import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import SpeechAnalysis from './SpeechAnalysis';

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
  Filler
);

const UnifiedAssessment = ({ 
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
  const [currentPhase, setCurrentPhase] = useState('ready'); // ready, countdown, scanning, speech, completed, results
  const [countdown, setCountdown] = useState(5);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningPhase, setScanningPhase] = useState('facial'); // facial, posture
  const [completedScans, setCompletedScans] = useState({
    facial: false,
    posture: false,
    speech: false
  });
  const [overallRisk, setOverallRisk] = useState('low');
  
  const countdownRef = useRef(null);
  const scanRef = useRef(null);
  const progressRef = useRef(null);

  // Start the assessment process
  const startAssessment = () => {
    onClearResults();
    setCurrentPhase('countdown');
    setCountdown(5);
    setCompletedScans({ facial: false, posture: false, speech: false });
    setScanProgress(0);
    setScanningPhase('facial');
    
    // Start countdown
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

  // Begin the scanning phase
  const beginScanning = () => {
    setCurrentPhase('scanning');
    if (!isDetecting) {
      onToggleDetection();
    }
    
    // Start facial analysis (10 seconds)
    setScanningPhase('facial');
    setScanProgress(0);
    
    progressRef.current = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressRef.current);
          setCompletedScans(prevScans => ({ ...prevScans, facial: true }));
          // Switch to posture analysis
          setTimeout(() => {
            setScanningPhase('posture');
            setScanProgress(0);
            startPostureScanning();
          }, 500);
          return 100;
        }
        return prev + 10; // 10% every second for 10 seconds
      });
    }, 1000);
  };

  // Start posture scanning phase
  const startPostureScanning = () => {
    progressRef.current = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressRef.current);
          setCompletedScans(prevScans => ({ ...prevScans, posture: true }));
          // Scanning complete
          setCurrentPhase('completed');
          if (isDetecting) {
            onToggleDetection();
          }
          // Auto-advance to speech after 2 seconds
          setTimeout(() => {
            setCurrentPhase('speech');
          }, 2000);
          return 100;
        }
        return prev + 6.67; // ~6.67% every second for 15 seconds
      });
    }, 1000);
  };

  // Handle speech completion
  const handleSpeechComplete = () => {
    setCompletedScans(prev => ({ ...prev, speech: true }));
    calculateOverallRisk();
    setCurrentPhase('results');
  };

  // Calculate overall risk assessment
  const calculateOverallRisk = () => {
    const risks = [];
    
    // Facial asymmetry risk
    if (asymmetryMetrics.overallAsymmetry > 0.15) risks.push('high');
    else if (asymmetryMetrics.overallAsymmetry > 0.08) risks.push('medium');
    else risks.push('low');
    
    // Posture risk
    if (postureMetrics.shoulderImbalance > 0.12) risks.push('high');
    else if (postureMetrics.shoulderImbalance > 0.06) risks.push('medium');
    else risks.push('low');
    
    // Speech risk
    if (speechMetrics.overallRisk === 'high' || speechMetrics.overallRisk === 'critical') risks.push('high');
    else if (speechMetrics.overallRisk === 'medium' || speechMetrics.overallRisk === 'moderate') risks.push('medium');
    else risks.push('low');
    
    // Determine overall risk
    if (risks.filter(r => r === 'high').length >= 2) {
      setOverallRisk('high');
    } else if (risks.filter(r => r === 'high').length >= 1 || risks.filter(r => r === 'medium').length >= 2) {
      setOverallRisk('medium');
    } else {
      setOverallRisk('low');
    }
  };

  // Reset assessment
  const resetAssessment = () => {
    setCurrentPhase('ready');
    setCountdown(5);
    setScanProgress(0);
    setScanningPhase('facial');
    setCompletedScans({ facial: false, posture: false, speech: false });
    setOverallRisk('low');
    
    // Clear intervals
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (scanRef.current) clearInterval(scanRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    
    if (isDetecting) {
      onToggleDetection();
    }
    onClearResults();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (scanRef.current) clearInterval(scanRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  // Notify parent of phase changes
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(currentPhase);
    }
  }, [currentPhase, onPhaseChange]);

  // Chart data for results dashboard
  const getChartData = () => {
    const facialScore = Math.max(0, 100 - (asymmetryMetrics.overallAsymmetry || 0) * 100);
    const postureScore = Math.max(0, 100 - (postureMetrics.shoulderImbalance || 0) * 100);
    const speechScore = speechMetrics.coherenceScore || 0;

    return {
      labels: ['Facial Symmetry', 'Posture Balance', 'Speech Clarity'],
      datasets: [
        {
          label: 'Assessment Scores',
          data: [facialScore, postureScore, speechScore],
          backgroundColor: [
            facialScore >= 80 ? '#10b981' : facialScore >= 60 ? '#f59e0b' : '#ef4444',
            postureScore >= 80 ? '#10b981' : postureScore >= 60 ? '#f59e0b' : '#ef4444',
            speechScore >= 80 ? '#10b981' : speechScore >= 60 ? '#f59e0b' : '#ef4444'
          ],
          borderColor: [
            facialScore >= 80 ? '#059669' : facialScore >= 60 ? '#d97706' : '#dc2626',
            postureScore >= 80 ? '#059669' : postureScore >= 60 ? '#d97706' : '#dc2626',
            speechScore >= 80 ? '#059669' : speechScore >= 60 ? '#d97706' : '#dc2626'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  };

  const radarData = () => {
    const facialScore = Math.max(0, 100 - (asymmetryMetrics.overallAsymmetry || 0) * 100);
    const postureScore = Math.max(0, 100 - (postureMetrics.shoulderImbalance || 0) * 100);
    const speechCoherence = speechMetrics.coherenceScore || 0;
    const speechClarity = 100 - (speechMetrics.slurredSpeechScore || 0);
    const wordFinding = speechMetrics.wordFindingScore || 0;

    return {
      labels: ['Facial Symmetry', 'Posture', 'Speech Coherence', 'Speech Clarity', 'Word Finding'],
      datasets: [
        {
          label: 'Assessment Profile',
          data: [facialScore, postureScore, speechCoherence, speechClarity, wordFinding],
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Assessment Score Breakdown',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {/* Ready State */}
        {currentPhase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl p-8 shadow-xl text-center"
          >
            <div className="mb-8">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Neurological Assessment</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Complete stroke risk evaluation using advanced AI analysis of facial symmetry, posture coordination, and speech patterns.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <div className="text-3xl mb-3">👁️</div>
                <h3 className="font-bold text-blue-800 mb-2">Facial Analysis</h3>
                <p className="text-sm text-blue-600">AI-powered symmetry detection using 468 facial landmarks</p>
                <div className="mt-3 text-xs text-blue-500">~10 seconds</div>
              </div>
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <div className="text-3xl mb-3">🏃</div>
                <h3 className="font-bold text-green-800 mb-2">Posture Assessment</h3>
                <p className="text-sm text-green-600">Balance and coordination evaluation</p>
                <div className="mt-3 text-xs text-green-500">~15 seconds</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                <div className="text-3xl mb-3">🗣️</div>
                <h3 className="font-bold text-purple-800 mb-2">Speech Analysis</h3>
                <p className="text-sm text-purple-600">Advanced AI speech pattern recognition</p>
                <div className="mt-3 text-xs text-purple-500">~30 seconds</div>
              </div>
            </div>

            <motion.button
              onClick={startAssessment}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              Start Assessment
            </motion.button>
          </motion.div>
        )}

        {/* Countdown State */}
        {currentPhase === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-8 shadow-xl text-center"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Get Ready</h3>
            <p className="text-gray-600 mb-8">Position yourself comfortably in front of the camera</p>
            
            <motion.div
              key={countdown}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-8xl font-bold text-blue-600 mb-6"
            >
              {countdown}
            </motion.div>
            
            <div className="text-gray-500">
              • Ensure good lighting
              • Face the camera directly  
              • Keep your upper body visible
            </div>
          </motion.div>
        )}

        {/* Scanning State */}
        {currentPhase === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl p-8 shadow-xl"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {scanningPhase === 'facial' ? 'Analyzing Facial Symmetry...' : 'Analyzing Posture & Coordination...'}
              </h3>
              <p className="text-gray-600">
                {scanningPhase === 'facial' 
                  ? 'Please look directly at the camera and make natural facial expressions'
                  : 'Raise both arms, touch your nose, and maintain good posture'
                }
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {scanningPhase === 'facial' ? 'Facial Analysis' : 'Posture Analysis'}
                </span>
                <span className="text-sm text-gray-500">{Math.round(scanProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className={`h-3 rounded-full ${
                    scanningPhase === 'facial' ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 ${
                completedScans.facial 
                  ? 'bg-green-50 border-green-300' 
                  : scanningPhase === 'facial'
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-center">
                  {completedScans.facial ? (
                    <span className="text-green-600 mr-2">✓</span>
                  ) : scanningPhase === 'facial' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  ) : (
                    <span className="text-gray-400 mr-2">○</span>
                  )}
                  <span className="font-medium">Facial Analysis</span>
                </div>
                {faceMeshResults && scanningPhase === 'facial' && (
                  <div className="text-xs text-green-600 mt-1">✓ Face detected</div>
                )}
              </div>
              
              <div className={`p-4 rounded-lg border-2 ${
                completedScans.posture 
                  ? 'bg-green-50 border-green-300' 
                  : scanningPhase === 'posture'
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-center">
                  {completedScans.posture ? (
                    <span className="text-green-600 mr-2">✓</span>
                  ) : scanningPhase === 'posture' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                  ) : (
                    <span className="text-gray-400 mr-2">○</span>
                  )}
                  <span className="font-medium">Posture Analysis</span>
                </div>
                {poseResults && scanningPhase === 'posture' && (
                  <div className="text-xs text-green-600 mt-1">✓ Pose detected</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Completed State */}
        {currentPhase === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-8 shadow-xl text-center"
          >
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-4">Scanning Complete!</h3>
            <p className="text-gray-600 mb-6">Camera analysis finished. Now let's test your speech.</p>
            <div className="text-sm text-gray-500">Proceeding to speech analysis...</div>
          </motion.div>
        )}

        {/* Speech State */}
        {currentPhase === 'speech' && (
          <motion.div
            key="speech"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl p-8 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Speech Analysis</h3>
              <button
                onClick={handleSpeechComplete}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Skip to Results
              </button>
            </div>
            
            <SpeechAnalysis 
              onSpeechMetricsUpdate={onSpeechMetricsUpdate}
              onComplete={handleSpeechComplete}
              asymmetryMetrics={asymmetryMetrics}
              postureMetrics={postureMetrics}
            />
          </motion.div>
        )}

        {/* Results State */}
        {currentPhase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overall Risk Assessment */}
            <div className={`rounded-2xl p-8 shadow-xl text-center ${
              overallRisk === 'high' ? 'bg-red-50 border-2 border-red-200' :
              overallRisk === 'medium' ? 'bg-yellow-50 border-2 border-yellow-200' :
              'bg-green-50 border-2 border-green-200'
            }`}>
              <h2 className="text-3xl font-bold mb-4">Assessment Complete</h2>
              <div className={`text-6xl font-bold mb-4 ${
                overallRisk === 'high' ? 'text-red-600' :
                overallRisk === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {overallRisk.toUpperCase()} RISK
              </div>
              <p className="text-gray-600 text-lg">
                {overallRisk === 'high' 
                  ? 'Some concerning indicators detected. Consider consulting a healthcare professional.'
                  : overallRisk === 'medium'
                    ? 'Minor indicators noted. Continue monitoring and maintain healthy habits.'
                    : 'No significant stroke indicators detected. Maintain healthy lifestyle.'
                }
              </p>
            </div>

            {/* Visual Dashboard */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Score Breakdown</h3>
                <div style={{ height: '300px' }}>
                  <Bar data={getChartData()} options={chartOptions} />
                </div>
              </div>

              {/* Radar Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Assessment Profile</h3>
                <div style={{ height: '300px' }}>
                  <Radar data={radarData()} options={radarOptions} />
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Detailed Analysis</h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* Facial Metrics */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 border-b pb-2">Facial Symmetry</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Overall Asymmetry:</span>
                      <span className="font-bold">
                        {((asymmetryMetrics.overallAsymmetry || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Eye Asymmetry:</span>
                      <span>{((asymmetryMetrics.eyeAsymmetry || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mouth Asymmetry:</span>
                      <span>{((asymmetryMetrics.mouthAsymmetry || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Posture Metrics */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 border-b pb-2">Posture & Balance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shoulder Balance:</span>
                      <span className="font-bold">
                        {((postureMetrics.shoulderImbalance || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Coordination:</span>
                      <span>{((postureMetrics.coordinationScore || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stability:</span>
                      <span>{((postureMetrics.posturalStability || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Speech Metrics */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 border-b pb-2">Speech Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Coherence:</span>
                      <span className="font-bold">{speechMetrics.coherenceScore || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Clarity:</span>
                      <span>{(100 - (speechMetrics.slurredSpeechScore || 0)).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Word Finding:</span>
                      <span>{speechMetrics.wordFindingScore || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Observations */}
              {speechMetrics.observations && speechMetrics.observations.length > 0 && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-bold text-blue-800 mb-2">Clinical Observations:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {speechMetrics.observations.slice(0, 3).map((observation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{observation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSaveAssessment}
                disabled={isSaving}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Assessment'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetAssessment}
                className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold transition-all shadow-lg"
              >
                New Assessment
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedAssessment; 