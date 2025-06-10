import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ApiService from "../utils/apiService";

const SpeechAnalysis = ({ onSpeechMetricsUpdate }) => {
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
  const [isSupported, setIsSupported] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  // Update transcript ref when state changes
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Memoize reading passages to prevent recreation on every render
  const readingPassages = useMemo(() => [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and helps evaluate speech clarity and pronunciation accuracy.",
    "Peter Piper picked a peck of pickled peppers. This tongue twister tests articulation, coordination, and speech fluency under challenging phonetic conditions.",
    "She sells seashells by the seashore. The shells she sells are surely seashells. This phrase evaluates sibilant sound production and speech rhythm.",
    "Around the rugged rock the ragged rascal ran. This alliterative sentence challenges pronunciation and tests for speech impediments or difficulties.",
    "Red leather, yellow leather. Betty Botter bought some butter. These phrases test rapid speech transitions and articulatory precision."
  ], []);

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

  // Analyze speech through backend API
  const analyzeSpeech = useCallback(async (speechTranscript) => {
    if (!speechTranscript || speechTranscript.trim().length === 0) {
      console.warn('No transcript provided for analysis');
      return;
    }

    setRecordingStatus("Analyzing speech patterns...");
    
    try {
      const data = await ApiService.analyzeSpeech(speechTranscript, currentPassage);
      setSpeechMetrics(data || {});
      setRecordingStatus("Analysis complete.");
      setError(null);
      
      // Update parent component with speech metrics
      if (onSpeechMetricsUpdate && data) {
        onSpeechMetricsUpdate(data);
      }
      
      // Refresh recent analyses
      await fetchRecentSpeechAnalyses();
      
    } catch (error) {
      console.error('Error analyzing speech:', error);
      const errorMsg = error.message || 'Error analyzing speech. Please try again.';
      setRecordingStatus(errorMsg);
      setError(errorMsg);
    }
  }, [currentPassage, onSpeechMetricsUpdate, fetchRecentSpeechAnalyses]);

  // Set random reading passage
  const setRandomPassage = useCallback(() => {
    if (!readingPassages || readingPassages.length === 0) {
      console.error('Reading passages not available');
      return;
    }
    const randomIndex = Math.floor(Math.random() * readingPassages.length);
    setCurrentPassage(readingPassages[randomIndex]);
  }, [readingPassages]);

  // Check browser support and initialize - removed circular dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initializeSpeechRecognition = useCallback(() => {
    try {
      setIsInitializing(true);
      setError(null);

      // Check if speech recognition is supported
      if (typeof window === 'undefined') {
        throw new Error('Speech recognition requires a browser environment');
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser. Please use Chrome, Safari, or Edge.');
      }

      // Initialize recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
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
        console.log('Speech recognition ended');
        setIsRecording(false);
        
        // Use ref to get current transcript value to avoid stale closure
        const finalTranscript = transcriptRef.current.trim();
        if (finalTranscript && finalTranscript.length > 5) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, []); // Removed dependencies to prevent infinite re-renders

  // Initialize speech recognition only once
  useEffect(() => {
    initializeSpeechRecognition();
  }, [initializeSpeechRecognition]);

  // Set initial passage and fetch analyses only once
  useEffect(() => {
    setRandomPassage();
    fetchRecentSpeechAnalyses();
  }, [setRandomPassage, fetchRecentSpeechAnalyses]);
  
  // Start recording
  const startRecording = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition not available');
      return;
    }

    try {
      setTranscript('');
      transcriptRef.current = '';
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
      setRecordingStatus('Failed to start recording. Please try again.');
    }
  }, [isSupported]);
  
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
        
        {/* Reading Passage */}
        <div className="mb-6">
          <h4 className="font-bold mb-4 text-gray-800 text-lg">READING PASSAGE:</h4>
          <motion.div 
            className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-xl min-h-[100px] text-gray-800 shadow-inner"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-lg leading-relaxed font-medium">
              {currentPassage || "Loading passage..."}
            </p>
          </motion.div>
          <div className="mt-4">
            <motion.button
              onClick={setRandomPassage}
              className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300 font-bold transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              NEW PASSAGE
            </motion.button>
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