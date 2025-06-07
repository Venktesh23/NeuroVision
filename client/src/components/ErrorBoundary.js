import React from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    const errorId = Date.now().toString();
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log to console for development
    console.error('[ERROR BOUNDARY] Component Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId
    });

    // In production, you would send this to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo, errorId);
    }
  }

  logErrorToService = (error, errorInfo, errorId) => {
    // This would integrate with services like Sentry, LogRocket, etc.
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (logError) {
      console.error('Failed to log error to service:', logError);
    }
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, componentName } = this.props;
      
      // If a custom fallback is provided, use it
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error}
            retry={this.handleRetry}
            componentName={componentName}
          />
        );
      }

      // Default error UI
      return (
        <motion.div 
          className="bg-white rounded-xl shadow-xl p-8 border border-red-200 max-w-2xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          role="alert"
          aria-live="assertive"
        >
          <motion.div 
            className="text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-black text-red-700 mb-4">
              Component Error Detected
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {componentName ? `The ${componentName} component` : 'A component'} encountered an unexpected error. 
              This is typically caused by network issues, browser compatibility problems, or temporary system issues.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <motion.button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Retry loading the component"
              >
                TRY AGAIN
              </motion.button>
              
              <motion.button
                onClick={this.handleReload}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Reload the entire page"
              >
                RELOAD PAGE
              </motion.button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.details 
                className="mt-6 text-left bg-gray-50 rounded-lg p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <summary className="cursor-pointer font-bold text-gray-700 mb-2">
                  🔍 Developer Error Details
                </summary>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              </motion.details>
            )}
          </motion.div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to wrap components with error boundary
export const withErrorBoundary = (Component, componentName) => {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <ErrorBoundary componentName={componentName}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary; 