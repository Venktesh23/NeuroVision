// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AssemblyAI } = require('assemblyai');
const mongoService = require('./services/mongoService');

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

// Serve static files - first try the React build, then fall back to static public folder
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(express.static(path.join(__dirname, 'public')));

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
app.post('/api/assessments', async (req, res) => {
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
    
    const result = await mongoService.saveAssessment(assessmentData);
    
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

// Analyze speech using Google AI
app.post('/api/analyze-speech', async (req, res) => {
  try {
    const { transcript, readingPassage } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Missing speech transcript' });
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
    
    // Create a prompt based on whether we have a reading passage or not
    let promptText;
    
    if (readingPassage) {
      // If we have both the transcript and the reading passage, we can do a comparison
      promptText = `
      Analyze the following speech transcript for potential stroke symptoms. The person was asked to read a specific passage, so compare their speech with the expected text:
      
      Expected reading passage: "${readingPassage}"
      
      Actual transcript: "${transcript}"
      
      Focus on:
      1. Speech coherence and clarity
      2. Word-finding difficulties (missing, substituted, or incorrect words)
      3. Slurred speech patterns
      4. Pronunciation errors that could indicate stroke
      5. Sentence completion and flow
      6. Omissions or additions compared to the expected reading passage
      
      Provide an analysis with:
      - A coherence score (0-100) - how well their speech matches the expected passage
      - A slurred speech score (0-100) - indication of slurring or unclear pronunciation
      - Word finding difficulty score (0-100) - measure of word substitutions or omissions
      - Overall stroke risk based on speech (low, medium, high)
      - Key observations including specific words or phrases that show potential issues
      `;
    } else {
      // Fall back to general speech analysis if no reading passage is provided
      promptText = `
      Analyze the following speech transcript for potential stroke symptoms:
      "${transcript}"
      
      Focus on:
      1. Speech coherence and clarity
      2. Word-finding difficulties
      3. Slurred speech patterns
      4. Grammatical errors beyond normal speech
      5. Repetition or confusion
      
      Provide an analysis with:
      - A coherence score (0-100)
      - A slurred speech score (0-100)
      - Word finding difficulty score (0-100)
      - Overall stroke risk based on speech (low, medium, high)
      - Key observations
      `;
    }
    
    // Add the response format instructions
    const prompt = `${promptText}
    
    Format the response as a JSON object with these exact fields: 
    {
      "coherenceScore": number,
      "slurredSpeechScore": number,
      "wordFindingScore": number, 
      "overallRisk": "low"|"medium"|"high",
      "observations": string[]
    }
    
    Return only the JSON, no additional text.
    `;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Extract the JSON from the response text (could be wrapped in ```json or code blocks)
      let jsonStr = text.trim();
      
      // Remove code block formatting if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n|```\n|```/g, '');
      }
      
      // Parse JSON
      const analysisData = JSON.parse(jsonStr);
      
      // Save the analysis to the database if connected
      if (dbConnected) {
        const speechAnalysis = {
          transcript,
          readingPassage,
          ...analysisData,
          timestamp: new Date().toISOString()
        };
        
        await mongoService.saveSpeechAnalysis(speechAnalysis);
      }
      
      res.json(analysisData);
      
    } catch (jsonError) {
      console.error('[ERROR] Failed to parse AI response:', jsonError);
      res.status(500).json({ 
        error: 'Failed to parse speech analysis',
        rawResponse: text
      });
    }
    
  } catch (error) {
    console.error('[ERROR] Failed to analyze speech:', error);
    res.status(500).json({ error: 'Failed to analyze speech', details: error.message });
  }
});

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
