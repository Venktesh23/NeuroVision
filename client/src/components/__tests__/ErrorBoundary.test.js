import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary, { withErrorBoundary } from '../ErrorBoundary';

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>Component working correctly</div>;
};

// Test component wrapped with error boundary HOC
const SafeComponent = withErrorBoundary(ThrowError, 'TestComponent');

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('displays error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Component Error Detected')).toBeInTheDocument();
    expect(screen.getByText(/encountered an unexpected error/)).toBeInTheDocument();
  });

  test('displays component name in error message when provided', () => {
    render(
      <ErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/The TestComponent component encountered an unexpected error/)).toBeInTheDocument();
  });

  test('provides retry functionality', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Component Error Detected')).toBeInTheDocument();
    
    const retryButton = screen.getByLabelText('Retry loading the component');
    fireEvent.click(retryButton);
    
    // After retry, re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Component working correctly')).toBeInTheDocument();
  });

  test('provides reload page functionality', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const reloadButton = screen.getByLabelText('Reload the entire page');
    fireEvent.click(reloadButton);
    
    expect(mockReload).toHaveBeenCalled();
  });

  test('has proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    
    const retryButton = screen.getByLabelText('Retry loading the component');
    const reloadButton = screen.getByLabelText('Reload the entire page');
    
    expect(retryButton).toBeInTheDocument();
    expect(reloadButton).toBeInTheDocument();
  });

  test('shows developer details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('🔍 Developer Error Details')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  test('does not show developer details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('🔍 Developer Error Details')).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });
});

describe('withErrorBoundary HOC', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  test('wraps component with error boundary', () => {
    render(<SafeComponent shouldThrow={false} />);
    expect(screen.getByText('Component working correctly')).toBeInTheDocument();
  });

  test('catches errors in wrapped component', () => {
    render(<SafeComponent shouldThrow={true} />);
    expect(screen.getByText('Component Error Detected')).toBeInTheDocument();
    expect(screen.getByText(/The TestComponent component encountered an unexpected error/)).toBeInTheDocument();
  });

  test('sets proper display name', () => {
    expect(SafeComponent.displayName).toBe('withErrorBoundary(ThrowError)');
  });
}); 