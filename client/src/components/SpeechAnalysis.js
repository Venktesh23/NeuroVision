import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ApiService from "../utils/apiService";

const SpeechAnalysis = ({ 
  onSpeechMetricsUpdate, 
  onComplete, 
  facialMetrics = null, 
  postureMetrics = null 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('Click "Start Recording" to begin voice analysis');
  const [speechMetrics, setSpeechMetrics] = useState({
    coherenceScore: null,
    slurredSpeechScore: null,
    wordFindingScore: null,
    overallRisk: null,
    observations: []
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [currentPassage, setCurrentPassage] = useState('');
  const [usedPassages, setUsedPassages] = useState(new Set());
  const [isSupported, setIsSupported] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [passageMetadata, setPassageMetadata] = useState(null);
  
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  // Update transcript ref when state changes
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Comprehensive medical-grade speech assessment passages
  const speechPassageBank = useMemo(() => {
    return {
      // Neurological Assessment Passages (Focus on articulation, motor control)
      neurological: [
        {
          id: 'neuro_1',
          difficulty: 'easy',
          text: "The early bird catches the worm. Please repeat this clearly three times.",
          focus: ['consonant_clusters', 'repetition', 'motor_consistency'],
          medicalTerms: ['repeat', 'clearly'],
          strokeSensitive: ['r', 'l', 'th', 'early', 'bird']
        },
        {
          id: 'neuro_2',
          difficulty: 'medium',
          text: "British Constitution. Methodist Episcopal. Around the rugged rocks the ragged rascals ran.",
          focus: ['tongue_twisters', 'articulation_precision', 'consonant_blends'],
          medicalTerms: ['constitution', 'episcopal'],
          strokeSensitive: ['r', 'constitution', 'methodist', 'episcopal', 'rugged', 'rocks', 'ragged', 'rascals']
        },
        {
          id: 'neuro_3',
          difficulty: 'medium',
          text: "Today is Thursday, the thirtieth of November. The weather is warm and wonderful.",
          focus: ['temporal_awareness', 'articulation', 'memory'],
          medicalTerms: ['november', 'weather'],
          strokeSensitive: ['th', 'thirtieth', 'thursday', 'weather', 'wonderful', 'warm']
        },
        {
          id: 'neuro_4',
          difficulty: 'hard',
          text: "Neurological examination revealed asymmetrical facial expressions and potential speech articulation difficulties.",
          focus: ['medical_terminology', 'multisyllabic_words', 'technical_pronunciation'],
          medicalTerms: ['neurological', 'examination', 'asymmetrical', 'articulation'],
          strokeSensitive: ['neurological', 'asymmetrical', 'articulation', 'difficulties']
        },
        {
          id: 'neuro_5',
          difficulty: 'expert',
          text: "Hippopotamus, rhinoceros, and elephant walked through the thick thorny thicket thinking thoughtful thoughts.",
          focus: ['complex_articulation', 'alliteration', 'tongue_coordination'],
          medicalTerms: ['hippopotamus', 'rhinoceros'],
          strokeSensitive: ['hippopotamus', 'rhinoceros', 'thick', 'thorny', 'thicket', 'thinking', 'thoughtful', 'thoughts']
        }
      ],

      // Cognitive Assessment Passages (Focus on comprehension, sequence)
      cognitive: [
        {
          id: 'cog_1',
          difficulty: 'easy',
          text: "Please count from one to ten, then spell your first name backwards.",
          focus: ['sequencing', 'working_memory', 'cognitive_load'],
          medicalTerms: ['count', 'spell'],
          strokeSensitive: ['backwards', 'sequencing']
        },
        {
          id: 'cog_2',
          difficulty: 'medium',
          text: "Emergency procedures require clear communication between healthcare providers and immediate documentation.",
          focus: ['professional_vocabulary', 'complex_concepts', 'healthcare_context'],
          medicalTerms: ['emergency', 'procedures', 'healthcare', 'providers', 'documentation'],
          strokeSensitive: ['emergency', 'procedures', 'communication', 'immediate']
        },
        {
          id: 'cog_3',
          difficulty: 'hard',
          text: "Describe the steps to make a peanut butter sandwich, including opening containers and spreading ingredients.",
          focus: ['procedural_memory', 'sequential_planning', 'detailed_description'],
          medicalTerms: ['procedures', 'ingredients'],
          strokeSensitive: ['describe', 'containers', 'spreading', 'ingredients']
        },
        {
          id: 'cog_4',
          difficulty: 'expert',
          text: "Pharmacological interventions must be administered according to established therapeutic guidelines while monitoring contraindications.",
          focus: ['pharmaceutical_terminology', 'complex_grammar', 'medical_precision'],
          medicalTerms: ['pharmacological', 'interventions', 'administered', 'therapeutic', 'guidelines', 'contraindications'],
          strokeSensitive: ['pharmacological', 'administered', 'therapeutic', 'contraindications']
        }
      ],

      // Motor Speech Assessment (Focus on coordination, rhythm)
      motor: [
        {
          id: 'motor_1',
          difficulty: 'easy',
          text: "Pa-ta-ka, pa-ta-ka, pa-ta-ka. Repeat this sequence five times as quickly and clearly as possible.",
          focus: ['diadochokinesis', 'oral_motor_speed', 'coordination'],
          medicalTerms: ['sequence', 'repeat'],
          strokeSensitive: ['pa-ta-ka', 'quickly', 'clearly', 'possible']
        },
        {
          id: 'motor_2',
          difficulty: 'medium',
          text: "Breathe deeply and speak slowly. Articulate each syllable clearly while maintaining steady rhythm.",
          focus: ['breath_control', 'rhythm', 'articulation', 'pacing'],
          medicalTerms: ['articulate', 'syllable', 'rhythm'],
          strokeSensitive: ['breathe', 'articulate', 'syllable', 'maintaining', 'steady']
        },
        {
          id: 'motor_3',
          difficulty: 'hard',
          text: "Rapid alternating movements require precise coordination and consistent articulatory patterns throughout speech production.",
          focus: ['rapid_speech', 'coordination', 'precision', 'consistency'],
          medicalTerms: ['alternating', 'coordination', 'articulatory', 'production'],
          strokeSensitive: ['rapid', 'alternating', 'precise', 'coordination', 'articulatory', 'production']
        },
        {
          id: 'motor_4',
          difficulty: 'expert',
          text: "Supraglottal articulation involves intricate muscular coordination affecting laryngeal adjustments and respiratory synchronization.",
          focus: ['technical_anatomy', 'complex_coordination', 'respiratory_control'],
          medicalTerms: ['supraglottal', 'articulation', 'muscular', 'laryngeal', 'respiratory', 'synchronization'],
          strokeSensitive: ['supraglottal', 'articulation', 'intricate', 'muscular', 'laryngeal', 'synchronization']
        }
      ],

      // Current Events & Spontaneous Speech (Focus on fluency, word-finding)
      spontaneous: [
        {
          id: 'spont_1',
          difficulty: 'easy',
          text: "Tell me about your morning routine. What did you eat for breakfast today?",
          focus: ['spontaneous_speech', 'personal_narrative', 'word_retrieval'],
          medicalTerms: ['routine', 'breakfast'],
          strokeSensitive: ['morning', 'routine', 'breakfast']
        },
        {
          id: 'spont_2',
          difficulty: 'medium',
          text: "Describe the importance of regular medical checkups and how they help prevent serious health problems.",
          focus: ['explanatory_speech', 'health_concepts', 'complex_reasoning'],
          medicalTerms: ['medical', 'checkups', 'prevent', 'health'],
          strokeSensitive: ['importance', 'regular', 'medical', 'checkups', 'prevent', 'serious']
        },
        {
          id: 'spont_3',
          difficulty: 'hard',
          text: "Explain how modern technology has changed healthcare delivery and patient communication in hospitals.",
          focus: ['abstract_reasoning', 'technical_vocabulary', 'complex_explanation'],
          medicalTerms: ['technology', 'healthcare', 'delivery', 'patient', 'communication', 'hospitals'],
          strokeSensitive: ['technology', 'healthcare', 'delivery', 'communication', 'hospitals']
        }
      ],

      // Emotional & Stress Testing (Focus on prosody, emotional expression)
      emotional: [
        {
          id: 'emot_1',
          difficulty: 'medium',
          text: "During stressful situations, it's important to remain calm and communicate clearly with confidence.",
          focus: ['stress_response', 'emotional_control', 'prosody'],
          medicalTerms: ['stressful', 'communicate', 'confidence'],
          strokeSensitive: ['stressful', 'situations', 'important', 'communicate', 'confidence']
        },
        {
          id: 'emot_2',
          difficulty: 'hard',
          text: "Express frustration, then joy, then concern while saying: The weather forecast predicts rain tomorrow.",
          focus: ['emotional_prosody', 'vocal_modulation', 'emotional_flexibility'],
          medicalTerms: ['forecast', 'predicts'],
          strokeSensitive: ['frustration', 'concern', 'weather', 'forecast', 'predicts', 'tomorrow']
        },
        {
          id: 'emot_3',
          difficulty: 'expert',
          text: "Anxiety can significantly impact speech patterns and cognitive performance requiring therapeutic intervention.",
          focus: ['emotional_vocabulary', 'psychological_concepts', 'therapeutic_language'],
          medicalTerms: ['anxiety', 'cognitive', 'performance', 'therapeutic', 'intervention'],
          strokeSensitive: ['anxiety', 'significantly', 'cognitive', 'performance', 'therapeutic', 'intervention']
        }
      ],

      // Aphasia Screening (Focus on naming, repetition, comprehension)
      aphasia: [
        {
          id: 'aphasia_1',
          difficulty: 'easy',
          text: "Name these common objects: pen, watch, book, key, chair.",
          focus: ['object_naming', 'word_retrieval', 'semantic_access'],
          medicalTerms: ['objects'],
          strokeSensitive: ['watch', 'chair']
        },
        {
          id: 'aphasia_2',
          difficulty: 'medium',
          text: "The lawyer's closing argument convinced the skeptical jury members despite opposing evidence.",
          focus: ['complex_syntax', 'passive_voice', 'abstract_concepts'],
          medicalTerms: ['argument', 'evidence'],
          strokeSensitive: ['lawyer', 'closing', 'argument', 'convinced', 'skeptical', 'opposing', 'evidence']
        },
        {
          id: 'aphasia_3',
          difficulty: 'hard',
          text: "Point to the pen after you pick up the paper but before you touch the book.",
          focus: ['complex_commands', 'temporal_sequencing', 'comprehension'],
          medicalTerms: ['commands', 'sequencing'],
          strokeSensitive: ['point', 'pick', 'touch', 'before', 'after']
        }
      ]
    };
  }, []);

  // Enhanced passage selection with neurological prioritization
  const generateNewPassage = useCallback(() => {
    const allCategories = Object.keys(speechPassageBank);
    const availablePassages = [];
    
    // Prioritize neurological and motor assessments for stroke detection
    const priorityCategories = ['neurological', 'motor', 'aphasia'];
    const standardCategories = ['cognitive', 'spontaneous', 'emotional'];
    
    // First, try to get passages from priority categories
    priorityCategories.forEach(category => {
      if (speechPassageBank[category]) {
        speechPassageBank[category].forEach(passage => {
          if (!usedPassages.has(passage.id)) {
            availablePassages.push({ ...passage, category, priority: true });
          }
        });
      }
    });
    
    // If no priority passages available, add standard categories
    if (availablePassages.length === 0) {
      standardCategories.forEach(category => {
        if (speechPassageBank[category]) {
          speechPassageBank[category].forEach(passage => {
            if (!usedPassages.has(passage.id)) {
              availablePassages.push({ ...passage, category, priority: false });
            }
          });
        }
      });
    }
    
    // If all passages have been used, reset the used set and prioritize again
    if (availablePassages.length === 0) {
      setUsedPassages(new Set());
      // Recollect priority passages first
      priorityCategories.forEach(category => {
        if (speechPassageBank[category]) {
          speechPassageBank[category].forEach(passage => {
            availablePassages.push({ ...passage, category, priority: true });
          });
        }
      });
    }
    
    // Select a passage, preferring neurological assessments
    const priorityPassages = availablePassages.filter(p => p.priority);
    const passagePool = priorityPassages.length > 0 ? priorityPassages : availablePassages;
    const selectedPassage = passagePool[Math.floor(Math.random() * passagePool.length)];
    
    // Mark as used
    setUsedPassages(prev => new Set([...prev, selectedPassage.id]));
    
    // Set current passage and enhanced metadata
    setCurrentPassage(selectedPassage.text);
    setPassageMetadata({
      id: selectedPassage.id,
      category: selectedPassage.category,
      difficulty: selectedPassage.difficulty,
      focus: selectedPassage.focus,
      medicalTerms: selectedPassage.medicalTerms,
      strokeSensitive: selectedPassage.strokeSensitive || [],
      priority: selectedPassage.priority || false,
      assessmentType: getAssessmentTypeDescription(selectedPassage.category),
      instructions: getPassageInstructions(selectedPassage)
    });
    
    return selectedPassage;
  }, [speechPassageBank, usedPassages]);

  // Get user-friendly assessment type description
  const getAssessmentTypeDescription = (category) => {
    const descriptions = {
      neurological: 'Neurological Motor Assessment',
      motor: 'Speech Motor Control Assessment', 
      aphasia: 'Language & Aphasia Screening',
      cognitive: 'Cognitive Function Assessment',
      spontaneous: 'Spontaneous Speech Evaluation',
      emotional: 'Prosody & Emotional Expression'
    };
    return descriptions[category] || 'General Speech Assessment';
  };

  // Get specific instructions for each passage type
  const getPassageInstructions = (passage) => {
    const baseInstructions = {
      neurological: [
        'Speak clearly and at a comfortable pace',
        'Focus on precise articulation of each sound',
        'Pay attention to difficult consonant combinations'
      ],
      motor: [
        'Maintain steady rhythm and timing',
        'Coordinate breath support with speech',
        'Repeat sequences exactly as shown'
      ],
      aphasia: [
        'Take your time to find the right words',
        'Speak as naturally as possible',
        'Don\'t worry about perfect pronunciation'
      ],
      cognitive: [
        'Think through the task step by step',
        'Organize your thoughts before speaking',
        'Provide clear, detailed responses'
      ],
      spontaneous: [
        'Speak naturally about the topic',
        'Use your own words and experiences',
        'Take time to organize your thoughts'
      ],
      emotional: [
        'Express the emotions clearly in your voice',
        'Vary your tone and pace appropriately',
        'Focus on emotional expression'
      ]
    };
    
    return baseInstructions[passage.category] || [
      'Read the passage clearly and naturally',
      'Take your time and speak at a comfortable pace'
    ];
  };

  // Fetch recent speech analyses
  const fetchRecentSpeechAnalyses = useCallback(async () => {
    try {
      const data = await ApiService.getRecentSpeechAnalyses();
      setRecentAnalyses(data || []);
    } catch (error) {
      console.warn('Error fetching recent speech analyses:', error);
      setRecentAnalyses([]);
    }
  }, []);

  // Enhanced speech analysis with passage metadata
  const analyzeSpeech = useCallback(async (speechTranscript) => {
    if (!speechTranscript || speechTranscript.trim().length === 0) {
      console.warn('No transcript provided for analysis');
      return;
    }

    setRecordingStatus("Analyzing speech patterns with multimodal AI...");
    
    try {
      // Get current facial and postural metrics from props or parent callback
      const currentFacialMetrics = facialMetrics || onSpeechMetricsUpdate?.facialMetrics || null;
      const currentPostureMetrics = postureMetrics || onSpeechMetricsUpdate?.postureMetrics || null;
      
      // Calculate basic audio features from transcript
      const audioFeatures = {
        wordCount: speechTranscript.split(/\s+/).length,
        averageWordLength: speechTranscript.split(/\s+/).reduce((acc, word) => acc + word.length, 0) / speechTranscript.split(/\s+/).length,
        speechRate: speechTranscript.split(/\s+/).length * 60 / 30, // Assuming 30 second recording
        pauseFrequency: (speechTranscript.match(/[.!?]/g) || []).length,
        complexityScore: speechTranscript.split(/[,;:]/g).length
      };
      
      // Enhanced analysis payload with multimodal data
      const analysisPayload = {
        passageMetadata: passageMetadata,
        facialMetrics: currentFacialMetrics,
        postureMetrics: currentPostureMetrics,
        audioFeatures: audioFeatures
      };
      
      const data = await ApiService.analyzeSpeech(speechTranscript, currentPassage, analysisPayload);
      setSpeechMetrics(data || {});
      setRecordingStatus("Multimodal analysis complete.");
      setError(null);
      
      // Update parent component with enhanced speech metrics
      if (onSpeechMetricsUpdate && data) {
        onSpeechMetricsUpdate({
          ...data,
          multimodalData: {
            facialCorrelation: data.enhancedAnalysis?.multimodalCorrelation?.facialSpeechCorrelation,
            posturalImpact: data.enhancedAnalysis?.multimodalCorrelation?.posturalImpact,
            integratedRisk: data.enhancedAnalysis?.multimodalCorrelation?.integratedRiskLevel
          }
        });
      }
      
      // Call completion callback if provided
      if (onComplete) {
        setTimeout(() => onComplete(), 1000);
      }
      
      // Refresh recent analyses
      await fetchRecentSpeechAnalyses();
      
    } catch (error) {
      console.error('Error analyzing speech:', error);
      const errorMsg = error.message || 'Error analyzing speech. Please try again.';
      setRecordingStatus(errorMsg);
      setError(errorMsg);
    }
  }, [currentPassage, passageMetadata, onSpeechMetricsUpdate, onComplete, fetchRecentSpeechAnalyses]);

  // Check browser support and initialize
  const initializeSpeechRecognition = useCallback(() => {
    try {
      setIsInitializing(true);
      setError(null);

      if (typeof window === 'undefined') {
        throw new Error('Speech recognition requires a browser environment');
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser. Please use Chrome, Safari, or Edge.');
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingStatus("Listening... Please read the passage above clearly.");
        setError(null);
      };

      recognition.onresult = (event) => {
        try {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart + ' ';
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
          }
        } catch (err) {
          console.error('Error processing speech results:', err);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        
        const finalTranscript = transcriptRef.current.trim();
        if (finalTranscript && finalTranscript.length > 5) {
          analyzeSpeech(finalTranscript);
        } else {
          setRecordingStatus("No speech detected or speech too short. Please try again with at least a few words.");
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        let errorMessage = 'Recording error: ';
        switch (event.error) {
          case 'no-speech':
            errorMessage += 'No speech detected. Please speak clearly and try again.';
            break;
          case 'audio-capture':
            errorMessage += 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage += 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage += 'Network error. Please check your connection.';
            break;
          default:
            errorMessage += `${event.error}. Please try again.`;
        }
        
        setRecordingStatus(errorMessage);
        setError(errorMessage);
      };

      recognitionRef.current = recognition;
      setIsSupported(true);
      setIsInitializing(false);
      setRecordingStatus('Ready for speech analysis. Click "Start Recording" to begin.');

    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsSupported(false);
      setIsInitializing(false);
      setError(err.message);
      setRecordingStatus(err.message);
    }
  }, [analyzeSpeech]);

  // Initialize speech recognition only once
  useEffect(() => {
    initializeSpeechRecognition();
  }, [initializeSpeechRecognition]);

  // Generate initial passage and fetch analyses
  useEffect(() => {
    generateNewPassage();
    fetchRecentSpeechAnalyses();
  }, [generateNewPassage, fetchRecentSpeechAnalyses]);
  
  // Start recording with new passage generation
  const startRecording = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition not available');
      return;
    }

    try {
      // Generate a new passage each time recording starts
      generateNewPassage();
      
      setTranscript('');
      transcriptRef.current = '';
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
      setRecordingStatus('Failed to start recording. Please try again.');
    }
  }, [isSupported, generateNewPassage]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop recording:', err);
        setIsRecording(false);
      }
    }
  }, [isRecording]);
  
  // Get risk level color
  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-emerald-600';
      case 'medium': return 'text-amber-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get risk background color
  const getRiskBgColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-emerald-100 border-emerald-300';
      case 'medium': return 'bg-amber-100 border-amber-300';
      case 'high': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
  };

  // Show initialization loading
  if (isInitializing) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing speech recognition...</p>
        </div>
      </motion.div>
    );
  }

  // Show error state if not supported
  if (!isSupported) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-black mb-6 text-gray-800">Speech Analysis System</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Speech Recognition Not Available</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="text-sm text-red-600">
            <p>Supported browsers:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Google Chrome (recommended)</li>
              <li>Microsoft Edge</li>
              <li>Safari (iOS/macOS)</li>
            </ul>
          </div>
          <button
            onClick={initializeSpeechRecognition}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.h2 
        className="text-3xl font-black mb-8 text-gray-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Speech Analysis System
      </motion.h2>
      
      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Recording Controls */}
      <motion.div 
        className="mb-8"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-bold mb-6 text-gray-800">Voice Recognition Module</h3>
        
        <div className="mb-6">
          <motion.button
            onClick={startRecording}
            disabled={isRecording || !isSupported}
            className="px-8 py-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed mr-4 shadow-lg transition-all duration-300"
            whileHover={!isRecording && isSupported ? { scale: 1.05 } : {}}
            whileTap={!isRecording && isSupported ? { scale: 0.95 } : {}}
          >
            {isRecording ? 'RECORDING...' : 'START RECORDING'}
          </motion.button>
          <motion.button
            onClick={stopRecording}
            disabled={!isRecording}
            className="px-8 py-4 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg transition-all duration-300"
            whileHover={isRecording ? { scale: 1.05 } : {}}
            whileTap={isRecording ? { scale: 0.95 } : {}}
          >
            STOP RECORDING
          </motion.button>
        </div>
        
        {/* Recording Status */}
        <motion.div 
          className="mb-6"
          animate={{ scale: isRecording ? [1, 1.02, 1] : 1 }}
          transition={{ repeat: isRecording ? Infinity : 0, duration: 2 }}
        >
          <div className={`p-4 rounded-xl border-2 ${
            error ? 'bg-red-50 border-red-300' :
            isRecording ? 'bg-emerald-50 border-emerald-300' : 
            'bg-gray-50 border-gray-300'
          }`}>
            <p className={`text-sm font-semibold ${
              error ? 'text-red-700' :
              isRecording ? 'text-emerald-700' : 
              'text-gray-700'
            }`}>
              {recordingStatus}
            </p>
          </div>
        </motion.div>
        
        {/* Enhanced Reading Passage with Stroke-Specific Guidance */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-800 text-lg">
              {passageMetadata?.assessmentType || 'READING PASSAGE'}:
            </h4>
            {passageMetadata && (
              <div className="flex items-center space-x-2 text-xs">
                {passageMetadata.priority && (
                  <span className="px-2 py-1 rounded-full bg-red-500 text-white font-bold">
                    PRIORITY
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-white font-bold ${
                  passageMetadata.difficulty === 'easy' ? 'bg-green-500' :
                  passageMetadata.difficulty === 'medium' ? 'bg-yellow-500' :
                  passageMetadata.difficulty === 'hard' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}>
                  {passageMetadata.difficulty?.toUpperCase()}
                </span>
                <span className="px-2 py-1 rounded-full bg-blue-500 text-white font-bold">
                  {passageMetadata.category?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Stroke-Specific Instructions */}
          {passageMetadata?.instructions && (
            <motion.div 
              className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h5 className="font-bold text-blue-800 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Instructions for This Assessment:
              </h5>
              <ul className="space-y-1 text-sm text-blue-700">
                {passageMetadata.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
          
          {/* Main Passage Display */}
          <motion.div 
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 rounded-xl min-h-[100px] text-gray-800 shadow-inner"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-lg leading-relaxed font-medium">
              {currentPassage || "Loading neurological assessment passage..."}
            </p>
          </motion.div>
          
          {/* Enhanced Passage Information */}
          {passageMetadata && (
            <motion.div 
              className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h5 className="font-bold text-gray-700 mb-2">Assessment Focus:</h5>
                  <div className="flex flex-wrap gap-1">
                    {passageMetadata.focus?.map((focus, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {focus.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-bold text-gray-700 mb-2">Medical Terms:</h5>
                  <div className="flex flex-wrap gap-1">
                    {passageMetadata.medicalTerms?.map((term, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-bold text-gray-700 mb-2">Stroke Indicators:</h5>
                  <div className="flex flex-wrap gap-1">
                    {passageMetadata.strokeSensitive?.slice(0, 4).map((term, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        {term}
                      </span>
                    ))}
                    {passageMetadata.strokeSensitive?.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        +{passageMetadata.strokeSensitive.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* New Passage Button */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={generateNewPassage}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Generate New Assessment Passage
                </button>
              </div>
            </motion.div>
          )}
          
          <div className="mt-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <motion.button
                onClick={generateNewPassage}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 GENERATE NEW PASSAGE
              </motion.button>
              <motion.button
                onClick={() => {
                  // Copy passage to clipboard
                  navigator.clipboard.writeText(currentPassage);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300 font-bold transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📋 COPY TEXT
              </motion.button>
            </div>
            
            {/* Usage Statistics */}
            <div className="text-xs text-gray-500">
              <span className="font-medium">Passages Used:</span> {usedPassages.size}/17
              {usedPassages.size >= 17 && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-bold">
                  🔄 RESET AVAILABLE
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Transcript */}
        <div className="mb-6">
          <h4 className="font-bold mb-4 text-gray-800 text-lg">SPEECH TRANSCRIPT:</h4>
          <div className="bg-gray-50 p-6 rounded-xl min-h-[100px] max-h-[150px] overflow-y-auto border border-gray-200 shadow-inner">
            <p className="text-gray-700 leading-relaxed">
              {transcript || "Your speech will appear here..."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Speech Metrics Display */}
      {Object.keys(speechMetrics).some(key => speechMetrics[key] !== null) && (
        <motion.div 
          className="mb-8"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-bold mb-6 text-gray-800">Speech Analysis Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Coherence Score */}
            {speechMetrics.coherenceScore !== null && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Coherence Score</h4>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-blue-600 mr-2">
                    {speechMetrics.coherenceScore}%
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${speechMetrics.coherenceScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Slurred Speech Score */}
            {speechMetrics.slurredSpeechScore !== null && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Speech Clarity</h4>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-green-600 mr-2">
                    {speechMetrics.slurredSpeechScore}%
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${speechMetrics.slurredSpeechScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Word Finding Score */}
            {speechMetrics.wordFindingScore !== null && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Word Finding</h4>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-purple-600 mr-2">
                    {speechMetrics.wordFindingScore}%
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${speechMetrics.wordFindingScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Risk */}
            {speechMetrics.overallRisk && (
              <div className={`p-4 rounded-lg border-2 ${getRiskBgColor(speechMetrics.overallRisk)}`}>
                <h4 className="font-semibold text-gray-800 mb-2">Overall Risk Level</h4>
                <span className={`text-2xl font-bold ${getRiskColor(speechMetrics.overallRisk)}`}>
                  {speechMetrics.overallRisk.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Observations */}
          {speechMetrics.observations && speechMetrics.observations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4">Clinical Observations</h4>
              <ul className="space-y-2">
                {speechMetrics.observations.map((observation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{observation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Recent Analyses */}
      {recentAnalyses && recentAnalyses.length > 0 && (
        <motion.div 
          className="mb-8"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-bold mb-6 text-gray-800">Recent Speech Analyses</h3>
          <div className="space-y-4">
            {recentAnalyses.slice(0, 3).map((analysis, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {new Date(analysis.timestamp).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getRiskBgColor(analysis.overallRisk)} ${getRiskColor(analysis.overallRisk)}`}>
                    {analysis.overallRisk}
                  </span>
                </div>
                <p className="text-gray-700 mt-2 text-sm">
                  Coherence: {analysis.coherenceScore}% | 
                  Clarity: {analysis.slurredSpeechScore}% | 
                  Word Finding: {analysis.wordFindingScore}%
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SpeechAnalysis; 