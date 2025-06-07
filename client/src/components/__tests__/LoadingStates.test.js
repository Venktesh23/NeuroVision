import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
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
} from '../LoadingStates';

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  test('applies size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('w-12', 'h-12');
  });

  test('applies color classes correctly', () => {
    render(<LoadingSpinner color="emerald" />);
    expect(screen.getByRole('status')).toHaveClass('border-emerald-600');
  });
});

describe('SkeletonCard', () => {
  test('renders skeleton structure', () => {
    render(<SkeletonCard />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('bg-white', 'rounded-xl', 'shadow-xl');
  });

  test('applies custom className', () => {
    render(<SkeletonCard className="custom-class" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('LoadingOverlay', () => {
  test('renders children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('shows loading overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows custom loading message', () => {
    render(
      <LoadingOverlay isLoading={true} message="Custom loading message">
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });
});

describe('LoadingButton', () => {
  test('renders normal button when not loading', () => {
    render(
      <LoadingButton onClick={jest.fn()}>
        Click me
      </LoadingButton>
    );
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });

  test('shows loading state when loading', () => {
    render(
      <LoadingButton isLoading={true} onClick={jest.fn()}>
        Click me
      </LoadingButton>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows custom loading text', () => {
    render(
      <LoadingButton isLoading={true} loadingText="Processing..." onClick={jest.fn()}>
        Click me
      </LoadingButton>
    );
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  test('handles click events when not disabled', () => {
    const mockClick = jest.fn();
    render(
      <LoadingButton onClick={mockClick}>
        Click me
      </LoadingButton>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalled();
  });

  test('does not handle click events when loading or disabled', () => {
    const mockClick = jest.fn();
    render(
      <LoadingButton isLoading={true} onClick={mockClick}>
        Click me
      </LoadingButton>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).not.toHaveBeenCalled();
  });
});

describe('PulseLoader', () => {
  test('renders with accessibility attributes', () => {
    render(<PulseLoader />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveAttribute('aria-label', 'Loading content');
  });

  test('applies custom className', () => {
    render(<PulseLoader className="w-full h-4" />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveClass('w-full', 'h-4');
  });
});

describe('DotsLoader', () => {
  test('renders three dots', () => {
    render(<DotsLoader />);
    const loader = screen.getByRole('status');
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveAttribute('aria-label', 'Loading');
  });

  test('applies color class', () => {
    render(<DotsLoader color="red-600" />);
    const loader = screen.getByRole('status');
    expect(loader).toBeInTheDocument();
  });
});

describe('CameraLoader', () => {
  test('renders camera initialization message', () => {
    render(<CameraLoader />);
    expect(screen.getByText('Initializing Camera...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Initializing camera');
  });
});

describe('ChartLoader', () => {
  test('renders chart loading message', () => {
    render(<ChartLoader />);
    expect(screen.getByText('Loading Chart Data...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading chart data');
  });

  test('applies custom height', () => {
    render(<ChartLoader height="400px" />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveStyle({ height: '400px' });
  });
});

describe('SpeechLoader', () => {
  test('renders speech analysis message', () => {
    render(<SpeechLoader />);
    expect(screen.getByText('Analyzing Speech Pattern...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Analyzing speech');
  });
});

describe('LoadingError', () => {
  test('renders error message and retry button', () => {
    const mockRetry = jest.fn();
    render(<LoadingError onRetry={mockRetry} />);
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('There was a problem loading this content. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  test('shows custom error message', () => {
    const mockRetry = jest.fn();
    render(<LoadingError onRetry={mockRetry} message="Custom error message" />);
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  test('calls onRetry when retry button is clicked', () => {
    const mockRetry = jest.fn();
    render(<LoadingError onRetry={mockRetry} />);
    
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRetry).toHaveBeenCalled();
  });

  test('has proper accessibility attributes', () => {
    const mockRetry = jest.fn();
    render(<LoadingError onRetry={mockRetry} />);
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
  });
}); 