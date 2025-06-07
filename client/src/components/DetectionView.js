import React, { useEffect, forwardRef } from 'react';

const DetectionView = forwardRef(({ faceMeshResults, poseResults }, ref) => {
  
  // Helper function to draw connections
  const drawConnectors = (ctx, landmarks, connections, style = {}) => {
    const { color = '#00FF00', lineWidth = 1 } = style;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    if (connections && Array.isArray(connections)) {
      connections.forEach(connection => {
        const start = landmarks[connection[0]];
        const end = landmarks[connection[1]];
        
        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
          ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
          ctx.stroke();
        }
      });
    }
  };
  
  // Helper function to draw landmarks
  const drawLandmarks = (ctx, landmarks, style = {}) => {
    const { color = '#FF0000', radius = 2, fillColor = '#FFFFFF' } = style;
    
    landmarks.forEach(landmark => {
      if (landmark) {
        const x = landmark.x * ctx.canvas.width;
        const y = landmark.y * ctx.canvas.height;
        
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
    
    try {
      // Draw face mesh if results are available
      if (faceMeshResults && faceMeshResults.multiFaceLandmarks) {
        for (const landmarks of faceMeshResults.multiFaceLandmarks) {
          // Draw basic face outline (simplified connections)
          drawLandmarks(ctx, landmarks, { color: '#00FF00', radius: 1 });
          
          // Draw key facial features
          if (landmarks.length > 468) {
            // Eyes outline (simplified)
            const leftEyePoints = [33, 7, 163, 144, 145, 153, 154, 155, 133];
            const rightEyePoints = [362, 382, 381, 380, 374, 373, 390, 249, 263];
            
            // Draw left eye
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            leftEyePoints.forEach((pointIndex, i) => {
              const point = landmarks[pointIndex];
              if (point) {
                const x = point.x * ctx.canvas.width;
                const y = point.y * ctx.canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
            
            // Draw right eye
            ctx.strokeStyle = '#0000FF';
            ctx.beginPath();
            rightEyePoints.forEach((pointIndex, i) => {
              const point = landmarks[pointIndex];
              if (point) {
                const x = point.x * ctx.canvas.width;
                const y = point.y * ctx.canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
          }
        }
      }
      
      // Draw pose if results are available
      if (poseResults && poseResults.poseLandmarks) {
        const landmarks = poseResults.poseLandmarks;
        
        // Draw pose landmarks
        drawLandmarks(ctx, landmarks, { 
          color: '#FFFF00', 
          radius: 3,
          fillColor: '#FF0000'
        });
        
        // Draw basic pose connections
        const poseConnections = [
          [11, 12], // shoulders
          [11, 23], // left shoulder to hip
          [12, 24], // right shoulder to hip
          [23, 24], // hips
        ];
        
        drawConnectors(ctx, landmarks, poseConnections, { 
          color: '#00FFFF', 
          lineWidth: 3 
        });
      }
    } catch (error) {
      console.error('Error drawing detection results:', error);
    }
  }, [faceMeshResults, poseResults, ref]);
  
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
