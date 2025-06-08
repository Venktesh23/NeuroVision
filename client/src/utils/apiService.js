// API service for NeuroVision application
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

class ApiService {
  // Get auth token from localStorage
  static getAuthToken() {
    return localStorage.getItem('neurovision_token');
  }

  // Get auth headers
  static getAuthHeaders() {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Authentication endpoints
  static async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async register(name, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  static async getUserProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Save assessment data to server
  static async saveAssessment(assessmentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assessments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...assessmentData,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.fallback) {
            console.warn('Database unavailable, assessment processed but not saved');
            return errorData.fallback;
          }
        }
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving assessment:', error);
      throw error;
    }
  }
  
  // Get recent assessments
  static async getRecentAssessments(limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assessments/recent?limit=${limit}`);
      
      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.fallback) {
            console.warn('Database unavailable, using fallback response');
            return errorData.fallback;
          }
        }
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent assessments:', error);
      throw error;
    }
  }
  
  // Analyze speech
  static async analyzeSpeech(transcript, readingPassage = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript, readingPassage })
      });
      
      if (!response.ok) {
        if (response.status === 503) {
          // Service unavailable - API key not configured
          const errorData = await response.json();
          if (errorData.fallback) {
            console.warn('Speech analysis service unavailable, using fallback response');
            return errorData.fallback;
          }
        }
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error analyzing speech:', error);
      throw error;
    }
  }
  
  // Get recent speech analyses
  static async getRecentSpeechAnalyses(limit = 5) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/speech-analyses/recent?limit=${limit}`);
      
      if (!response.ok) {
        if (response.status === 503) {
          // Service unavailable - database not connected
          const errorData = await response.json();
          if (errorData.fallback) {
            console.warn('Database unavailable for speech analyses, using fallback response');
            return errorData.fallback;
          }
        }
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent speech analyses:', error);
      throw error;
    }
  }
  
  // Upload audio file
  static async uploadAudio(audioBlob) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav'
        },
        body: audioBlob
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }
  
  // Transcribe audio
  static async transcribeAudio(audioUrl) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audioUrl })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }
  
  // Health check
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking API health:', error);
      throw error;
    }
  }

  // Get user's assessment history
  static async getUserAssessmentHistory(limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assessments/user-history?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.fallback) {
            console.warn('Database unavailable, using fallback response');
            return errorData.fallback;
          }
        }
        throw new Error(`HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user assessment history:', error);
      throw error;
    }
  }
}

export default ApiService; 