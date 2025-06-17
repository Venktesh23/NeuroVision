const express = require('express');
const { AssemblyAI } = require('assemblyai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Enhanced AssemblyAI Configuration with Advanced Features
const assemblyAIConfig = {
  apiKey: process.env.ASSEMBLYAI_API_KEY,
  // Advanced speech analysis features
  config: {
    // Core transcription settings
    speech_model: 'nano',  // Latest high-accuracy model
    language_code: 'en_us',
    
    // ADVANCED FEATURES FOR STROKE DETECTION
    speaker_labels: true,           // Speaker diarization for speech pattern analysis
    auto_chapters: false,           // Focus on continuous speech flow
    content_safety: false,          // Not needed for medical assessment
    iab_categories: false,          // Not needed for medical assessment
    
    // CRITICAL SPEECH ANALYSIS FEATURES
    sentiment_analysis: true,       // Emotional state indicators
    entity_detection: true,         // Medical term recognition
    auto_highlights: true,          // Key speech moments identification
    summarization: true,            // Speech pattern summarization
    
    // PRONUNCIATION & FLUENCY ANALYSIS
    speech_threshold: 0.3,          // Sensitivity for speech detection
    disfluencies: true,             // "Um", "uh", hesitations detection
    punctuate: true,                // Grammar and pause analysis
    format_text: true,              // Proper formatting for analysis
    
    // ADVANCED AUDIO ANALYSIS
    boost_param: 'medical',         // Medical terminology boost
    redact_pii: false,              // Keep medical information
    filter_profanity: false,        // Medical terms may seem inappropriate
    dual_channel: false,            // Single speaker assessment
    
    // SPEED & TIMING ANALYSIS
    speed_boost: true,              // Faster processing for real-time feedback
    word_boost: [                   // Boost medically relevant words
      'stroke', 'speech', 'slurred', 'difficulty', 'weakness', 
      'numbness', 'confusion', 'headache', 'balance', 'coordination',
      'articulation', 'pronunciation', 'fluency', 'comprehension'
    ]
  }
};

// Enhanced Gemini Configuration for Medical Analysis
const geminiConfig = {
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.1,        // Low temperature for consistent medical analysis
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,   // Extended output for comprehensive analysis
    candidateCount: 1,
    stopSequences: []
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_MEDICAL',
      threshold: 'BLOCK_NONE'  // Allow medical content analysis
    }
  ]
};

class EnhancedAIAnalyzer {
  constructor() {
    this.assemblyAI = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel(geminiConfig);
  }

  // ENHANCED ASSEMBLYAI SPEECH ANALYSIS
  async performAdvancedSpeechAnalysis(audioBuffer, assessmentContext = {}) {
    try {
      console.log('[AI] Starting enhanced AssemblyAI speech analysis...');
      
      // Upload audio with enhanced configuration
      const uploadResponse = await this.assemblyAI.files.upload(audioBuffer);
      
      // Advanced transcription with ALL stroke-relevant features
      const transcriptResponse = await this.assemblyAI.transcripts.transcribe({
        audio_url: uploadResponse.upload_url,
        ...assemblyAIConfig.config,
        
        // Dynamic configuration based on assessment type
        ...(assessmentContext.expectedDuration && {
          speech_threshold: assessmentContext.expectedDuration > 30 ? 0.2 : 0.4
        }),
        
        // Enhanced medical word boosting
        word_boost: [
          ...assemblyAIConfig.config.word_boost,
          ...(assessmentContext.medicalTerms || [])
        ]
      });

      // Wait for completion with status polling
      let transcript = await this.assemblyAI.transcripts.get(transcriptResponse.id);
      while (transcript.status !== 'completed' && transcript.status !== 'error') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        transcript = await this.assemblyAI.transcripts.get(transcriptResponse.id);
      }

      if (transcript.status === 'error') {
        throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
      }

      // Extract COMPREHENSIVE speech metrics
      const enhancedMetrics = this.extractAdvancedSpeechMetrics(transcript);
      
      console.log('[AI] AssemblyAI analysis completed with enhanced metrics');
      return enhancedMetrics;

    } catch (error) {
      console.error('[AI] Enhanced AssemblyAI analysis failed:', error);
      throw error;
    }
  }

  // EXTRACT ADVANCED SPEECH METRICS FROM ASSEMBLYAI
  extractAdvancedSpeechMetrics(transcript) {
    const words = transcript.words || [];
    const sentences = transcript.sentences || [];
    
    // SPEECH TIMING ANALYSIS
    const speechTiming = this.analyzeSpeechTiming(words);
    
    // DISFLUENCY DETECTION
    const disfluencies = this.analyzeDisfluencies(words, transcript.text);
    
    // PRONUNCIATION ANALYSIS
    const pronunciation = this.analyzePronunciation(words);
    
    // SENTIMENT & EMOTIONAL STATE
    const emotionalState = transcript.sentiment_analysis_results || null;
    
    // ENTITY RECOGNITION (Medical terms)
    const medicalEntities = transcript.entities || [];
    
    // AUTO HIGHLIGHTS (Key speech moments)
    const keyMoments = transcript.auto_highlights_result?.results || [];
    
    // SPEECH RATE ANALYSIS
    const speechRate = this.calculateSpeechRate(words, sentences);
    
    return {
      // Core transcription
      text: transcript.text,
      confidence: transcript.confidence,
      
      // ADVANCED SPEECH METRICS
      speechTiming,
      disfluencies,
      pronunciation,
      speechRate,
      emotionalState,
      
      // MEDICAL ANALYSIS
      medicalEntities: medicalEntities.map(entity => ({
        text: entity.text,
        entity_type: entity.entity_type,
        start: entity.start,
        end: entity.end
      })),
      
      // KEY INSIGHTS
      keyMoments: keyMoments.map(moment => ({
        text: moment.text,
        rank: moment.rank,
        timestamps: moment.timestamps
      })),
      
      // STROKE-SPECIFIC INDICATORS
      strokeIndicators: {
        longPauses: speechTiming.longPauses,
        speechRate: speechRate.wordsPerMinute,
        disfluencyRate: disfluencies.rate,
        pronunciationAccuracy: pronunciation.accuracy,
        hesitationFrequency: disfluencies.hesitations.length
      },
      
      // RAW DATA for further analysis
      rawWords: words,
      rawSentences: sentences,
      processingTime: Date.now()
    };
  }

  // ADVANCED SPEECH TIMING ANALYSIS
  analyzeSpeechTiming(words) {
    if (!words.length) return { avgPauseDuration: 0, longPauses: [] };
    
    const pauses = [];
    const longPauses = [];
    
    for (let i = 1; i < words.length; i++) {
      const pauseDuration = words[i].start - words[i-1].end;
      if (pauseDuration > 100) { // Pauses longer than 100ms
        pauses.push({
          duration: pauseDuration,
          beforeWord: words[i-1].text,
          afterWord: words[i].text,
          position: i
        });
        
        if (pauseDuration > 1000) { // Long pauses (>1 second) - stroke indicator
          longPauses.push({
            duration: pauseDuration,
            context: `${words[i-1].text} ... ${words[i].text}`,
            severity: pauseDuration > 3000 ? 'severe' : 'moderate'
          });
        }
      }
    }
    
    return {
      totalPauses: pauses.length,
      avgPauseDuration: pauses.length ? pauses.reduce((sum, p) => sum + p.duration, 0) / pauses.length : 0,
      longPauses,
      pauseRate: pauses.length / words.length
    };
  }

  // DISFLUENCY DETECTION (Um, uh, repetitions, false starts)
  analyzeDisfluencies(words, text) {
    const disfluencyPatterns = {
      fillers: ['um', 'uh', 'er', 'ah', 'like', 'you know'],
      repetitions: [],
      falseStarts: []
    };
    
    const fillers = words.filter(word => 
      disfluencyPatterns.fillers.includes(word.text.toLowerCase())
    );
    
    // Detect word repetitions
    for (let i = 1; i < words.length; i++) {
      if (words[i].text.toLowerCase() === words[i-1].text.toLowerCase()) {
        disfluencyPatterns.repetitions.push({
          word: words[i].text,
          position: i,
          confidence: Math.min(words[i].confidence, words[i-1].confidence)
        });
      }
    }
    
    // Detect hesitations (long confidence gaps)
    const hesitations = words.filter(word => word.confidence < 0.7);
    
    return {
      fillers: fillers.length,
      repetitions: disfluencyPatterns.repetitions.length,
      hesitations: hesitations,
      rate: (fillers.length + disfluencyPatterns.repetitions.length) / words.length,
      severity: this.categorizeDisfluency(fillers.length, disfluencyPatterns.repetitions.length, words.length)
    };
  }

  // PRONUNCIATION ACCURACY ANALYSIS
  analyzePronunciation(words) {
    // Stroke-sensitive phonemes and word patterns
    const strokeSensitiveSounds = {
      'r': ['right', 'round', 'red', 'three', 'tree'],
      'l': ['left', 'light', 'blue', 'slow'],
      'th': ['think', 'thought', 'through', 'the'],
      'complex': ['articulation', 'coordination', 'concentration', 'constitution']
    };
    
    let totalAccuracy = 0;
    let difficultWordsFound = 0;
    const pronunciationIssues = [];
    
    words.forEach(word => {
      if (word.confidence < 0.8) {
        // Check if it's a stroke-sensitive word
        const lowerText = word.text.toLowerCase();
        for (const [sound, wordList] of Object.entries(strokeSensitiveSounds)) {
          if (wordList.includes(lowerText)) {
            pronunciationIssues.push({
              word: word.text,
              sound,
              confidence: word.confidence,
              severity: word.confidence < 0.5 ? 'severe' : word.confidence < 0.7 ? 'moderate' : 'mild'
            });
            difficultWordsFound++;
            break;
          }
        }
      }
      totalAccuracy += word.confidence;
    });
    
    return {
      accuracy: words.length ? totalAccuracy / words.length : 0,
      strokeSensitiveIssues: pronunciationIssues,
      difficultWordAccuracy: difficultWordsFound ? 
        pronunciationIssues.reduce((sum, issue) => sum + issue.confidence, 0) / difficultWordsFound : 1
    };
  }

  // SPEECH RATE CALCULATION
  calculateSpeechRate(words, sentences) {
    if (!words.length) return { wordsPerMinute: 0, syllablesPerMinute: 0 };
    
    const duration = (words[words.length - 1].end - words[0].start) / 1000; // Convert to seconds
    const wordsPerMinute = (words.length / duration) * 60;
    
    // Estimate syllables (rough approximation)
    const syllables = words.reduce((count, word) => {
      return count + this.estimateSyllables(word.text);
    }, 0);
    const syllablesPerMinute = (syllables / duration) * 60;
    
    return {
      wordsPerMinute,
      syllablesPerMinute,
      totalDuration: duration,
      category: this.categorizeSpeechRate(wordsPerMinute)
    };
  }

  // ENHANCED GEMINI MEDICAL ANALYSIS
  async performAdvancedGeminiAnalysis(speechData, facialMetrics, postureMetrics, assessmentContext) {
    try {
      console.log('[AI] Starting enhanced Gemini medical analysis...');
      
      const prompt = this.createAdvancedMedicalPrompt(speechData, facialMetrics, postureMetrics, assessmentContext);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      // Parse enhanced medical analysis
      const medicalAnalysis = this.parseGeminiMedicalResponse(analysisText);
      
      console.log('[AI] Gemini medical analysis completed');
      return medicalAnalysis;
      
    } catch (error) {
      console.error('[AI] Enhanced Gemini analysis failed:', error);
      throw error;
    }
  }

  // CREATE ADVANCED MEDICAL PROMPT FOR GEMINI
  createAdvancedMedicalPrompt(speechData, facialMetrics, postureMetrics, context) {
    return `You are a specialized AI neurologist with expertise in stroke assessment. Perform a comprehensive multimodal neurological evaluation.

## COMPREHENSIVE PATIENT DATA:

### ADVANCED SPEECH ANALYSIS (AssemblyAI Enhanced):
**Transcription:** "${speechData.text}"
**Confidence:** ${speechData.confidence}%

**Speech Timing Analysis:**
- Average Pause Duration: ${speechData.speechTiming.avgPauseDuration}ms
- Long Pauses (>1s): ${speechData.speechTiming.longPauses.length}
- Pause Rate: ${speechData.speechTiming.pauseRate.toFixed(3)}

**Disfluency Analysis:**
- Filler Words: ${speechData.disfluencies.fillers}
- Repetitions: ${speechData.disfluencies.repetitions}
- Hesitation Rate: ${speechData.disfluencies.rate.toFixed(3)}
- Hesitations: ${speechData.disfluencies.hesitations.length}

**Pronunciation Assessment:**
- Overall Accuracy: ${speechData.pronunciation.accuracy.toFixed(3)}
- Stroke-Sensitive Issues: ${speechData.pronunciation.strokeSensitiveIssues.length}
- Difficult Word Accuracy: ${speechData.pronunciation.difficultWordAccuracy.toFixed(3)}

**Speech Rate Analysis:**
- Words Per Minute: ${speechData.speechRate.wordsPerMinute.toFixed(1)}
- Category: ${speechData.speechRate.category}
- Total Duration: ${speechData.speechRate.totalDuration.toFixed(2)}s

**Medical Entity Recognition:**
${speechData.medicalEntities.map(entity => `- ${entity.text} (${entity.entity_type})`).join('\n')}

**Emotional State:** ${speechData.emotionalState ? JSON.stringify(speechData.emotionalState) : 'Not available'}

### FACIAL ANALYSIS (Computer Vision):
${facialMetrics ? `
- Overall Asymmetry: ${facialMetrics.overallAsymmetry?.toFixed(4)} (Normal: <0.05)
- Eye Asymmetry: ${facialMetrics.eyeAsymmetry?.toFixed(4)}
- Mouth Asymmetry: ${facialMetrics.mouthAsymmetry?.toFixed(4)}
- Eyebrow Asymmetry: ${facialMetrics.eyebrowAsymmetry?.toFixed(4)}
- Confidence Score: ${facialMetrics.confidenceScore?.toFixed(3)}
` : 'Facial analysis not available'}

### POSTURAL ANALYSIS (Movement Detection):
${postureMetrics ? `
- Shoulder Imbalance: ${postureMetrics.shoulderImbalance?.toFixed(4)}
- Postural Stability: ${postureMetrics.posturalStability?.toFixed(3)}
- Coordination Score: ${postureMetrics.coordinationScore?.toFixed(3)}
- Balance Score: ${postureMetrics.balanceScore?.toFixed(3)}
` : 'Postural analysis not available'}

### ASSESSMENT CONTEXT:
- Type: ${context.type || 'Comprehensive neurological screening'}
- Duration: ${context.duration || 'Standard assessment'}
- Patient Demographics: ${context.demographics || 'Not specified'}

## CLINICAL ANALYSIS PROTOCOL:

### 1. STROKE RISK STRATIFICATION (NIHSS-informed):
Analyze using established stroke assessment criteria:
- **Speech/Language (NIHSS 9):** Aphasia indicators
- **Facial Palsy (NIHSS 4):** Asymmetry correlations
- **Motor Function:** Coordination and balance issues
- **Overall Severity:** Integrated risk assessment

### 2. TERRITORIAL LOCALIZATION:
Based on symptom patterns, assess likely vascular territories:
- **Anterior Circulation:** MCA, ACA involvement indicators
- **Posterior Circulation:** Vertebrobasilar system indicators
- **Lacunar:** Small vessel disease patterns

### 3. URGENCY CLASSIFICATION:
- **CRITICAL:** Immediate medical attention required
- **URGENT:** Assessment within 24 hours
- **MODERATE:** Follow-up within 1 week
- **LOW:** Routine monitoring

### 4. DIFFERENTIAL DIAGNOSIS:
Consider alternative explanations for findings:
- Fatigue, anxiety, medication effects
- Age-related changes
- Other neurological conditions

## RESPONSE FORMAT (JSON):
{
  "strokeRiskAssessment": {
    "overallRisk": "low|moderate|high|critical",
    "riskScore": [0-100],
    "nihssEquivalent": [0-42],
    "confidence": [0-100]
  },
  "territorialAnalysis": {
    "anteriorCirculation": [0-100],
    "posteriorCirculation": [0-100],
    "lacunar": [0-100],
    "mostLikely": "anterior|posterior|lacunar|none"
  },
  "clinicalFindings": {
    "speechLanguage": {
      "dysarthria": "none|mild|moderate|severe",
      "aphasia": "none|mild|moderate|severe",
      "apraxia": "none|mild|moderate|severe",
      "details": ["specific findings"]
    },
    "facialFunction": {
      "asymmetry": "none|mild|moderate|severe",
      "weakness": "none|unilateral|bilateral",
      "details": ["specific findings"]
    },
    "motorFunction": {
      "coordination": "normal|impaired",
      "balance": "normal|impaired",
      "details": ["specific findings"]
    }
  },
  "multimodalCorrelation": {
    "consistency": [0-100],
    "primaryIndicators": ["list of main concerns"],
    "supportingEvidence": ["corroborating findings"]
  },
  "recommendations": {
    "urgency": "critical|urgent|moderate|routine",
    "nextSteps": ["specific recommendations"],
    "followUp": "timeframe and type",
    "redFlags": ["warning signs to watch"]
  },
  "medicalSummary": "Comprehensive clinical assessment summary for healthcare provider",
  "patientSummary": "Patient-friendly explanation of findings"
}

Provide ONLY the JSON response with comprehensive neurological analysis.`;
  }

  // Helper methods
  categorizeDisfluency(fillers, repetitions, totalWords) {
    const rate = (fillers + repetitions) / totalWords;
    if (rate > 0.15) return 'severe';
    if (rate > 0.08) return 'moderate';
    if (rate > 0.03) return 'mild';
    return 'normal';
  }

  categorizeSpeechRate(wpm) {
    if (wpm < 100) return 'very slow';
    if (wpm < 140) return 'slow';
    if (wpm < 180) return 'normal';
    if (wpm < 220) return 'fast';
    return 'very fast';
  }

  estimateSyllables(word) {
    // Simple syllable estimation
    return Math.max(1, word.toLowerCase().replace(/[^aeiou]/g, '').length);
  }

  parseGeminiMedicalResponse(responseText) {
    try {
      let jsonStr = responseText.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n|```\n|```/g, '');
      }
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        strokeRiskAssessment: { overallRisk: 'moderate', riskScore: 50, confidence: 30 },
        error: 'Response parsing failed'
      };
    }
  }
}

module.exports = EnhancedAIAnalyzer; 