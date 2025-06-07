# MongoDB Setup Guide for NeuroVision

This guide covers the MongoDB database setup and configuration for the NeuroVision stroke detection application.

## Current Configuration

### Database Details
- **Database Name**: `neurovision`
- **Connection URI**: `mongodb://localhost:27017/neurovision`
- **Environment**: Development (local MongoDB instance)

### Collections
1. **assessments** - Stores stroke detection assessments
2. **speechAnalyses** - Stores speech analysis results

## Database Schema

### Assessments Collection
```javascript
{
  _id: String,                    // Timestamp-based unique ID
  asymmetryMetrics: {
    eyeAsymmetry: Number,        // 0-1 range
    mouthAsymmetry: Number,      // 0-1 range
    overallAsymmetry: Number     // 0-1 range
  },
  postureMetrics: {
    shoulderImbalance: Number,   // 0-1 range
    headTilt: Number            // 0-1 range
  },
  speechMetrics: Object,        // Speech-related metrics
  riskLevel: String,           // 'low', 'medium', 'high'
  timestamp: String,           // ISO date string
  createdAt: Date             // MongoDB date
}
```

### Speech Analyses Collection
```javascript
{
  _id: String,                    // Timestamp-based unique ID
  transcript: String,             // Transcribed speech text
  readingPassage: String,         // Original text to read
  coherenceScore: Number,         // 0-100 score
  slurredSpeechScore: Number,     // 0-100 score
  wordFindingScore: Number,       // 0-100 score
  overallRisk: String,           // 'low', 'medium', 'high'
  observations: Array,           // Array of observation strings
  timestamp: String,             // ISO date string
  createdAt: Date               // MongoDB date
}
```

## Database Indexes

The following indexes are automatically created for optimal performance:

### Assessments Collection
- `_id`: Primary key (automatic)
- `timestamp`: Descending index for recent queries
- `riskLevel`: Index for filtering by risk level

### Speech Analyses Collection
- `_id`: Primary key (automatic)
- `timestamp`: Descending index for recent queries
- `overallRisk`: Index for filtering by risk level

## Setup Commands

### 1. Environment Configuration
```bash
# Copy environment template
cp env.template .env

# Edit .env file with proper MongoDB URI
MONGODB_URI=mongodb://localhost:27017/neurovision
DB_NAME=neurovision
```

### 2. Database Initialization
```bash
# Run setup script to initialize database with sample data
node setup-database.js

# Or run database test
node test-db.js
```

### 3. Verify Setup
```bash
# Check MongoDB connection
curl http://localhost:5000/api/health

# Test API endpoints
curl http://localhost:5000/api/assessments/recent
curl http://localhost:5000/api/speech-analyses/recent
curl http://localhost:5000/api/assessments/stats
```

## API Endpoints

### Assessment Endpoints
- `GET /api/assessments/recent?limit=10` - Get recent assessments
- `POST /api/assessments` - Save new assessment
- `GET /api/assessments/stats` - Get assessment statistics

### Speech Analysis Endpoints
- `GET /api/speech-analyses/recent?limit=5` - Get recent speech analyses
- `POST /api/speech-analyses` - Save speech analysis

### Health Check
- `GET /api/health` - Database and service status

## Database Operations

### MongoDB CLI Commands
```bash
# Connect to database
mongosh neurovision

# View collections
db.getCollectionNames()

# Count documents
db.assessments.countDocuments()
db.speechAnalyses.countDocuments()

# View recent assessments
db.assessments.find().sort({timestamp: -1}).limit(5)

# View indexes
db.assessments.getIndexes()
db.speechAnalyses.getIndexes()

# Clear all data (development only)
db.assessments.deleteMany({})
db.speechAnalyses.deleteMany({})
```

### Backup and Restore
```bash
# Backup database
mongodump --db neurovision --out backup/

# Restore database
mongorestore --db neurovision backup/neurovision/
```

## Production Configuration

For production deployment, consider:

1. **MongoDB Atlas**: Use cloud MongoDB service
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/neurovision
   ```

2. **Connection Pooling**: Already configured in mongoService.js

3. **Security**: 
   - Enable authentication
   - Use SSL/TLS connections
   - Restrict network access

4. **Monitoring**:
   - Enable MongoDB monitoring
   - Set up alerts for connection failures
   - Monitor database performance metrics

## Troubleshooting

### Common Issues

1. **Connection Failed**
   ```bash
   # Check if MongoDB is running
   pgrep mongod
   
   # Start MongoDB (macOS with Homebrew)
   brew services start mongodb/brew/mongodb-community
   ```

2. **Database Case Sensitivity**
   - MongoDB database names are case-sensitive
   - Use consistent naming: `neurovision` (lowercase)

3. **Index Creation Errors**
   - Usually indicates existing data conflicts
   - Check existing indexes with `db.collection.getIndexes()`

4. **Permission Issues**
   - Ensure MongoDB has proper file permissions
   - Check MongoDB logs: `/usr/local/var/log/mongodb/mongo.log`

## Development Notes

- Sample data is automatically created by `setup-database.js`
- Database service includes graceful fallback for disconnected state
- All operations include proper error handling
- Indexes are optimized for query patterns used by the frontend

## Files
- `services/mongoService.js` - Main database service
- `setup-database.js` - Database initialization script
- `test-db.js` - Connection testing script
- `.env` - Environment configuration
- `env.template` - Environment template

## Support

For database-related issues:
1. Check MongoDB logs
2. Verify environment variables
3. Test connection with `node test-db.js`
4. Run health check: `curl http://localhost:5000/api/health` 