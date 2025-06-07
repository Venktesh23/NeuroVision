// Database connection test script
require('dotenv').config();
const mongoService = require('./services/mongoService');

async function testDatabase() {
  console.log('🧪 Testing MongoDB Connection...');
  
  // Use same logic as main server
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/neurovision';
  const DB_NAME = process.env.DB_NAME || 'NeuroVision';
  
  console.log('Environment variables:');
  console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  console.log('- MONGODB_URL:', process.env.MONGODB_URL ? 'Set' : 'Not set');
  console.log('- Using URI:', MONGODB_URI ? 'Yes' : 'No');
  console.log('- DB_NAME:', DB_NAME);
  
  try {
    console.log(`\n📦 Attempting to connect to database: "${DB_NAME}"`);
    
    await mongoService.connect(MONGODB_URI, DB_NAME);
    
    console.log('✅ Connection successful!');
    
    // Test a simple operation
    console.log('\n🧪 Testing database operations...');
    
    // Get database reference and list collections
    const db = mongoService.getDb();
    const collections = await db.listCollections().toArray();
    console.log('📋 Existing collections:', collections.map(c => c.name));
    
    // Test saving an assessment
    console.log('\n💾 Testing assessment save...');
    const testAssessment = {
      asymmetryMetrics: { eyeAsymmetry: 0.1 },
      postureMetrics: { shoulderImbalance: 0.05 },
      riskLevel: 'low'
    };
    
    const result = await mongoService.saveAssessment(testAssessment);
    console.log('✅ Assessment saved with ID:', result.id);
    
    // Test retrieving assessments
    console.log('\n📖 Testing assessment retrieval...');
    const assessments = await mongoService.getRecentAssessments(1);
    console.log('✅ Retrieved assessments:', assessments.length);
    
    // Test statistics
    console.log('\n📊 Testing statistics...');
    const stats = await mongoService.getAssessmentStats();
    console.log('✅ Statistics:', stats);
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoService.disconnect();
    process.exit(0);
  }
}

testDatabase(); 