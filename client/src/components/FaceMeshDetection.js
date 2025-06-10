import { useEffect, useState, useCallback, useRef } from 'react';
import analyzeFacialAsymmetry from '../utils/facialAsymmetryDetector';

const FaceMeshDetection = ({ webcamRef, isDetecting, onResults, onMetricsUpdate }) => {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  
  // Use refs to track instances and prevent memory leaks
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const isActiveRef = useRef(false);
  
  // Optimized script loading with caching
  const loadMediaPipeScripts = useCallback(() => {
    if (scriptsLoaded || isInitializing) return Promise.resolve();
    
    setIsInitializing(true);
    
    return new Promise((resolve, reject) => {
      // Check if scripts are already loaded
      if (window.FaceMesh && window.Camera) {
        setScriptsLoaded(true);
        setIsInitializing(false);
        resolve();
        return;
      }

      const loadScript = (src, id) => {
        return new Promise((resolveScript, rejectScript) => {
          // Check if script already exists
          if (document.getElementById(id)) {
            resolveScript();
            return;
          }

          const script = document.createElement('script');
          script.id = id;
          script.src = src;
          script.crossOrigin = 'anonymous';
          script.async = true; // Load asynchronously
          script.onload = resolveScript;
          script.onerror = () => rejectScript(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });
      };

      Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', 'camera-utils'),
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js', 'face-mesh')
      ]).then(() => {
        setScriptsLoaded(true);
        setIsInitializing(false);
        resolve();
      }).catch((err) => {
        console.error('Failed to load MediaPipe scripts:', err);
        setError('Failed to load face detection scripts. Please refresh the page.');
        setIsInitializing(false);
        reject(err);
      });
    });
  }, [scriptsLoaded, isInitializing]);

  // Initialize FaceMesh with better error handling
  const initializeFaceMesh = useCallback(async () => {
    if (!webcamRef.current || !scriptsLoaded || faceMeshRef.current) return;
    
    try {
      isActiveRef.current = true;
      
      const mesh = new window.FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      
      mesh.setOptions({
        maxNumFaces: 1,
        minDetectionConfidence: 0.7, // Slightly higher for better performance
        minTrackingConfidence: 0.5,
        refineLandmarks: false // Disable for better performance
      });
      
      // Throttle results processing to improve performance
      let lastProcessTime = 0;
      const processInterval = 100; // Process every 100ms instead of every frame
      
      mesh.onResults((results) => {
        const now = Date.now();
        if (now - lastProcessTime < processInterval) return;
        lastProcessTime = now;
        
        if (!isActiveRef.current) return;
        
        onResults(results);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const metrics = analyzeFacialAsymmetry(results.multiFaceLandmarks[0]);
          onMetricsUpdate(metrics);
        }
      });
      
      faceMeshRef.current = mesh;
      
      // Initialize camera with optimized settings
      if (webcamRef.current && window.Camera) {
        const cam = new window.Camera(webcamRef.current, {
          onFrame: async () => {
            if (webcamRef.current && isDetecting && mesh && isActiveRef.current) {
              try {
                await mesh.send({ image: webcamRef.current });
              } catch (err) {
                console.warn('Frame processing error:', err);
              }
            }
          },
          width: 640,
          height: 480,
          facingMode: 'user'
        });
        
        cameraRef.current = cam;
      }
    } catch (error) {
      console.error('Error initializing FaceMesh:', error);
      setError('Failed to initialize face detection. Please check camera permissions.');
    }
  }, [webcamRef, onResults, onMetricsUpdate, scriptsLoaded, isDetecting]);

  // Load scripts when component mounts
  useEffect(() => {
    if (isDetecting) {
      loadMediaPipeScripts().then(() => {
        initializeFaceMesh();
      });
    }
  }, [isDetecting, loadMediaPipeScripts, initializeFaceMesh]);
  
  // Handle detection state changes
  useEffect(() => {
    if (cameraRef.current) {
      if (isDetecting) {
        isActiveRef.current = true;
        cameraRef.current.start();
      } else {
        isActiveRef.current = false;
        cameraRef.current.stop();
      }
    }
  }, [isDetecting]);
  
  // Cleanup function
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (err) {
          console.warn('Error closing FaceMesh:', err);
        }
        faceMeshRef.current = null;
      }
      
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (err) {
          console.warn('Error stopping camera:', err);
        }
        cameraRef.current = null;
      }
    };
  }, []);

  // Display loading or error states
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <p className="text-red-800 text-sm">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setScriptsLoaded(false);
            loadMediaPipeScripts();
          }}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isDetecting && !scriptsLoaded && isInitializing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
        <p className="text-blue-800 text-sm">Loading face detection models...</p>
      </div>
    );
  }
  
  return null; // This component doesn't render anything when working normally
};

export default FaceMeshDetection;
