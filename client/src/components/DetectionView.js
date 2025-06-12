import React, { useEffect, forwardRef } from 'react';

const DetectionView = forwardRef(({ faceMeshResults, poseResults, shouldClear }, ref) => {
  
  // Helper function to draw landmarks
  const drawLandmarks = (ctx, landmarks, style = {}) => {
    const { color = '#FF0000', radius = 2, fillColor = '#FFFFFF' } = style;
    
    landmarks.forEach(landmark => {
      if (landmark && landmark.x !== undefined && landmark.y !== undefined) {
        const x = Math.max(0, Math.min(landmark.x * ctx.canvas.width, ctx.canvas.width));
        const y = Math.max(0, Math.min(landmark.y * ctx.canvas.height, ctx.canvas.height));
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor || color;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  };
  
  useEffect(() => {
    if (!ref || !ref.current) return;
    
    const ctx = ref.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // If shouldClear is true, don't draw anything
    if (shouldClear) return;
    
    try {
      // Draw face mesh if results are available
      if (faceMeshResults && faceMeshResults.multiFaceLandmarks) {
        for (const landmarks of faceMeshResults.multiFaceLandmarks) {
          // Draw facial landmarks with better styling
          drawLandmarks(ctx, landmarks, { color: '#00FF00', radius: 1, fillColor: '#00FF00' });
          
          // Draw key facial features with improved positioning checks
          if (landmarks.length > 468) {
            // Eyes outline (simplified)
            const leftEyePoints = [33, 7, 163, 144, 145, 153, 154, 155, 133];
            const rightEyePoints = [362, 382, 381, 380, 374, 373, 390, 249, 263];
            
            // Draw left eye
            ctx.strokeStyle = '#FF3030';
            ctx.lineWidth = 2;
            ctx.beginPath();
            let first = true;
            leftEyePoints.forEach((pointIndex) => {
              const point = landmarks[pointIndex];
              if (point && point.x !== undefined && point.y !== undefined) {
                const x = Math.max(0, Math.min(point.x * ctx.canvas.width, ctx.canvas.width));
                const y = Math.max(0, Math.min(point.y * ctx.canvas.height, ctx.canvas.height));
                if (first) {
                  ctx.moveTo(x, y);
                  first = false;
                } else {
                  ctx.lineTo(x, y);
                }
              }
            });
            ctx.closePath();
            ctx.stroke();
            
            // Draw right eye
            ctx.strokeStyle = '#3030FF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            first = true;
            rightEyePoints.forEach((pointIndex) => {
              const point = landmarks[pointIndex];
              if (point && point.x !== undefined && point.y !== undefined) {
                const x = Math.max(0, Math.min(point.x * ctx.canvas.width, ctx.canvas.width));
                const y = Math.max(0, Math.min(point.y * ctx.canvas.height, ctx.canvas.height));
                if (first) {
                  ctx.moveTo(x, y);
                  first = false;
                } else {
                  ctx.lineTo(x, y);
                }
              }
            });
            ctx.closePath();
            ctx.stroke();
            
            // Draw mouth outline
            const mouthPoints = [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318];
            ctx.strokeStyle = '#FF6030';
            ctx.lineWidth = 2;
            ctx.beginPath();
            first = true;
            mouthPoints.forEach((pointIndex) => {
              const point = landmarks[pointIndex];
              if (point && point.x !== undefined && point.y !== undefined) {
                const x = Math.max(0, Math.min(point.x * ctx.canvas.width, ctx.canvas.width));
                const y = Math.max(0, Math.min(point.y * ctx.canvas.height, ctx.canvas.height));
                if (first) {
                  ctx.moveTo(x, y);
                  first = false;
                } else {
                  ctx.lineTo(x, y);
                }
              }
            });
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
      
      // Draw pose if results are available
      if (poseResults && poseResults.poseLandmarks) {
        const landmarks = poseResults.poseLandmarks;
        
        // Draw pose landmarks with bounds checking
        drawLandmarks(ctx, landmarks, { 
          color: '#FFFF00', 
          radius: 4,
          fillColor: '#FF6600'
        });
        
        // Draw basic pose connections with bounds checking
        const poseConnections = [
          [11, 12], // shoulders
          [11, 23], // left shoulder to hip
          [12, 24], // right shoulder to hip
          [23, 24], // hips
          [11, 13], // left arm
          [13, 15], // left forearm
          [12, 14], // right arm
          [14, 16], // right forearm
        ];
        
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        
        poseConnections.forEach(connection => {
          const start = landmarks[connection[0]];
          const end = landmarks[connection[1]];
          
          if (start && end && start.x !== undefined && start.y !== undefined && 
              end.x !== undefined && end.y !== undefined) {
            const startX = Math.max(0, Math.min(start.x * ctx.canvas.width, ctx.canvas.width));
            const startY = Math.max(0, Math.min(start.y * ctx.canvas.height, ctx.canvas.height));
            const endX = Math.max(0, Math.min(end.x * ctx.canvas.width, ctx.canvas.width));
            const endY = Math.max(0, Math.min(end.y * ctx.canvas.height, ctx.canvas.height));
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        });
      }
    } catch (error) {
      console.error('Error drawing detection results:', error);
    }
  }, [faceMeshResults, poseResults, shouldClear, ref]);
  
  return (
    <canvas
      ref={ref}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      width={640}
      height={480}
      style={{ zIndex: 10 }}
    />
  );
});

export default DetectionView;
