#!/usr/bin/env node

// MongoDB Database Setup Script for NeuroVision
require('dotenv').config();
const mongoService = require('./services/mongoService');

async function setupDatabase() {
  console.log('🚀 NeuroVision Database Setup');
  console.log('================================');
  
  try {
    // Get connection details
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neurovision';
    const DB_NAME = process.env.DB_NAME || 'neurovision';
    
    console.log('\n📋 Configuration:');
    console.log(`   Database URI: ${MONGODB_URI}`);
    console.log(`   Database Name: ${DB_NAME}`);
    
    // Connect to database
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoService.connect(MONGODB_URI, DB_NAME);
    console.log('✅ Connected successfully!');
    
    // Get database reference
    const db = mongoService.getDb();
    
    // Check existing collections
    console.log('\n📊 Checking existing collections...');
    const collections = await db.listCollections().toArray();
    console.log(`   Found ${collections.length} collections:`, collections.map(c => c.name));
    
    // Create sample assessment data if collections are empty
    const assessmentsCount = await db.collection('assessments').countDocuments();
    const speechAnalysesCount = await db.collection('speechAnalyses').countDocuments();
    
    console.log(`\n📈 Data Status:`);
    console.log(`   Assessments: ${assessmentsCount} documents`);
    console.log(`   Speech Analyses: ${speechAnalysesCount} documents`);
    
    if (assessmentsCount === 0) {
      console.log('\n💾 Creating sample assessment data...');
      
      const sampleAssessments = [
        {
          asymmetryMetrics: {
            eyeAsymmetry: 0.05,
            mouthAsymmetry: 0.03,
            overallAsymmetry: 0.04
          },
          postureMetrics: {
            shoulderImbalance: 0.02,
            headTilt: 0.01
          },
          riskLevel: 'low',
          timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          asymmetryMetrics: {
            eyeAsymmetry: 0.15,
            mouthAsymmetry: 0.12,
            overallAsymmetry: 0.14
          },
          postureMetrics: {
            shoulderImbalance: 0.08,
            headTilt: 0.06
          },
          riskLevel: 'medium',
          timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        },
        {
          asymmetryMetrics: {
            eyeAsymmetry: 0.25,
            mouthAsymmetry: 0.22,
            overallAsymmetry: 0.24
          },
          postureMetrics: {
            shoulderImbalance: 0.18,
            headTilt: 0.16
          },
          riskLevel: 'high',
          timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        }
      ];
      
      for (const assessment of sampleAssessments) {
        await mongoService.saveAssessment(assessment);
      }
      console.log(`✅ Created ${sampleAssessments.length} sample assessments`);
    }
    
    if (speechAnalysesCount === 0) {
      console.log('\n🎤 Creating sample speech analysis data...');
      
      const sampleSpeechAnalyses = [
        {
          transcript: "The quick brown fox jumps over the lazy dog.",
          readingPassage: "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
          coherenceScore: 95,
          slurredSpeechScore: 10,
          wordFindingScore: 90,
          overallRisk: 'low',
          observations: ['Clear pronunciation', 'Good articulation', 'No word-finding difficulties detected'],
          timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
          transcript: "Peter Piper picked a peck of... pickled peppers.",
          readingPassage: "Peter Piper picked a peck of pickled peppers.",
          coherenceScore: 75,
          slurredSpeechScore: 25,
          wordFindingScore: 70,
          overallRisk: 'medium',
          observations: ['Slight hesitation observed', 'Some difficulty with tongue twisters', 'Mild word-finding issues'],
          timestamp: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      
      for (const analysis of sampleSpeechAnalyses) {
        await mongoService.saveSpeechAnalysis(analysis);
      }
      console.log(`✅ Created ${sampleSpeechAnalyses.length} sample speech analyses`);
    }
    
    // Verify indexes
    console.log('\n🔍 Verifying database indexes...');
    const assessmentIndexes = await db.collection('assessments').listIndexes().toArray();
    const speechIndexes = await db.collection('speechAnalyses').listIndexes().toArray();
    
    console.log(`   Assessment indexes: ${assessmentIndexes.length}`);
    console.log(`   Speech analysis indexes: ${speechIndexes.length}`);
    
    // Display final statistics
    console.log('\n📊 Final Database Statistics:');
    const finalAssessments = await db.collection('assessments').countDocuments();
    const finalSpeechAnalyses = await db.collection('speechAnalyses').countDocuments();
    
    console.log(`   📋 Assessments: ${finalAssessments} documents`);
    console.log(`   🎤 Speech Analyses: ${finalSpeechAnalyses} documents`);
    
    // Test basic operations
    console.log('\n🧪 Testing database operations...');
    
    const recentAssessments = await mongoService.getRecentAssessments(3);
    const assessmentStats = await mongoService.getAssessmentStats();
    const recentSpeechAnalyses = await mongoService.getRecentSpeechAnalyses(2);
    
    console.log(`   ✅ Recent assessments query: ${recentAssessments.length} results`);
    console.log(`   ✅ Assessment statistics: ${assessmentStats.totalAssessments} total`);
    console.log(`   ✅ Recent speech analyses: ${recentSpeechAnalyses.length} results`);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Access the app: http://localhost:3000');
    console.log('   3. API health check: http://localhost:5000/api/health');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await mongoService.disconnect();
    process.exit(0);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase; 