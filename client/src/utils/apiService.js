// API service for NeuroVision application
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true' || !process.env.REACT_APP_API_URL;

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

  // Demo mode helpers
  static generateDemoToken(user) {
    return btoa(JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  }

  static validateDemoToken(token) {
    try {
      const decoded = JSON.parse(atob(token));
      return decoded.exp > Date.now() ? decoded : null;
    } catch {
      return null;
    }
  }

  // Authentication endpoints
  static async login(email, password) {
    try {
      if (DEMO_MODE) {
        // Demo mode - simulate login
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        // Check if user exists in demo storage
        const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '{}');
        const user = demoUsers[email];
        
        if (user && user.password === password) {
          const userInfo = {
            id: user.id,
            email: user.email,
            name: user.name
          };
          const token = this.generateDemoToken(userInfo);
          return { token, user: userInfo, message: 'Login successful' };
        } else if (email === 'demo@neurovision.com' && password === 'demo123') {
          // Fallback demo credentials
          const userInfo = {
            id: 'demo-user-1',
            email: 'demo@neurovision.com',
            name: 'Demo User'
          };
          const token = this.generateDemoToken(userInfo);
          return { token, user: userInfo, message: 'Demo login successful' };
        } else {
          throw new Error('Invalid email or password. Please check your credentials or sign up for a new account.');
        }
      }

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
      if (DEMO_MODE && error.message.includes('fetch')) {
        throw new Error('Demo mode: Use email: demo@neurovision.com, password: demo123');
      }
      throw error;
    }
  }

  static async register(name, email, password) {
    try {
      if (DEMO_MODE) {
        // Demo mode - simulate registration
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        // Check if user already exists in demo storage
        const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '{}');
        
        if (demoUsers[email]) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        
        // Create new user in demo storage
        const user = {
          id: `demo-user-${Date.now()}`,
          email,
          name,
          password, // In demo mode, we store the password for login
          createdAt: new Date().toISOString()
        };
        
        demoUsers[email] = user;
        localStorage.setItem('demo_users', JSON.stringify(demoUsers));
        
        // Return user info without password
        const userInfo = {
          id: user.id,
          email: user.email,
          name: user.name
        };
        
        const token = this.generateDemoToken(userInfo);
        return { token, user: userInfo, message: 'Registration successful' };
      }

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
      if (DEMO_MODE && error.message.includes('fetch')) {
        // In demo mode, always allow registration
        const user = {
          id: `demo-user-${Date.now()}`,
          email,
          name
        };
        const token = this.generateDemoToken(user);
        return { token, user, message: 'Demo registration successful' };
      }
      throw error;
    }
  }

  static async getUserProfile() {
    try {
      if (DEMO_MODE) {
        const token = this.getAuthToken();
        if (token) {
          const user = this.validateDemoToken(token);
          if (user) {
            return { user };
          }
        }
        throw new Error('Demo session expired');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (DEMO_MODE && error.message.includes('fetch')) {
        throw new Error('Demo session expired');
      }
      throw error;
    }
  }

  // Save assessment data to server
  static async saveAssessment(assessmentData) {
    try {
      if (DEMO_MODE) {
        // Demo mode - simulate saving
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
          id: `demo-assessment-${Date.now()}`,
          message: 'Assessment processed in demo mode (not permanently saved)'
        };
      }

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
      if (DEMO_MODE && error.message.includes('fetch')) {
        return {
          id: `demo-assessment-${Date.now()}`,
          message: 'Assessment processed in demo mode (not permanently saved)'
        };
      }
      throw error;
    }
  }
  
  // Get recent assessments
  static async getRecentAssessments(limit = 10) {
    try {
      if (DEMO_MODE) {
        // Return demo data
        return [
          {
            id: 'demo-1',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            riskLevel: 'low',
            asymmetryMetrics: { eyeAsymmetry: 0.05, mouthAsymmetry: 0.03 },
            postureMetrics: { shoulderImbalance: 0.02 }
          },
          {
            id: 'demo-2',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            riskLevel: 'medium',
            asymmetryMetrics: { eyeAsymmetry: 0.12, mouthAsymmetry: 0.08 },
            postureMetrics: { shoulderImbalance: 0.15 }
          }
        ];
      }

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
      if (DEMO_MODE && error.message.includes('fetch')) {
        // Return demo data on fetch error
        return [];
      }
      throw error;
    }
  }
  
  // Analyze speech
  static async analyzeSpeech(transcript, readingPassage = null) {
    try {
      if (DEMO_MODE) {
        // Demo mode - simulate speech analysis
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const words = transcript.split(' ').length;
        const coherenceScore = Math.max(0.5, Math.min(1.0, words / 20));
        const slurredSpeechScore = 0.1 + Math.random() * 0.3;
        const wordFindingScore = 0.8 + Math.random() * 0.2;
        
        return {
          coherenceScore,
          slurredSpeechScore,
          wordFindingScore,
          overallRisk: coherenceScore > 0.8 ? 'low' : coherenceScore > 0.6 ? 'medium' : 'high',
          observations: ['Demo speech analysis completed', 'Results are simulated for demonstration']
        };
      }

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
      if (DEMO_MODE && error.message.includes('fetch')) {
        // Return demo analysis on fetch error
        return {
          coherenceScore: 0.75,
          slurredSpeechScore: 0.2,
          wordFindingScore: 0.85,
          overallRisk: 'low',
          observations: ['Demo mode: Speech analysis unavailable']
        };
      }
      throw error;
    }
  }
  
  // Get recent speech analyses
  static async getRecentSpeechAnalyses(limit = 5) {
    try {
      if (DEMO_MODE) {
        return [
          {
            id: 'demo-speech-1',
            timestamp: new Date().toISOString(),
            overallRisk: 'low',
            coherenceScore: 0.85
          }
        ];
      }

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
      if (DEMO_MODE && error.message.includes('fetch')) {
        return [];
      }
      throw error;
    }
  }
  
  // Upload audio file
  static async uploadAudio(audioBlob) {
    try {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { audioUrl: 'demo-audio-url', message: 'Demo mode: Audio upload simulated' };
      }

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
      if (DEMO_MODE && error.message.includes('fetch')) {
        return { audioUrl: 'demo-audio-url', message: 'Demo mode: Audio upload simulated' };
      }
      throw error;
    }
  }
  
  // Transcribe audio
  static async transcribeAudio(audioUrl) {
    try {
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          transcript: 'This is a demo transcription. In a real deployment, this would contain the actual transcribed speech.',
          confidence: 0.85
        };
      }

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
      if (DEMO_MODE && error.message.includes('fetch')) {
        return {
          transcript: 'Demo mode: Transcription unavailable',
          confidence: 0.5
        };
      }
      throw error;
    }
  }
  
  // Health check
  static async healthCheck() {
    try {
      if (DEMO_MODE) {
        return {
          status: 'ok',
          mode: 'demo',
          message: 'Running in demo mode'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      if (DEMO_MODE || error.message.includes('fetch')) {
        return {
          status: 'demo',
          mode: 'demo',
          message: 'Running in demo mode - backend unavailable'
        };
      }
      throw error;
    }
  }

  // Get user assessment history
  static async getUserAssessmentHistory(limit = 20) {
    try {
      if (DEMO_MODE) {
        return [
          {
            id: 'demo-hist-1',
            timestamp: new Date().toISOString(),
            riskLevel: 'low',
            asymmetryMetrics: { eyeAsymmetry: 0.05 },
            postureMetrics: { shoulderImbalance: 0.03 }
          }
        ];
      }

      const response = await fetch(`${API_BASE_URL}/api/assessments/user-history?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user assessment history:', error);
      if (DEMO_MODE && error.message.includes('fetch')) {
        return [];
      }
      throw error;
    }
  }
}

export default ApiService; 