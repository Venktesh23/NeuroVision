const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

class MongoService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  // Initialize MongoDB connection
  async connect(connectionString, dbName = 'neurovision') {
    try {
      console.log('[INFO] Connecting to MongoDB...');
      
      this.client = new MongoClient(connectionString);
      
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      
      console.log('[INFO] MongoDB connected successfully');
      console.log(`[INFO] Database: ${dbName}`);
      
      // Create indexes for better performance
      await this.createIndexes();
      
      return this.db;
    } catch (error) {
      console.error('[ERROR] MongoDB connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  // Create database indexes
  async createIndexes() {
    try {
      // Create index on assessments collection
      await this.db.collection('assessments').createIndex({ timestamp: -1 });
      await this.db.collection('assessments').createIndex({ riskLevel: 1 });
      
      // Create index on speech analyses collection
      await this.db.collection('speechAnalyses').createIndex({ timestamp: -1 });
      await this.db.collection('speechAnalyses').createIndex({ overallRisk: 1 });
      
      console.log('[INFO] Database indexes created');
    } catch (error) {
      console.warn('[WARN] Index creation warning:', error.message);
    }
  }

  // Close MongoDB connection
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('[INFO] MongoDB disconnected');
    }
  }

  // Check if connected
  isConnectionActive() {
    return this.isConnected && this.client;
  }

  // Get database reference
  getDb() {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB not connected');
    }
    return this.db;
  }

  // ASSESSMENT OPERATIONS
  
  // Save a new assessment
  async saveAssessment(assessmentData, userId = null) {
    try {
      const collection = this.getDb().collection('assessments');
      
      const assessmentWithUser = {
        ...assessmentData,
        userId: userId ? new ObjectId(userId) : null,
        createdAt: assessmentData.timestamp || new Date().toISOString()
      };
      
      const result = await collection.insertOne(assessmentWithUser);
      console.log('[INFO] Assessment saved:', assessmentWithUser._id);
      
      return {
        id: result.insertedId,
        ...assessmentWithUser
      };
    } catch (error) {
      console.error('[ERROR] Failed to save assessment:', error);
      throw error;
    }
  }

  // Get recent assessments
  async getRecentAssessments(limit = 10) {
    try {
      const collection = this.getDb().collection('assessments');
      
      const assessments = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      // Transform MongoDB documents to match frontend format
      return assessments.map(doc => ({
        id: doc._id,
        asymmetryMetrics: doc.asymmetryMetrics,
        postureMetrics: doc.postureMetrics,
        speechMetrics: doc.speechMetrics,
        riskLevel: doc.riskLevel,
        timestamp: doc.timestamp
      }));
    } catch (error) {
      console.error('[ERROR] Failed to fetch recent assessments:', error);
      throw error;
    }
  }

  // Get assessment statistics
  async getAssessmentStats() {
    try {
      const collection = this.getDb().collection('assessments');
      
      const stats = await collection.aggregate([
        {
          $group: {
            _id: null,
            totalAssessments: { $sum: 1 },
            highRiskCount: {
              $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] }
            },
            mediumRiskCount: {
              $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] }
            },
            lowRiskCount: {
              $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] }
            }
          }
        }
      ]).toArray();
      
      return stats.length > 0 ? stats[0] : {
        totalAssessments: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0
      };
    } catch (error) {
      console.error('[ERROR] Failed to fetch assessment stats:', error);
      throw error;
    }
  }

  // SPEECH ANALYSIS OPERATIONS
  
  // Save speech analysis
  async saveSpeechAnalysis(analysisData) {
    try {
      const collection = this.getDb().collection('speechAnalyses');
      
      const analysis = {
        _id: new Date().getTime().toString(), // Use timestamp as ID
        transcript: analysisData.transcript,
        readingPassage: analysisData.readingPassage || null,
        coherenceScore: analysisData.coherenceScore,
        slurredSpeechScore: analysisData.slurredSpeechScore,
        wordFindingScore: analysisData.wordFindingScore,
        overallRisk: analysisData.overallRisk,
        observations: analysisData.observations || [],
        timestamp: analysisData.timestamp || new Date().toISOString(),
        createdAt: new Date()
      };
      
      const result = await collection.insertOne(analysis);
      console.log('[INFO] Speech analysis saved:', analysis._id);
      
      return { id: analysis._id, insertedId: result.insertedId };
    } catch (error) {
      console.error('[ERROR] Failed to save speech analysis:', error);
      throw error;
    }
  }

  // Get recent speech analyses
  async getRecentSpeechAnalyses(limit = 5) {
    try {
      const collection = this.getDb().collection('speechAnalyses');
      
      const analyses = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      // Transform MongoDB documents to match frontend format
      return analyses.map(doc => ({
        id: doc._id,
        transcript: doc.transcript,
        readingPassage: doc.readingPassage,
        coherenceScore: doc.coherenceScore,
        slurredSpeechScore: doc.slurredSpeechScore,
        wordFindingScore: doc.wordFindingScore,
        overallRisk: doc.overallRisk,
        observations: doc.observations,
        timestamp: doc.timestamp
      }));
    } catch (error) {
      console.error('[ERROR] Failed to fetch recent speech analyses:', error);
      throw error;
    }
  }

  // Get speech analysis statistics
  async getSpeechAnalysisStats() {
    try {
      const collection = this.getDb().collection('speechAnalyses');
      
      const stats = await collection.aggregate([
        {
          $group: {
            _id: null,
            totalSpeechAnalyses: { $sum: 1 },
            avgCoherenceScore: { $avg: '$coherenceScore' },
            avgSlurredSpeechScore: { $avg: '$slurredSpeechScore' },
            avgWordFindingScore: { $avg: '$wordFindingScore' }
          }
        }
      ]).toArray();
      
      return stats.length > 0 ? {
        totalSpeechAnalyses: stats[0].totalSpeechAnalyses,
        avgCoherenceScore: Math.round(stats[0].avgCoherenceScore || 0),
        avgSlurredSpeechScore: Math.round(stats[0].avgSlurredSpeechScore || 0),
        avgWordFindingScore: Math.round(stats[0].avgWordFindingScore || 0)
      } : {
        totalSpeechAnalyses: 0,
        avgCoherenceScore: 0,
        avgSlurredSpeechScore: 0,
        avgWordFindingScore: 0
      };
    } catch (error) {
      console.error('[ERROR] Failed to fetch speech analysis stats:', error);
      throw error;
    }
  }

  // UTILITY OPERATIONS
  
  // Clear all data (for development/testing)
  async clearAllData() {
    try {
      await this.getDb().collection('assessments').deleteMany({});
      await this.getDb().collection('speechAnalyses').deleteMany({});
      console.log('[INFO] All data cleared from database');
    } catch (error) {
      console.error('[ERROR] Failed to clear data:', error);
      throw error;
    }
  }

  // Get health status
  async getHealthStatus() {
    try {
      const adminDb = this.client.db().admin();
      const result = await adminDb.ping();
      
      return {
        connected: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // User operations
  async createUser(userData) {
    try {
      const result = await this.getDb().collection('users').insertOne(userData);
      return { id: result.insertedId, ...userData };
    } catch (error) {
      console.error('[ERROR] Failed to create user:', error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      return await this.getDb().collection('users').findOne({ email });
    } catch (error) {
      console.error('[ERROR] Failed to find user by email:', error);
      throw error;
    }
  }

  async findUserById(userId) {
    try {
      return await this.getDb().collection('users').findOne({ _id: new ObjectId(userId) });
    } catch (error) {
      console.error('[ERROR] Failed to find user by ID:', error);
      throw error;
    }
  }

  async updateUserLastLogin(userId) {
    try {
      await this.getDb().collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { lastLogin: new Date().toISOString() } }
      );
    } catch (error) {
      console.error('[ERROR] Failed to update last login:', error);
      throw error;
    }
  }

  // Get user's assessments
  async getUserAssessments(userId, limit = 10) {
    try {
      const assessments = await this.getDb().collection('assessments')
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      return assessments;
    } catch (error) {
      console.error('[ERROR] Failed to get user assessments:', error);
      throw error;
    }
  }

  // Enhanced user profile methods
  async updateUserProfile(userId, profileData) {
    try {
      const updateData = {
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      const result = await this.getDb().collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('[ERROR] Failed to update user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await this.getDb().collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } // Exclude password from response
      );
      
      if (!user) return null;

      // Get user statistics
      const assessmentStats = await this.getUserAssessmentStats(userId);
      const recentAssessments = await this.getUserAssessments(userId, 5);
      const speechAnalyses = await this.getUserSpeechAnalyses(userId, 5);

      return {
        ...user,
        statistics: assessmentStats,
        recentAssessments,
        recentSpeechAnalyses: speechAnalyses
      };
    } catch (error) {
      console.error('[ERROR] Failed to get user profile:', error);
      throw error;
    }
  }

  async getUserAssessmentStats(userId) {
    try {
      const stats = await this.getDb().collection('assessments').aggregate([
        { $match: { userId: new ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalAssessments: { $sum: 1 },
            highRiskCount: {
              $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] }
            },
            mediumRiskCount: {
              $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] }
            },
            lowRiskCount: {
              $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] }
            },
            lastAssessmentDate: { $max: '$createdAt' },
            firstAssessmentDate: { $min: '$createdAt' }
          }
        }
      ]).toArray();

      if (stats.length === 0) {
        return {
          totalAssessments: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
          lastAssessmentDate: null,
          firstAssessmentDate: null,
          riskTrend: 'stable'
        };
      }

      const result = stats[0];
      
      // Calculate risk trend (last 5 vs previous 5 assessments)
      const riskTrend = await this.calculateUserRiskTrend(userId);

      return {
        ...result,
        riskTrend
      };
    } catch (error) {
      console.error('[ERROR] Failed to get user assessment stats:', error);
      throw error;
    }
  }

  async calculateUserRiskTrend(userId) {
    try {
      const recentAssessments = await this.getDb().collection('assessments')
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      if (recentAssessments.length < 4) return 'insufficient_data';

      const recent5 = recentAssessments.slice(0, 5);
      const previous5 = recentAssessments.slice(5, 10);

      const calculateRiskScore = (assessments) => {
        const riskValues = { 'low': 1, 'medium': 2, 'high': 3 };
        const totalScore = assessments.reduce((sum, assessment) => {
          return sum + (riskValues[assessment.riskLevel] || 1);
        }, 0);
        return totalScore / assessments.length;
      };

      if (previous5.length === 0) return 'stable';

      const recentScore = calculateRiskScore(recent5);
      const previousScore = calculateRiskScore(previous5);

      if (recentScore > previousScore + 0.3) return 'increasing';
      if (recentScore < previousScore - 0.3) return 'decreasing';
      return 'stable';
    } catch (error) {
      console.error('[ERROR] Failed to calculate risk trend:', error);
      return 'stable';
    }
  }

  async getUserSpeechAnalyses(userId, limit = 5) {
    try {
      const analyses = await this.getDb().collection('speechAnalyses')
        .find({ userId: new ObjectId(userId) })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return analyses.map(doc => ({
        id: doc._id,
        transcript: doc.transcript,
        readingPassage: doc.readingPassage,
        coherenceScore: doc.coherenceScore,
        slurredSpeechScore: doc.slurredSpeechScore,
        wordFindingScore: doc.wordFindingScore,
        overallRisk: doc.overallRisk,
        observations: doc.observations,
        timestamp: doc.timestamp
      }));
    } catch (error) {
      console.error('[ERROR] Failed to get user speech analyses:', error);
      throw error;
    }
  }

  // Save speech analysis with user association
  async saveSpeechAnalysisForUser(analysisData, userId = null) {
    try {
      const collection = this.getDb().collection('speechAnalyses');
      
      const analysis = {
        _id: new Date().getTime().toString(),
        userId: userId ? new ObjectId(userId) : null,
        transcript: analysisData.transcript,
        readingPassage: analysisData.readingPassage || null,
        coherenceScore: analysisData.coherenceScore,
        slurredSpeechScore: analysisData.slurredSpeechScore,
        wordFindingScore: analysisData.wordFindingScore,
        overallRisk: analysisData.overallRisk,
        observations: analysisData.observations || [],
        timestamp: analysisData.timestamp || new Date().toISOString(),
        createdAt: new Date()
      };
      
      const result = await collection.insertOne(analysis);
      console.log('[INFO] Speech analysis saved for user:', userId);
      
      return { id: analysis._id, insertedId: result.insertedId };
    } catch (error) {
      console.error('[ERROR] Failed to save speech analysis for user:', error);
      throw error;
    }
  }

  // Get user's complete history with pagination
  async getUserHistory(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      // Get assessments and speech analyses
      const [assessments, speechAnalyses, totalAssessments, totalSpeechAnalyses] = await Promise.all([
        this.getDb().collection('assessments')
          .find({ userId: new ObjectId(userId) })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Math.floor(limit / 2))
          .toArray(),
        
        this.getDb().collection('speechAnalyses')
          .find({ userId: new ObjectId(userId) })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(Math.floor(limit / 2))
          .toArray(),
        
        this.getDb().collection('assessments').countDocuments({ userId: new ObjectId(userId) }),
        this.getDb().collection('speechAnalyses').countDocuments({ userId: new ObjectId(userId) })
      ]);

      // Combine and sort by date
      const combined = [
        ...assessments.map(a => ({ ...a, type: 'assessment', date: a.createdAt })),
        ...speechAnalyses.map(s => ({ ...s, type: 'speech', date: s.timestamp }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        data: combined.slice(0, limit),
        pagination: {
          page,
          limit,
          totalAssessments,
          totalSpeechAnalyses,
          totalItems: totalAssessments + totalSpeechAnalyses,
          totalPages: Math.ceil((totalAssessments + totalSpeechAnalyses) / limit)
        }
      };
    } catch (error) {
      console.error('[ERROR] Failed to get user history:', error);
      throw error;
    }
  }
}

module.exports = new MongoService(); 