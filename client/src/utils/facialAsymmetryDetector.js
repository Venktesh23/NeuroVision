/**
 * Enhanced Facial Asymmetry Detector for Clinical Assessment
 * Analyzes facial landmarks to detect asymmetry with clinical correlation
 * The face mesh provides 468 3D landmarks
 * We'll focus on key points around eyes, mouth, and overall face symmetry
 */

// Helper to calculate distance between two points
const calculateDistance = (point1, point2) => {
  if (!point1 || !point2 || point1.x === undefined || point2.x === undefined) return 0;
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = (point1.z || 0) - (point2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Helper to calculate horizontal ratio difference (asymmetry)
const calculateAsymmetryRatio = (leftDistance, rightDistance) => {
  const maxDistance = Math.max(leftDistance, rightDistance);
  const minDistance = Math.min(leftDistance, rightDistance);
  
  // Avoid division by zero
  if (maxDistance === 0) return 0;
  
  // Calculate how different the two sides are (0 = perfectly symmetric, 1 = completely asymmetric)
  return 1 - (minDistance / maxDistance);
};

// Calculate confidence based on landmark quality and face position
const calculateConfidence = (landmarks) => {
  let confidenceScore = 100;
  
  // Check for missing or invalid landmarks
  const validLandmarks = landmarks.filter(l => l && l.x !== undefined && l.y !== undefined);
  if (validLandmarks.length < 400) {
    confidenceScore -= (468 - validLandmarks.length) * 0.2;
  }
  
  // Check face angle (frontal vs profile)
  const noseTip = landmarks[1];
  const leftEar = landmarks[234];
  const rightEar = landmarks[454];
  
  if (noseTip && leftEar && rightEar) {
    const faceAngle = Math.abs(calculateDistance(noseTip, leftEar) - calculateDistance(noseTip, rightEar));
    if (faceAngle > 0.05) {
      confidenceScore -= faceAngle * 200; // Penalize non-frontal faces
    }
  }
  
  // Check for face size (too small or too large)
  const faceWidth = calculateDistance(landmarks[234], landmarks[454]);
  if (faceWidth < 0.1 || faceWidth > 0.8) {
    confidenceScore -= 20;
  }
  
  return Math.max(0, Math.min(100, confidenceScore));
};

// Enhanced clinical indicators
const detectClinicalIndicators = (landmarks, metrics) => {
  const indicators = [];
  
  // Severe asymmetry threshold (clinical significance)
  if (metrics.overallAsymmetry > 0.15) {
    indicators.push('Significant facial asymmetry detected');
  }
  
  // Eye droop detection
  if (metrics.eyeAsymmetry > 0.12) {
    indicators.push('Possible eyelid droop (ptosis)');
  }
  
  // Mouth droop detection  
  if (metrics.mouthAsymmetry > 0.10) {
    indicators.push('Possible mouth droop');
  }
  
  // Forehead asymmetry
  if (metrics.eyebrowAsymmetry > 0.08) {
    indicators.push('Forehead muscle weakness');
  }
  
  return indicators;
};

// Main analysis function
const analyzeFacialAsymmetry = (landmarks) => {
  if (!landmarks || landmarks.length < 468) {
    return {
      eyeAsymmetry: 0,
      mouthAsymmetry: 0,
      eyebrowAsymmetry: 0,
      overallAsymmetry: 0,
      confidence: 0,
      clinicalIndicators: [],
      dataQuality: 'insufficient'
    };
  }
  
  try {
    // Key landmark indices with error checking
    const getValidLandmark = (index) => landmarks[index] || { x: 0, y: 0, z: 0 };
    
    // Face midline points
    const noseTip = getValidLandmark(4);
    const foreheadMid = getValidLandmark(151);
    const chinBottom = getValidLandmark(199);
    
    // Eye landmarks
    const leftEyeOuter = getValidLandmark(33);
    const leftEyeInner = getValidLandmark(133);
    const rightEyeOuter = getValidLandmark(263);
    const rightEyeInner = getValidLandmark(362);
    
    // Enhanced eye measurements
    const leftEyeTop = getValidLandmark(159);
    const leftEyeBottom = getValidLandmark(145);
    const rightEyeTop = getValidLandmark(386);
    const rightEyeBottom = getValidLandmark(374);
    
    // Additional eye landmarks for better accuracy
    const leftEyeUpperLid = getValidLandmark(158);
    const leftEyeLowerLid = getValidLandmark(153);
    const rightEyeUpperLid = getValidLandmark(385);
    const rightEyeLowerLid = getValidLandmark(380);
    
    // Mouth landmarks
    const mouthLeft = getValidLandmark(61);
    const mouthRight = getValidLandmark(291);
    const mouthCenter = getValidLandmark(13);
    
    // Enhanced mouth measurements
    const upperLipLeft = getValidLandmark(84);
    const upperLipRight = getValidLandmark(314);
    const lowerLipLeft = getValidLandmark(17);
    const lowerLipRight = getValidLandmark(18);
    
    // Eyebrow landmarks
    const leftEyebrowOuter = getValidLandmark(70);
    const leftEyebrowInner = getValidLandmark(107);
    const rightEyebrowOuter = getValidLandmark(300);
    const rightEyebrowInner = getValidLandmark(336);
    
    // Calculate enhanced midline (vertical line through center of face)
    const midline = {
      x: (foreheadMid.x + noseTip.x + chinBottom.x) / 3,
      y: 0  // We only care about x-coordinate for horizontal symmetry
    };
    
    // 1. Enhanced eye symmetry analysis
    const leftEyeWidth = calculateDistance(leftEyeOuter, leftEyeInner);
    const rightEyeWidth = calculateDistance(rightEyeOuter, rightEyeInner);
    const eyeWidthAsymmetry = calculateAsymmetryRatio(leftEyeWidth, rightEyeWidth);
    
    const leftEyeHeight = calculateDistance(leftEyeTop, leftEyeBottom);
    const rightEyeHeight = calculateDistance(rightEyeTop, rightEyeBottom);
    const eyeHeightAsymmetry = calculateAsymmetryRatio(leftEyeHeight, rightEyeHeight);
    
    // Eyelid analysis
    const leftEyelidGap = calculateDistance(leftEyeUpperLid, leftEyeLowerLid);
    const rightEyelidGap = calculateDistance(rightEyeUpperLid, rightEyeLowerLid);
    const eyelidAsymmetry = calculateAsymmetryRatio(leftEyelidGap, rightEyelidGap);
    
    // Distance from eyes to midline
    const leftEyeToMidline = Math.abs(midline.x - ((leftEyeOuter.x + leftEyeInner.x) / 2));
    const rightEyeToMidline = Math.abs(midline.x - ((rightEyeOuter.x + rightEyeInner.x) / 2));
    const eyePositionAsymmetry = calculateAsymmetryRatio(leftEyeToMidline, rightEyeToMidline);
    
    // Combined eye asymmetry with eyelid component
    const eyeAsymmetry = (eyeWidthAsymmetry + eyeHeightAsymmetry + eyelidAsymmetry + eyePositionAsymmetry) / 4;
    
    // 2. Enhanced mouth symmetry analysis
    const mouthLeftSide = calculateDistance(mouthLeft, {x: midline.x, y: mouthLeft.y});
    const mouthRightSide = calculateDistance(mouthRight, {x: midline.x, y: mouthRight.y});
    const mouthCornerAsymmetry = calculateAsymmetryRatio(mouthLeftSide, mouthRightSide);
    
    // Upper and lower lip analysis
    const upperLipLeftWidth = calculateDistance(upperLipLeft, {x: midline.x, y: upperLipLeft.y});
    const upperLipRightWidth = calculateDistance(upperLipRight, {x: midline.x, y: upperLipRight.y});
    const upperLipAsymmetry = calculateAsymmetryRatio(upperLipLeftWidth, upperLipRightWidth);
    
    const lowerLipLeftWidth = calculateDistance(lowerLipLeft, {x: midline.x, y: lowerLipLeft.y});
    const lowerLipRightWidth = calculateDistance(lowerLipRight, {x: midline.x, y: lowerLipRight.y});
    const lowerLipAsymmetry = calculateAsymmetryRatio(lowerLipLeftWidth, lowerLipRightWidth);
    
    const mouthAsymmetry = (mouthCornerAsymmetry + upperLipAsymmetry + lowerLipAsymmetry) / 3;
    
    // 3. Enhanced eyebrow symmetry analysis
    const leftEyebrowLength = calculateDistance(leftEyebrowOuter, leftEyebrowInner);
    const rightEyebrowLength = calculateDistance(rightEyebrowOuter, rightEyebrowInner);
    const eyebrowLengthAsymmetry = calculateAsymmetryRatio(leftEyebrowLength, rightEyebrowLength);
    
    const leftEyebrowHeight = (leftEyebrowOuter.y + leftEyebrowInner.y) / 2;
    const rightEyebrowHeight = (rightEyebrowOuter.y + rightEyebrowInner.y) / 2;
    const eyebrowHeightDiff = Math.abs(leftEyebrowHeight - rightEyebrowHeight);
    
    // Normalize by face height
    const faceHeight = calculateDistance(foreheadMid, chinBottom);
    const eyebrowHeightAsymmetry = faceHeight > 0 ? eyebrowHeightDiff / faceHeight : 0;
    
    const eyebrowAsymmetry = (eyebrowLengthAsymmetry + eyebrowHeightAsymmetry) / 2;
    
    // 4. Enhanced overall asymmetry calculation
    const overallAsymmetry = (
      (eyeAsymmetry * 0.4) + 
      (mouthAsymmetry * 0.4) + 
      (eyebrowAsymmetry * 0.2)
    );
    
    // Calculate confidence and quality metrics
    const confidence = calculateConfidence(landmarks);
    const dataQuality = confidence > 80 ? 'excellent' : 
                       confidence > 60 ? 'good' : 
                       confidence > 40 ? 'fair' : 'poor';
    
    const metrics = {
      eyeAsymmetry,
      mouthAsymmetry,
      eyebrowAsymmetry,
      overallAsymmetry,
      confidence,
      dataQuality
    };
    
    // Detect clinical indicators
    const clinicalIndicators = detectClinicalIndicators(landmarks, metrics);
    
    return {
      ...metrics,
      clinicalIndicators,
      
      // Additional detailed metrics for clinical use
      detailedMetrics: {
        eyeWidthAsymmetry,
        eyeHeightAsymmetry,
        eyelidAsymmetry,
        eyePositionAsymmetry,
        mouthCornerAsymmetry,
        upperLipAsymmetry,
        lowerLipAsymmetry,
        eyebrowLengthAsymmetry,
        eyebrowHeightAsymmetry
      },
      
      // Timestamp for tracking
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error in facial asymmetry analysis:', error);
    return {
      eyeAsymmetry: 0,
      mouthAsymmetry: 0,
      eyebrowAsymmetry: 0,
      overallAsymmetry: 0,
      confidence: 0,
      clinicalIndicators: ['Analysis error - please retry'],
      dataQuality: 'error',
      error: error.message
    };
  }
};

export default analyzeFacialAsymmetry;
