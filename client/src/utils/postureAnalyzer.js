/**
 * Enhanced Posture Analyzer for Clinical Assessment
 * Analyzes body posture using MediaPipe Pose landmarks
 * Focuses on clinical indicators for neurological assessment:
 * 1. Shoulder imbalance (drooping on one side)
 * 2. Head tilt and stability
 * 3. Body lean and coordination
 * 4. Postural stability over time
 */

// Helper to calculate the angle between three points
const calculateAngle = (p1, p2, p3) => {
  if (!p1 || !p2 || !p3 || 
      p1.x === undefined || p2.x === undefined || p3.x === undefined) return 0;
      
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  // Normalize angle to be between 0-180
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  
  return angle;
};

// Helper to calculate the slope of a line between two points
const calculateSlope = (p1, p2) => {
  if (!p1 || !p2 || p1.x === undefined || p2.x === undefined) return 0;
  if (p2.x - p1.x === 0) return Number.MAX_VALUE; // Vertical line
  return (p2.y - p1.y) / (p2.x - p1.x);
};

// Helper to calculate distance between two points
const calculateDistance = (p1, p2) => {
  if (!p1 || !p2 || p1.x === undefined || p2.x === undefined) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Helper to normalize a value to a 0-1 range
const normalizeValue = (value, maxValue) => {
  return Math.min(Math.abs(value) / maxValue, 1);
};

// Calculate confidence based on landmark visibility and quality
const calculateConfidence = (poseLandmarks) => {
  let confidenceScore = 100;
  
  // Check for visibility of key landmarks
  const keyLandmarks = [11, 12, 23, 24, 7, 8, 0]; // shoulders, hips, ears, nose
  const visibleLandmarks = keyLandmarks.filter(index => {
    const landmark = poseLandmarks[index];
    return landmark && landmark.visibility !== undefined ? landmark.visibility > 0.5 : true;
  });
  
  if (visibleLandmarks.length < keyLandmarks.length) {
    confidenceScore -= (keyLandmarks.length - visibleLandmarks.length) * 15;
  }
  
  // Check for landmark quality (presence of coordinates)
  const validLandmarks = poseLandmarks.filter(l => 
    l && l.x !== undefined && l.y !== undefined
  );
  
  if (validLandmarks.length < 25) { // Minimum for upper body analysis
    confidenceScore -= (25 - validLandmarks.length) * 2;
  }
  
  return Math.max(0, Math.min(100, confidenceScore));
};

// Detect clinical indicators for postural deficits
const detectClinicalIndicators = (metrics) => {
  const indicators = [];
  
  // Significant shoulder imbalance
  if (metrics.shoulderImbalance > 0.15) {
    indicators.push('Significant shoulder imbalance detected');
  }
  
  // Head tilt indicating possible weakness
  if (metrics.headTilt > 0.12) {
    indicators.push('Possible head tilt or neck weakness');
  }
  
  // Body lean indicating postural instability
  if (metrics.bodyLean > 0.10) {
    indicators.push('Postural instability or trunk weakness');
  }
  
  // Combined postural deficits
  if (metrics.shoulderImbalance > 0.08 && metrics.headTilt > 0.08) {
    indicators.push('Combined upper body asymmetry');
  }
  
  // Severe overall postural deficit
  if (metrics.posturalStability < 0.6) {
    indicators.push('Significant postural instability');
  }
  
  return indicators;
};

// Calculate postural stability score
const calculatePosturalStability = (shoulderImbalance, headTilt, bodyLean) => {
  // Weighted scoring system (higher score = better stability)
  const stabilityScore = 100 - (
    (shoulderImbalance * 100 * 0.4) +
    (headTilt * 100 * 0.3) +
    (bodyLean * 100 * 0.3)
  );
  
  return Math.max(0, Math.min(100, stabilityScore)) / 100;
};

// Calculate coordination score based on symmetry
const calculateCoordinationScore = (landmarks) => {
  try {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    
    // Calculate arm symmetry if all landmarks are available
    let coordination = 1.0;
    
    if (leftShoulder && rightShoulder && leftElbow && rightElbow) {
      const leftArmLength = calculateDistance(leftShoulder, leftElbow);
      const rightArmLength = calculateDistance(rightShoulder, rightElbow);
      const armLengthDiff = Math.abs(leftArmLength - rightArmLength);
      
      if (leftWrist && rightWrist) {
        const leftForearmLength = calculateDistance(leftElbow, leftWrist);
        const rightForearmLength = calculateDistance(rightElbow, rightWrist);
        const forearmLengthDiff = Math.abs(leftForearmLength - rightForearmLength);
        
        // Penalize for asymmetric arm positioning
        coordination -= (armLengthDiff + forearmLengthDiff) * 2;
      }
    }
    
    return Math.max(0, Math.min(1, coordination));
  } catch (error) {
    console.warn('Error calculating coordination score:', error);
    return 0.5; // Default middle value
  }
};

const analyzePosture = (poseLandmarks) => {
  if (!poseLandmarks || poseLandmarks.length < 33) {
    return {
      shoulderImbalance: 0,
      headTilt: 0,
      bodyLean: 0,
      posturalStability: 0,
      coordinationScore: 0,
      confidence: 0,
      clinicalIndicators: [],
      dataQuality: 'insufficient'
    };
  }
  
  try {
    // Helper to get valid landmark with fallback
    const getValidLandmark = (index) => poseLandmarks[index] || { x: 0, y: 0, z: 0 };
    
    // Extract relevant landmarks
    // Shoulders
    const leftShoulder = getValidLandmark(11);
    const rightShoulder = getValidLandmark(12);
    
    // Hips
    const leftHip = getValidLandmark(23);
    const rightHip = getValidLandmark(24);
    
    // Head/Ears/Eyes
    const leftEar = getValidLandmark(7);
    const rightEar = getValidLandmark(8);
    const nose = getValidLandmark(0);
    
    // Additional landmarks for enhanced analysis
    const leftEye = getValidLandmark(1);
    const rightEye = getValidLandmark(2);
    
    // 1. Enhanced shoulder imbalance analysis
    const shoulderSlope = calculateSlope(leftShoulder, rightShoulder);
    // Normalize: 20 degrees (0.36 radians) is a significant shoulder imbalance
    const shoulderImbalance = normalizeValue(Math.atan(shoulderSlope), 0.36);
    
    // Additional shoulder analysis - height difference
    const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
    const normalizedHeightDiff = shoulderWidth > 0 ? shoulderHeightDiff / shoulderWidth : 0;
    
    const enhancedShoulderImbalance = Math.max(shoulderImbalance, normalizedHeightDiff);
    
    // 2. Enhanced head tilt analysis
    const earMidpoint = {
      x: (leftEar.x + rightEar.x) / 2,
      y: (leftEar.y + rightEar.y) / 2,
      z: ((leftEar.z || 0) + (rightEar.z || 0)) / 2
    };
    
    // Calculate angle between vertical line from ear midpoint and nose
    const verticalPoint = { x: earMidpoint.x, y: earMidpoint.y - 0.1, z: earMidpoint.z };
    const headAngle = calculateAngle(verticalPoint, earMidpoint, nose);
    const headTilt = normalizeValue(headAngle, 15); // 15 degrees threshold
    
    // Additional head analysis using eyes
    const eyeSlope = calculateSlope(leftEye, rightEye);
    const eyeTilt = normalizeValue(Math.atan(eyeSlope), 0.26); // ~15 degrees
    
    const enhancedHeadTilt = Math.max(headTilt, eyeTilt);
    
    // 3. Enhanced body lean analysis
    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2
    };
    
    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: ((leftHip.z || 0) + (rightHip.z || 0)) / 2
    };
    
    // Calculate angle of spine relative to vertical
    const verticalFromHips = { x: hipMidpoint.x, y: hipMidpoint.y - 0.1, z: hipMidpoint.z };
    const spineAngle = calculateAngle(verticalFromHips, hipMidpoint, shoulderMidpoint);
    const bodyLean = normalizeValue(spineAngle, 10); // 10 degrees threshold
    
    // 4. Calculate additional metrics
    const coordinationScore = calculateCoordinationScore(poseLandmarks);
    const posturalStability = calculatePosturalStability(
      enhancedShoulderImbalance, 
      enhancedHeadTilt, 
      bodyLean
    );
    
    // Calculate confidence and data quality
    const confidence = calculateConfidence(poseLandmarks);
    const dataQuality = confidence > 80 ? 'excellent' : 
                       confidence > 60 ? 'good' : 
                       confidence > 40 ? 'fair' : 'poor';
    
    const metrics = {
      shoulderImbalance: enhancedShoulderImbalance,
      headTilt: enhancedHeadTilt,
      bodyLean,
      posturalStability,
      coordinationScore,
      confidence,
      dataQuality
    };
    
    // Detect clinical indicators
    const clinicalIndicators = detectClinicalIndicators(metrics);
    
    return {
      ...metrics,
      clinicalIndicators,
      
      // Additional detailed metrics for clinical use
      detailedMetrics: {
        shoulderHeightDiff: normalizedHeightDiff,
        eyeTilt,
        spineAngle: spineAngle,
        shoulderWidth,
        hipWidth: calculateDistance(leftHip, rightHip)
      },
      
      // Landmark visibility scores
      landmarkQuality: {
        shouldersVisible: !!(leftShoulder.x && rightShoulder.x),
        hipsVisible: !!(leftHip.x && rightHip.x),
        headVisible: !!(leftEar.x && rightEar.x && nose.x)
      },
      
      // Timestamp for tracking
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error in posture analysis:', error);
    return {
      shoulderImbalance: 0,
      headTilt: 0,
      bodyLean: 0,
      posturalStability: 0,
      coordinationScore: 0,
      confidence: 0,
      clinicalIndicators: ['Analysis error - please retry'],
      dataQuality: 'error',
      error: error.message
    };
  }
};

export default analyzePosture;
