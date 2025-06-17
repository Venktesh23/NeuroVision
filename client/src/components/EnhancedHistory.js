import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import ApiService from '../utils/apiService';
import { useAuth } from '../contexts/AuthContext';
import { HistorySkeletonLoader, LoadingError } from './LoadingStates';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);

const EnhancedHistory = () => {
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, charts, summary
  const { user } = useAuth();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [history, stats] = await Promise.all([
        ApiService.getUserAssessmentHistory(50),
        ApiService.getUserStatistics()
      ]);
      setAssessmentHistory(history);
      setStatistics(stats);
      setError(null);
    } catch (err) {
      setError('Failed to load your assessment history');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-700 bg-green-100 border-green-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'high': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const formatMetric = (value) => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') return `${(value * 100).toFixed(1)}%`;
    return value;
  };

  const getChartData = () => {
    if (!assessmentHistory.length) return null;

    // Risk trend over time
    const riskTrendData = {
      labels: assessmentHistory.slice(-10).map(a => new Date(a.timestamp).toLocaleDateString()),
      datasets: [{
        label: 'Risk Score',
        data: assessmentHistory.slice(-10).map(a => {
          const score = a.riskLevel === 'high' ? 3 : a.riskLevel === 'medium' ? 2 : 1;
          return score;
        }),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }]
    };

    // Facial asymmetry distribution
    const facialData = {
      labels: ['Eye Asymmetry', 'Mouth Asymmetry', 'Overall Asymmetry'],
      datasets: [{
        label: 'Average Asymmetry (%)',
        data: [
          assessmentHistory.reduce((sum, a) => sum + (a.asymmetryMetrics?.eyeAsymmetry || 0), 0) / assessmentHistory.length * 100,
          assessmentHistory.reduce((sum, a) => sum + (a.asymmetryMetrics?.mouthAsymmetry || 0), 0) / assessmentHistory.length * 100,
          assessmentHistory.reduce((sum, a) => sum + (a.asymmetryMetrics?.overallAsymmetry || 0), 0) / assessmentHistory.length * 100
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6'],
        borderRadius: 4
      }]
    };

    // Risk level distribution
    const riskDistribution = {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [{
        data: [
          assessmentHistory.filter(a => a.riskLevel === 'low').length,
          assessmentHistory.filter(a => a.riskLevel === 'medium').length,
          assessmentHistory.filter(a => a.riskLevel === 'high').length
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0
      }]
    };

    return { riskTrendData, facialData, riskDistribution };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  if (loading) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-xl p-8 border border-gray-100"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Assessment History</h2>
        <HistorySkeletonLoader />
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
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Assessment History</h2>
        <LoadingError 
          message={error}
          onRetry={fetchUserData}
        />
      </motion.div>
    );
  }

  const chartData = getChartData();

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header with view controls */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Assessment History</h2>
          <div className="flex space-x-2">
            {['list', 'charts', 'summary'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Summary */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-semibold text-blue-700">Total Assessments</div>
              <div className="text-2xl font-bold text-gray-800">{statistics.totalAssessments}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-semibold text-green-700">Low Risk</div>
              <div className="text-2xl font-bold text-gray-800">{statistics.lowRiskCount}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-sm font-semibold text-yellow-700">Medium Risk</div>
              <div className="text-2xl font-bold text-gray-800">{statistics.mediumRiskCount}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm font-semibold text-red-700">High Risk</div>
              <div className="text-2xl font-bold text-gray-800">{statistics.highRiskCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {assessmentHistory.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-600">No assessment history available</p>
                <p className="text-sm text-gray-500 mt-2">Complete your first assessment to see results here</p>
              </div>
            ) : (
              assessmentHistory.map((assessment, index) => {
                const date = new Date(assessment.timestamp);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString();

                return (
                  <motion.div
                    key={assessment.id || index}
                    className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold text-lg text-gray-800">{formattedDate}</div>
                        <div className="text-sm text-gray-500">{formattedTime}</div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getRiskColor(assessment.riskLevel)}`}>
                        {assessment.riskLevel?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <div className="text-xs text-blue-700 font-semibold mb-1">Facial Asymmetry</div>
                        <div className="font-bold text-gray-800">{formatMetric(assessment.asymmetryMetrics?.overallAsymmetry)}</div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <div className="text-xs text-green-700 font-semibold mb-1">Posture Balance</div>
                        <div className="font-bold text-gray-800">{formatMetric(assessment.postureMetrics?.shoulderImbalance)}</div>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                        <div className="text-xs text-purple-700 font-semibold mb-1">Speech Score</div>
                        <div className="font-bold text-gray-800">{formatMetric(assessment.speechMetrics?.coherenceScore)}</div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <div className="text-xs text-gray-700 font-semibold mb-1">Overall Risk</div>
                        <div className="font-bold text-gray-800">{assessment.riskLevel?.toUpperCase() || 'N/A'}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {viewMode === 'charts' && chartData && (
          <motion.div
            key="charts"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Risk Trend Over Time</h3>
                <div className="h-64">
                  <Line data={chartData.riskTrendData} options={chartOptions} />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
                <div className="h-64">
                  <Doughnut data={chartData.riskDistribution} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Average Facial Asymmetry Metrics</h3>
              <div className="h-64">
                <Bar data={chartData.facialData} options={chartOptions} />
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Health Summary</h3>
            
            {statistics && assessmentHistory.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">Assessment Overview</h4>
                  <p className="text-blue-700">
                    You have completed {statistics.totalAssessments} assessments. 
                    {statistics.riskTrend === 'improving' && ' Your risk levels are trending downward, showing positive improvement.'}
                    {statistics.riskTrend === 'stable' && ' Your risk levels remain stable across assessments.'}
                    {statistics.riskTrend === 'worsening' && ' Your recent assessments show increased risk levels that may require attention.'}
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">Recommendations</h4>
                  <ul className="text-green-700 space-y-2">
                    <li>• Continue regular assessments to monitor your neurological health</li>
                    <li>• Maintain healthy lifestyle habits including regular exercise</li>
                    <li>• Consult with healthcare providers about any concerning trends</li>
                    {statistics.highRiskCount > 0 && (
                      <li>• Consider discussing your high-risk assessments with a medical professional</li>
                    )}
                  </ul>
                </div>
                
                {assessmentHistory[0] && (
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Latest Assessment</h4>
                    <p className="text-gray-700">
                      Your most recent assessment on {new Date(assessmentHistory[0].timestamp).toLocaleDateString()} 
                      showed a {assessmentHistory[0].riskLevel} risk level.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg">No assessment data available for summary</p>
                <p className="text-sm mt-2">Complete assessments to see your health summary here</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedHistory; 