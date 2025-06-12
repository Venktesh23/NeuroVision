import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800">About NeuroVision</h3>
        <p className="text-gray-600">AI-powered neurological assessment platform</p>
      </div>

      <div className="space-y-6">
        {/* Application Overview */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Application Overview</h4>
          <p className="text-gray-700 leading-relaxed">
            NeuroVision is an advanced neurological assessment platform that uses artificial intelligence 
            and computer vision to analyze facial expressions, speech patterns, and posture. The application 
            provides real-time feedback and risk assessment to help identify potential neurological conditions.
          </p>
        </div>

        {/* Key Features */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Key Features</h4>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Facial Analysis:</strong> Real-time detection of facial asymmetry and expressions</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Speech Assessment:</strong> Advanced analysis of speech patterns and clarity</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Posture Detection:</strong> Body posture and movement analysis</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Risk Assessment:</strong> Comprehensive evaluation and scoring</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>History Tracking:</strong> Save and review past assessments</span>
            </li>
          </ul>
        </div>

        {/* How to Use */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">How to Use the Application</h4>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold text-gray-800">Step 1: Start Assessment</h5>
              <p className="text-gray-700 text-sm">
                Navigate to the "Neurological Assessment" tab and click "Start Assessment" to begin the evaluation process.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold text-gray-800">Step 2: Camera Setup</h5>
              <p className="text-gray-700 text-sm">
                Allow camera access when prompted. Position yourself 18-24 inches from the camera with good lighting. 
                Ensure your face and upper body are clearly visible.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold text-gray-800">Step 3: Follow Instructions</h5>
              <p className="text-gray-700 text-sm">
                The application will guide you through three phases: facial analysis, speech assessment, and posture evaluation. 
                Follow the on-screen instructions carefully.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold text-gray-800">Step 4: Speech Analysis</h5>
              <p className="text-gray-700 text-sm">
                When prompted, read the provided text clearly and at a normal pace. The system will analyze your 
                speech patterns, pronunciation, and fluency.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold text-gray-800">Step 5: Review Results</h5>
              <p className="text-gray-700 text-sm">
                After completing all phases, review your assessment results and recommendations. 
                You can save the results for future reference.
              </p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Important Notes</h4>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <ul className="space-y-2 text-amber-800 text-sm">
              <li className="flex items-start">
                <span className="text-amber-600 mr-2">⚠️</span>
                <span>This application is for educational and research purposes only</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-2">⚠️</span>
                <span>Results should not be used as a substitute for professional medical advice</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-2">⚠️</span>
                <span>Consult healthcare professionals for any medical concerns</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-2">⚠️</span>
                <span>Ensure good lighting and stable internet connection for best results</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Technology */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Technology</h4>
          <p className="text-gray-700 leading-relaxed">
            Built with modern web technologies including React, TensorFlow.js, MediaPipe, and advanced 
            machine learning models. The application runs entirely in your browser, ensuring privacy 
            and real-time performance.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default About; 