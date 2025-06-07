import React from "react";
import { motion } from "framer-motion";

const InstructionsPanel = () => {
  const containerVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.6 } }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-xl p-6 border border-gray-100"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.h2 
        className="text-2xl font-black mb-6 text-gray-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Assessment Instructions
      </motion.h2>
      
      <div className="space-y-8">
        {/* Facial Analysis Section */}
        <motion.div
          variants={itemVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-bold text-purple-700 mb-4 text-lg border-b border-purple-200 pb-2">
            FACIAL ANALYSIS
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-purple-600 font-bold">•</span>
              <span className="font-medium">Position yourself 2-3 feet from the camera</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-purple-600 font-bold">•</span>
              <span className="font-medium">Ensure your entire face is visible and well-lit</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-purple-600 font-bold">•</span>
              <span className="font-medium">Look directly at the camera lens</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-purple-600 font-bold">•</span>
              <span className="font-medium">Try smiling and making various facial expressions</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-purple-600 font-bold">•</span>
              <span className="font-medium">System analyzes facial symmetry and expressions</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Posture Analysis Section */}
        <motion.div
          variants={itemVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold text-green-700 mb-4 text-lg border-b border-green-200 pb-2">
            POSTURE ANALYSIS
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-green-600 font-bold">•</span>
              <span className="font-medium">Stand or sit with your upper body visible</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-green-600 font-bold">•</span>
              <span className="font-medium">Keep shoulders and arms in camera view</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-green-600 font-bold">•</span>
              <span className="font-medium">Raise both arms and hold for a few seconds</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-green-600 font-bold">•</span>
              <span className="font-medium">Touch your nose with each index finger</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-green-600 font-bold">•</span>
              <span className="font-medium">System detects posture abnormalities and coordination</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Speech Analysis Section */}
        <motion.div
          variants={itemVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-bold text-blue-700 mb-4 text-lg border-b border-blue-200 pb-2">
            SPEECH ANALYSIS
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-blue-600 font-bold">•</span>
              <span className="font-medium">Navigate to the Speech Analysis tab</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-blue-600 font-bold">•</span>
              <span className="font-medium">Read the provided passage aloud clearly</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-blue-600 font-bold">•</span>
              <span className="font-medium">Speak at a normal pace and volume</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-blue-600 font-bold">•</span>
              <span className="font-medium">AI analyzes coherence, clarity, and speech patterns</span>
            </motion.div>
            <motion.div 
              className="flex items-start space-x-2"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-blue-600 font-bold">•</span>
              <span className="font-medium">Results provide comprehensive speech assessment</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Warning Section */}
        <motion.div
          className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl"
          variants={itemVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <h4 className="font-black text-red-800 mb-3 text-sm">MEDICAL DISCLAIMER</h4>
          <p className="text-xs text-red-700 leading-relaxed font-medium">
            This system is for educational and screening purposes only. It is not a substitute for professional medical diagnosis. 
            If you suspect a stroke, call emergency services immediately.
          </p>
          <div className="mt-3 p-3 bg-red-100 rounded-lg">
            <p className="text-xs font-bold text-red-800">
              FAST Method: Facial drooping, Arm weakness, Speech difficulties, Time to call emergency services.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InstructionsPanel; 