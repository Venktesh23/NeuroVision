import { useEffect, useState } from 'react';
import analyzePosture from '../utils/postureAnalyzer';

const PoseDetection = ({ webcamRef, isDetecting, onResults, onMetricsUpdate }) => {
  const [pose, setPose] = useState(null);
  const [camera, setCamera] = useState(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  
  // Load MediaPipe scripts
  useEffect(() => {
    const loadMediaPipeScripts = () => {
      // Check if scripts are already loaded
      if (window.Pose && window.Camera) {
        setScriptsLoaded(true);
        return;
      }

      // Load pose script
      const poseScript = document.createElement('script');
      poseScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
      poseScript.crossOrigin = 'anonymous';
      
      // Load camera utils script (if not already loaded)
      let cameraScript = null;
      if (!window.Camera) {
        cameraScript = document.createElement('script');
        cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
        cameraScript.crossOrigin = 'anonymous';
      }

      let scriptsToLoad = cameraScript ? 2 : 1;
      const onScriptLoad = () => {
        scriptsToLoad--;
        if (scriptsToLoad === 0) {
          setScriptsLoaded(true);
        }
      };

      poseScript.onload = onScriptLoad;
      if (cameraScript) {
        cameraScript.onload = onScriptLoad;
        document.head.appendChild(cameraScript);
      }

      document.head.appendChild(poseScript);
    };

    loadMediaPipeScripts();
  }, []);
  
  useEffect(() => {
    if (!webcamRef.current || !scriptsLoaded) return;
    
    // Initialize Pose
    const initializePose = async () => {
      try {
        const poseModel = new window.Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });
        
        poseModel.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        poseModel.onResults((results) => {
          onResults(results);
          
          if (results.poseLandmarks) {
            const metrics = analyzePosture(results.poseLandmarks);
            onMetricsUpdate(metrics);
          }
        });
        
        setPose(poseModel);
        
        // Initialize camera if needed (FaceMeshDetection might already have one)
        if (!camera && webcamRef.current && window.Camera) {
          const cam = new window.Camera(webcamRef.current, {
            onFrame: async () => {
              if (webcamRef.current && isDetecting && poseModel) {
                await poseModel.send({ image: webcamRef.current });
              }
            },
            width: 640,
            height: 480
          });
          
          setCamera(cam);
        }
      } catch (error) {
        console.error('Error initializing Pose:', error);
      }
    };
    
    initializePose();
    
    return () => {
      if (pose) {
        pose.close();
      }
      // We don't stop the camera here since FaceMeshDetection manages it
    };
  }, [webcamRef, onResults, onMetricsUpdate, camera, isDetecting, scriptsLoaded]);
  
  useEffect(() => {
    if (camera && isDetecting) {
      camera.start();
    } else if (camera && !isDetecting) {
      camera.stop();
    }
  }, [camera, isDetecting, pose]);
  
  return null; // This component doesn't render anything
};

export default PoseDetection;
