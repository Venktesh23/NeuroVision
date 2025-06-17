// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AssemblyAI } = require('assemblyai');
const mongoService = require('./services/mongoService');
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');
const AIOrchestrator = require('./ai-orchestrator');
const EnhancedAIAnalyzer = require('./enhanced-ai-endpoints');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/neurovision';
const DB_NAME = process.env.DB_NAME || 'neurovision';

// Initialize Google Generative AI
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
let genAI = null;

if (GOOGLE_AI_API_KEY && GOOGLE_AI_API_KEY !== 'your_google_ai_api_key_here') {
  genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
  console.log('[INFO] Google AI initialized successfully');
} else {
  console.warn('[WARN] Google AI API key not configured. Speech analysis features will be disabled.');
}

// Initialize AssemblyAI
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
let assemblyai = null;

if (ASSEMBLYAI_API_KEY && ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here') {
  assemblyai = new AssemblyAI({
    apiKey: ASSEMBLYAI_API_KEY
  });
  console.log('[INFO] AssemblyAI initialized successfully');
} else {
  console.warn('[WARN] AssemblyAI API key not configured. Audio transcription features will be disabled.');
}

// Initialize AI Orchestrator and Enhanced AI Analyzer
const aiOrchestrator = new AIOrchestrator();
let enhancedAI = null;

if (GOOGLE_AI_API_KEY && ASSEMBLYAI_API_KEY) {
  enhancedAI = new EnhancedAIAnalyzer();
  console.log('[INFO] Enhanced AI Analyzer initialized with full capabilities');
} else {
  console.warn('[WARN] Enhanced AI features require both Google AI and AssemblyAI API keys');
}

// Initialize MongoDB connection
let dbConnected = false;

async function connectToDatabase() {
  try {
    if (MONGODB_URI && MONGODB_URI !== 'your_mongodb_connection_string_here') {
      await mongoService.connect(MONGODB_URI, DB_NAME);
      dbConnected = true;
      console.log('[INFO] MongoDB connection successful');
    } else {
      console.warn('[WARN] MongoDB URI not configured. Using fallback mode (data will not persist).');
      dbConnected = false;
    }
  } catch (error) {
    console.error('[ERROR] MongoDB connection failed:', error.message);
    console.warn('[WARN] Continuing without database. Data will not persist.');
    dbConnected = false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Add authentication routes BEFORE static file serving
app.use('/api/auth', authRoutes);

// API endpoints
app.get('/api/health', async (req, res) => {
  try {
    let dbHealth = { connected: false, status: 'disconnected' };
    
    if (dbConnected && mongoService.isConnectionActive()) {
      dbHealth = await mongoService.getHealthStatus();
    }
    
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      services: {
        googleAI: !!genAI,
        assemblyAI: !!assemblyai,
        mongodb: dbConnected
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Save assessment data
app.post('/api/assessments', authenticateToken, async (req, res) => {
  try {
    const { asymmetryMetrics, postureMetrics, speechMetrics, riskLevel, timestamp } = req.body;
    
    if (!asymmetryMetrics || !postureMetrics || !riskLevel) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available. Assessment could not be saved.',
        fallback: {
          id: Date.now().toString(),
          message: 'Assessment processed but not saved (database unavailable)'
        }
      });
    }
    
    const assessmentData = {
      asymmetryMetrics,
      postureMetrics,
      speechMetrics: speechMetrics || {},
      riskLevel,
      timestamp: timestamp || new Date().toISOString()
    };
    
    const result = await mongoService.saveAssessment(assessmentData, req.user.userId);
    
    res.status(201).json({ 
      id: result.id, 
      message: 'Assessment saved successfully',
      timestamp: assessmentData.timestamp
    });
  } catch (error) {
    console.error('[ERROR] Failed to save assessment:', error);
    res.status(500).json({ error: 'Failed to save assessment', details: error.message });
  }
});

// Get recent assessments
app.get('/api/assessments/recent', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: []
      });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const recentAssessments = await mongoService.getRecentAssessments(limit);
    
    res.json(recentAssessments);
  } catch (error) {
    console.error('[ERROR] Failed to fetch recent assessments:', error);
    res.status(500).json({ error: 'Failed to fetch recent assessments', details: error.message });
  }
});

// Get assessment statistics
app.get('/api/assessments/stats', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: {
          totalAssessments: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0
        }
      });
    }
    
    const stats = await mongoService.getAssessmentStats();
    res.json(stats);
  } catch (error) {
    console.error('[ERROR] Failed to fetch assessment stats:', error);
    res.status(500).json({ error: 'Failed to fetch assessment statistics', details: error.message });
  }
});

// Get user's assessment history
app.get('/api/assessments/user-history', authenticateToken, async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: []
      });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const userAssessments = await mongoService.getUserAssessments(req.user.userId, limit);
    
    res.json(userAssessments);
  } catch (error) {
    console.error('[ERROR] Failed to fetch user assessments:', error);
    res.status(500).json({ error: 'Failed to fetch user assessments', details: error.message });
  }
});

// Serve static files - AFTER API routes to prevent conflicts
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(express.static(path.join(__dirname, 'public')));

// Enhanced multimodal assessment endpoint with maximum AI utilization
app.post('/api/enhanced-multimodal-assessment', async (req, res) => {
  try {
    console.log('[AI] Starting enhanced multimodal assessment with full AI capabilities...');
    
    const {
      facialMetrics,
      postureMetrics,
      speechMetrics,
      audioData,
      assessmentContext,
      timestamp
    } = req.body;

    if (!enhancedAI) {
      return res.status(503).json({
        error: 'Enhanced AI services not available. Please configure both Google AI and AssemblyAI API keys.',
        fallback: generateBasicFallbackResponse(facialMetrics, postureMetrics, speechMetrics)
      });
    }

    let comprehensiveResults = {
      timestamp: timestamp || new Date().toISOString(),
      processingStartTime: Date.now()
    };

    // PHASE 1: Advanced Speech Analysis with AssemblyAI (if audio provided)
    if (audioData && audioData.buffer) {
      console.log('[AI] Phase 1: Advanced AssemblyAI speech analysis...');
      try {
        const audioBuffer = Buffer.from(audioData.buffer, 'base64');
        const speechAnalysis = await enhancedAI.performAdvancedSpeechAnalysis(
          audioBuffer, 
          {
            expectedDuration: assessmentContext?.expectedDuration || 30,
            medicalTerms: assessmentContext?.medicalTerms || [],
            passageType: assessmentContext?.passageType || 'general'
          }
        );
        
        comprehensiveResults.advancedSpeechAnalysis = speechAnalysis;
        console.log('[AI] Advanced speech analysis completed');
        
      } catch (error) {
        console.error('[AI] Advanced speech analysis failed:', error);
        comprehensiveResults.speechAnalysisError = error.message;
      }
    }

    // PHASE 2: Enhanced Gemini Medical Analysis
    console.log('[AI] Phase 2: Enhanced Gemini medical analysis...');
    try {
      const speechData = comprehensiveResults.advancedSpeechAnalysis || {
        text: speechMetrics?.transcript || 'No speech data available',
        confidence: speechMetrics?.confidence || 0,
        speechTiming: { avgPauseDuration: 0, longPauses: [], pauseRate: 0 },
        disfluencies: { fillers: 0, repetitions: 0, hesitations: [], rate: 0 },
        pronunciation: { accuracy: 1, strokeSensitiveIssues: [], difficultWordAccuracy: 1 },
        speechRate: { wordsPerMinute: 150, category: 'normal', totalDuration: 0 },
        medicalEntities: [],
        emotionalState: null
      };

      const medicalAnalysis = await enhancedAI.performAdvancedGeminiAnalysis(
        speechData,
        facialMetrics,
        postureMetrics,
        {
          type: assessmentContext?.type || 'Comprehensive neurological screening',
          duration: assessmentContext?.duration || 'Standard assessment',
          demographics: assessmentContext?.demographics
        }
      );

      comprehensiveResults.advancedMedicalAnalysis = medicalAnalysis;
      console.log('[AI] Enhanced medical analysis completed');

    } catch (error) {
      console.error('[AI] Enhanced medical analysis failed:', error);
      comprehensiveResults.medicalAnalysisError = error.message;
      
      // Fallback to basic analysis
      comprehensiveResults.advancedMedicalAnalysis = generateBasicMedicalAnalysis(
        facialMetrics, postureMetrics, speechMetrics
      );
    }

    // PHASE 3: Cross-Validation and Integration
    console.log('[AI] Phase 3: Cross-validation and result integration...');
    const integratedAssessment = integrateMultimodalFindings(
      comprehensiveResults.advancedSpeechAnalysis,
      comprehensiveResults.advancedMedicalAnalysis,
      facialMetrics,
      postureMetrics
    );

    // PHASE 4: Generate Clinical Summary and Recommendations
    const clinicalSummary = generateAdvancedClinicalSummary(
      integratedAssessment,
      comprehensiveResults
    );

    // Final response with comprehensive AI analysis
    const finalResults = {
      // Core assessment results
      integratedAssessment,
      clinicalSummary,
      
      // Advanced AI analysis results
      advancedSpeechAnalysis: comprehensiveResults.advancedSpeechAnalysis,
      advancedMedicalAnalysis: comprehensiveResults.advancedMedicalAnalysis,
      
      // Enhanced recommendations
      recommendations: generateEnhancedRecommendations(integratedAssessment),
      clinicalCorrelations: extractClinicalCorrelations(integratedAssessment),
      
      // Data quality and confidence metrics
      dataQuality: {
        completeness: calculateDataCompleteness(facialMetrics, postureMetrics, speechMetrics, audioData),
        reliability: calculateReliability(comprehensiveResults),
        processingTime: Date.now() - comprehensiveResults.processingStartTime,
        aiServicesUsed: ['AssemblyAI', 'Gemini-1.5-Pro'],
        assessmentDuration: assessmentContext?.duration || 'unknown'
      },

      // System metadata
      timestamp: comprehensiveResults.timestamp,
      version: '2.0-enhanced',
      processingMode: 'full-ai-analysis'
    };

    console.log('[AI] Enhanced multimodal assessment completed successfully');
    res.json(finalResults);

  } catch (error) {
    console.error('[ERROR] Enhanced multimodal assessment failed:', error);
    res.status(500).json({
      error: 'Enhanced multimodal assessment failed',
      details: error.message,
      fallback: generateBasicFallbackResponse(req.body.facialMetrics, req.body.postureMetrics, req.body.speechMetrics)
    });
  }
});

// Advanced Audio Analysis Endpoint (Maximum AssemblyAI utilization)
app.post('/api/advanced-audio-analysis', async (req, res) => {
  try {
    const { audioBuffer, assessmentContext } = req.body;
    
    if (!enhancedAI) {
      return res.status(503).json({
        error: 'Enhanced AI services not available',
        fallback: { text: 'Basic transcription unavailable', confidence: 0 }
      });
    }

    const audioData = Buffer.from(audioBuffer, 'base64');
    const speechAnalysis = await enhancedAI.performAdvancedSpeechAnalysis(audioData, assessmentContext);
    
    res.json({
      success: true,
      analysis: speechAnalysis,
      processingTime: speechAnalysis.processingTime
    });

  } catch (error) {
    console.error('[ERROR] Advanced audio analysis failed:', error);
    res.status(500).json({
      error: 'Advanced audio analysis failed',
      details: error.message
    });
  }
});

// Enhanced speech analysis with Gemini AI - supports multimodal assessment
app.post('/api/analyze-speech', async (req, res) => {
  try {
    const { 
      transcript, 
      expectedText, 
      passageMetadata,
      facialMetrics,
      postureMetrics,
      audioFeatures,
      timestamp 
    } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // Check if Google AI is available
    if (!genAI) {
      return res.status(503).json({
        error: 'Speech analysis service unavailable. Google AI API key not configured.',
        fallback: {
          coherenceScore: 50,
          slurredSpeechScore: 20,
          wordFindingScore: 30,
          overallRisk: 'unknown',
          observations: ['Speech analysis requires Google AI API key configuration']
        }
      });
    }
    
    // Configure the generative model - use the latest available model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create comprehensive multimodal prompt for stroke assessment
    const createMultimodalPrompt = () => {
      let prompt = `You are a specialized AI assistant trained in neurological assessment, specifically focusing on stroke detection through multimodal analysis. Analyze the following comprehensive data for potential stroke indicators.

## PATIENT SPEECH DATA:
**Transcript:** "${transcript}"
${expectedText ? `**Expected Text:** "${expectedText}"` : ''}

## ASSESSMENT CONTEXT:
${passageMetadata ? `
**Passage Type:** ${passageMetadata.category || 'general'} assessment
**Difficulty Level:** ${passageMetadata.difficulty || 'medium'}
**Focus Areas:** ${passageMetadata.focus ? passageMetadata.focus.join(', ') : 'general speech analysis'}
**Medical Terms:** ${passageMetadata.medicalTerms ? passageMetadata.medicalTerms.join(', ') : 'none specified'}
` : '**Assessment Type:** General speech analysis'}

## MULTIMODAL CLINICAL DATA:
${facialMetrics ? `
**Facial Asymmetry Analysis:**
- Overall Asymmetry: ${facialMetrics.overallAsymmetry?.toFixed(3) || 'N/A'}
- Eye Asymmetry: ${facialMetrics.eyeAsymmetry?.toFixed(3) || 'N/A'}
- Mouth Asymmetry: ${facialMetrics.mouthAsymmetry?.toFixed(3) || 'N/A'}
- Eyebrow Asymmetry: ${facialMetrics.eyebrowAsymmetry?.toFixed(3) || 'N/A'}
` : '**Facial Metrics:** Not available for this assessment'}

${postureMetrics ? `
**Postural Analysis:**
- Shoulder Imbalance: ${postureMetrics.shoulderImbalance?.toFixed(3) || 'N/A'}
- Postural Stability: ${postureMetrics.posturalStability?.toFixed(3) || 'N/A'}
- Coordination Score: ${postureMetrics.coordinationScore?.toFixed(3) || 'N/A'}
` : '**Postural Metrics:** Not available for this assessment'}

${audioFeatures ? `
**Audio Quality Analysis:**
- Volume Consistency: ${audioFeatures.volumeConsistency || 'N/A'}
- Speech Rate: ${audioFeatures.speechRate || 'N/A'} words/minute
- Pause Frequency: ${audioFeatures.pauseFrequency || 'N/A'}
` : ''}

## NEUROLOGICAL ASSESSMENT PROTOCOL:

### SPEECH-SPECIFIC STROKE INDICATORS:
1. **Articulation Deficits (Dysarthria):**
   - Slurred speech patterns
   - Consonant imprecision
   - Reduced speech intelligibility
   - Altered speech rhythm/prosody

2. **Language Impairments (Aphasia):**
   - Word-finding difficulties (anomia)
   - Paraphasic errors (word substitutions)
   - Reduced sentence complexity
   - Comprehension difficulties

3. **Motor Speech Control:**
   - Breath support inadequacy
   - Voice quality changes
   - Speech rate abnormalities
   - Coordination deficits

### ANALYSIS REQUIREMENTS:

**For Reading Passage Tasks:**
${expectedText ? `
- Compare actual transcript against expected text word-by-word
- Identify specific omissions, substitutions, or additions
- Assess pronunciation accuracy for neurologically sensitive sounds
- Evaluate sentence completion rates and fluency
- Note any hesitations or false starts on specific word types
` : ''}

**For Spontaneous Speech:**
- Evaluate semantic fluency and word retrieval
- Assess grammatical complexity and syntax
- Monitor for circumlocution or semantic paraphasias
- Analyze narrative coherence and organization

### CLINICAL CORRELATION:
If multimodal data is available, provide integrated analysis considering:
- Correlation between facial asymmetry and speech motor deficits
- Postural instability contributing to respiratory support for speech
- Combined neurological indicators suggesting specific stroke territories

## RESPONSE FORMAT:
Provide a comprehensive assessment in the following JSON structure:

{
  "speechAnalysis": {
    "coherenceScore": [0-100 integer],
    "articulationScore": [0-100 integer], 
    "wordFindingScore": [0-100 integer],
    "fluencyScore": [0-100 integer],
    "prosodyScore": [0-100 integer]
  },
  "strokeRiskIndicators": {
    "dysarthriaRisk": "none|mild|moderate|severe",
    "aphasiaRisk": "none|mild|moderate|severe", 
    "motorSpeechRisk": "none|mild|moderate|severe"
  },
  "multimodalCorrelation": {
    "facialSpeechCorrelation": [0-100 integer or null],
    "posturalImpact": [0-100 integer or null],
    "integratedRiskLevel": "low|moderate|high|critical"
  },
  "clinicalObservations": [
    "Specific clinical findings with detailed explanations"
  ],
  "recommendedActions": [
    "Evidence-based recommendations for further assessment or intervention"
  ],
  "overallRisk": "low|moderate|high|critical",
  "confidenceLevel": [0-100 integer]
}

## IMPORTANT GUIDELINES:
- Base assessments on established neurological assessment criteria
- Consider normal speech variations and avoid over-pathologizing
- Provide specific, actionable clinical observations
- When multimodal data is limited, acknowledge limitations in assessment
- Prioritize patient safety with appropriate urgency levels
- Use evidence-based thresholds for risk categorization

Analyze the provided data and return ONLY the JSON response with no additional text.`;

      return prompt;
    };

    // Generate content with enhanced prompt
    const result = await model.generateContent(createMultimodalPrompt());
    const response = await result.response;
    const text = response.text();
    
    try {
      // Extract and parse JSON response
      let jsonStr = text.trim();
      
      // Remove code block formatting if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n|```\n|```/g, '');
      }
      
      // Parse the enhanced response
      const analysisData = JSON.parse(jsonStr);
      
      // Ensure backward compatibility with existing frontend
      const compatibleResponse = {
        // Legacy fields for backward compatibility
        coherenceScore: analysisData.speechAnalysis?.coherenceScore || 0,
        slurredSpeechScore: analysisData.speechAnalysis?.articulationScore || 0,
        wordFindingScore: analysisData.speechAnalysis?.wordFindingScore || 0,
        overallRisk: analysisData.overallRisk || 'unknown',
        observations: analysisData.clinicalObservations || [],
        
        // Enhanced analysis data
        enhancedAnalysis: {
          speechAnalysis: analysisData.speechAnalysis || {},
          strokeRiskIndicators: analysisData.strokeRiskIndicators || {},
          multimodalCorrelation: analysisData.multimodalCorrelation || {},
          recommendedActions: analysisData.recommendedActions || [],
          confidenceLevel: analysisData.confidenceLevel || 0
        },
        
        // Assessment metadata
        metadata: {
          timestamp: timestamp || new Date().toISOString(),
          passageMetadata: passageMetadata || null,
          multimodalDataAvailable: !!(facialMetrics || postureMetrics),
          assessmentType: expectedText ? 'structured_reading' : 'spontaneous_speech'
        }
      };
      
      // Save the enhanced analysis to the database
      if (dbConnected) {
        const speechAnalysis = {
          transcript,
          expectedText: expectedText || null,
          passageMetadata: passageMetadata || null,
          facialMetrics: facialMetrics || null,
          postureMetrics: postureMetrics || null,
          audioFeatures: audioFeatures || null,
          ...compatibleResponse,
          timestamp: new Date().toISOString()
        };
        
        await mongoService.saveSpeechAnalysis(speechAnalysis);
      }
      
      res.json(compatibleResponse);
      
    } catch (jsonError) {
      console.error('[ERROR] Failed to parse enhanced AI response:', jsonError);
      console.error('[ERROR] Raw response:', text);
      
      // Fallback to basic analysis if enhanced parsing fails
      const fallbackResponse = {
        coherenceScore: 75,
        slurredSpeechScore: 20,
        wordFindingScore: 80,
        overallRisk: 'moderate',
        observations: [
          'Enhanced AI analysis temporarily unavailable',
          'Basic speech assessment completed',
          'Recommend clinical evaluation for comprehensive assessment'
        ],
        metadata: {
          timestamp: timestamp || new Date().toISOString(),
          fallbackMode: true
        }
      };
      
      res.json(fallbackResponse);
    }
    
  } catch (error) {
    console.error('[ERROR] Failed to analyze speech:', error);
    res.status(500).json({ 
      error: 'Failed to analyze speech', 
      details: error.message,
      fallback: {
        coherenceScore: 50,
        slurredSpeechScore: 30,
        wordFindingScore: 60,
        overallRisk: 'unknown',
        observations: ['Speech analysis failed - please try again']
      }
    });
  }
});

// Helper Functions for Enhanced AI Integration

function integrateMultimodalFindings(speechAnalysis, medicalAnalysis, facialMetrics, postureMetrics) {
  const strokeRisk = medicalAnalysis?.strokeRiskAssessment || { overallRisk: 'low', riskScore: 20 };
  
  return {
    strokeProbability: strokeRisk.riskScore,
    integratedRisk: strokeRisk.overallRisk,
    nihssEquivalentScore: strokeRisk.nihssEquivalent || 0,
    
    // Multimodal correlations
    facialSpeechCorrelation: calculateFacialSpeechCorrelation(facialMetrics, speechAnalysis),
    postureCoordinationScore: calculatePostureCoordination(postureMetrics, speechAnalysis),
    
    // Territorial analysis
    territoryLikelihood: medicalAnalysis?.territorialAnalysis || {
      anteriorCirculation: 20,
      posteriorCirculation: 10,
      lacunar: 5
    },
    
    // Clinical findings summary
    clinicalFindings: medicalAnalysis?.clinicalFindings || {},
    
    // Urgency and recommendations
    urgencyLevel: medicalAnalysis?.recommendations?.urgency || 'routine',
    confidence: strokeRisk.confidence || 70
  };
}

function generateAdvancedClinicalSummary(integratedAssessment, comprehensiveResults) {
  return {
    overallAssessment: `Comprehensive multimodal neurological assessment completed using advanced AI analysis. Stroke probability: ${integratedAssessment.strokeProbability}%`,
    
    keyFindings: [
      `Integrated risk level: ${integratedAssessment.integratedRisk}`,
      `NIHSS equivalent score: ${integratedAssessment.nihssEquivalentScore}`,
      `Urgency classification: ${integratedAssessment.urgencyLevel}`
    ],
    
    speechAnalysisSummary: comprehensiveResults.advancedSpeechAnalysis ? 
      generateSpeechSummary(comprehensiveResults.advancedSpeechAnalysis) :
      'Speech analysis not available',
      
    medicalCorrelations: comprehensiveResults.advancedMedicalAnalysis?.medicalSummary ||
      'Medical correlation analysis not available',
      
    patientFriendlySummary: comprehensiveResults.advancedMedicalAnalysis?.patientSummary ||
      generateBasicPatientSummary(integratedAssessment)
  };
}

function generateSpeechSummary(speechAnalysis) {
  const timing = speechAnalysis.speechTiming;
  const disfluencies = speechAnalysis.disfluencies;
  const rate = speechAnalysis.speechRate;
  
  return `Speech analysis: ${rate.category} speech rate (${rate.wordsPerMinute.toFixed(1)} WPM), ` +
         `${timing.longPauses.length} significant pauses, ` +
         `${disfluencies.severity} disfluency level, ` +
         `${(speechAnalysis.pronunciation.accuracy * 100).toFixed(1)}% pronunciation accuracy`;
}

function calculateFacialSpeechCorrelation(facialMetrics, speechAnalysis) {
  if (!facialMetrics || !speechAnalysis) return 0;
  
  const facialAsymmetry = facialMetrics.overallAsymmetry || 0;
  const speechAccuracy = speechAnalysis.pronunciation?.accuracy || 1;
  
  // Higher facial asymmetry correlating with lower speech accuracy indicates stronger correlation
  const correlation = facialAsymmetry > 0.05 && speechAccuracy < 0.8 ? 
    Math.min(85, (facialAsymmetry * 1000) + ((1 - speechAccuracy) * 100)) : 
    Math.max(15, 40 - (facialAsymmetry * 500));
    
  return Math.round(correlation);
}

function calculatePostureCoordination(postureMetrics, speechAnalysis) {
  if (!postureMetrics || !speechAnalysis) return 50;
  
  const shoulderBalance = 1 - (postureMetrics.shoulderImbalance || 0);
  const speechTiming = speechAnalysis.speechTiming?.pauseRate || 0;
  
  return Math.round((shoulderBalance * 70) + Math.max(0, 30 - (speechTiming * 100)));
}

function calculateDataCompleteness(facialMetrics, postureMetrics, speechMetrics, audioData) {
  let completeness = 0;
  if (facialMetrics) completeness += 30;
  if (postureMetrics) completeness += 30;
  if (speechMetrics) completeness += 20;
  if (audioData) completeness += 20;
  return completeness;
}

function calculateReliability(results) {
  let reliability = 50; // Base reliability
  
  if (results.advancedSpeechAnalysis) reliability += 25;
  if (results.advancedMedicalAnalysis) reliability += 25;
  if (!results.speechAnalysisError && !results.medicalAnalysisError) reliability += 10;
  
  return Math.min(100, reliability);
}

function generateBasicFallbackResponse(facialMetrics, postureMetrics, speechMetrics) {
  return {
    integratedAssessment: {
      strokeProbability: 25,
      integratedRisk: 'low',
      nihssEquivalentScore: 1
    },
    recommendations: ['Enhanced AI analysis unavailable - basic assessment only'],
    clinicalCorrelations: ['Limited analysis due to AI service unavailability'],
    dataQuality: { completeness: 30, reliability: 40 }
  };
}

function generateBasicMedicalAnalysis(facialMetrics, postureMetrics, speechMetrics) {
  const riskScore = calculateBasicRiskScore(facialMetrics, postureMetrics, speechMetrics);
  
  return {
    strokeRiskAssessment: {
      overallRisk: riskScore > 60 ? 'high' : riskScore > 30 ? 'moderate' : 'low',
      riskScore,
      confidence: 60
    },
    recommendations: {
      urgency: riskScore > 60 ? 'urgent' : 'routine',
      nextSteps: ['Basic assessment completed - enhanced analysis unavailable']
    },
    medicalSummary: `Basic risk assessment: ${riskScore}% risk score`,
    patientSummary: 'Basic assessment completed with limited AI analysis'
  };
}

function calculateBasicRiskScore(facialMetrics, postureMetrics, speechMetrics) {
  let score = 10; // Base score
  
  if (facialMetrics?.overallAsymmetry > 0.08) score += 25;
  if (postureMetrics?.shoulderImbalance > 0.1) score += 20;
  if (speechMetrics?.overallRisk === 'high') score += 30;
  
  return Math.min(100, score);
}

function extractClinicalCorrelations(assessment) {
  const correlations = [];
  
  if (assessment.strokeProbability > 50) {
    correlations.push('Elevated stroke probability requires medical attention');
  }
  
  if (assessment.facialSpeechCorrelation > 70) {
    correlations.push('Strong correlation between facial asymmetry and speech difficulties');
  }
  
  if (assessment.urgencyLevel === 'urgent' || assessment.urgencyLevel === 'critical') {
    correlations.push('Urgent medical evaluation recommended based on integrated findings');
  }
  
  return correlations;
}

function generateBasicPatientSummary(assessment) {
  return `Your assessment shows a ${assessment.integratedRisk} risk level with ${assessment.strokeProbability}% stroke probability. ` +
         `This assessment recommends ${assessment.urgencyLevel} follow-up.`;
}

// Transcribe audio with AssemblyAI
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'Missing audio URL' });
    }
    
    // Check if AssemblyAI is available
    if (!assemblyai) {
      return res.status(503).json({ 
        error: 'Audio transcription service unavailable. AssemblyAI API key not configured.' 
      });
    }
    
    // Create transcription request with AssemblyAI
    const transcript = await assemblyai.transcripts.transcribe({
      audio: audioUrl,
      language_code: 'en',
    });
    
    res.json({ 
      transcript: transcript.text,
      status: 'completed'
    });
    
  } catch (error) {
    console.error('[ERROR] Failed to transcribe audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
  }
});

// Upload audio to AssemblyAI
app.post('/api/upload-audio', express.raw({ type: 'audio/*', limit: '50mb' }), async (req, res) => {
  try {
    // Check if AssemblyAI is available
    if (!assemblyai) {
      return res.status(503).json({ 
        error: 'Audio upload service unavailable. AssemblyAI API key not configured.' 
      });
    }
    
    // Upload the audio data to AssemblyAI
    const uploadResponse = await assemblyai.files.upload(req.body, {
      // You can provide optional parameters here if needed
      // data_format: 'wav',
    });
    
    // Return the URL of the uploaded audio file
    res.json({ 
      upload_url: uploadResponse.url 
    });
    
  } catch (error) {
    console.error('[ERROR] Failed to upload audio:', error);
    res.status(500).json({ error: 'Failed to upload audio', details: error.message });
  }
});

// Get recent speech analyses
app.get('/api/speech-analyses/recent', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: []
      });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const recentAnalyses = await mongoService.getRecentSpeechAnalyses(limit);
    
    res.json(recentAnalyses);
  } catch (error) {
    console.error('[ERROR] Failed to fetch recent speech analyses:', error);
    res.status(500).json({ error: 'Failed to fetch recent speech analyses', details: error.message });
  }
});

// Get speech analysis statistics
app.get('/api/speech-analyses/stats', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: {
          totalSpeechAnalyses: 0,
          avgCoherenceScore: 0,
          avgSlurredSpeechScore: 0,
          avgWordFindingScore: 0
        }
      });
    }
    
    const stats = await mongoService.getSpeechAnalysisStats();
    res.json(stats);
  } catch (error) {
    console.error('[ERROR] Failed to fetch speech analysis stats:', error);
    res.status(500).json({ error: 'Failed to fetch speech analysis statistics', details: error.message });
  }
});

// User Profile and History Routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: null
      });
    }
    
    const userProfile = await mongoService.getUserProfile(req.user.userId);
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    res.json(userProfile);
  } catch (error) {
    console.error('[ERROR] Failed to get user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile', details: error.message });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { name, dateOfBirth, gender, medicalHistory, emergencyContact } = req.body;
    
    const profileData = {
      name,
      dateOfBirth,
      gender,
      medicalHistory,
      emergencyContact
    };
    
    // Remove undefined fields
    Object.keys(profileData).forEach(key => 
      profileData[key] === undefined && delete profileData[key]
    );
    
    const updated = await mongoService.updateUserProfile(req.user.userId, profileData);
    
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('[ERROR] Failed to update user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile', details: error.message });
  }
});

app.get('/api/users/history', authenticateToken, async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: { data: [], pagination: { page: 1, totalPages: 0, totalItems: 0 } }
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const history = await mongoService.getUserHistory(req.user.userId, page, limit);
    
    res.json(history);
  } catch (error) {
    console.error('[ERROR] Failed to get user history:', error);
    res.status(500).json({ error: 'Failed to get user history', details: error.message });
  }
});

app.get('/api/users/statistics', authenticateToken, async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: {
          totalAssessments: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
          riskTrend: 'stable'
        }
      });
    }
    
    const stats = await mongoService.getUserAssessmentStats(req.user.userId);
    
    res.json(stats);
  } catch (error) {
    console.error('[ERROR] Failed to get user statistics:', error);
    res.status(500).json({ error: 'Failed to get user statistics', details: error.message });
  }
});

// Get recent integrated assessments
app.get('/api/integrated-assessments/recent', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: []
      });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const recentAssessments = await mongoService.getRecentIntegratedAssessments(limit);
    
    res.json(recentAssessments);
  } catch (error) {
    console.error('[ERROR] Failed to fetch recent integrated assessments:', error);
    res.status(500).json({ error: 'Failed to fetch recent integrated assessments', details: error.message });
  }
});

// Enhanced AI-powered speech analysis with multiple AI services
app.post('/api/ai-enhanced-speech', async (req, res) => {
  try {
    const { audioData, options = {} } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ 
        error: 'Audio data is required',
        fallback: {
          confidence: 0,
          analysis: 'No audio data provided'
        }
      });
    }

    console.log('[AI-ENHANCED] Starting multi-AI speech analysis...');
    
    // Use AI orchestrator for comprehensive analysis
    const enhancedResults = await aiOrchestrator.enhancedSpeechAnalysis(audioData, {
      expectedText: options.expectedText,
      patientAge: options.patientAge,
      patientGender: options.patientGender,
      medicalHistory: options.medicalHistory,
      language: options.language || 'en'
    });
    
    // Enhanced response with multiple AI insights
    const response = {
      // Core analysis results
      transcription: enhancedResults.transcription,
      medicalAnalysis: enhancedResults.medicalAnalysis,
      
      // Quality and confidence metrics
      qualityMetrics: enhancedResults.qualityMetrics,
      overallConfidence: enhancedResults.confidence,
      
      // Cross-validation from multiple AIs
      crossValidation: enhancedResults.crossValidation,
      
      // Service information
      aiServicesUsed: enhancedResults.services,
      analysisTimestamp: new Date().toISOString(),
      
      // Enhanced clinical insights
      clinicalSummary: generateClinicalSummary(enhancedResults),
      riskAssessment: calculateEnhancedRiskLevel(enhancedResults),
      recommendations: generateEnhancedRecommendations(enhancedResults)
    };
    
    // Save enhanced analysis to database
    if (dbConnected) {
      try {
        await mongoService.saveEnhancedAnalysis({
          type: 'ai-enhanced-speech',
          ...response,
          userId: req.user?.userId || null
        });
      } catch (dbError) {
        console.warn('[AI-ENHANCED] Failed to save to database:', dbError.message);
      }
    }
    
    console.log(`[AI-ENHANCED] Analysis complete using ${enhancedResults.services.length} AI services`);
    res.json(response);
    
  } catch (error) {
    console.error('[AI-ENHANCED] Enhanced speech analysis failed:', error);
    res.status(500).json({
      error: 'Enhanced AI analysis failed',
      details: error.message,
      fallback: {
        confidence: 30,
        analysis: 'AI orchestration temporarily unavailable',
        recommendation: 'Please try standard analysis or consult healthcare provider'
      }
    });
  }
});

// AI orchestrator health check endpoint
app.get('/api/ai-health', async (req, res) => {
  try {
    const healthStatus = await aiOrchestrator.healthCheck();
    
    const enhancedHealthStatus = {
      ...healthStatus,
      overallStatus: calculateOverallAIHealth(healthStatus),
      capabilities: {
        speechAnalysis: healthStatus.services.gemini?.available && healthStatus.services.assemblyai?.available,
        crossValidation: healthStatus.services.openai?.available,
        enhancedTranscription: healthStatus.services.assemblyai?.available,
        medicalAnalysis: healthStatus.services.gemini?.available
      },
      recommendations: generateHealthRecommendations(healthStatus)
    };
    
    res.json(enhancedHealthStatus);
    
  } catch (error) {
    console.error('[AI-HEALTH] Health check failed:', error);
    res.status(500).json({
      error: 'AI health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions for enhanced AI responses
function generateClinicalSummary(results) {
  const summary = {
    overallAssessment: 'Comprehensive AI analysis completed',
    keyFindings: [],
    clinicalSignificance: 'Moderate',
    confidence: results.confidence || 50
  };
  
  if (results.medicalAnalysis?.clinicalObservations) {
    summary.keyFindings = results.medicalAnalysis.clinicalObservations;
  }
  
  if (results.crossValidation) {
    summary.validationNotes = 'Cross-validated with multiple AI systems';
  }
  
  return summary;
}

function calculateEnhancedRiskLevel(results) {
  let riskScore = 0;
  let factors = [];
  
  // Assess based on medical analysis
  if (results.medicalAnalysis?.strokeIndicators) {
    const indicators = results.medicalAnalysis.strokeIndicators;
    if (indicators.overallSpeechRisk === 'high' || indicators.overallSpeechRisk === 'critical') {
      riskScore += 40;
      factors.push('High speech risk detected');
    }
  }
  
  // Consider confidence levels
  if (results.confidence < 50) {
    riskScore += 20;
    factors.push('Low confidence in analysis');
  }
  
  // Cross-validation impact
  if (results.crossValidation) {
    riskScore -= 10; // More reliable with validation
    factors.push('Cross-validated results');
  }
  
  return {
    score: Math.min(riskScore, 100),
    level: riskScore > 70 ? 'high' : riskScore > 40 ? 'moderate' : 'low',
    factors
  };
}

function generateEnhancedRecommendations(results) {
  const recommendations = [];
  
  if (results.medicalAnalysis?.recommendedActions) {
    recommendations.push(...results.medicalAnalysis.recommendedActions);
  }
  
  if (results.confidence < 70) {
    recommendations.push('Consider repeating assessment for higher confidence');
  }
  
  if (results.crossValidation) {
    recommendations.push('Analysis validated across multiple AI systems');
  } else {
    recommendations.push('Single AI system used - consider enabling cross-validation');
  }
  
  return recommendations;
}

function calculateOverallAIHealth(healthStatus) {
  const services = Object.values(healthStatus.services);
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const totalCount = services.length;
  
  const healthPercentage = (healthyCount / totalCount) * 100;
  
  if (healthPercentage >= 80) return 'excellent';
  if (healthPercentage >= 60) return 'good';
  if (healthPercentage >= 40) return 'fair';
  return 'poor';
}

function generateHealthRecommendations(healthStatus) {
  const recommendations = [];
  
  Object.entries(healthStatus.services).forEach(([service, status]) => {
    if (status.status === 'unavailable') {
      recommendations.push(`Configure ${service} API key for enhanced ${service} capabilities`);
    } else if (status.status === 'error') {
      recommendations.push(`Check ${service} API configuration - ${status.error}`);
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push('All AI services are healthy and operational');
  }
  
  return recommendations;
}

// Get enhanced speech analyses
app.get('/api/speech-analyses/enhanced', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(503).json({ 
        error: 'Database not available',
        fallback: []
      });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const enhancedAnalyses = await mongoService.getEnhancedSpeechAnalyses(limit);
    
    res.json(enhancedAnalyses);
  } catch (error) {
    console.error('[ERROR] Failed to fetch enhanced speech analyses:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced speech analyses', details: error.message });
  }
});

// Development endpoint to clear all data
if (process.env.NODE_ENV === 'development') {
  app.post('/api/dev/clear-data', async (req, res) => {
    try {
      if (!dbConnected) {
        return res.status(503).json({ error: 'Database not available' });
      }
      
      await mongoService.clearAllData();
      res.json({ message: 'All data cleared successfully' });
    } catch (error) {
      console.error('[ERROR] Failed to clear data:', error);
      res.status(500).json({ error: 'Failed to clear data', details: error.message });
    }
  });
}

// Serve the static files from React app for any other routes
app.get('*', (req, res) => {
  // Try to serve the React build first, then fall back to public folder
  const reactBuildPath = path.join(__dirname, '../client/build', 'index.html');
  const publicPath = path.join(__dirname, 'public', 'index.html');
  
  // Check if React build exists, otherwise serve from public
  if (fs.existsSync(reactBuildPath)) {
    res.sendFile(reactBuildPath);
  } else {
    res.sendFile(publicPath);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[INFO] Shutting down NeuroVision server...');
  
  if (dbConnected) {
    await mongoService.disconnect();
  }
  
  process.exit(0);
});

// Start the server
async function startServer() {
  // Connect to database first
  await connectToDatabase();
  
  // Then start the HTTP server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[INFO] NeuroVision Server running on http://0.0.0.0:${PORT}`);
    console.log(`[INFO] React Client proxy target: http://localhost:${PORT}`);
    console.log('\n[STATUS] Service Status:');
    console.log(`   ${genAI ? '[ACTIVE]' : '[INACTIVE]'} Core Features: Facial & Posture Detection`);
    console.log(`   ${genAI ? '[ACTIVE]' : '[INACTIVE]'} Speech Analysis: ${genAI ? 'Available' : 'Disabled (API key needed)'}`);
    console.log(`   ${assemblyai ? '[ACTIVE]' : '[INACTIVE]'} Audio Transcription: ${assemblyai ? 'Available' : 'Disabled (API key needed)'}`);
    console.log(`   ${dbConnected ? '[ACTIVE]' : '[INACTIVE]'} MongoDB Database: ${dbConnected ? 'Connected' : 'Disconnected (URI needed)'}`);
    console.log('\n[SETUP] To enable all features:');
    console.log('   • Get Google AI key: https://makersuite.google.com/app/apikey');
    console.log('   • Get AssemblyAI key: https://www.assemblyai.com/app/account');
    console.log('   • Get MongoDB Atlas connection: https://cloud.mongodb.com');
    console.log('   • Update your .env file with the keys\n');
  });
}

// Start the server
startServer().catch(error => {
  console.error('[ERROR] Failed to start server:', error);
  process.exit(1);
});
