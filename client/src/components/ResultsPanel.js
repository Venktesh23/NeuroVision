import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ResultsPanel = ({ asymmetryMetrics, postureMetrics, riskLevel, assessmentFindings }) => {
  
  // Format a metric value to 2 decimal places and add a % sign
  const formatMetric = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Get color based on risk level
  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-600 text-white border-red-600';
      case 'medium': return 'bg-amber-600 text-white border-amber-600';
      case 'low': return 'bg-emerald-600 text-white border-emerald-600';
      default: return 'bg-gray-600 text-white border-gray-600';
    }
  };
  
  // Prepare data for chart
  const asymmetryValues = [
    asymmetryMetrics.eyeAsymmetry || 0,
    asymmetryMetrics.mouthAsymmetry || 0,
    asymmetryMetrics.eyebrowAsymmetry || 0,
    asymmetryMetrics.overallAsymmetry || 0
  ];
  
  const postureValues = [
    postureMetrics.shoulderImbalance || 0,
    postureMetrics.headTilt || 0,
    postureMetrics.bodyLean || 0
  ];

  const chartData = {
    labels: [
      'Eye Asymmetry', 
      'Mouth Asymmetry', 
      'Eyebrow Asymmetry', 
      'Overall Facial Asymmetry',
      'Shoulder Imbalance',
      'Head Tilt',
      'Body Lean'
    ],
    datasets: [{
      label: 'Asymmetry Metrics (%)',
      data: [...asymmetryValues.map(v => v * 100), ...postureValues.map(v => v * 100)],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(107, 114, 128, 0.8)'
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(107, 114, 128, 1)'
      ],
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Asymmetry (%)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
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
        Detection Results
      </motion.h2>
      
      {/* Risk Level Indicator */}
      <motion.div 
        className="mb-8"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-bold mb-4 text-gray-800">RISK ASSESSMENT</h3>
        <motion.div 
          className={`px-6 py-4 rounded-xl font-black text-center text-lg shadow-lg border-2 ${getRiskColor(riskLevel)}`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {riskLevel === 'high' && 'HIGH RISK - SEEK MEDICAL ATTENTION'}
          {riskLevel === 'medium' && 'MEDIUM RISK - CONSIDER MEDICAL CONSULTATION'}
          {riskLevel === 'low' && 'LOW RISK - CONTINUE MONITORING'}
          {!riskLevel && 'AWAITING ANALYSIS'}
        </motion.div>
      </motion.div>
      
      {/* Visualization */}
      <motion.div 
        className="mb-8"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-bold mb-6 text-gray-800">ASYMMETRY METRICS</h3>
        <motion.div 
          className="bg-gray-50 rounded-xl p-6 shadow-inner border border-gray-200"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </motion.div>
      </motion.div>
      
      {/* Facial Metrics Grid */}
      <motion.div 
        className="mb-8"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-bold mb-6 text-gray-800">FACIAL ANALYSIS</h3>
        <div className="grid grid-cols-2 gap-6">
          <motion.div 
            className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow-md"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-blue-700 font-bold mb-2">EYE ASYMMETRY</div>
            <div className="text-3xl font-black text-gray-800">{formatMetric(asymmetryMetrics.eyeAsymmetry)}</div>
          </motion.div>
          <motion.div 
            className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow-md"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-blue-700 font-bold mb-2">MOUTH ASYMMETRY</div>
            <div className="text-3xl font-black text-gray-800">{formatMetric(asymmetryMetrics.mouthAsymmetry)}</div>
          </motion.div>
          <motion.div 
            className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow-md"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-blue-700 font-bold mb-2">EYEBROW ASYMMETRY</div>
            <div className="text-3xl font-black text-gray-800">{formatMetric(asymmetryMetrics.eyebrowAsymmetry)}</div>
          </motion.div>
          <motion.div 
            className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow-md"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-blue-700 font-bold mb-2">OVERALL ASYMMETRY</div>
            <div className="text-3xl font-black text-gray-800">{formatMetric(asymmetryMetrics.overallAsymmetry)}</div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Posture Metrics */}
      <motion.div 
        className="mb-8"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-bold mb-6 text-gray-800">POSTURE ANALYSIS</h3>
        <div className="grid grid-cols-3 gap-6">
          <motion.div 
            className="bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-md"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-purple-700 font-bold mb-2">SHOULDER IMBALANCE</div>
            <div className="text-3xl font-black text-gray-800">{formatMetric(postureMetrics.shoulderImbalance)}</div>
          </motion.div>
          <motion.div 
            className="bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-md"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-purple-700 font-bold mb-2">HEAD TILT</div>
            <div className="text-3xl font-black text-gray-800">{formatMetric(postureMetrics.headTilt)}</div>
          </motion.div>
          <motion.div 
            className="bg-purple-50 border border-purple-200 p-6 rounded-xl shadow-md"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-purple-700 font-bold mb-2">BODY LEAN</div>
            <div className="text-3xl font-black text-gray-800">{formatMetric(postureMetrics.bodyLean)}</div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Findings */}
      {assessmentFindings.length > 0 && (
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-bold mb-6 text-gray-800">KEY FINDINGS</h3>
          <motion.div 
            className="bg-gray-50 border border-gray-200 rounded-xl p-6"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="space-y-3">
              {assessmentFindings.map((finding, index) => (
                <motion.li 
                  key={index} 
                  className="text-gray-700 font-medium leading-relaxed"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  • {finding}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
      
      {/* Disclaimer */}
      <motion.div 
        className="mt-8 text-sm bg-red-50 border-l-4 border-red-500 p-6 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.01 }}
      >
        <h4 className="font-black text-red-800 mb-3">MEDICAL DISCLAIMER</h4>
        <p className="text-red-700 leading-relaxed font-medium mb-3">
          <strong>This tool is not a medical device and should not be used for medical diagnosis.</strong> 
          If you suspect a stroke, call emergency services immediately (911 in the US).
        </p>
        <div className="bg-red-100 p-3 rounded-lg">
          <p className="text-red-800 font-bold text-xs">
            FAST Method: Facial drooping, Arm weakness, Speech difficulties, Time to call emergency services.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultsPanel;
