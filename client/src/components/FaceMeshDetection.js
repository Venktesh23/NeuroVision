import { useEffect, useState, useCallback, useRef } from 'react';
import analyzeFacialAsymmetry from '../utils/facialAsymmetryDetector';

const FaceMeshDetection = ({ webcamRef, isDetecting, onResults, onMetricsUpdate }) => {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [performance, setPerformance] = useState({ fps: 0, latency: 0 });
  
  // Use refs to track instances and prevent memory leaks
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const isActiveRef = useRef(false);
  const performanceRef = useRef({ frameCount: 0, lastTime: Date.now() });
  const retryTimeoutRef = useRef(null);
  
  // Performance monitoring
  const updatePerformance = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - performanceRef.current.lastTime;
    
    if (timeDiff >= 1000) { // Update every second
      const fps = Math.round((performanceRef.current.frameCount * 1000) / timeDiff);
      setPerformance(prev => ({ ...prev, fps }));
      
      performanceRef.current.frameCount = 0;
      performanceRef.current.lastTime = now;
    } else {
      performanceRef.current.frameCount++;
    }
  }, []);

  // Optimized script loading with retry mechanism
  const loadMediaPipeScripts = useCallback(() => {
    if (scriptsLoaded || isInitializing) return Promise.resolve();
    
    setIsInitializing(true);
    setError(null);
    
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
          // Remove existing script if any
          const existingScript = document.getElementById(id);
          if (existingScript) {
            existingScript.remove();
          }

          const script = document.createElement('script');
          script.id = id;
          script.src = src;
          script.crossOrigin = 'anonymous';
          script.async = true;
          
          const timeoutId = setTimeout(() => {
            rejectScript(new Error(`Script loading timeout: ${src}`));
          }, 15000); // 15 second timeout
          
          script.onload = () => {
            clearTimeout(timeoutId);
            resolveScript();
          };
          
          script.onerror = () => {
            clearTimeout(timeoutId);
            rejectScript(new Error(`Failed to load ${src}`));
          };
          
          document.head.appendChild(script);
        });
      };

      Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', 'camera-utils'),
        loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js', 'face-mesh')
      ]).then(() => {
        // Wait a bit for scripts to initialize
        setTimeout(() => {
          if (window.FaceMesh && window.Camera) {
            setScriptsLoaded(true);
            setIsInitializing(false);
            resolve();
          } else {
            setError('Scripts loaded but MediaPipe objects not available');
            setIsInitializing(false);
            reject(new Error('MediaPipe initialization failed'));
          }
        }, 500);
      }).catch((err) => {
        console.error('Failed to load MediaPipe scripts:', err);
        setError('Failed to load face detection scripts. Check your internet connection and try again.');
        setIsInitializing(false);
        reject(err);
      });
    });
  }, [scriptsLoaded, isInitializing]);

  // Enhanced FaceMesh initialization with better error handling
  const initializeFaceMesh = useCallback(async () => {
    if (!webcamRef.current || !scriptsLoaded || faceMeshRef.current) return;
    
    try {
      isActiveRef.current = true;
      
      const mesh = new window.FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      
      // Enhanced configuration for clinical use
      mesh.setOptions({
        maxNumFaces: 1,
        minDetectionConfidence: 0.8, // Higher confidence for clinical accuracy
        minTrackingConfidence: 0.7,  // Better tracking for consistent results
        refineLandmarks: true,       // Enable for medical-grade precision
        enableFaceGeometry: false    // Disable for performance
      });
      
      // Enhanced results processing with error handling and performance monitoring
      let lastProcessTime = 0;
      const processInterval = 66; // ~15 FPS for smooth but efficient processing
      
      mesh.onResults((results) => {
        if (!isActiveRef.current) return;
        
        const now = Date.now();
        const processingLatency = now - lastProcessTime;
        
        // Update performance metrics
        updatePerformance();
        setPerformance(prev => ({ 
          ...prev, 
          latency: processingLatency 
        }));
        
        if (now - lastProcessTime < processInterval) return;
        lastProcessTime = now;
        
        try {
          // Validate results before processing
          if (!results) {
            console.warn('Empty results received from FaceMesh');
            return;
          }
          
          onResults(results);
          
          // Enhanced metrics calculation with validation
          if (results.multiFaceLandmarks && 
              results.multiFaceLandmarks.length > 0 && 
              results.multiFaceLandmarks[0].length >= 468) {
            
            const startTime = Date.now();
            const metrics = analyzeFacialAsymmetry(results.multiFaceLandmarks[0]);
            const analysisTime = Date.now() - startTime;
            
            // Add analysis performance to metrics
            const enhancedMetrics = {
              ...metrics,
              analysisTime,
              frameQuality: results.multiFaceLandmarks[0].length >= 468 ? 'complete' : 'partial'
            };
            
            onMetricsUpdate(enhancedMetrics);
          } else {
            // Send empty metrics with quality indicator
            onMetricsUpdate({
              eyeAsymmetry: 0,
              mouthAsymmetry: 0,
              eyebrowAsymmetry: 0,
              overallAsymmetry: 0,
              confidence: 0,
              dataQuality: 'no_face_detected'
            });
          }
        } catch (processingError) {
          console.error('Error processing face mesh results:', processingError);
          // Don't break the processing loop, just log the error
        }
      });
      
      faceMeshRef.current = mesh;
      
      // Enhanced camera initialization with better error handling
      if (webcamRef.current && window.Camera) {
        const cam = new window.Camera(webcamRef.current, {
          onFrame: async () => {
            if (webcamRef.current && isDetecting && mesh && isActiveRef.current) {
              try {
                await mesh.send({ image: webcamRef.current });
              } catch (frameError) {
                console.warn('Frame processing error:', frameError);
                // Don't throw, just continue with next frame
              }
            }
          },
          width: 640,
          height: 480,
          facingMode: 'user'
        });
        
        cameraRef.current = cam;
        
        // Start camera automatically if detection is enabled
        if (isDetecting) {
          cam.start();
        }
      }
      
      setError(null); // Clear any previous errors
      
    } catch (error) {
      console.error('Error initializing FaceMesh:', error);
      setError(`Failed to initialize face detection: ${error.message}. Please check camera permissions and try again.`);
      
      // Schedule retry if not a permission error
      if (!error.message.includes('permission') && !error.message.includes('NotAllowed')) {
        retryTimeoutRef.current = setTimeout(() => {
          console.log('Retrying FaceMesh initialization...');
          initializeFaceMesh();
        }, 3000);
      }
    }
  }, [webcamRef, onResults, onMetricsUpdate, isDetecting, scriptsLoaded, updatePerformance]);

  // Load scripts when component mounts
  useEffect(() => {
    if (isDetecting) {
      loadMediaPipeScripts()
        .then(() => {
          initializeFaceMesh();
        })
        .catch((err) => {
          console.error('Script loading failed:', err);
          // Implement retry logic for script loading
          setTimeout(() => {
            setScriptsLoaded(false);
            setIsInitializing(false);
          }, 2000);
        });
    }
  }, [isDetecting, loadMediaPipeScripts, initializeFaceMesh]);
  
  // Handle detection state changes with improved reliability
  useEffect(() => {
    if (cameraRef.current) {
      if (isDetecting && isActiveRef.current) {
        try {
          cameraRef.current.start();
        } catch (startError) {
          console.error('Error starting camera:', startError);
          setError('Failed to start camera. Please check permissions and refresh the page.');
        }
      } else if (!isDetecting && isActiveRef.current) {
        try {
          cameraRef.current.stop();
        } catch (stopError) {
          console.warn('Error stopping camera:', stopError);
        }
      }
    }
  }, [isDetecting]);
  
  // Enhanced cleanup function
  useEffect(() => {
    return () => {
      console.log('Cleaning up FaceMeshDetection...');
      isActiveRef.current = false;
      
      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Clean up face mesh
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (err) {
          console.warn('Error closing FaceMesh:', err);
        }
        faceMeshRef.current = null;
      }
      
      // Clean up camera
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

  // Manual retry function
  const handleRetry = useCallback(() => {
    setError(null);
    setScriptsLoaded(false);
    setIsInitializing(false);
    
    // Reset refs
    if (faceMeshRef.current) {
      try {
        faceMeshRef.current.close();
      } catch (err) {
        console.warn('Error closing previous FaceMesh:', err);
      }
      faceMeshRef.current = null;
    }
    
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (err) {
        console.warn('Error stopping previous camera:', err);
      }
      cameraRef.current = null;
    }
    
    // Restart initialization
    loadMediaPipeScripts();
  }, [loadMediaPipeScripts]);

  // Display enhanced loading state
  if (isDetecting && !scriptsLoaded && isInitializing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-blue-800 text-sm">Loading advanced face detection models...</p>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          This may take a few moments on first load
        </div>
      </div>
    );
  }

  // Display error state with enhanced information
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-start space-x-2">
          <div className="text-red-600 text-lg">⚠️</div>
          <div className="flex-1">
            <p className="text-red-800 text-sm font-medium">{error}</p>
            <div className="mt-2 space-x-2">
              <button 
                onClick={handleRetry}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display performance information in development
  if (process.env.NODE_ENV === 'development' && isDetecting && scriptsLoaded) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 m-4">
        <div className="text-xs text-green-800">
          <div className="font-medium mb-1">Face Detection Active</div>
          <div className="space-y-1">
            <div>FPS: {performance.fps}</div>
            <div>Latency: {performance.latency}ms</div>
            <div>Status: {isActiveRef.current ? 'Running' : 'Inactive'}</div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default FaceMeshDetection;
