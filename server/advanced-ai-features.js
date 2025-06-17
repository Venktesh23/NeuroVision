const { AssemblyAI } = require('assemblyai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const WebSocket = require('ws');

class AdvancedAIFeatures {
  constructor() {
    this.assemblyAI = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.realtimeTranscripts = new Map();
    this.assessmentHistory = new Map();
  }

  // 1. REAL-TIME STREAMING SPEECH ANALYSIS
  async setupRealtimeTranscription(userId, websocket) {
    try {
      console.log('[AI] Setting up real-time transcription for user:', userId);
      
      // Create real-time transcription session
      const realtimeTranscriber = this.assemblyAI.realtime.createTranscriber({
        sample_rate: 16000,
        word_boost: [
          'stroke', 'weakness', 'numbness', 'slurred', 'difficulty',
          'speech', 'balance', 'coordination', 'headache', 'confusion'
        ],
        boost_param: 'medical'
      });

      // Real-time speech analysis callbacks
      realtimeTranscriber.on('transcript', (transcript) => {
        if (transcript.message_type === 'FinalTranscript') {
          const analysis = this.analyzeRealtimeSpeech(transcript);
          
          websocket.send(JSON.stringify({
            type: 'realtime_speech_analysis',
            transcript: transcript.text,
            analysis,
            timestamp: Date.now()
          }));
        }
      });

      realtimeTranscriber.on('error', (error) => {
        console.error('[AI] Real-time transcription error:', error);
        websocket.send(JSON.stringify({
          type: 'transcription_error',
          error: error.message
        }));
      });

      // Store session
      this.realtimeTranscripts.set(userId, realtimeTranscriber);
      
      return realtimeTranscriber;
      
    } catch (error) {
      console.error('[AI] Failed to setup real-time transcription:', error);
      throw error;
    }
  }

  // Analyze speech in real-time for immediate feedback
  analyzeRealtimeSpeech(transcript) {
    const words = transcript.words || [];
    const text = transcript.text || '';
    
    // Real-time stroke indicators
    const indicators = {
      slowSpeech: this.detectSlowSpeech(words),
      longPauses: this.detectLongPauses(words),
      slurring: this.detectSlurring(text, words),
      wordFinding: this.detectWordFindingDifficulty(text),
      repetitions: this.detectRepetitions(words)
    };
    
    // Calculate real-time risk score
    const riskScore = this.calculateRealtimeRisk(indicators);
    
    return {
      indicators,
      riskScore,
      urgency: riskScore > 70 ? 'immediate' : riskScore > 40 ? 'concerning' : 'normal',
      recommendations: this.generateRealtimeRecommendations(riskScore)
    };
  }

  // 2. GEMINI VISION FOR ENHANCED FACIAL ANALYSIS
  async enhancedFacialAnalysisWithVision(imageData, existingMetrics) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-vision' });
      
      const prompt = `
      You are a specialized neurologist analyzing facial images for stroke detection.
      
      Analyze this facial image for:
      1. Facial droop or asymmetry (NIHSS Item 4)
      2. Subtle muscle weakness patterns
      3. Eyelid ptosis or asymmetric eye opening
      4. Mouth corner asymmetry during rest and expression
      5. Forehead muscle function
      6. Overall facial nerve function (CN VII)
      
      Current computer vision metrics:
      - Overall Asymmetry: ${existingMetrics.overallAsymmetry}
      - Eye Asymmetry: ${existingMetrics.eyeAsymmetry}
      - Mouth Asymmetry: ${existingMetrics.mouthAsymmetry}
      
      Provide detailed neurological assessment with confidence scores.
      Format as JSON with medical terminology.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const analysisText = response.text();
      
      return this.parseVisionAnalysis(analysisText, existingMetrics);
      
    } catch (error) {
      console.error('[AI] Gemini Vision analysis failed:', error);
      return {
        enhanced: false,
        error: error.message,
        fallback: existingMetrics
      };
    }
  }

  // 3. PREDICTIVE ANALYTICS & TREND ANALYSIS
  async performPredictiveAnalysis(userId, currentAssessment, historicalData) {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      });

      const prompt = `
      You are an AI neurologist performing longitudinal analysis for stroke risk prediction.
      
      ## CURRENT ASSESSMENT:
      ${JSON.stringify(currentAssessment, null, 2)}
      
      ## HISTORICAL DATA (Last 6 months):
      ${JSON.stringify(historicalData.slice(-10), null, 2)}
      
      ## ANALYSIS REQUIREMENTS:
      1. **Trend Analysis**: Identify patterns in speech, facial, and motor metrics
      2. **Risk Progression**: Calculate trend in stroke risk over time
      3. **Early Warning Signs**: Detect subtle deterioration patterns
      4. **Personalized Baselines**: Establish individual normal ranges
      5. **Predictive Modeling**: Forecast risk trajectory
      6. **Intervention Timing**: Optimal timing for medical consultation
      
      ## OUTPUT FORMAT:
      {
        "trendAnalysis": {
          "speechTrend": "improving|stable|declining",
          "facialTrend": "improving|stable|declining", 
          "motorTrend": "improving|stable|declining",
          "overallTrend": "improving|stable|declining"
        },
        "riskProgression": {
          "currentRisk": [0-100],
          "30dayForecast": [0-100],
          "90dayForecast": [0-100],
          "trendDirection": "increasing|stable|decreasing"
        },
        "earlyWarningSignals": [
          {"signal": "description", "severity": "low|medium|high", "confidence": [0-100]}
        ],
        "personalizedBaselines": {
          "speechNormal": [0-100],
          "facialNormal": [0-100],
          "motorNormal": [0-100]
        },
        "recommendations": {
          "immediateActions": ["action1", "action2"],
          "followUpTiming": "days/weeks",
          "monitoringFocus": ["area1", "area2"]
        }
      }
      
      Provide ONLY the JSON response.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      return this.parsePredictiveAnalysis(analysisText);
      
    } catch (error) {
      console.error('[AI] Predictive analysis failed:', error);
      return {
        trendAnalysis: { overallTrend: 'stable' },
        riskProgression: { currentRisk: 30, trendDirection: 'stable' },
        error: error.message
      };
    }
  }

  // 4. MULTI-LANGUAGE NEUROLOGICAL ASSESSMENT
  async multiLanguageAssessment(audioData, targetLanguage = 'en') {
    try {
      const languageConfigs = {
        'es': { 
          language_code: 'es',
          word_boost: ['accidente cerebrovascular', 'debilidad', 'habla', 'dificultad'],
          medical_terms: ['neurológico', 'síntomas', 'coordinación']
        },
        'fr': {
          language_code: 'fr', 
          word_boost: ['accident vasculaire', 'faiblesse', 'parole', 'difficulté'],
          medical_terms: ['neurologique', 'symptômes', 'coordination']
        },
        'de': {
          language_code: 'de',
          word_boost: ['schlaganfall', 'schwäche', 'sprache', 'schwierigkeit'],
          medical_terms: ['neurologisch', 'symptome', 'koordination']
        }
      };

      const config = languageConfigs[targetLanguage] || languageConfigs['en'];
      
      // Enhanced multi-language transcription
      const transcript = await this.assemblyAI.transcripts.transcribe({
        audio_url: audioData,
        language_code: config.language_code,
        word_boost: config.word_boost,
        boost_param: 'medical',
        sentiment_analysis: true,
        entity_detection: true
      });

      // Multi-language medical analysis with Gemini
      const medicalAnalysis = await this.performMultiLanguageMedicalAnalysis(
        transcript, targetLanguage
      );

      return {
        language: targetLanguage,
        transcript: transcript.text,
        analysis: medicalAnalysis,
        confidence: transcript.confidence
      };
      
    } catch (error) {
      console.error(`[AI] Multi-language assessment failed for ${targetLanguage}:`, error);
      throw error;
    }
  }

  // 5. EMOTIONAL & PSYCHOLOGICAL STATE ANALYSIS
  async analyzeEmotionalState(speechData, facialExpression, contextData) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      const prompt = `
      You are a neuropsychologist analyzing emotional and psychological state during stroke assessment.
      
      ## SPEECH DATA:
      - Transcript: "${speechData.text}"
      - Sentiment: ${JSON.stringify(speechData.sentiment_analysis_results)}
      - Emotional Markers: ${JSON.stringify(speechData.emotional_markers)}
      
      ## FACIAL EXPRESSION DATA:
      ${JSON.stringify(facialExpression)}
      
      ## CONTEXT:
      - Assessment Phase: ${contextData.phase}
      - Duration: ${contextData.duration}
      - Previous Emotional State: ${contextData.previousState}
      
      ## ANALYSIS FRAMEWORK:
      1. **Anxiety Assessment**: Signs of test anxiety, medical anxiety
      2. **Depression Screening**: Mood indicators, affect evaluation  
      3. **Cognitive Load**: Mental effort, processing strain
      4. **Stress Response**: Physiological stress markers
      5. **Motivation Level**: Engagement, cooperation assessment
      6. **Coping Mechanisms**: Response to assessment challenges
      
      Provide psychological profile with clinical recommendations.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return this.parseEmotionalAnalysis(response.text());
      
    } catch (error) {
      console.error('[AI] Emotional state analysis failed:', error);
      return {
        emotionalState: 'neutral',
        confidence: 30,
        error: error.message
      };
    }
  }

  // 6. CONTINUOUS LEARNING & MODEL ADAPTATION
  async updatePersonalizedModel(userId, assessmentData, outcome) {
    try {
      // Store assessment data for continuous learning
      if (!this.assessmentHistory.has(userId)) {
        this.assessmentHistory.set(userId, []);
      }
      
      const userHistory = this.assessmentHistory.get(userId);
      userHistory.push({
        assessment: assessmentData,
        outcome,
        timestamp: Date.now()
      });
      
      // Keep last 50 assessments
      if (userHistory.length > 50) {
        userHistory.shift();
      }
      
      // Update personalized thresholds
      const personalizedThresholds = this.calculatePersonalizedThresholds(userHistory);
      
      // Generate user-specific insights
      const insights = await this.generatePersonalizedInsights(userId, userHistory);
      
      return {
        thresholds: personalizedThresholds,
        insights,
        totalAssessments: userHistory.length
      };
      
    } catch (error) {
      console.error('[AI] Model adaptation failed:', error);
      return { error: error.message };
    }
  }

  // Helper methods
  detectSlowSpeech(words) {
    if (words.length < 2) return false;
    const duration = words[words.length - 1].end - words[0].start;
    const wordsPerMinute = (words.length / duration) * 60000;
    return wordsPerMinute < 120; // Slower than 120 WPM
  }

  detectLongPauses(words) {
    const longPauses = [];
    for (let i = 1; i < words.length; i++) {
      const pauseDuration = words[i].start - words[i-1].end;
      if (pauseDuration > 1000) { // > 1 second
        longPauses.push({
          duration: pauseDuration,
          beforeWord: words[i-1].text,
          afterWord: words[i].text
        });
      }
    }
    return longPauses;
  }

  detectSlurring(text, words) {
    // Simple slurring detection based on confidence scores
    const lowConfidenceWords = words.filter(w => w.confidence < 0.7);
    return {
      suspectedSlurring: lowConfidenceWords.length / words.length > 0.3,
      affectedWords: lowConfidenceWords.map(w => w.text),
      severity: lowConfidenceWords.length / words.length
    };
  }

  calculateRealtimeRisk(indicators) {
    let risk = 0;
    if (indicators.slowSpeech) risk += 25;
    if (indicators.longPauses.length > 2) risk += 30;
    if (indicators.slurring.suspectedSlurring) risk += 35;
    if (indicators.wordFinding > 0.2) risk += 20;
    if (indicators.repetitions > 3) risk += 15;
    return Math.min(risk, 100);
  }

  generateRealtimeRecommendations(riskScore) {
    if (riskScore > 70) {
      return ['Stop assessment', 'Seek immediate medical attention', 'Call emergency services'];
    } else if (riskScore > 40) {
      return ['Complete assessment carefully', 'Consider medical consultation', 'Monitor closely'];
    }
    return ['Continue assessment', 'Normal speech patterns detected'];
  }

  parseVisionAnalysis(text, fallback) {
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '');
      return JSON.parse(cleanText);
    } catch (error) {
      return { enhanced: false, fallback, parseError: error.message };
    }
  }

  parsePredictiveAnalysis(text) {
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '');
      return JSON.parse(cleanText);
    } catch (error) {
      return { 
        trendAnalysis: { overallTrend: 'unknown' },
        parseError: error.message 
      };
    }
  }

  parseEmotionalAnalysis(text) {
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '');
      return JSON.parse(cleanText);
    } catch (error) {
      return {
        emotionalState: 'unknown',
        confidence: 30,
        parseError: error.message
      };
    }
  }

  calculatePersonalizedThresholds(history) {
    // Calculate user-specific normal ranges
    const metrics = history.map(h => h.assessment);
    
    return {
      speechRate: this.calculatePercentile(metrics.map(m => m.speechRate), 25, 75),
      facialAsymmetry: this.calculatePercentile(metrics.map(m => m.facialAsymmetry), 25, 75),
      postureStability: this.calculatePercentile(metrics.map(m => m.postureStability), 25, 75)
    };
  }

  calculatePercentile(values, p25, p75) {
    const sorted = values.filter(v => v != null).sort((a, b) => a - b);
    if (sorted.length === 0) return { min: 0, max: 1 };
    
    return {
      min: sorted[Math.floor(sorted.length * p25 / 100)],
      max: sorted[Math.floor(sorted.length * p75 / 100)]
    };
  }

  async generatePersonalizedInsights(userId, history) {
    // Generate AI insights based on user history
    const recentTrend = history.slice(-5);
    const improvements = this.detectImprovements(recentTrend);
    const concerns = this.detectConcerns(recentTrend);
    
    return {
      improvements,
      concerns,
      recommendations: this.generatePersonalizedRecommendations(improvements, concerns)
    };
  }

  detectImprovements(data) {
    // Analyze positive trends
    return data.filter(d => d.outcome === 'improved').map(d => d.assessment.primaryMetric);
  }

  detectConcerns(data) {
    // Analyze concerning trends  
    return data.filter(d => d.outcome === 'declined').map(d => d.assessment.primaryMetric);
  }

  generatePersonalizedRecommendations(improvements, concerns) {
    const recommendations = [];
    
    if (improvements.length > concerns.length) {
      recommendations.push('Continue current health practices');
    }
    
    if (concerns.length > 0) {
      recommendations.push('Consider discussing concerns with healthcare provider');
    }
    
    return recommendations;
  }
}

module.exports = AdvancedAIFeatures; 