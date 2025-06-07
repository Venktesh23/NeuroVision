import React from 'react';
import { motion } from 'framer-motion';

// Main loading spinner component
export const LoadingSpinner = ({ size = 'md', color = 'blue', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    emerald: 'border-emerald-600',
    red: 'border-red-600',
    gray: 'border-gray-600'
  };

  return (
    <motion.div
      className={`
        ${sizeClasses[size]} 
        border-4 border-gray-200 border-t-4 ${colorClasses[color]} 
        rounded-full 
        ${className}
      `}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      role="status"
      aria-label="Loading"
    />
  );
};

// Skeleton loader for cards
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-xl p-6 border border-gray-100 ${className}`}>
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 rounded-xl"></div>
        <div className="h-20 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  </div>
);

// Loading overlay for entire components
export const LoadingOverlay = ({ isLoading, children, message = 'Loading...' }) => {
  if (!isLoading) return children;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <motion.div
        className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">{message}</p>
        </div>
      </motion.div>
    </div>
  );
};

// Button loading state
export const LoadingButton = ({ 
  isLoading, 
  children, 
  className = '', 
  disabled = false,
  loadingText = 'Loading...',
  ...props 
}) => (
  <motion.button
    className={`
      px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl
      ${isLoading || disabled ? 'cursor-not-allowed opacity-70' : 'hover:scale-105'}
      ${className}
    `}
    disabled={isLoading || disabled}
    whileHover={!(isLoading || disabled) ? { scale: 1.05 } : {}}
    whileTap={!(isLoading || disabled) ? { scale: 0.95 } : {}}
    aria-busy={isLoading}
    aria-disabled={isLoading || disabled}
    {...props}
  >
    {isLoading ? (
      <div className="flex items-center justify-center gap-2">
        <LoadingSpinner size="sm" color="white" />
        <span>{loadingText}</span>
      </div>
    ) : (
      children
    )}
  </motion.button>
);

// Pulse animation for loading states
export const PulseLoader = ({ className = '' }) => (
  <motion.div
    className={`bg-gray-300 rounded ${className}`}
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    role="status"
    aria-label="Loading content"
  />
);

// Dots loading animation
export const DotsLoader = ({ color = 'blue-600' }) => (
  <div className="flex items-center space-x-1" role="status" aria-label="Loading">
    {[0, 1, 2].map((index) => (
      <motion.div
        key={index}
        className={`w-2 h-2 bg-${color} rounded-full`}
        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: index * 0.2
        }}
      />
    ))}
  </div>
);

// Camera loading state
export const CameraLoader = () => (
  <motion.div
    className="bg-black rounded-xl flex items-center justify-center"
    style={{ aspectRatio: '4/3' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    role="status"
    aria-label="Initializing camera"
  >
    <div className="text-center text-white">
      <motion.div
        className="text-6xl mb-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        📹
      </motion.div>
      <p className="text-lg font-medium">Initializing Camera...</p>
      <DotsLoader color="white" />
    </div>
  </motion.div>
);

// Chart loading placeholder
export const ChartLoader = ({ height = '300px' }) => (
  <div 
    className="bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center"
    style={{ height }}
    role="status"
    aria-label="Loading chart data"
  >
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="text-4xl mb-4"
      >
        📊
      </motion.div>
      <p className="text-gray-600 font-medium">Loading Chart Data...</p>
      <DotsLoader />
    </div>
  </div>
);

// Speech analysis loading
export const SpeechLoader = () => (
  <motion.div
    className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-xl"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    role="status"
    aria-label="Analyzing speech"
  >
    <div className="flex items-center gap-4">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-3xl"
      >
        🎤
      </motion.div>
      <div>
        <h4 className="font-bold text-blue-800 mb-2">Analyzing Speech Pattern...</h4>
        <div className="flex items-center gap-2">
          <div className="w-32 bg-blue-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <span className="text-sm text-blue-700 font-medium">Processing...</span>
        </div>
      </div>
    </div>
  </motion.div>
);

// Error loading state (when loading fails)
export const LoadingError = ({ onRetry, message = 'Failed to load data' }) => (
  <motion.div
    className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    role="alert"
    aria-live="assertive"
  >
    <div className="text-4xl mb-4">⚠️</div>
    <h3 className="font-bold text-red-800 mb-2">{message}</h3>
    <p className="text-red-600 mb-4 text-sm">
      There was a problem loading this content. Please try again.
    </p>
    <LoadingButton
      onClick={onRetry}
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      TRY AGAIN
    </LoadingButton>
  </motion.div>
);

const LoadingComponents = {
  LoadingSpinner,
  SkeletonCard,
  LoadingOverlay,
  LoadingButton,
  PulseLoader,
  DotsLoader,
  CameraLoader,
  ChartLoader,
  SpeechLoader,
  LoadingError
};

export default LoadingComponents; 