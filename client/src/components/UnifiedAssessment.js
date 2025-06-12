import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpeechAnalysis from './SpeechAnalysis';

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
  const [currentPhase, setCurrentPhase] = useState('instruction'); // instruction, face, pose, speech, results
  const [completedPhases, setCompletedPhases] = useState({
    face: false,
    pose: false,
    speech: false
  });
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [showMessage, setShowMessage] = useState('');
  
  const timerRef = useRef(null);

  // Phase management
  const phases = [
    {
      id: 'face',
      title: 'Facial Analysis',
      duration: 10, // seconds
      instructions: [
        'Position yourself 2-3 feet from the camera',
        'Ensure your entire face is visible and well-lit',
        'Look directly at the camera lens',
        'Try smiling and making various facial expressions',
        'Keep your head steady'
      ],
      description: 'System analyzes facial symmetry and expressions'
    },
    {
      id: 'pose',
      title: 'Posture Analysis',
      duration: 15, // seconds
      instructions: [
        'Stand or sit with your upper body visible',
        'Keep shoulders and arms in camera view',
        'Raise both arms and hold for a few seconds',
        'Touch your nose with each index finger',
        'Keep your body centered in the frame'
      ],
      description: 'System detects posture abnormalities and coordination'
    },
    {
      id: 'speech',
      title: 'Speech Analysis',
      duration: 30, // seconds
      instructions: [
        'Click "Start Recording" when ready',
        'Read the provided passage aloud clearly',
        'Speak at a normal pace and volume',
        'Ensure good microphone access'
      ],
      description: 'AI analyzes coherence, clarity, and speech patterns'
    }
  ];

  const getCurrentPhase = () => phases.find(p => p.id === currentPhase);

  // Start assessment
  const startAssessment = () => {
    setCurrentPhase('face');
    setCompletedPhases({ face: false, pose: false, speech: false });
    onClearResults();
    if (!isDetecting) {
      onToggleDetection();
    }
    startPhaseTimer('face');
  };

  // Notify parent of phase changes
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(currentPhase);
    }
  }, [currentPhase, onPhaseChange]);

  // Start phase timer
  const startPhaseTimer = (phase) => {
    const phaseData = phases.find(p => p.id === phase);
    if (!phaseData) return;

    setPhaseTimer(phaseData.duration);
    
    timerRef.current = setInterval(() => {
      setPhaseTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          completePhase(phase);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Complete current phase
  const completePhase = (phase) => {
    setCompletedPhases(prev => ({ ...prev, [phase]: true }));
    
    // Show completion message
    setShowMessage(`${phase} analysis complete! Moving to next phase...`);
    setTimeout(() => setShowMessage(''), 3000);

    // Move to next phase
    if (phase === 'face') {
      setTimeout(() => {
        setCurrentPhase('pose');
        startPhaseTimer('pose');
      }, 2000);
    } else if (phase === 'pose') {
      setTimeout(() => {
        setCurrentPhase('speech');
        // Don't auto-start timer for speech - user controls this
      }, 2000);
    } else if (phase === 'speech') {
      setTimeout(() => {
        setCurrentPhase('results');
        if (isDetecting) {
          onToggleDetection();
        }
      }, 2000);
    }
  };

  // Manual phase completion
  const skipToNextPhase = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    completePhase(currentPhase);
  };

  // Reset assessment
  const resetAssessment = () => {
    setCurrentPhase('instruction');
    setCompletedPhases({ face: false, pose: false, speech: false });
    setPhaseTimer(0);
    setShowMessage('');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (isDetecting) {
      onToggleDetection();
    }
    onClearResults();
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle speech completion
  const handleSpeechComplete = () => {
    completePhase('speech');
  };

  // Get overall risk assessment
  const getOverallRisk = () => {
    if (!completedPhases.face && !completedPhases.pose && !completedPhases.speech) {
      return 'pending';
    }
    
    // Calculate based on available metrics
    const risks = [];
    if (asymmetryMetrics.overallAsymmetry > 0.7) risks.push('high');
    if (postureMetrics.shoulderImbalance > 0.6) risks.push('high');
    if (speechMetrics.overallRisk === 'high') risks.push('high');
    
    if (risks.includes('high')) return 'high';
    if (risks.length > 0) return 'medium';
    return 'low';
  };

  return (
    <div className="space-y-6">
      {/* Phase Progress Bar */}
      <div className="bg-white rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold mb-4">Assessment Progress</h3>
        <div className="flex items-center space-x-4">
          {phases.map((phase, index) => (
            <div key={phase.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                completedPhases[phase.id] 
                  ? 'bg-green-500 text-white' 
                  : currentPhase === phase.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {completedPhases[phase.id] ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentPhase === phase.id ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {phase.title}
              </span>
              {index < phases.length - 1 && (
                <div className={`mx-4 h-0.5 w-8 ${
                  completedPhases[phase.id] ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-xl text-center font-medium"
          >
            {showMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {/* Initial Instructions */}
        {currentPhase === 'instruction' && (
          <motion.div
            key="instruction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl p-8 shadow-xl text-center"
          >
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Neurological Assessment</h2>
            <p className="text-lg text-gray-600 mb-8">
              This assessment will evaluate three key areas: facial symmetry, posture coordination, and speech patterns.
              The entire process takes about 1-2 minutes.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {phases.map((phase, index) => (
                <div key={phase.id} className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{index + 1}</div>
                  <h3 className="font-bold mb-2">{phase.title}</h3>
                  <p className="text-sm text-gray-600">{phase.description}</p>
                  <p className="text-xs text-gray-500 mt-2">~{phase.duration} seconds</p>
                </div>
              ))}
            </div>
            <button
              onClick={startAssessment}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              Start Assessment
            </button>
          </motion.div>
        )}

        {/* Active Phase Instructions */}
        {(currentPhase === 'face' || currentPhase === 'pose') && (
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl p-6 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{getCurrentPhase()?.title}</h3>
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-blue-600">
                  {phaseTimer}s
                </div>
                <button
                  onClick={skipToNextPhase}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                >
                  Next Phase
                </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold mb-3">Instructions:</h4>
                <ul className="space-y-2">
                  {getCurrentPhase()?.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-sm">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Current Status:</h4>
                <div className="space-y-2 text-sm">
                  {currentPhase === 'face' && (
                    <>
                      <div className="flex justify-between">
                        <span>Face Detection:</span>
                        <span className={faceMeshResults ? 'text-green-600 font-bold' : 'text-gray-400'}>
                          {faceMeshResults ? 'ACTIVE' : 'WAITING'}
                        </span>
                      </div>
                      {asymmetryMetrics.overallAsymmetry > 0 && (
                        <div className="text-xs text-green-600">
                          ✓ Facial data being collected
                        </div>
                      )}
                    </>
                  )}
                  
                  {currentPhase === 'pose' && (
                    <>
                      <div className="flex justify-between">
                        <span>Pose Detection:</span>
                        <span className={poseResults ? 'text-green-600 font-bold' : 'text-gray-400'}>
                          {poseResults ? 'ACTIVE' : 'WAITING'}
                        </span>
                      </div>
                      {postureMetrics.shoulderImbalance > 0 && (
                        <div className="text-xs text-green-600">
                          ✓ Posture data being collected
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Speech Phase */}
        {currentPhase === 'speech' && (
          <motion.div
            key="speech"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl p-6 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Speech Analysis</h3>
              <button
                onClick={handleSpeechComplete}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
              >
                Complete Assessment
              </button>
            </div>
            
            <SpeechAnalysis 
              onSpeechMetricsUpdate={onSpeechMetricsUpdate}
              onComplete={handleSpeechComplete}
            />
          </motion.div>
        )}

        {/* Results Phase */}
        {currentPhase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overall Results Summary */}
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold mb-6">Assessment Results</h3>
              
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* Face Results */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-3 flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${
                      completedPhases.face ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    Facial Analysis
                  </h4>
                  {completedPhases.face ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Overall Asymmetry:</span>
                        <span className="font-bold">
                          {asymmetryMetrics.overallAsymmetry != null ? 
                            (asymmetryMetrics.overallAsymmetry * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Eye Asymmetry:</span>
                        <span>{asymmetryMetrics.eyeAsymmetry != null ? 
                          (asymmetryMetrics.eyeAsymmetry * 100).toFixed(1) : '0.0'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mouth Asymmetry:</span>
                        <span>{asymmetryMetrics.mouthAsymmetry != null ? 
                          (asymmetryMetrics.mouthAsymmetry * 100).toFixed(1) : '0.0'}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not completed</p>
                  )}
                </div>

                {/* Pose Results */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-3 flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${
                      completedPhases.pose ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    Posture Analysis
                  </h4>
                  {completedPhases.pose ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Shoulder Balance:</span>
                        <span className="font-bold">
                          {postureMetrics.shoulderImbalance != null ? 
                            (postureMetrics.shoulderImbalance * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Head Tilt:</span>
                        <span>{postureMetrics.headTilt != null ? 
                          (postureMetrics.headTilt * 100).toFixed(1) : '0.0'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Body Lean:</span>
                        <span>{postureMetrics.bodyLean != null ? 
                          (postureMetrics.bodyLean * 100).toFixed(1) : '0.0'}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not completed</p>
                  )}
                </div>

                {/* Speech Results */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-3 flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${
                      completedPhases.speech ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    Speech Analysis
                  </h4>
                  {completedPhases.speech && speechMetrics.overallRisk ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Coherence:</span>
                        <span className="font-bold">
                          {speechMetrics.coherenceScore != null ? speechMetrics.coherenceScore : '0'}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Clarity:</span>
                        <span>
                          {speechMetrics.slurredSpeechScore != null ? speechMetrics.slurredSpeechScore : '0'}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Word Finding:</span>
                        <span>
                          {speechMetrics.wordFindingScore != null ? speechMetrics.wordFindingScore : '0'}/10
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not completed</p>
                  )}
                </div>
              </div>

              {/* Overall Risk Assessment */}
              <div className={`p-6 rounded-lg text-center ${
                getOverallRisk() === 'high' ? 'bg-red-100 border border-red-300' :
                getOverallRisk() === 'medium' ? 'bg-yellow-100 border border-yellow-300' :
                'bg-green-100 border border-green-300'
              }`}>
                <h4 className="text-lg font-bold mb-2">Overall Risk Assessment</h4>
                <div className={`text-2xl font-bold ${
                  getOverallRisk() === 'high' ? 'text-red-600' :
                  getOverallRisk() === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {getOverallRisk().toUpperCase()}
                </div>
                {assessmentFindings.length > 0 && (
                  <div className="mt-4 text-left">
                    <h5 className="font-bold mb-2">Key Findings:</h5>
                    <ul className="text-sm space-y-1">
                      {assessmentFindings.map((finding, index) => (
                        <li key={index}>• {finding}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={onSaveAssessment}
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Assessment'}
                </button>
                <button
                  onClick={resetAssessment}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
                >
                  New Assessment
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedAssessment; 