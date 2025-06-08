import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user, logout } = useAuth();

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">User Profile</h3>
          <p className="text-gray-600">Manage your account and assessment history</p>
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

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="font-semibold text-gray-700">Name:</span>
          <span className="text-gray-800">{user?.name}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="font-semibold text-gray-700">Email:</span>
          <span className="text-gray-800">{user?.email}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="font-semibold text-gray-700">Member Since:</span>
          <span className="text-gray-800">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default UserProfile; 