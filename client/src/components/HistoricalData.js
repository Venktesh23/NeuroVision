import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApiService from '../utils/apiService';

const HistoricalData = () => {
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecentAssessments();
  }, []);

  const fetchRecentAssessments = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getRecentAssessments(10);
      setRecentAssessments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load historical data');
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-emerald-600 bg-emerald-100 border-emerald-300';
      case 'medium': return 'text-amber-600 bg-amber-100 border-amber-300';
      case 'high': return 'text-red-600 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const formatMetric = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 }
  };

  if (loading) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-black mb-8 text-gray-800">Assessment History</h2>
        <motion.div 
          className="text-center text-gray-500 py-12"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Loading historical data...
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-black mb-8 text-gray-800">Assessment History</h2>
        <div className="text-center text-red-500 py-8">
          <p className="mb-4 font-medium">{error}</p>
          <motion.button 
            onClick={fetchRecentAssessments}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            RETRY
          </motion.button>
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
      <div className="flex justify-between items-center mb-8">
        <motion.h2 
          className="text-3xl font-black text-gray-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Assessment History
        </motion.h2>
        <motion.button 
          onClick={fetchRecentAssessments}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          REFRESH
        </motion.button>
      </div>

      {recentAssessments.length === 0 ? (
        <motion.div 
          className="text-center text-gray-500 py-12"
          variants={cardVariants}
          initial="initial"
          animate="animate"
        >
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg font-medium">No assessment history available.</p>
          <p className="text-sm mt-2">Complete a detection session to see results here.</p>
          <p className="text-xs mt-4 text-gray-400 italic">
            Note: Data persistence requires database connection
          </p>
        </motion.div>
      ) : (
        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence>
            {recentAssessments.map((assessment, index) => {
              const date = new Date(assessment.timestamp);
              const formattedDate = date.toLocaleDateString();
              const formattedTime = date.toLocaleTimeString();

              return (
                <motion.div 
                  key={assessment.id || index} 
                  className="border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-lg text-gray-800">{formattedDate}</div>
                      <div className="text-sm text-gray-500 font-medium">{formattedTime}</div>
                    </div>
                    <motion.span 
                      className={`px-4 py-2 rounded-full text-sm font-black border-2 shadow-md ${getRiskColor(assessment.riskLevel)}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {assessment.riskLevel?.toUpperCase() || 'UNKNOWN'}
                    </motion.span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    {/* Facial Asymmetry Metrics */}
                    <motion.div 
                      className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-xs text-blue-700 font-bold mb-1">EYE ASYMMETRY</div>
                      <div className="font-black text-xl text-gray-800">{formatMetric(assessment.asymmetryMetrics?.eyeAsymmetry)}</div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-xs text-blue-700 font-bold mb-1">MOUTH ASYMMETRY</div>
                      <div className="font-black text-xl text-gray-800">{formatMetric(assessment.asymmetryMetrics?.mouthAsymmetry)}</div>
                    </motion.div>

                    {/* Posture Metrics */}
                    <motion.div 
                      className="bg-purple-50 border border-purple-200 p-4 rounded-xl shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-xs text-purple-700 font-bold mb-1">SHOULDER IMBALANCE</div>
                      <div className="font-black text-xl text-gray-800">{formatMetric(assessment.postureMetrics?.shoulderImbalance)}</div>
                    </motion.div>

                    <motion.div 
                      className="bg-purple-50 border border-purple-200 p-4 rounded-xl shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-xs text-purple-700 font-bold mb-1">HEAD TILT</div>
                      <div className="font-black text-xl text-gray-800">{formatMetric(assessment.postureMetrics?.headTilt)}</div>
                    </motion.div>
                  </div>

                  {/* Overall Score */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 font-bold mb-1">OVERALL FACIAL ASYMMETRY</div>
                    <div className="font-black text-2xl text-gray-800">{formatMetric(assessment.asymmetryMetrics?.overallAsymmetry)}</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Statistics Summary */}
      {recentAssessments.length > 0 && (
        <motion.div 
          className="mt-8 pt-6 border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-black text-xl mb-6 text-gray-800">RECENT TRENDS</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-4xl font-black text-emerald-600 mb-2">
                {recentAssessments.filter(a => a.riskLevel === 'low').length}
              </div>
              <div className="text-sm text-gray-600 font-bold">LOW RISK</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-4xl font-black text-amber-600 mb-2">
                {recentAssessments.filter(a => a.riskLevel === 'medium').length}
              </div>
              <div className="text-sm text-gray-600 font-bold">MEDIUM RISK</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-4xl font-black text-red-600 mb-2">
                {recentAssessments.filter(a => a.riskLevel === 'high').length}
              </div>
              <div className="text-sm text-gray-600 font-bold">HIGH RISK</div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HistoricalData; 