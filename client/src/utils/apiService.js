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
  
  // Enhanced speech analysis with multimodal data
  static async analyzeSpeech(transcript, expectedText = null, additionalData = {}) {
    try {
      if (DEMO_MODE) {
        // Demo mode - simulate enhanced speech analysis
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const words = transcript.split(' ').length;
        const coherenceScore = Math.max(50, Math.min(95, 65 + Math.random() * 25));
        const articulationScore = Math.max(60, Math.min(95, 75 + Math.random() * 20));
        const wordFindingScore = Math.max(70, Math.min(95, 80 + Math.random() * 15));
        
        return {
          coherenceScore: Math.round(coherenceScore),
          slurredSpeechScore: Math.round(articulationScore),
          wordFindingScore: Math.round(wordFindingScore),
          overallRisk: coherenceScore > 80 ? 'low' : coherenceScore > 65 ? 'moderate' : 'high',
          observations: [
            'Demo enhanced speech analysis completed',
            'Multimodal correlation analysis simulated',
            'Results are simulated for demonstration purposes'
          ],
          enhancedAnalysis: {
            speechAnalysis: {
              coherenceScore: Math.round(coherenceScore),
              articulationScore: Math.round(articulationScore),
              wordFindingScore: Math.round(wordFindingScore),
              fluencyScore: Math.round(70 + Math.random() * 25),
              prosodyScore: Math.round(75 + Math.random() * 20)
            },
            strokeRiskIndicators: {
              dysarthriaRisk: articulationScore > 80 ? 'none' : 'mild',
              aphasiaRisk: wordFindingScore > 85 ? 'none' : 'mild',
              motorSpeechRisk: coherenceScore > 75 ? 'none' : 'mild'
            },
            multimodalCorrelation: {
              facialSpeechCorrelation: additionalData.facialMetrics ? Math.round(60 + Math.random() * 30) : null,
              posturalImpact: additionalData.postureMetrics ? Math.round(50 + Math.random() * 40) : null,
              integratedRiskLevel: 'low'
            },
            recommendedActions: [
              'Continue regular monitoring',
              'Consider professional evaluation if symptoms persist'
            ],
            confidenceLevel: Math.round(75 + Math.random() * 20)
          },
          metadata: {
            timestamp: new Date().toISOString(),
            assessmentType: expectedText ? 'structured_reading' : 'spontaneous_speech',
            multimodalDataAvailable: !!(additionalData.facialMetrics || additionalData.postureMetrics),
            demoMode: true
          }
        };
      }

      // Enhanced payload for multimodal analysis
      const analysisPayload = {
        transcript,
        expectedText: expectedText || null,
        passageMetadata: additionalData.passageMetadata || null,
        facialMetrics: additionalData.facialMetrics || null,
        postureMetrics: additionalData.postureMetrics || null,
        audioFeatures: additionalData.audioFeatures || null,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/api/analyze-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analysisPayload)
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
        // Return enhanced demo analysis on fetch error
        return {
          coherenceScore: 75,
          slurredSpeechScore: 20,
          wordFindingScore: 85,
          overallRisk: 'low',
          observations: ['Demo mode: Enhanced speech analysis unavailable'],
          enhancedAnalysis: {
            speechAnalysis: {
              coherenceScore: 75,
              articulationScore: 80,
              wordFindingScore: 85,
              fluencyScore: 78,
              prosodyScore: 82
            },
            strokeRiskIndicators: {
              dysarthriaRisk: 'none',
              aphasiaRisk: 'none',
              motorSpeechRisk: 'none'
            },
            multimodalCorrelation: {
              facialSpeechCorrelation: null,
              posturalImpact: null,
              integratedRiskLevel: 'low'
            },
            recommendedActions: ['Regular monitoring recommended'],
            confidenceLevel: 80
          },
          metadata: {
            timestamp: new Date().toISOString(),
            fallbackMode: true
          }
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

  // Enhanced User Profile Methods
  static async getFullUserProfile() {
    try {
      if (DEMO_MODE) {
        const token = this.getAuthToken();
        if (token) {
          const user = this.validateDemoToken(token);
          if (user) {
            return {
              ...user,
              statistics: {
                totalAssessments: 0,
                highRiskCount: 0,
                mediumRiskCount: 0,
                lowRiskCount: 0,
                riskTrend: 'stable',
                lastAssessmentDate: null,
                firstAssessmentDate: null
              },
              recentAssessments: [],
              recentSpeechAnalyses: []
            };
          }
        }
        throw new Error('Demo session expired');
      }

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching full user profile:', error);
      throw error;
    }
  }

  static async updateUserProfile(profileData) {
    try {
      if (DEMO_MODE) {
        // In demo mode, just return success
        await new Promise(resolve => setTimeout(resolve, 300));
        return { message: 'Profile updated successfully (demo mode)' };
      }

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async getUserHistory(page = 1, limit = 20) {
    try {
      if (DEMO_MODE) {
        // Demo mode - return sample data
        return {
          data: [],
          pagination: {
            page,
            limit,
            totalAssessments: 0,
            totalSpeechAnalyses: 0,
            totalItems: 0,
            totalPages: 0
          }
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/users/history?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get user history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user history:', error);
      throw error;
    }
  }

  static async getUserStatistics() {
    try {
      if (DEMO_MODE) {
        return {
          totalAssessments: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
          riskTrend: 'stable',
          lastAssessmentDate: null,
          firstAssessmentDate: null
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/users/statistics`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get user statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }

  // Enhanced multimodal assessment with maximum AI utilization
  static async enhancedMultimodalAssessment(facialMetrics, postureMetrics, speechMetrics, audioData = null, assessmentContext = {}) {
    try {
      console.log('[API] Starting enhanced multimodal assessment with full AI capabilities');
      
      const requestData = {
        facialMetrics,
        postureMetrics,
        speechMetrics,
        audioData,
        assessmentContext: {
          type: 'Comprehensive neurological screening',
          expectedDuration: 45,
          medicalTerms: [
            'stroke', 'weakness', 'numbness', 'confusion', 'headache',
            'balance', 'coordination', 'speech', 'slurred', 'difficulty'
          ],
          passageType: 'medical-assessment',
          demographics: assessmentContext.demographics || null,
          ...assessmentContext
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/api/enhanced-multimodal-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if there's a fallback response
        if (errorData.fallback) {
          console.warn('[API] Enhanced analysis unavailable, using fallback');
          return {
            success: true,
            data: errorData.fallback,
            mode: 'fallback',
            message: 'Enhanced AI analysis unavailable - using basic assessment'
          };
        }
        
        throw new Error(errorData.error || 'Enhanced assessment failed');
      }

      const result = await response.json();
      
      console.log('[API] Enhanced multimodal assessment completed successfully');
      return {
        success: true,
        data: result,
        mode: 'enhanced',
        aiServicesUsed: result.dataQuality?.aiServicesUsed || ['Gemini', 'AssemblyAI']
      };

    } catch (error) {
      console.error('[API] Enhanced multimodal assessment failed:', error);
      
      // Return demo mode with enhanced structure
      return this.generateEnhancedDemoResponse(facialMetrics, postureMetrics, speechMetrics);
    }
  }

  // Advanced audio analysis with AssemblyAI
  static async advancedAudioAnalysis(audioBuffer, assessmentContext = {}) {
    try {
      console.log('[API] Starting advanced AssemblyAI audio analysis');
      
      const response = await fetch(`${API_BASE_URL}/api/advanced-audio-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioBuffer: audioBuffer.toString('base64'),
          assessmentContext: {
            expectedDuration: 30,
            medicalTerms: [
              'stroke', 'speech', 'slurred', 'difficulty', 'weakness',
              'numbness', 'confusion', 'balance', 'coordination'
            ],
            passageType: 'neurological-assessment',
            ...assessmentContext
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Advanced audio analysis failed');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.analysis,
        processingTime: result.processingTime
      };

    } catch (error) {
      console.error('[API] Advanced audio analysis failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: {
          text: 'Advanced transcription unavailable',
          confidence: 0,
          strokeIndicators: {
            longPauses: [],
            speechRate: 150,
            disfluencyRate: 0,
            pronunciationAccuracy: 0.8
          }
        }
      };
    }
  }

  // Generate enhanced demo response with realistic AI analysis structure
  static generateEnhancedDemoResponse(facialMetrics, postureMetrics, speechMetrics) {
    const riskScore = this.calculateDemoRiskScore(facialMetrics, postureMetrics, speechMetrics);
    
    return {
      success: true,
      data: {
        integratedAssessment: {
          strokeProbability: riskScore,
          integratedRisk: riskScore > 60 ? 'high' : riskScore > 30 ? 'moderate' : 'low',
          nihssEquivalentScore: Math.max(0, Math.floor(riskScore / 10) - 1),
          facialSpeechCorrelation: Math.min(85, riskScore + 15),
          postureCoordinationScore: Math.max(30, 90 - riskScore),
          territoryLikelihood: {
            anteriorCirculation: riskScore > 50 ? riskScore - 20 : 15,
            posteriorCirculation: riskScore > 40 ? 25 : 10,
            lacunar: riskScore > 30 ? 20 : 5
          },
          urgencyLevel: riskScore > 70 ? 'urgent' : riskScore > 40 ? 'moderate' : 'routine',
          confidence: 75
        },
        
        advancedSpeechAnalysis: {
          text: speechMetrics?.transcript || 'Demo assessment completed',
          confidence: 0.85,
          speechTiming: {
            avgPauseDuration: 250 + (riskScore * 3),
            longPauses: riskScore > 40 ? [
              { duration: 1200, context: 'speech ... analysis', severity: 'moderate' }
            ] : [],
            pauseRate: 0.02 + (riskScore * 0.001)
          },
          disfluencies: {
            fillers: Math.floor(riskScore / 20),
            repetitions: Math.floor(riskScore / 30),
            hesitations: riskScore > 50 ? [{ word: 'assessment', confidence: 0.65 }] : [],
            rate: 0.01 + (riskScore * 0.0005),
            severity: riskScore > 60 ? 'moderate' : riskScore > 30 ? 'mild' : 'normal'
          },
          pronunciation: {
            accuracy: Math.max(0.5, 0.95 - (riskScore * 0.005)),
            strokeSensitiveIssues: riskScore > 50 ? [
              { word: 'articulation', sound: 'r', confidence: 0.7, severity: 'mild' }
            ] : [],
            difficultWordAccuracy: Math.max(0.6, 0.9 - (riskScore * 0.004))
          },
          speechRate: {
            wordsPerMinute: Math.max(100, 180 - (riskScore * 0.8)),
            category: riskScore > 50 ? 'slow' : 'normal',
            totalDuration: 25.5
          },
          medicalEntities: [
            { text: 'speech', entity_type: 'MEDICAL_CONDITION' },
            { text: 'assessment', entity_type: 'MEDICAL_PROCEDURE' }
          ],
          strokeIndicators: {
            longPauses: riskScore > 40 ? 1 : 0,
            speechRate: Math.max(100, 180 - (riskScore * 0.8)),
            disfluencyRate: 0.01 + (riskScore * 0.0005),
            pronunciationAccuracy: Math.max(0.5, 0.95 - (riskScore * 0.005)),
            hesitationFrequency: riskScore > 50 ? 1 : 0
          }
        },
        
        advancedMedicalAnalysis: {
          strokeRiskAssessment: {
            overallRisk: riskScore > 60 ? 'high' : riskScore > 30 ? 'moderate' : 'low',
            riskScore,
            nihssEquivalent: Math.max(0, Math.floor(riskScore / 10) - 1),
            confidence: 78
          },
          territorialAnalysis: {
            anteriorCirculation: riskScore > 50 ? riskScore - 20 : 15,
            posteriorCirculation: riskScore > 40 ? 25 : 10,
            lacunar: riskScore > 30 ? 20 : 5,
            mostLikely: riskScore > 50 ? 'anterior' : 'none'
          },
          clinicalFindings: {
            speechLanguage: {
              dysarthria: riskScore > 60 ? 'mild' : 'none',
              aphasia: riskScore > 70 ? 'mild' : 'none',
              apraxia: 'none',
              details: riskScore > 50 ? ['Mild articulation difficulties noted'] : ['Speech patterns within normal limits']
            },
            facialFunction: {
              asymmetry: (facialMetrics?.overallAsymmetry || 0) > 0.08 ? 'mild' : 'none',
              weakness: 'none',
              details: (facialMetrics?.overallAsymmetry || 0) > 0.08 ? ['Slight facial asymmetry detected'] : ['Facial symmetry normal']
            },
            motorFunction: {
              coordination: (postureMetrics?.shoulderImbalance || 0) > 0.1 ? 'impaired' : 'normal',
              balance: 'normal',
              details: (postureMetrics?.shoulderImbalance || 0) > 0.1 ? ['Minor postural imbalances noted'] : ['Motor function appears normal']
            }
          },
          recommendations: {
            urgency: riskScore > 70 ? 'urgent' : riskScore > 40 ? 'moderate' : 'routine',
            nextSteps: riskScore > 60 ? 
              ['Recommend neurological consultation', 'Monitor for additional symptoms'] :
              ['Continue regular health monitoring', 'Maintain healthy lifestyle'],
            followUp: riskScore > 50 ? 'within 1 week' : 'routine annual checkup',
            redFlags: ['Sudden speech changes', 'New weakness', 'Balance problems', 'Severe headache']
          },
          medicalSummary: `Demo assessment completed with ${riskScore}% risk score. ${riskScore > 60 ? 'Elevated risk detected - recommend medical evaluation.' : 'Risk levels within acceptable range.'}`,
          patientSummary: `Your assessment shows ${riskScore > 60 ? 'some areas of concern' : 'generally normal results'}. ${riskScore > 60 ? 'We recommend consulting with a healthcare provider for further evaluation.' : 'Continue maintaining your current health routine.'}`
        },
        
        clinicalSummary: {
          overallAssessment: `Comprehensive multimodal neurological assessment completed in demo mode. Stroke probability: ${riskScore}%`,
          keyFindings: [
            `Integrated risk level: ${riskScore > 60 ? 'high' : riskScore > 30 ? 'moderate' : 'low'}`,
            `NIHSS equivalent score: ${Math.max(0, Math.floor(riskScore / 10) - 1)}`,
            `Urgency classification: ${riskScore > 70 ? 'urgent' : riskScore > 40 ? 'moderate' : 'routine'}`
          ],
          speechAnalysisSummary: `Demo speech analysis: ${riskScore > 50 ? 'slow' : 'normal'} speech rate, ${riskScore > 40 ? 'some' : 'minimal'} pauses detected`,
          medicalCorrelations: 'Demo assessment with simulated multimodal correlation analysis',
          patientFriendlySummary: `Your assessment shows ${riskScore > 60 ? 'some areas that may need attention' : 'generally good results'}. This is a demonstration of our enhanced AI analysis capabilities.`
        },
        
        recommendations: [
          riskScore > 60 ? 'Demo: Consider medical consultation' : 'Demo: Continue regular health monitoring',
          'This is a demonstration of enhanced AI capabilities',
          'Real assessment requires proper API configuration'
        ],
        
        clinicalCorrelations: [
          `Demo correlation analysis with ${riskScore}% risk score`,
          'Enhanced AI features require API key configuration',
          'Multimodal assessment demonstrates integrated analysis capabilities'
        ],
        
        dataQuality: {
          completeness: 85,
          reliability: 70,
          processingTime: Math.floor(Math.random() * 3000) + 2000,
          aiServicesUsed: ['Demo-Gemini', 'Demo-AssemblyAI'],
          assessmentDuration: '45 seconds'
        },
        
        timestamp: new Date().toISOString(),
        version: '2.0-enhanced-demo',
        processingMode: 'demo-ai-analysis'
      },
      mode: 'demo',
      message: 'Enhanced AI analysis demo - configure API keys for full functionality'
    };
  }

  calculateDemoRiskScore(facialMetrics, postureMetrics, speechMetrics) {
    let score = 15; // Base demo score
    
    // Factor in facial asymmetry
    if (facialMetrics?.overallAsymmetry > 0.08) score += 25;
    else if (facialMetrics?.overallAsymmetry > 0.05) score += 15;
    
    // Factor in postural imbalance
    if (postureMetrics?.shoulderImbalance > 0.12) score += 20;
    else if (postureMetrics?.shoulderImbalance > 0.08) score += 10;
    
    // Factor in speech metrics
    if (speechMetrics?.overallRisk === 'high') score += 30;
    else if (speechMetrics?.overallRisk === 'medium') score += 15;
    
    // Add some randomness for realistic demo
    score += Math.floor(Math.random() * 10);
    
    return Math.min(85, Math.max(10, score));
  }

  // New multimodal assessment endpoint
  static async performMultimodalAssessment(assessmentData) {
    try {
      if (DEMO_MODE) {
        // Demo mode - simulate multimodal assessment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          integratedAssessment: {
            strokeProbability: Math.round(15 + Math.random() * 25),
            nihssEquivalentScore: Math.round(1 + Math.random() * 3),
            territoryLikelihood: {
              anteriorCirculation: Math.round(20 + Math.random() * 40),
              posteriorCirculation: Math.round(10 + Math.random() * 30),
              lacunar: Math.round(5 + Math.random() * 20)
            }
          },
          clinicalCorrelations: [
            'Facial asymmetry correlates with mild speech articulation findings',
            'Postural stability within normal limits',
            'No significant multimodal indicators of acute stroke'
          ],
          integratedRisk: 'low',
          urgencyLevel: 'routine',
          recommendations: [
            'Continue regular monitoring',
            'Maintain healthy lifestyle',
            'Consider annual neurological screening'
          ],
          nextSteps: [
            'Follow-up assessment in 6 months',
            'Lifestyle counseling if risk factors present'
          ],
          dataQuality: {
            completeness: Math.round(85 + Math.random() * 10),
            reliability: Math.round(80 + Math.random() * 15),
            assessmentDuration: assessmentData.assessmentDuration || 'unknown'
          }
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/multimodal-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assessmentData)
      });
      
      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json();
          if (errorData.fallback) {
            console.warn('Multimodal assessment service unavailable, using fallback');
            return errorData.fallback;
          }
        }
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error performing multimodal assessment:', error);
      if (DEMO_MODE && error.message.includes('fetch')) {
        return {
          integratedRisk: 'unknown',
          urgencyLevel: 'routine',
          recommendations: ['Demo mode: Multimodal assessment unavailable'],
          dataQuality: { completeness: 0, reliability: 0, assessmentDuration: 'unknown' }
        };
      }
      throw error;
    }
  }
}

export default ApiService; 