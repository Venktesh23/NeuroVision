import React, { useEffect, forwardRef, useState } from 'react';

const Webcam = forwardRef(({ isDetecting }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    // Capture the current ref value to avoid stale closure issues
    const currentVideoRef = ref.current;
    
    const setupCamera = async () => {
      if (!currentVideoRef) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Check for camera permission first
        const permissions = await navigator.permissions.query({ name: 'camera' });
        setHasPermission(permissions.state === 'granted');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, min: 320, max: 1280 },
            height: { ideal: 480, min: 240, max: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 30 }
          }
        });
        
        currentVideoRef.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          currentVideoRef.onloadedmetadata = () => {
            currentVideoRef.play();
            resolve();
          };
        });
        
        setIsLoading(false);
        setHasPermission(true);
        
      } catch (error) {
        console.error('Error accessing camera:', error);
        setIsLoading(false);
        
        let errorMessage = 'Unable to access the camera. ';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage += 'Please allow camera access and try again.';
          setHasPermission(false);
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage += 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage += 'Camera is already in use by another application.';
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
          errorMessage += 'Camera does not support the required settings.';
        } else {
          errorMessage += 'Please check your camera and browser settings.';
        }
        
        setError(errorMessage);
      }
    };

    const stopCamera = () => {
      if (currentVideoRef && currentVideoRef.srcObject) {
        const tracks = currentVideoRef.srcObject.getTracks();
        tracks.forEach(track => {
                  track.stop();
        });
        currentVideoRef.srcObject = null;
      }
      setIsLoading(false);
    };

    if (isDetecting) {
      setupCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      // Clean up - stop camera stream when component unmounts or effect runs again
      stopCamera();
    };
  }, [isDetecting, ref]);

  // Handle retry functionality
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Trigger re-initialization by toggling detection state
    if (ref.current) {
      const event = new CustomEvent('retryCamera');
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
        style={{ 
          display: error ? 'none' : 'block',
          backgroundColor: '#000'
        }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Initializing camera...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center rounded">
          <div className="text-center text-white p-4 max-w-md">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              Try Again
            </button>
            {hasPermission === false && (
              <p className="text-xs mt-2 text-gray-300">
                Check your browser settings to enable camera access
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

Webcam.displayName = 'Webcam';

export default Webcam;
