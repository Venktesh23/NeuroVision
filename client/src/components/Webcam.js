import React, { useEffect, forwardRef } from 'react';

const Webcam = forwardRef(({ isDetecting }, ref) => {
  useEffect(() => {
    // Capture the current ref value to avoid stale closure issues
    const currentVideoRef = ref.current;
    
    const setupCamera = async () => {
      if (!currentVideoRef) return;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user'
          }
        });
        
        currentVideoRef.srcObject = stream;
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access the camera. Please check your permissions and try again.');
      }
    };
    
    if (isDetecting) {
      setupCamera();
    } else {
      // Stop the camera when detection is turned off
      if (currentVideoRef && currentVideoRef.srcObject) {
        const tracks = currentVideoRef.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        currentVideoRef.srcObject = null;
      }
    }
    
    return () => {
      // Clean up - stop camera stream when component unmounts
      if (currentVideoRef && currentVideoRef.srcObject) {
        const tracks = currentVideoRef.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isDetecting, ref]);
  
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="w-full h-auto rounded"
      style={{ maxHeight: '480px' }}
    />
  );
});

export default Webcam;
