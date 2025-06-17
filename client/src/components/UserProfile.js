import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../utils/apiService';
import { ToastProvider, useToast } from './ToastNotification';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState(null);
  const [userHistory, setUserHistory] = useState({ data: [], pagination: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    medicalHistory: '',
    emergencyContact: ''
  });

  // Load user profile and data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [profileData, historyData] = await Promise.all([
        ApiService.getFullUserProfile(),
        ApiService.getUserHistory(1, 20)
      ]);
      
      setUserProfile(profileData);
      setUserHistory(historyData);
      
      setEditForm({
        name: profileData.name || '',
        dateOfBirth: profileData.dateOfBirth || '',
        gender: profileData.gender || '',
        medicalHistory: profileData.medicalHistory || '',
        emergencyContact: profileData.emergencyContact || ''
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      showError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await ApiService.updateUserProfile(editForm);
      showSuccess('Profile updated successfully!');
      setIsEditing(false);
      loadUserData(); // Reload data
    } catch (error) {
      showError('Failed to update profile');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRiskTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return { icon: '↗', color: 'text-red-600', text: 'Increasing' };
      case 'decreasing':
        return { icon: '↘', color: 'text-green-600', text: 'Decreasing' };
      case 'stable':
        return { icon: '→', color: 'text-blue-600', text: 'Stable' };
      default:
        return { icon: '?', color: 'text-gray-600', text: 'Unknown' };
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '●' },
    { id: 'statistics', name: 'Statistics', icon: '□' },
    { id: 'history', name: 'History', icon: '≡' },
    { id: 'settings', name: 'Settings', icon: '⚙' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">User Profile</h2>
            <p className="text-blue-100">Welcome back, {user?.name}!</p>
          </div>
          <motion.button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            SIGN OUT
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>
                <motion.button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </motion.button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                    <textarea
                      value={editForm.medicalHistory}
                      onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                      rows="3"
                      placeholder="Any relevant medical history or conditions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={editForm.emergencyContact}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                      placeholder="Name and phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <motion.button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Save Changes
                    </motion.button>
                    <motion.button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Name:</span>
                      <span className="text-gray-800">{userProfile?.name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Email:</span>
                      <span className="text-gray-800">{userProfile?.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Date of Birth:</span>
                      <span className="text-gray-800">{formatDate(userProfile?.dateOfBirth)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Gender:</span>
                      <span className="text-gray-800 capitalize">{userProfile?.gender || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Member Since:</span>
                      <span className="text-gray-800">{formatDate(userProfile?.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Last Login:</span>
                      <span className="text-gray-800">{formatDate(userProfile?.lastLogin)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Emergency Contact:</span>
                      <span className="text-gray-800">{userProfile?.emergencyContact || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              )}

              {userProfile?.medicalHistory && !isEditing && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-2">Medical History:</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800">{userProfile.medicalHistory}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'statistics' && (
            <motion.div
              key="statistics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-gray-800">Assessment Statistics</h3>
              
              {userProfile?.statistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{userProfile.statistics.totalAssessments}</div>
                    <div className="text-sm text-blue-800">Total Assessments</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{userProfile.statistics.highRiskCount}</div>
                    <div className="text-sm text-red-800">High Risk</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">{userProfile.statistics.mediumRiskCount}</div>
                    <div className="text-sm text-yellow-800">Medium Risk</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{userProfile.statistics.lowRiskCount}</div>
                    <div className="text-sm text-green-800">Low Risk</div>
                  </div>
                </div>
              )}

              {userProfile?.statistics?.riskTrend && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Risk Trend</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getRiskTrendIcon(userProfile.statistics.riskTrend).icon}</span>
                    <span className={`font-medium ${getRiskTrendIcon(userProfile.statistics.riskTrend).color}`}>
                      {getRiskTrendIcon(userProfile.statistics.riskTrend).text}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Recent Assessments</h4>
                  {userProfile?.recentAssessments?.length > 0 ? (
                    <div className="space-y-2">
                      {userProfile.recentAssessments.slice(0, 5).map((assessment, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                          <span className="text-sm text-gray-600">{formatDate(assessment.createdAt)}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            assessment.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                            assessment.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {assessment.riskLevel?.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No assessments yet</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Recent Speech Analyses</h4>
                  {userProfile?.recentSpeechAnalyses?.length > 0 ? (
                    <div className="space-y-2">
                      {userProfile.recentSpeechAnalyses.slice(0, 5).map((analysis, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                          <span className="text-sm text-gray-600">{formatDate(analysis.timestamp)}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            analysis.overallRisk === 'high' ? 'bg-red-100 text-red-800' :
                            analysis.overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {analysis.overallRisk?.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No speech analyses yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-gray-800">Assessment History</h3>
              
              {userHistory?.data?.length > 0 ? (
                <div className="space-y-4">
                  {userHistory.data.map((item, index) => (
                    <motion.div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">
                                                          {item.type === 'assessment' ? 'Assessment' : 'Speech Analysis'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            (item.riskLevel || item.overallRisk) === 'high' ? 'bg-red-100 text-red-800' :
                            (item.riskLevel || item.overallRisk) === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {(item.riskLevel || item.overallRisk)?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
                      </div>
                      
                      {item.type === 'assessment' && (
                        <div className="text-sm text-gray-600">
                          <p>Asymmetry Score: {item.asymmetryMetrics?.overallAsymmetry?.toFixed(2) || 'N/A'}</p>
                          <p>Posture Score: {item.postureMetrics?.shoulderImbalance?.toFixed(2) || 'N/A'}</p>
                        </div>
                      )}
                      
                      {item.type === 'speech' && (
                        <div className="text-sm text-gray-600">
                          <p>Coherence: {item.coherenceScore?.toFixed(2) || 'N/A'}</p>
                          <p>Clarity: {item.slurredSpeechScore?.toFixed(2) || 'N/A'}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No assessment history yet</p>
                  <p className="text-sm text-gray-400 mt-2">Start taking assessments to see your history here</p>
                </div>
              )}

              {userHistory?.pagination?.totalPages > 1 && (
                <div className="flex justify-center">
                  <p className="text-sm text-gray-500">
                    Showing {userHistory.data.length} of {userHistory.pagination.totalItems} items
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-gray-800">Account Settings</h3>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Important Medical Disclaimer</h4>
                  <p className="text-sm text-red-700">
                    This tool is for educational and screening purposes only. It is not a substitute for professional medical advice, 
                    diagnosis, or treatment. If you suspect you are having a stroke, call emergency services (911) immediately.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">🔒 Privacy & Data</h4>
                  <p className="text-sm text-blue-700">
                    Your assessment data is securely stored and used only to track your personal health trends. 
                    We do not share your data with third parties without your consent.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Account Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border border-gray-200">
                      Export Assessment Data
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded border border-red-200">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Wrap with ToastProvider if not already wrapped
const UserProfileWithToast = () => (
  <ToastProvider>
    <UserProfile />
  </ToastProvider>
);

export default UserProfileWithToast; 