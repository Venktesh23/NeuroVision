import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoricalData from '../HistoricalData';
import ApiService from '../../utils/apiService';

// Mock the ApiService
jest.mock('../../utils/apiService');

const mockAssessments = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    riskLevel: 'low',
    asymmetryMetrics: {
      eyeAsymmetry: 0.05,
      mouthAsymmetry: 0.03,
      overallAsymmetry: 0.04
    },
    postureMetrics: {
      shoulderImbalance: 0.02,
      headTilt: 0.01
    }
  },
  {
    id: '2',
    timestamp: '2024-01-14T15:45:00Z',
    riskLevel: 'medium',
    asymmetryMetrics: {
      eyeAsymmetry: 0.15,
      mouthAsymmetry: 0.12,
      overallAsymmetry: 0.14
    },
    postureMetrics: {
      shoulderImbalance: 0.08,
      headTilt: 0.06
    }
  },
  {
    id: '3',
    timestamp: '2024-01-13T09:15:00Z',
    riskLevel: 'high',
    asymmetryMetrics: {
      eyeAsymmetry: 0.25,
      mouthAsymmetry: 0.22,
      overallAsymmetry: 0.24
    },
    postureMetrics: {
      shoulderImbalance: 0.18,
      headTilt: 0.16
    }
  }
];

describe('HistoricalData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading state initially', async () => {
    // Create a promise that resolves with delay to test loading state
    ApiService.getRecentAssessments.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve([]), 100))
    );
    
    render(<HistoricalData />);
    
    expect(screen.getByText('Assessment History')).toBeInTheDocument();
    expect(screen.getByText('Loading historical data...')).toBeInTheDocument();
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading historical data...')).not.toBeInTheDocument();
    });
  });

  test('displays assessments when data loads successfully', async () => {
    ApiService.getRecentAssessments.mockResolvedValue(mockAssessments);
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      expect(screen.getByText('Assessment History')).toBeInTheDocument();
      expect(screen.queryByText('Loading historical data...')).not.toBeInTheDocument();
    });

    // Check that assessment data is displayed
    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    
    // Check metrics are displayed
    expect(screen.getByText('5.0%')).toBeInTheDocument(); // eyeAsymmetry: 0.05 * 100
    expect(screen.getByText('15.0%')).toBeInTheDocument(); // eyeAsymmetry: 0.15 * 100
    expect(screen.getByText('25.0%')).toBeInTheDocument(); // eyeAsymmetry: 0.25 * 100
  });

  test('displays error state when API call fails', async () => {
    const errorMessage = 'Network error';
    ApiService.getRecentAssessments.mockRejectedValue(new Error(errorMessage));
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load historical data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  test('displays empty state when no assessments exist', async () => {
    ApiService.getRecentAssessments.mockResolvedValue([]);
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      expect(screen.getByText('No assessment history available.')).toBeInTheDocument();
      expect(screen.getByText('Complete a detection session to see results here.')).toBeInTheDocument();
    });
  });

  test('refresh button calls API again', async () => {
    ApiService.getRecentAssessments.mockResolvedValue(mockAssessments);
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      expect(screen.getByText('Assessment History')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('REFRESH');
    fireEvent.click(refreshButton);
    
    // API should be called again
    expect(ApiService.getRecentAssessments).toHaveBeenCalledTimes(2);
  });

  test('retry button in error state calls API again', async () => {
    ApiService.getRecentAssessments
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockAssessments);
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load historical data')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });
    
    expect(ApiService.getRecentAssessments).toHaveBeenCalledTimes(2);
  });

  test('displays recent trends statistics', async () => {
    ApiService.getRecentAssessments.mockResolvedValue(mockAssessments);
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      expect(screen.getByText('RECENT TRENDS')).toBeInTheDocument();
      
      // Check statistics are displayed
      expect(screen.getByText('LOW RISK')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM RISK')).toBeInTheDocument();
      expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
    });
  });

  test('formats dates correctly', async () => {
    ApiService.getRecentAssessments.mockResolvedValue([mockAssessments[0]]);
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      // Check that date is formatted (this depends on locale, so we just check it exists)
      const dateElement = screen.getByText(/1\/15\/2024|15\/1\/2024|2024-01-15/); // Different date formats
      expect(dateElement).toBeInTheDocument();
    });
  });

  test('handles missing or null metric values', async () => {
    const incompleteAssessment = {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      riskLevel: 'low',
      asymmetryMetrics: {
        eyeAsymmetry: null,
        mouthAsymmetry: undefined,
        overallAsymmetry: 0.04
      },
      postureMetrics: {
        shoulderImbalance: 0.02,
        headTilt: null
      }
    };
    
    ApiService.getRecentAssessments.mockResolvedValue([incompleteAssessment]);
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      // Should display N/A for null/undefined values (eye, mouth, head)
      expect(screen.getAllByText('N/A')).toHaveLength(3);
    });
  });

  test('displays proper risk level colors and styling', async () => {
    ApiService.getRecentAssessments.mockResolvedValue(mockAssessments);
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      const lowRiskElement = screen.getByText('LOW');
      const mediumRiskElement = screen.getByText('MEDIUM');
      const highRiskElement = screen.getByText('HIGH');
      
      expect(lowRiskElement).toHaveClass('text-emerald-600');
      expect(mediumRiskElement).toHaveClass('text-amber-600');
      expect(highRiskElement).toHaveClass('text-red-600');
    });
  });

  test('has proper accessibility attributes', async () => {
    ApiService.getRecentAssessments.mockResolvedValue(mockAssessments);
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText('REFRESH');
      expect(refreshButton).toBeInTheDocument();
      
      // Check that headings are properly structured
      expect(screen.getByRole('heading', { level: 2, name: /assessment history/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /recent trends/i })).toBeInTheDocument();
    });
  });

  test('handles API service errors gracefully', async () => {
    // Test console.error is called but component doesn't crash
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    ApiService.getRecentAssessments.mockRejectedValue(new Error('API Error'));
    
    render(<HistoricalData />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load historical data')).toBeInTheDocument();
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching assessments:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
}); 