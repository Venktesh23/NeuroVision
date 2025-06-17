import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "./components/Webcam";
import DetectionView from "./components/DetectionView";
import ErrorBoundary, { withErrorBoundary } from "./components/ErrorBoundary";
import { CameraLoader } from "./components/LoadingStates";
import ApiService from "./utils/apiService";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './components/ToastNotification';
import AuthPage from './components/Auth/AuthPage';
import UserProfile from './components/UserProfile';
import About from './components/About';
import PolishedAssessment from './components/PolishedAssessment';

// Lazy load heavy components
const EnhancedHistory = lazy(() => import("./components/EnhancedHistory"));
const FaceMeshDetection = lazy(() => import("./components/FaceMeshDetection"));
const PoseDetection = lazy(() => import("./components/PoseDetection"));
const StrokeAssessment = lazy(() => import("./components/StrokeAssessment"));

// Enhanced Loading component with dark mode and visual polish
const ComponentLoader = ({ message = "Loading component..." }) => (
  <motion.div 
    className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-center">
      <motion.div 
        className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-b-blue-600 mx-auto mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-gray-600 font-medium">{message}</p>
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

// Wrap critical components with error boundaries
const SafeEnhancedHistory = withErrorBoundary(
  (props) => (
    <Suspense fallback={<ComponentLoader />}>
      <EnhancedHistory {...props} />
    </Suspense>
  ), 
  "EnhancedHistory"
);

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
  const [activeTab, setActiveTab] = useState("assessment");
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentAssessmentPhase, setCurrentAssessmentPhase] = useState("instruction");

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const lastSaveRef = useRef(null);

  useAuth(); // Authentication context
  const { showSuccess, showError, showWarning } = useToast();

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
        showWarning('Assessment processed successfully, but database is currently unavailable. Data was not permanently saved.', {
          title: 'Database Unavailable',
          duration: 7000
        });
      } else {
        showSuccess('Assessment saved successfully!', {
          title: 'Success',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Failed to save assessment:', error);
      if (serverStatus === 'disconnected') {
        showError('Cannot save assessment: Server is offline. Please check your connection.', {
          title: 'Connection Error',
          duration: 6000
        });
      } else {
        showError('Failed to save assessment: ' + (error.message || 'Unknown error occurred'), {
          title: 'Save Failed',
          duration: 6000
        });
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



  return (
    <div className="min-h-screen bg-gray-50 font-sans">
              <motion.header 
          className="bg-blue-600 text-white p-6 shadow-xl"
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
              <p className="mt-2 text-gray-200 font-medium text-lg">
                Advanced Neurological Assessment Platform
              </p>
            </motion.div>
            

          </div>
        </div>
      </motion.header>

      {/* Enhanced Navigation with Visual Polish */}
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
              { id: "assessment", label: "Neurological Assessment", ariaControls: "assessment-panel" },
              { id: "history", label: "Assessment History", ariaControls: "history-panel" },
              { id: "profile", label: "Profile", ariaControls: "profile-panel" },
              { id: "about", label: "About", ariaControls: "about-panel" }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 border-b-4 font-bold text-sm tracking-wide transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-700 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
                whileHover={{ 
                  scale: 1.02,
                  y: -1
                }}
                whileTap={{ scale: 0.98 }}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={tab.ariaControls}
                tabIndex={activeTab === tab.id ? 0 : -1}
              >
                {/* Hover effect background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>

      <main className="container mx-auto p-6" role="main">
        <AnimatePresence mode="wait">
          {/* Polished Assessment Tab */}
          {activeTab === "assessment" && (
            <motion.div 
              key="assessment"
              className="space-y-8"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="tabpanel"
              id="assessment-panel"
              aria-labelledby="assessment-tab"
            >
              {/* Camera Feed - Hidden during results phase */}
              {currentAssessmentPhase !== 'results' && currentAssessmentPhase !== 'instruction' && (
                <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Live Assessment Feed</h2>
                  <div 
                    className="relative bg-black rounded-xl overflow-hidden shadow-inner mx-auto" 
                    style={{ aspectRatio: '4/3', maxWidth: '600px' }}
                    role="img"
                    aria-label="Live camera feed for neurological assessment"
                  >
                    {isInitializingCamera ? (
                      <CameraLoader />
                    ) : (
                      <>
                        <Webcam ref={webcamRef} isDetecting={isDetecting} />
                        {currentAssessmentPhase !== 'results' && currentAssessmentPhase !== 'instruction' && (
                          <SafeDetectionView
                            ref={canvasRef}
                            faceMeshResults={faceMeshResults}
                            poseResults={poseResults}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
                
              {/* Hidden Analysis Components - Only load when detecting */}
              {isDetecting && (
                <div style={{ display: 'none' }}>
                  <ErrorBoundary componentName="Real-time Analysis">
                    <Suspense fallback={<ComponentLoader />}>
                      <FaceMeshDetection
                        webcamRef={webcamRef}
                        isDetecting={isDetecting}
                        onResults={setFaceMeshResults}
                        onMetricsUpdate={setAsymmetryMetrics}
                      />
                      <PoseDetection
                        webcamRef={webcamRef}
                        isDetecting={isDetecting}
                        onResults={setPoseResults}
                        onMetricsUpdate={setPostureMetrics}
                      />
                      <StrokeAssessment
                        asymmetryMetrics={asymmetryMetrics}
                        postureMetrics={postureMetrics}
                        speechMetrics={speechMetrics}
                        onRiskLevelUpdate={setRiskLevel}
                        onFindingsUpdate={setAssessmentFindings}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              )}

              {/* Polished Assessment Component */}
              <ErrorBoundary componentName="Polished Assessment">
                <PolishedAssessment
                  webcamRef={webcamRef}
                  canvasRef={canvasRef}
                  isDetecting={isDetecting}
                  onToggleDetection={toggleDetection}
                  faceMeshResults={faceMeshResults}
                  poseResults={poseResults}
                  asymmetryMetrics={asymmetryMetrics}
                  postureMetrics={postureMetrics}
                  speechMetrics={speechMetrics}
                  onSpeechMetricsUpdate={handleSpeechMetricsUpdate}
                  onClearResults={clearResults}
                  onSaveAssessment={manualSave}
                  isSaving={isSaving}
                  riskLevel={riskLevel}
                  assessmentFindings={assessmentFindings}
                  onPhaseChange={setCurrentAssessmentPhase}
                />
              </ErrorBoundary>
            </motion.div>
          )}

          {/* Assessment History Tab */}
          {activeTab === "history" && (
            <motion.div 
              key="history"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="tabpanel"
              id="history-panel"
              aria-labelledby="history-tab"
            >
              <SafeEnhancedHistory />
            </motion.div>
          )}

          {/* User Profile Tab */}
          {activeTab === "profile" && (
            <motion.div 
              key="profile"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="tabpanel"
              id="profile-panel"
              aria-labelledby="profile-tab"
            >
              <ErrorBoundary componentName="User Profile">
                <UserProfile />
              </ErrorBoundary>
            </motion.div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <motion.div 
              key="about"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="tabpanel"
              id="about-panel"
              aria-labelledby="about-tab"
            >
              <ErrorBoundary componentName="About">
                <About />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary componentName="Main Application">
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-b-blue-600 mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-600 text-lg font-medium mb-2">Loading NeuroVision...</p>
            <p className="text-gray-500 text-sm">Initializing neural assessment systems</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <AuthenticatedApp />;
};

export default App;
