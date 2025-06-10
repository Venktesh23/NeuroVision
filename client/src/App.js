import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "./components/Webcam";
import DetectionView from "./components/DetectionView";
import ResultsPanel from "./components/ResultsPanel";
import SpeechAnalysis from "./components/SpeechAnalysis";
import HistoricalData from "./components/HistoricalData";
import InstructionsPanel from "./components/InstructionsPanel";
import FaceMeshDetection from "./components/FaceMeshDetection";
import PoseDetection from "./components/PoseDetection";
import StrokeAssessment from "./components/StrokeAssessment";
import ErrorBoundary, { withErrorBoundary } from "./components/ErrorBoundary";
import { LoadingButton, CameraLoader } from "./components/LoadingStates";
import ApiService from "./utils/apiService";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import UserProfile from './components/UserProfile';

// Wrap critical components with error boundaries
const SafeSpeechAnalysis = withErrorBoundary(SpeechAnalysis, "SpeechAnalysis");
const SafeHistoricalData = withErrorBoundary(HistoricalData, "HistoricalData");
const SafeResultsPanel = withErrorBoundary(ResultsPanel, "ResultsPanel");
const SafeDetectionView = withErrorBoundary(DetectionView, "DetectionView");

// Create authenticated app component
const AuthenticatedApp = () => {
  const [faceMeshResults, setFaceMeshResults] = useState(null);
  const [poseResults, setPoseResults] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [asymmetryMetrics, setAsymmetryMetrics] = useState({});
  const [postureMetrics, setPostureMetrics] = useState({});
  const [speechMetrics, setSpeechMetrics] = useState({});
  const [riskLevel, setRiskLevel] = useState("low");
  const [assessmentFindings, setAssessmentFindings] = useState([]);
  const [serverStatus, setServerStatus] = useState("unknown");
  const [activeTab, setActiveTab] = useState("detection");
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const lastSaveRef = useRef(null);

  const { user } = useAuth();

  const toggleDetection = async () => {
    if (!isDetecting) {
      setIsInitializingCamera(true);
      // Simulate camera initialization delay
      setTimeout(() => {
        setIsInitializingCamera(false);
        setIsDetecting(true);
      }, 1500);
    } else {
      setIsDetecting(false);
    }
  };

  const clearResults = () => {
    setFaceMeshResults(null);
    setPoseResults(null);
    setAsymmetryMetrics({});
    setPostureMetrics({});
    setSpeechMetrics({});
    setRiskLevel("low");
    setAssessmentFindings([]);
  };

  // Auto-save assessment data when significant changes occur
  useEffect(() => {
    const hasData = Object.keys(asymmetryMetrics).length > 0 || 
                    Object.keys(postureMetrics).length > 0;
    
    if (hasData && riskLevel !== "low") {
      // Debounce saving to avoid too frequent API calls
      const saveData = async () => {
        try {
          const assessmentData = {
            asymmetryMetrics,
            postureMetrics,
            riskLevel
          };
          
          // Only save if data has changed significantly
          const currentDataString = JSON.stringify(assessmentData);
          if (currentDataString !== lastSaveRef.current) {
            await ApiService.saveAssessment(assessmentData);
            lastSaveRef.current = currentDataString;
            console.log('Assessment auto-saved');
          }
        } catch (error) {
          console.error('Failed to auto-save assessment:', error);
        }
      };

      const timeoutId = setTimeout(saveData, 2000); // Save after 2 seconds of inactivity
      return () => clearTimeout(timeoutId);
    }
  }, [asymmetryMetrics, postureMetrics, riskLevel]);

  // Check server status on mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await ApiService.healthCheck();
        setServerStatus("connected");
      } catch (error) {
        setServerStatus("disconnected");
        console.error('Server health check failed:', error);
      }
    };

    checkServerStatus();

    // Initialize feather icons
    if (window.feather) {
      window.feather.replace();
    }
  }, []);

  // Handle speech metrics updates
  const handleSpeechMetricsUpdate = (metrics) => {
    setSpeechMetrics(metrics);
  };

  // Manual save function
  const manualSave = async () => {
    try {
      setIsSaving(true);
      const assessmentData = {
        asymmetryMetrics,
        postureMetrics,
        speechMetrics,
        riskLevel
      };
      
      const result = await ApiService.saveAssessment(assessmentData);
      
      if (result.message && result.message.includes('not saved')) {
        alert('Assessment processed successfully, but database is currently unavailable. Data was not permanently saved.');
      } else {
        alert('Assessment saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save assessment:', error);
      if (serverStatus === 'disconnected') {
        alert('Cannot save assessment: Server is offline. Please check your connection.');
      } else {
        alert('Failed to save assessment: ' + (error.message || 'Unknown error occurred'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const tabVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  // Add user profile section in the header
  const renderUserSection = () => (
    <motion.div 
      className="flex items-center space-x-4"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="text-right">
        <p className="text-white font-bold">Welcome, {user?.name}</p>
        <p className="text-gray-300 text-sm">{user?.email}</p>
      </div>
      <div 
        className={`text-sm px-4 py-2 rounded-full font-bold shadow-lg transition-all duration-300 ${
          serverStatus === "connected" 
            ? "bg-emerald-500 text-white" 
            : serverStatus === "disconnected" 
              ? "bg-red-500 text-white" 
              : "bg-amber-500 text-white"
        }`}
        role="status"
        aria-live="polite"
        aria-label={`Server connection status: ${serverStatus}`}
      >
        SERVER: {serverStatus === "connected" ? "CONNECTED" : serverStatus === "disconnected" ? "OFFLINE" : "UNKNOWN"}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <motion.header 
        className="bg-slate-800 text-white p-6 shadow-xl"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        role="banner"
      >
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl font-black tracking-tight">NeuroVision</h1>
              <p className="mt-2 text-gray-300 font-medium text-lg">
                Advanced Neurological Assessment Platform
              </p>
            </motion.div>
            {renderUserSection()}
          </div>
        </div>
      </motion.header>

      {/* Demo Mode Banner */}
      {serverStatus === "disconnected" && (
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 text-center shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="container mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">DEMO MODE:</span>
              <span>Backend server unavailable. All data is processed locally and not permanently saved.</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add User Profile to navigation tabs */}
      <motion.div 
        className="bg-white border-b-2 border-gray-200 shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto">
          <nav className="flex space-x-0" role="tablist">
            {[
              { id: "detection", label: "Live Detection", ariaControls: "detection-panel" },
              { id: "speech", label: "Speech Analysis", ariaControls: "speech-panel" },
              { id: "history", label: "Assessment History", ariaControls: "history-panel" },
              { id: "profile", label: "Profile", ariaControls: "profile-panel" }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 border-b-4 font-bold text-sm tracking-wide transition-all duration-300 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-700 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={tab.ariaControls}
                tabIndex={activeTab === tab.id ? 0 : -1}
              >
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>

      <main className="container mx-auto p-6" role="main">
        <AnimatePresence mode="wait">
          {/* Live Detection Tab */}
          {activeTab === "detection" && (
            <motion.div 
              key="detection"
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="tabpanel"
              id="detection-panel"
              aria-labelledby="detection-tab"
            >
              {/* Camera Input Section */}
              <div className="lg:col-span-2 space-y-8">
                <ErrorBoundary componentName="Camera System">
                  <motion.div 
                    className="bg-white rounded-xl shadow-xl p-6 border border-gray-100"
                    variants={tabVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <h2 className="text-2xl font-black mb-6 text-gray-800">Camera Input</h2>
                    <div 
                      className="relative bg-black rounded-xl overflow-hidden shadow-inner" 
                      style={{ aspectRatio: '4/3' }}
                      role="img"
                      aria-label="Live camera feed for neurological assessment"
                    >
                      {isInitializingCamera ? (
                        <CameraLoader />
                      ) : (
                        <>
                          <Webcam ref={webcamRef} isDetecting={isDetecting} />
                          <SafeDetectionView
                            ref={canvasRef}
                            faceMeshResults={faceMeshResults}
                            poseResults={poseResults}
                          />
                        </>
                      )}
                    </div>
                    <div className="mt-6 flex gap-3 flex-wrap" role="group" aria-label="Camera controls">
                      <LoadingButton
                        onClick={toggleDetection}
                        isLoading={isInitializingCamera}
                        loadingText="INITIALIZING..."
                        className={
                          isDetecting 
                            ? "bg-red-600 hover:bg-red-700 text-white" 
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }
                        aria-describedby="detection-status"
                      >
                        {isDetecting ? "STOP DETECTION" : "START DETECTION"}
                      </LoadingButton>
                      <motion.button
                        onClick={clearResults}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Clear all assessment results"
                      >
                        CLEAR RESULTS
                      </motion.button>
                      <LoadingButton
                        onClick={manualSave}
                        isLoading={isSaving}
                        loadingText="SAVING..."
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={Object.keys(asymmetryMetrics).length === 0}
                        aria-label="Save current assessment data"
                        aria-describedby="save-status"
                      >
                        SAVE ASSESSMENT
                      </LoadingButton>
                    </div>
                    
                    {/* Detection Status */}
                    <motion.div 
                      className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      id="detection-status"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700">DETECTION STATUS:</span>
                        <motion.span 
                          className={`px-4 py-2 rounded-full text-xs font-black shadow-md ${
                            isDetecting ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                          }`}
                          animate={{ scale: isDetecting ? [1, 1.1, 1] : 1 }}
                          transition={{ repeat: isDetecting ? Infinity : 0, duration: 2 }}
                          aria-label={`Detection is currently ${isDetecting ? 'active' : 'stopped'}`}
                        >
                          {isDetecting ? 'ACTIVE' : 'STOPPED'}
                        </motion.span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">Face Detection:</span>
                          <span 
                            className={`font-bold ${faceMeshResults ? 'text-emerald-600' : 'text-gray-400'}`}
                            aria-label={`Face detection is ${faceMeshResults ? 'active' : 'inactive'}`}
                          >
                            {faceMeshResults ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">Pose Detection:</span>
                          <span 
                            className={`font-bold ${poseResults ? 'text-emerald-600' : 'text-gray-400'}`}
                            aria-label={`Pose detection is ${poseResults ? 'active' : 'inactive'}`}
                          >
                            {poseResults ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </ErrorBoundary>

                {/* Results Panel */}
                <motion.div
                  variants={tabVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.2 }}
                >
                  <SafeResultsPanel
                    asymmetryMetrics={asymmetryMetrics}
                    postureMetrics={postureMetrics}
                    riskLevel={riskLevel}
                    assessmentFindings={assessmentFindings}
                  />
                </motion.div>
              </div>

              {/* Instructions Panel */}
              <motion.div 
                className="lg:col-span-1"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.3 }}
              >
                <ErrorBoundary componentName="Instructions Panel">
                  <InstructionsPanel />
                </ErrorBoundary>
              </motion.div>
            </motion.div>
          )}

          {/* Speech Analysis Tab */}
          {activeTab === "speech" && (
            <motion.div 
              key="speech"
              className="max-w-5xl mx-auto"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="tabpanel"
              id="speech-panel"
              aria-labelledby="speech-tab"
            >
              <SafeSpeechAnalysis onSpeechMetricsUpdate={handleSpeechMetricsUpdate} />
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <motion.div 
              key="history"
              className="max-w-5xl mx-auto"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="tabpanel"
              id="history-panel"
              aria-labelledby="history-tab"
            >
              <SafeHistoricalData />
            </motion.div>
          )}

          {/* Add Profile Tab */}
          {activeTab === "profile" && (
            <motion.div 
              key="profile"
              className="max-w-2xl mx-auto"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="tabpanel"
              id="profile-panel"
              aria-labelledby="profile-tab"
            >
              <UserProfile />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden components for detection logic */}
      <ErrorBoundary componentName="Face Mesh Detection">
        <FaceMeshDetection
          webcamRef={webcamRef}
          isDetecting={isDetecting}
          onResults={setFaceMeshResults}
          onMetricsUpdate={setAsymmetryMetrics}
        />
      </ErrorBoundary>
      <ErrorBoundary componentName="Pose Detection">
        <PoseDetection
          webcamRef={webcamRef}
          isDetecting={isDetecting}
          onResults={setPoseResults}
          onMetricsUpdate={setPostureMetrics}
        />
      </ErrorBoundary>
      <ErrorBoundary componentName="Stroke Assessment">
        <StrokeAssessment
          asymmetryMetrics={asymmetryMetrics}
          postureMetrics={postureMetrics}
          onRiskUpdate={setRiskLevel}
          onFindingsUpdate={setAssessmentFindings}
        />
      </ErrorBoundary>
    </div>
  );
};

// Main App wrapper with authentication
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// App content that checks authentication
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          className="text-white text-xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading NeuroVision...
        </motion.div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <AuthPage />;
};

export default App;
