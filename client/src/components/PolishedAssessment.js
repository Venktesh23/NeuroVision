import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler, ArcElement } from 'chart.js';
import { Bar, Radar, Doughnut } from 'react-chartjs-2';
import SpeechAnalysis from './SpeechAnalysis';
import ApiService from '../utils/apiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement
);

const PolishedAssessment = ({ 
  webcamRef, 
  canvasRef,
  isDetecting,
  onToggleDetection,
  faceMeshResults,
  poseResults,
  asymmetryMetrics,
  postureMetrics,
  speechMetrics,
  onSpeechMetricsUpdate,
  onClearResults,
  onSaveAssessment,
  isSaving,
  riskLevel,
  assessmentFindings,
  onPhaseChange
}) => {
  const [currentPhase, setCurrentPhase] = useState('instruction');
  const [countdown, setCountdown] = useState(5);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningStep, setScanningStep] = useState('facial');
  const [completedSteps, setCompletedSteps] = useState({
    facial: false,
    posture: false,
    speech: false
  });
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  
  const countdownRef = useRef(null);
  const progressRef = useRef(null);

  // Enhanced AI analysis with both APIs
  const processAssessmentWithAI = useCallback(async () => {
    setAiProcessing(true);
    try {
      const assessmentData = {
        facialMetrics: {
          overallAsymmetry: asymmetryMetrics.overallAsymmetry || 0,
          eyeAsymmetry: asymmetryMetrics.eyeAsymmetry || 0,
          mouthAsymmetry: asymmetryMetrics.mouthAsymmetry || 0,
          eyebrowAsymmetry: asymmetryMetrics.eyebrowAsymmetry || 0,
          confidenceScore: asymmetryMetrics.confidenceScore || 0
        },
        postureMetrics: {
          shoulderImbalance: postureMetrics.shoulderImbalance || 0,
          posturalStability: postureMetrics.posturalStability || 0,
          coordinationScore: postureMetrics.coordinationScore || 0,
          balanceScore: postureMetrics.balanceScore || 0
        },
        speechMetrics: {
          coherenceScore: speechMetrics.coherenceScore || 0,
          articulationScore: speechMetrics.slurredSpeechScore || 0,
          wordFindingScore: speechMetrics.wordFindingScore || 0,
          overallRisk: speechMetrics.overallRisk || 'low',
          observations: speechMetrics.observations || []
        },
        assessmentDuration: 45,
        timestamp: new Date().toISOString()
      };

      // Use enhanced AI endpoint for comprehensive analysis with maximum AI utilization
      const aiResponse = await ApiService.enhancedMultimodalAssessment(
        assessmentData.facialMetrics,
        assessmentData.postureMetrics,
        assessmentData.speechMetrics,
        null, // Audio data would be passed here if available
        {
          type: 'Comprehensive neurological screening',
          expectedDuration: 45,
          demographics: null,
          sessionId: Date.now().toString()
        }
      );
      
      console.log('Enhanced AI Response:', aiResponse);
      
      // Extract comprehensive AI analysis
      const aiAnalysis = aiResponse.data || {};
      const overallRisk = calculateEnhancedRisk(assessmentData, aiAnalysis);
      
      const results = {
        riskLevel: overallRisk.level,
        riskScore: overallRisk.score,
        strokeProbability: aiAnalysis.integratedAssessment?.strokeProbability || overallRisk.probability,
        detectedSymptoms: extractSymptoms(assessmentData, aiAnalysis),
        recommendations: aiAnalysis.recommendations || generateFallbackRecommendations(overallRisk.level),
        clinicalCorrelations: aiAnalysis.clinicalCorrelations || [],
        urgencyLevel: aiAnalysis.integratedAssessment?.urgencyLevel || 'routine',
        aiConfidence: aiAnalysis.dataQuality?.reliability || 70,
        
        // Enhanced analysis fields
        advancedSpeechAnalysis: aiAnalysis.advancedSpeechAnalysis,
        advancedMedicalAnalysis: aiAnalysis.advancedMedicalAnalysis,
        integratedAssessment: aiAnalysis.integratedAssessment,
        clinicalSummary: aiAnalysis.clinicalSummary,
        dataQuality: aiAnalysis.dataQuality,
        
        // Processing metadata
        processingMode: aiResponse.mode || 'unknown',
        aiServicesUsed: aiResponse.aiServicesUsed || [],
        processingTime: aiAnalysis.dataQuality?.processingTime || 0,
        
        // Clinical metrics
        nihssEquivalent: aiAnalysis.integratedAssessment?.nihssEquivalentScore || 0,
        territoryLikelihood: aiAnalysis.integratedAssessment?.territoryLikelihood || {},
        clinicalFindings: aiAnalysis.advancedMedicalAnalysis?.clinicalFindings || {},
        
        assessmentData,
        aiAnalysis,
        completedAt: new Date().toISOString()
      };

      setAssessmentResults(results);
      
      await onSaveAssessment({
        ...assessmentData,
        aiAnalysis: results,
        riskLevel: overallRisk.level
      });

      return results;
    } catch (error) {
      console.error('AI processing failed:', error);
      const fallbackRisk = calculateBasicRisk();
      const fallbackResults = {
        riskLevel: fallbackRisk.level,
        riskScore: fallbackRisk.score,
        strokeProbability: fallbackRisk.probability,
        detectedSymptoms: fallbackRisk.symptoms,
        recommendations: generateFallbackRecommendations(fallbackRisk.level),
        clinicalCorrelations: ['Assessment completed with basic analysis'],
        urgencyLevel: fallbackRisk.level === 'high' ? 'urgent' : 'routine',
        aiConfidence: 50,
        assessmentData: { asymmetryMetrics, postureMetrics, speechMetrics },
        error: 'AI analysis unavailable - using basic assessment',
        completedAt: new Date().toISOString()
      };
      setAssessmentResults(fallbackResults);
      return fallbackResults;
    } finally {
      setAiProcessing(false);
    }
  }, [asymmetryMetrics, postureMetrics, speechMetrics, onSaveAssessment]);

  const calculateEnhancedRisk = (data, aiAnalysis) => {
    let riskScore = 0;
    const factors = [];

    if (data.facialMetrics.overallAsymmetry > 0.15) {
      riskScore += 35;
      factors.push('Significant facial asymmetry detected');
    } else if (data.facialMetrics.overallAsymmetry > 0.08) {
      riskScore += 20;
      factors.push('Mild facial asymmetry observed');
    }

    if (data.postureMetrics.shoulderImbalance > 0.12) {
      riskScore += 30;
      factors.push('Notable postural imbalance');
    } else if (data.postureMetrics.shoulderImbalance > 0.06) {
      riskScore += 15;
      factors.push('Minor postural variations');
    }

    if (data.speechMetrics.overallRisk === 'high' || data.speechMetrics.overallRisk === 'critical') {
      riskScore += 35;
      factors.push('Speech difficulties identified');
    } else if (data.speechMetrics.overallRisk === 'moderate') {
      riskScore += 20;
      factors.push('Mild speech variations noted');
    }

    if (aiAnalysis?.integratedAssessment?.strokeProbability > 70) {
      riskScore += 20;
      factors.push('AI analysis indicates elevated risk');
    }

    let level = 'low';
    if (riskScore >= 70) level = 'high';
    else if (riskScore >= 40) level = 'medium';

    return {
      score: Math.min(riskScore, 100),
      level,
      factors,
      probability: aiAnalysis?.integratedAssessment?.strokeProbability || riskScore
    };
  };

  const calculateBasicRisk = () => {
    let riskScore = 0;
    const symptoms = [];

    if (asymmetryMetrics.overallAsymmetry > 0.1) {
      riskScore += 30;
      symptoms.push('Facial asymmetry');
    }
    if (postureMetrics.shoulderImbalance > 0.08) {
      riskScore += 25;
      symptoms.push('Postural imbalance');
    }
    if (speechMetrics.overallRisk !== 'low') {
      riskScore += 25;
      symptoms.push('Speech variations');
    }

    let level = 'low';
    if (riskScore >= 60) level = 'high';
    else if (riskScore >= 30) level = 'medium';

    return {
      score: riskScore,
      level,
      probability: riskScore,
      symptoms
    };
  };

  const extractSymptoms = (data, aiAnalysis) => {
    const symptoms = [];
    
    if (data.facialMetrics.overallAsymmetry > 0.08) {
      symptoms.push({
        type: 'Facial Asymmetry',
        severity: data.facialMetrics.overallAsymmetry > 0.15 ? 'High' : 'Moderate',
        description: 'Uneven facial muscle control detected'
      });
    }
    
    if (data.postureMetrics.shoulderImbalance > 0.06) {
      symptoms.push({
        type: 'Postural Imbalance',
        severity: data.postureMetrics.shoulderImbalance > 0.12 ? 'High' : 'Moderate',
        description: 'Uneven shoulder positioning observed'
      });
    }
    
    if (data.speechMetrics.overallRisk !== 'low') {
      symptoms.push({
        type: 'Speech Variations',
        severity: data.speechMetrics.overallRisk === 'high' ? 'High' : 'Moderate',
        description: 'Changes in speech patterns detected'
      });
    }

    if (aiAnalysis?.clinicalCorrelations) {
      aiAnalysis.clinicalCorrelations.forEach(correlation => {
        if (correlation.includes('asymmetry') || correlation.includes('weakness')) {
          symptoms.push({
            type: 'AI-Detected Pattern',
            severity: 'Moderate',
            description: correlation
          });
        }
      });
    }
    
    return symptoms;
  };

  const generateFallbackRecommendations = (riskLevel) => {
    const baseRecommendations = [
      'Continue regular health monitoring',
      'Maintain healthy lifestyle habits',
      'Stay hydrated and exercise regularly'
    ];

    if (riskLevel === 'high') {
      return [
        'Consult healthcare provider immediately',
        'Monitor symptoms closely',
        'Avoid strenuous activities until cleared',
        ...baseRecommendations
      ];
    } else if (riskLevel === 'medium') {
      return [
        'Schedule routine medical checkup',
        'Monitor any changes in symptoms',
        'Discuss results with healthcare provider',
        ...baseRecommendations
      ];
    }

    return baseRecommendations;
  };

  const startAssessment = () => {
    onClearResults();
    setCurrentPhase('countdown');
    setCountdown(5);
    setCompletedSteps({ facial: false, posture: false, speech: false });
    setScanProgress(0);
    setScanningStep('facial');
    setAssessmentResults(null);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          beginScanning();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginScanning = () => {
    setCurrentPhase('scanning');
    if (!isDetecting) {
      onToggleDetection();
    }
    
    setScanningStep('facial');
    setScanProgress(0);
    
    progressRef.current = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressRef.current);
          setCompletedSteps(prev => ({ ...prev, facial: true }));
          setTimeout(() => startPosturePhase(), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 1000);
  };

  const startPosturePhase = () => {
    setScanningStep('posture');
    setScanProgress(0);
    
    progressRef.current = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressRef.current);
          setCompletedSteps(prev => ({ ...prev, posture: true }));
          setTimeout(() => {
            if (isDetecting) onToggleDetection();
            setCurrentPhase('speech');
          }, 1000);
          return 100;
        }
        return prev + 6.67;
      });
    }, 1000);
  };

  const handleSpeechComplete = async () => {
    setCompletedSteps(prev => ({ ...prev, speech: true }));
    setCurrentPhase('processing');
    
    await processAssessmentWithAI();
    setCurrentPhase('results');
  };

  const resetAssessment = () => {
    setCurrentPhase('instruction');
    setCountdown(5);
    setScanProgress(0);
    setScanningStep('facial');
    setCompletedSteps({ facial: false, posture: false, speech: false });
    setAssessmentResults(null);
    
    [countdownRef, progressRef].forEach(ref => {
      if (ref.current) clearInterval(ref.current);
    });
    
    if (isDetecting) onToggleDetection();
    onClearResults();
  };

  useEffect(() => {
    return () => {
      [countdownRef, progressRef].forEach(ref => {
        if (ref.current) clearInterval(ref.current);
      });
    };
  }, []);

  useEffect(() => {
    if (onPhaseChange) onPhaseChange(currentPhase);
  }, [currentPhase, onPhaseChange]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const renderInstructionPhase = () => (
    <motion.div 
      className="text-center space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Neurological Assessment
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          This comprehensive assessment will evaluate your facial symmetry, posture, and speech patterns to provide insights into your neurological health.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Facial Analysis</h3>
            <p className="text-sm text-gray-600">Computer vision analysis of facial symmetry and muscle control</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Posture Assessment</h3>
            <p className="text-sm text-gray-600">Evaluation of balance, coordination, and postural stability</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Speech Analysis</h3>
            <p className="text-sm text-gray-600">AI-powered analysis of speech clarity and cognitive function</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h4 className="font-semibold text-yellow-800 mb-2">Important Instructions:</h4>
          <ul className="text-sm text-yellow-700 space-y-1 text-left">
            <li>• Ensure good lighting and clear camera view</li>
            <li>• Sit or stand comfortably in front of the camera</li>
            <li>• Follow on-screen prompts during each phase</li>
            <li>• Speak clearly during the speech assessment</li>
            <li>• Complete assessment takes approximately 2-3 minutes</li>
          </ul>
        </div>

        <motion.button
          onClick={startAssessment}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Assessment
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {currentPhase === 'instruction' && (
          <motion.div key="instruction" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            {renderInstructionPhase()}
          </motion.div>
        )}
        
        {currentPhase === 'countdown' && (
          <motion.div key="countdown" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <div className="text-center space-y-8">
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Preparing Assessment
                </h2>
                <p className="text-gray-600 mb-8">
                  Position yourself comfortably in front of the camera. Assessment will begin in:
                </p>
                
                <motion.div 
                  className="text-6xl font-bold text-blue-600 mb-8"
                  key={countdown}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {countdown}
                </motion.div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {currentPhase === 'scanning' && (
          <motion.div key="scanning" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {scanningStep === 'facial' ? 'Facial Analysis' : 'Posture Assessment'}
                  </h2>
                  <div className="text-sm text-gray-500">
                    Step {scanningStep === 'facial' ? '1' : '2'} of 2
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>
                      {scanningStep === 'facial' ? 'Analyzing facial symmetry...' : 'Evaluating posture and balance...'}
                    </span>
                    <span>{Math.round(scanProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div 
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                
                <div className="text-center text-gray-600">
                  {scanningStep === 'facial' 
                    ? 'Please look directly at the camera and maintain a neutral expression'
                    : 'Please sit or stand upright and keep your shoulders level'
                  }
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {currentPhase === 'speech' && (
          <motion.div key="speech" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <div className="space-y-6">
              <SpeechAnalysis
                onSpeechMetricsUpdate={onSpeechMetricsUpdate}
                onComplete={handleSpeechComplete}
                facialMetrics={asymmetryMetrics}
                postureMetrics={postureMetrics}
              />
            </div>
          </motion.div>
        )}
        
        {currentPhase === 'processing' && (
          <motion.div key="processing" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <div className="text-center space-y-8">
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <motion.div
                  className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Processing Assessment
                </h2>
                <p className="text-gray-600 mb-4">
                  Our AI is analyzing your assessment data to provide comprehensive insights...
                </p>
                <div className="flex justify-center space-x-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 bg-blue-500 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {currentPhase === 'results' && assessmentResults && (
          <motion.div key="results" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Assessment Results</h2>
                  <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                    assessmentResults.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                    assessmentResults.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      assessmentResults.riskLevel === 'high' ? 'bg-red-500' :
                      assessmentResults.riskLevel === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    {assessmentResults.riskLevel.toUpperCase()} RISK
                  </div>
                  <p className="text-gray-600 mt-4">
                    Risk Score: {assessmentResults.riskScore}/100
                  </p>
                  <p className="text-sm text-gray-500">
                    AI Confidence: {assessmentResults.aiConfidence}%
                  </p>
                </div>

                {assessmentResults.detectedSymptoms.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Detected Patterns</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {assessmentResults.detectedSymptoms.map((symptom, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800">{symptom.type}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              symptom.severity === 'High' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {symptom.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{symptom.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {assessmentResults.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <motion.button
                    onClick={resetAssessment}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    New Assessment
                  </motion.button>
                  <motion.button
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Print Results
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PolishedAssessment; 