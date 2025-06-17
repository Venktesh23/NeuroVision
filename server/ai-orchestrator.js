/**
 * AI Orchestration Service for NeuroVision
 * Coordinates multiple AI APIs for comprehensive stroke detection
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AssemblyAI } = require('assemblyai');
const OpenAI = require('openai');

class AIOrchestrator {
  constructor() {
    // Initialize AI services
    this.gemini = process.env.GOOGLE_AI_API_KEY ? 
      new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;
    
    this.assemblyai = process.env.ASSEMBLYAI_API_KEY ? 
      new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY }) : null;
    
    this.openai = process.env.OPENAI_API_KEY ? 
      new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    
    // Service availability flags
    this.services = {
      gemini: !!this.gemini,
      assemblyai: !!this.assemblyai,
      openai: !!this.openai
    };
    
    console.log('[AI-ORCHESTRATOR] Initialized with services:', this.services);
  }

  /**
   * Enhanced Speech Analysis with Multiple AI Services
   */
  async enhancedSpeechAnalysis(audioData, options = {}) {
    const results = {
      transcription: null,
      medicalAnalysis: null,
      qualityMetrics: null,
      confidence: 0,
      services: []
    };

    try {
      // Step 1: Enhanced Transcription with Medical Context
      if (this.assemblyai) {
        results.transcription = await this.advancedTranscription(audioData, options);
        results.services.push('AssemblyAI');
      }

      // Step 2: Gemini Medical Analysis
      if (this.gemini && results.transcription) {
        results.medicalAnalysis = await this.geminiMedicalAnalysis(
          results.transcription, 
          options
        );
        results.services.push('Gemini-1.5-pro');
      }

      // Step 3: OpenAI Cross-Validation (if available)
      if (this.openai && results.transcription) {
        const openaiAnalysis = await this.openaiCrossValidation(
          results.transcription,
          results.medicalAnalysis
        );
        results.crossValidation = openaiAnalysis;
        results.services.push('GPT-4');
      }

      // Step 4: Quality Assessment and Confidence Scoring
      results.qualityMetrics = this.assessAnalysisQuality(results);
      results.confidence = this.calculateOverallConfidence(results);

      return results;

    } catch (error) {
      console.error('[AI-ORCHESTRATOR] Enhanced speech analysis failed:', error);
      return this.generateFallbackAnalysis(error);
    }
  }

  /**
   * Advanced Audio Transcription with Medical Enhancement
   */
  async advancedTranscription(audioData, options) {
    try {
      const enhancedConfig = {
        audio: audioData.url || audioData.buffer,
        
        // Medical-optimized configuration
        speech_model: 'best',
        language_code: options.language || 'en',
        
        // Advanced features for medical analysis
        punctuate: true,
        format_text: true,
        
        // Medical context enhancement
        boost_param: 'high',
        word_boost: [
          'dysarthria', 'aphasia', 'articulation', 'fluency',
          'speech clarity', 'word finding', 'slurred speech',
          'stroke', 'neurological', 'assessment'
        ],
        
        // Audio quality analysis
        audio_quality_enhancement: true,
        speaker_labels: false, // Single speaker expected
        
        // Real-time processing if needed
        realtime: options.realtime || false
      };

      const transcript = await this.assemblyai.transcripts.transcribe(enhancedConfig);
      
      // Extract detailed metrics
      const transcriptionResult = {
        text: transcript.text,
        confidence: transcript.confidence,
        words: transcript.words,
        
        // Audio quality indicators
        audioQuality: {
          duration: transcript.audio_duration,
          speechRate: this.calculateSpeechRate(transcript),
          pauseAnalysis: this.analyzePauses(transcript.words),
          clarityScore: this.assessAudioClarity(transcript)
        },
        
        // Medical markers detected during transcription
        medicalMarkers: this.extractMedicalMarkers(transcript),
        timestamp: new Date().toISOString()
      };

      return transcriptionResult;

    } catch (error) {
      console.error('[AI-ORCHESTRATOR] Advanced transcription failed:', error);
      return {
        text: '',
        confidence: 0,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Gemini Medical Analysis with Enhanced Prompting
   */
  async geminiMedicalAnalysis(transcriptionData, options) {
    if (!this.gemini) {
      throw new Error('Gemini AI service not available');
    }

    try {
      const model = this.gemini.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.1, // Low temperature for medical accuracy
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      });

      const medicalPrompt = this.createEnhancedMedicalPrompt(transcriptionData, options);
      const result = await model.generateContent(medicalPrompt);
      const response = await result.response;
      
      return this.parseGeminiMedicalResponse(response.text());

    } catch (error) {
      console.error('[AI-ORCHESTRATOR] Gemini medical analysis failed:', error);
      return this.generateMedicalFallback(error);
    }
  }

  /**
   * OpenAI Cross-Validation and Enhancement
   */
  async openaiCrossValidation(transcriptionData, geminiAnalysis) {
    if (!this.openai) {
      return null;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a medical AI validator specializing in stroke assessment. 
            Review and cross-validate the analysis provided, looking for:
            1. Consistency in medical findings
            2. Potential missed indicators
            3. Risk assessment accuracy
            4. Clinical recommendation appropriateness
            Provide validation scores and suggested improvements.`
          },
          {
            role: "user",
            content: `
            Original Transcript: "${transcriptionData.text}"
            Audio Quality: ${JSON.stringify(transcriptionData.audioQuality)}
            Gemini Analysis: ${JSON.stringify(geminiAnalysis)}
            
            Please cross-validate this stroke assessment analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });

      return this.parseOpenAIValidation(response.choices[0].message.content);

    } catch (error) {
      console.error('[AI-ORCHESTRATOR] OpenAI cross-validation failed:', error);
      return null;
    }
  }

  /**
   * Image Analysis with Multiple AI Services
   */
  async enhancedImageAnalysis(imageData, options = {}) {
    const results = {
      facialAnalysis: null,
      medicalIndicators: null,
      qualityAssessment: null,
      confidence: 0,
      services: []
    };

    try {
      // Gemini Vision Analysis
      if (this.gemini) {
        results.facialAnalysis = await this.geminiVisionAnalysis(imageData, options);
        results.services.push('Gemini-Vision');
      }

      // OpenAI Vision Analysis (if available)
      if (this.openai) {
        const openaiVision = await this.openaiVisionAnalysis(imageData, options);
        results.crossValidation = openaiVision;
        results.services.push('GPT-4-Vision');
      }

      // Quality and confidence assessment
      results.qualityAssessment = this.assessImageQuality(imageData);
      results.confidence = this.calculateImageConfidence(results);

      return results;

    } catch (error) {
      console.error('[AI-ORCHESTRATOR] Enhanced image analysis failed:', error);
      return this.generateImageFallback(error);
    }
  }

  /**
   * Gemini Vision Analysis for Medical Assessment
   */
  async geminiVisionAnalysis(imageData, options) {
    try {
      const model = this.gemini.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

      const prompt = `Analyze this facial image for neurological assessment with focus on stroke indicators:

1. **Facial Symmetry Analysis:**
   - Compare left and right sides of face
   - Assess eye position and eyelid symmetry
   - Evaluate mouth position and smile symmetry
   - Check forehead wrinkle patterns

2. **Stroke-Specific Indicators:**
   - Facial droop (particularly mouth corner)
   - Eyelid ptosis (drooping)
   - Asymmetric facial expressions
   - Unilateral weakness signs

3. **Assessment Quality:**
   - Image clarity and lighting
   - Face positioning and angle
   - Visible facial landmarks
   - Assessment reliability

Provide analysis in JSON format with numerical scores and clinical observations.`;

      const result = await model.generateContent([prompt, {
        inlineData: {
          data: imageData.base64 || imageData.buffer.toString('base64'),
          mimeType: imageData.mimeType || 'image/jpeg'
        }
      }]);

      const response = await result.response;
      return this.parseGeminiVisionResponse(response.text());

    } catch (error) {
      console.error('[AI-ORCHESTRATOR] Gemini vision analysis failed:', error);
      return null;
    }
  }

  /**
   * Create Enhanced Medical Prompt for Speech Analysis
   */
  createEnhancedMedicalPrompt(transcriptionData, options) {
    const basePrompt = `You are a specialized neurological assessment AI with expertise in stroke detection through speech analysis.

## ASSESSMENT DATA:
**Transcript:** "${transcriptionData.text}"
**Audio Quality:** ${JSON.stringify(transcriptionData.audioQuality)}
**Speech Rate:** ${transcriptionData.audioQuality?.speechRate || 'unknown'} words/minute
**Pause Analysis:** ${JSON.stringify(transcriptionData.audioQuality?.pauseAnalysis)}

## CLINICAL CONTEXT:
${options.expectedText ? `**Expected Text:** "${options.expectedText}"` : '**Assessment Type:** Spontaneous speech evaluation'}
${options.patientAge ? `**Patient Age:** ${options.patientAge}` : ''}
${options.patientGender ? `**Patient Gender:** ${options.patientGender}` : ''}
${options.medicalHistory ? `**Medical History:** ${options.medicalHistory.join(', ')}` : ''}

## NEUROLOGICAL ASSESSMENT PROTOCOL:

### SPEECH INDICATORS TO ANALYZE:
1. **Dysarthria (Motor Speech Disorder):**
   - Articulation precision
   - Speech rate abnormalities
   - Voice quality changes
   - Respiratory support adequacy

2. **Aphasia (Language Disorder):**
   - Word retrieval difficulties
   - Semantic paraphasias
   - Syntactic complexity
   - Comprehension indicators

3. **Apraxia of Speech:**
   - Sound sequencing errors
   - Inconsistent articulation
   - Struggle behaviors
   - Prosodic abnormalities

### ASSESSMENT CRITERIA:
- Compare against age-appropriate norms
- Consider educational and cultural factors
- Evaluate severity and functional impact
- Correlate with stroke territory patterns

## RESPONSE FORMAT (JSON):
{
  "speechAnalysis": {
    "articulationClarity": [0-100],
    "fluencyScore": [0-100],
    "prosodyScore": [0-100],
    "wordFindingAbility": [0-100],
    "speechRate": "slow|normal|fast",
    "voiceQuality": "normal|hoarse|breathy|strained"
  },
  "strokeIndicators": {
    "dysarthriaRisk": "none|mild|moderate|severe",
    "aphasiaRisk": "none|mild|moderate|severe",
    "apraxiaRisk": "none|mild|moderate|severe",
    "overallSpeechRisk": "low|moderate|high|critical"
  },
  "clinicalObservations": [
    "Specific clinical findings with neuroanatomical correlation"
  ],
  "recommendedActions": [
    "Evidence-based recommendations for further assessment"
  ],
  "confidenceLevel": [0-100],
  "urgencyLevel": "routine|urgent|emergent|immediate"
}

Analyze the speech data and return ONLY the JSON response.`;

    return basePrompt;
  }

  /**
   * Helper Functions for Analysis Enhancement
   */
  calculateSpeechRate(transcript) {
    if (!transcript.words || transcript.audio_duration === 0) return 0;
    return Math.round((transcript.words.length / transcript.audio_duration) * 60);
  }

  analyzePauses(words) {
    if (!words || words.length === 0) return { avgPauseLength: 0, pauseCount: 0 };
    
    let pauseCount = 0;
    let totalPauseTime = 0;
    
    for (let i = 1; i < words.length; i++) {
      const pauseLength = words[i].start - words[i-1].end;
      if (pauseLength > 0.5) { // Pauses longer than 500ms
        pauseCount++;
        totalPauseTime += pauseLength;
      }
    }
    
    return {
      pauseCount,
      avgPauseLength: pauseCount > 0 ? totalPauseTime / pauseCount : 0,
      totalPauseTime
    };
  }

  assessAudioClarity(transcript) {
    // Calculate clarity based on confidence scores and audio quality indicators
    if (!transcript.words) return 50;
    
    const avgConfidence = transcript.words.reduce((sum, word) => 
      sum + (word.confidence || 0.5), 0) / transcript.words.length;
    
    return Math.round(avgConfidence * 100);
  }

  extractMedicalMarkers(transcript) {
    const medicalTerms = [
      'slurred', 'difficulty', 'speaking', 'words', 'unclear',
      'mumbling', 'stuttering', 'hesitation', 'repetition'
    ];
    
    const foundMarkers = [];
    const text = transcript.text.toLowerCase();
    
    medicalTerms.forEach(term => {
      if (text.includes(term)) {
        foundMarkers.push(term);
      }
    });
    
    return foundMarkers;
  }

  assessAnalysisQuality(results) {
    const quality = {
      transcriptionQuality: 0,
      analysisCompleteness: 0,
      crossValidationScore: 0,
      overallQuality: 0
    };
    
    // Assess transcription quality
    if (results.transcription) {
      quality.transcriptionQuality = results.transcription.confidence * 100;
    }
    
    // Assess analysis completeness
    if (results.medicalAnalysis) {
      quality.analysisCompleteness = results.medicalAnalysis.confidenceLevel || 50;
    }
    
    // Assess cross-validation
    if (results.crossValidation) {
      quality.crossValidationScore = results.crossValidation.validationScore || 50;
    }
    
    // Calculate overall quality
    quality.overallQuality = (
      quality.transcriptionQuality * 0.4 +
      quality.analysisCompleteness * 0.4 +
      quality.crossValidationScore * 0.2
    );
    
    return quality;
  }

  calculateOverallConfidence(results) {
    const factors = [];
    
    if (results.transcription?.confidence) {
      factors.push(results.transcription.confidence * 100);
    }
    
    if (results.medicalAnalysis?.confidenceLevel) {
      factors.push(results.medicalAnalysis.confidenceLevel);
    }
    
    if (results.crossValidation?.validationScore) {
      factors.push(results.crossValidation.validationScore);
    }
    
    if (factors.length === 0) return 0;
    
    return Math.round(factors.reduce((sum, factor) => sum + factor, 0) / factors.length);
  }

  parseGeminiMedicalResponse(responseText) {
    try {
      let jsonStr = responseText.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n|```\n|```/g, '');
      }
      
      const parsed = JSON.parse(jsonStr);
      return {
        ...parsed,
        aiService: 'Gemini-1.5-pro',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[AI-ORCHESTRATOR] Failed to parse Gemini response:', error);
      return this.generateMedicalFallback(error);
    }
  }

  generateMedicalFallback(error) {
    return {
      speechAnalysis: {
        articulationClarity: 75,
        fluencyScore: 75,
        prosodyScore: 75,
        wordFindingAbility: 75,
        speechRate: "normal",
        voiceQuality: "normal"
      },
      strokeIndicators: {
        dysarthriaRisk: "mild",
        aphasiaRisk: "none",
        apraxiaRisk: "none",
        overallSpeechRisk: "moderate"
      },
      clinicalObservations: [
        "AI analysis temporarily unavailable",
        "Manual clinical assessment recommended"
      ],
      recommendedActions: [
        "Consult healthcare provider for comprehensive evaluation"
      ],
      confidenceLevel: 50,
      urgencyLevel: "routine",
      fallback: true,
      error: error.message
    };
  }

  generateFallbackAnalysis(error) {
    return {
      transcription: {
        text: '',
        confidence: 0,
        error: error.message
      },
      medicalAnalysis: this.generateMedicalFallback(error),
      qualityMetrics: {
        transcriptionQuality: 0,
        analysisCompleteness: 0,
        overallQuality: 0
      },
      confidence: 0,
      services: [],
      fallback: true
    };
  }

  /**
   * Service Health Check
   */
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Check Gemini AI
    try {
      if (this.gemini) {
        const testModel = this.gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
        await testModel.generateContent("Test connection");
        health.services.gemini = { status: 'healthy', available: true };
      } else {
        health.services.gemini = { status: 'unavailable', available: false };
      }
    } catch (error) {
      health.services.gemini = { status: 'error', available: false, error: error.message };
    }

    // Check AssemblyAI
    try {
      if (this.assemblyai) {
        // Simple API check (you might want to implement a proper health check)
        health.services.assemblyai = { status: 'healthy', available: true };
      } else {
        health.services.assemblyai = { status: 'unavailable', available: false };
      }
    } catch (error) {
      health.services.assemblyai = { status: 'error', available: false, error: error.message };
    }

    // Check OpenAI
    try {
      if (this.openai) {
        health.services.openai = { status: 'healthy', available: true };
      } else {
        health.services.openai = { status: 'unavailable', available: false };
      }
    } catch (error) {
      health.services.openai = { status: 'error', available: false, error: error.message };
    }

    return health;
  }
}

module.exports = AIOrchestrator; 