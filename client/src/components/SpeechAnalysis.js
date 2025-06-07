import React, { useState, useEffect, useRef } from "react";
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
  
  const recognitionRef = useRef(null);

  // Reading passages for speech analysis
  const readingPassages = [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and helps evaluate speech clarity and pronunciation accuracy.",
    "Peter Piper picked a peck of pickled peppers. This tongue twister tests articulation, coordination, and speech fluency under challenging phonetic conditions.",
    "She sells seashells by the seashore. The shells she sells are surely seashells. This phrase evaluates sibilant sound production and speech rhythm.",
    "Around the rugged rock the ragged rascal ran. This alliterative sentence challenges pronunciation and tests for speech impediments or difficulties.",
    "Red leather, yellow leather. Betty Botter bought some butter. These phrases test rapid speech transitions and articulatory precision.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood? This classic tests speech flow and cognitive-linguistic coordination.",
    "Unique New York, unique New York. You know you need unique New York. This phrase challenges vowel differentiation and speech clarity.",
    "Toy boat, toy boat, toy boat. The sixth sick sheik's sixth sheep's sick. These test rapid repetition and complex consonant combinations.",
    "Can you can a can as a canner can can a can? This tests speech planning, execution, and the ability to manage complex sentence structures.",
    "Six thick thistle sticks, six thick thistles stick. This phrase evaluates fricative sound production and articulatory coordination."
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setRecordingStatus("Listening... Please read the passage above.");
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        if (transcript.trim()) {
          analyzeSpeech(transcript);
        } else {
          setRecordingStatus("No speech detected. Please try again.");
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsRecording(false);
        setRecordingStatus(`Recording error: ${event.error}. Please try again.`);
      };
    } else {
      setRecordingStatus("Speech recognition not supported in this browser. Please use Chrome or Safari.");
    }

    // Set initial random passage
    setRandomPassage();
    fetchRecentSpeechAnalyses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set random reading passage
  const setRandomPassage = () => {
    const randomIndex = Math.floor(Math.random() * readingPassages.length);
    setCurrentPassage(readingPassages[randomIndex]);
  };
  
  // Start recording
  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };
  
  // Analyze speech through backend API
  const analyzeSpeech = async (speechTranscript) => {
    setRecordingStatus("Analyzing speech patterns...");
    
    try {
      const data = await ApiService.analyzeSpeech(speechTranscript, currentPassage);
      setSpeechMetrics(data);
      setRecordingStatus("Analysis complete.");
      
      // Update parent component with speech metrics
      if (onSpeechMetricsUpdate) {
        onSpeechMetricsUpdate(data);
      }
      
      // Refresh recent analyses
      fetchRecentSpeechAnalyses();
      
    } catch (error) {
      console.error('Error analyzing speech:', error);
      setRecordingStatus("Error analyzing speech. Please try again.");
    }
  };
  
  // Fetch recent speech analyses
  const fetchRecentSpeechAnalyses = async () => {
    try {
      const data = await ApiService.getRecentSpeechAnalyses();
      setRecentAnalyses(data);
    } catch (error) {
      console.error('Error fetching recent speech analyses:', error);
    }
  };
  
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
            disabled={isRecording}
            className="px-8 py-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed mr-4 shadow-lg transition-all duration-300"
            whileHover={!isRecording ? { scale: 1.05 } : {}}
            whileTap={!isRecording ? { scale: 0.95 } : {}}
          >
            START RECORDING
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
          <div className={`p-4 rounded-xl border-2 ${isRecording ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'}`}>
            <p className={`text-sm font-semibold ${isRecording ? 'text-red-700' : 'text-gray-700'}`}>
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
      
      {/* Speech Analysis Results */}
      <motion.div 
        className="mb-8"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-bold mb-6 text-gray-800">Analysis Results</h3>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <motion.div 
            className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-md"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-gray-600 font-semibold mb-2">SPEECH COHERENCE</div>
            <div className="text-3xl font-black text-gray-800">
              {speechMetrics.coherenceScore !== null ? `${speechMetrics.coherenceScore}%` : 'N/A'}
            </div>
          </motion.div>
          <motion.div 
            className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-md"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-gray-600 font-semibold mb-2">SLURRED SPEECH</div>
            <div className="text-3xl font-black text-gray-800">
              {speechMetrics.slurredSpeechScore !== null ? `${speechMetrics.slurredSpeechScore}%` : 'N/A'}
            </div>
          </motion.div>
          <motion.div 
            className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-md"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-gray-600 font-semibold mb-2">WORD FINDING</div>
            <div className="text-3xl font-black text-gray-800">
              {speechMetrics.wordFindingScore !== null ? `${speechMetrics.wordFindingScore}%` : 'N/A'}
            </div>
          </motion.div>
          <motion.div 
            className={`p-6 rounded-xl border-2 shadow-md ${getRiskBgColor(speechMetrics.overallRisk)}`}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-gray-700 font-semibold mb-2">SPEECH RISK LEVEL</div>
            <div className={`text-3xl font-black ${getRiskColor(speechMetrics.overallRisk)}`}>
              {speechMetrics.overallRisk ? speechMetrics.overallRisk.toUpperCase() : 'N/A'}
            </div>
          </motion.div>
        </div>
        
        {/* Observations */}
        <AnimatePresence>
          {speechMetrics.observations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="font-bold mb-4 text-gray-800 text-lg">CLINICAL OBSERVATIONS:</h4>
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <ul className="space-y-3">
                  {speechMetrics.observations.map((observation, index) => (
                    <motion.li 
                      key={index} 
                      className="text-gray-700 leading-relaxed font-medium"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      • {observation}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Recent Analyses */}
      <AnimatePresence>
        {recentAnalyses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-xl font-bold mb-6 text-gray-800">Recent Analysis History</h3>
            <div className="space-y-4">
              {recentAnalyses.map((analysis, index) => {
                const date = new Date(analysis.timestamp);
                const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                const transcriptPreview = analysis.transcript.length > 50 
                  ? analysis.transcript.substring(0, 50) + "..." 
                  : analysis.transcript;
                
                return (
                  <motion.div 
                    key={analysis.id} 
                    className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-md"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="font-bold text-sm text-gray-700">{formattedDate}</span>
                        <span className="text-xs font-bold text-blue-600 ml-3 px-2 py-1 bg-blue-100 rounded-full">
                          READING ASSESSMENT
                        </span>
                      </div>
                      <span className={`font-black text-lg ${getRiskColor(analysis.overallRisk)}`}>
                        {analysis.overallRisk?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-3 text-gray-700 italic">"{transcriptPreview}"</p>
                    <div className="text-xs text-gray-600 font-semibold">
                      SCORES: {analysis.coherenceScore}% coherence • {analysis.slurredSpeechScore}% slurred • {analysis.wordFindingScore}% word finding
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SpeechAnalysis; 