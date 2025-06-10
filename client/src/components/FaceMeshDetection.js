import { useEffect, useState } from 'react';
import analyzeFacialAsymmetry from '../utils/facialAsymmetryDetector';

const FaceMeshDetection = ({ webcamRef, isDetecting, onResults, onMetricsUpdate }) => {
  const [faceMesh, setFaceMesh] = useState(null);
  const [camera, setCamera] = useState(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  
  // Load MediaPipe scripts
  useEffect(() => {
    const loadMediaPipeScripts = () => {
      // Check if scripts are already loaded
      if (window.FaceMesh && window.Camera) {
        setScriptsLoaded(true);
        return;
      }

      // Load face mesh script
      const faceMeshScript = document.createElement('script');
      faceMeshScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      faceMeshScript.crossOrigin = 'anonymous';
      
      // Load camera utils script
      const cameraScript = document.createElement('script');
      cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      cameraScript.crossOrigin = 'anonymous';

      let scriptsToLoad = 2;
      const onScriptLoad = () => {
        scriptsToLoad--;
        if (scriptsToLoad === 0) {
          setScriptsLoaded(true);
        }
      };

      faceMeshScript.onload = onScriptLoad;
      cameraScript.onload = onScriptLoad;

      document.head.appendChild(faceMeshScript);
      document.head.appendChild(cameraScript);
    };

    loadMediaPipeScripts();
  }, []);
  
  useEffect(() => {
    if (!webcamRef.current || !scriptsLoaded) return;
    
    // Initialize FaceMesh
    const initializeFaceMesh = async () => {
      try {
        const mesh = new window.FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          }
        });
        
        mesh.setOptions({
          maxNumFaces: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          refineLandmarks: true
        });
        
        mesh.onResults((results) => {
          onResults(results);
          
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const metrics = analyzeFacialAsymmetry(results.multiFaceLandmarks[0]);
            onMetricsUpdate(metrics);
          }
        });
        
        setFaceMesh(mesh);
        
        // Initialize camera
        if (webcamRef.current && window.Camera) {
          const cam = new window.Camera(webcamRef.current, {
            onFrame: async () => {
              if (webcamRef.current && isDetecting && mesh) {
                await mesh.send({ image: webcamRef.current });
              }
            },
            width: 640,
            height: 480
          });
          
          setCamera(cam);
        }
      } catch (error) {
        console.error('Error initializing FaceMesh:', error);
      }
    };
    
    initializeFaceMesh();
    
    return () => {
      if (faceMesh) {
        faceMesh.close();
      }
      if (camera) {
        camera.stop();
      }
    };
  }, [webcamRef, onResults, onMetricsUpdate, isDetecting, scriptsLoaded, camera, faceMesh]);
  
  useEffect(() => {
    if (camera && isDetecting) {
      camera.start();
    } else if (camera && !isDetecting) {
      camera.stop();
    }
  }, [camera, isDetecting]);
  
  return null; // This component doesn't render anything
};

export default FaceMeshDetection;
