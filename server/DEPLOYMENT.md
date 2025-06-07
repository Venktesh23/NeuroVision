# StrokeGuard Deployment Guide

## 🚀 Quick Start

Your StrokeGuard application is fully configured and ready to run!

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (already configured)
- API keys for Google AI and AssemblyAI (already configured)

### Running the Application

1. **Start the Backend Server:**
```bash
cd server
npm start
```

2. **Start the Frontend Client:**
```bash
cd client
npm start
```

3. **Access the Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables (`.env` in server directory)
All required environment variables are already configured:
- `MONGODB_URL` - Your MongoDB Atlas connection
- `DB_NAME` - Database name (neurovision)
- `GOOGLE_AI_API_KEY` - For speech analysis
- `ASSEMBLYAI_API_KEY` - For audio transcription
- `PORT` - Server port (5000)

### Database Testing
To verify your database connection:
```bash
cd server
node test-db.js
```

## 📊 Features

### ✅ Fully Functional Features:
- **Real-time Face Mesh Detection** - Facial asymmetry analysis
- **Pose Detection** - Body posture and symmetry analysis  
- **Speech Analysis** - AI-powered speech pattern analysis
- **Assessment History** - Historical data and trends
- **Data Persistence** - MongoDB Atlas integration
- **API Integration** - Google AI and AssemblyAI services

### 🔗 API Endpoints:
- `GET /api/health` - Health check
- `POST /api/assessments` - Save assessment data
- `GET /api/assessments/recent` - Get recent assessments
- `POST /api/analyze-speech` - AI speech analysis
- `POST /api/transcribe` - Audio transcription

## 🛠️ Development

### Building for Production:
```bash
cd client
npm run build
```

### Environment Setup for New Deployments:
1. Copy `server/env.template` to `server/.env`
2. Update with your API keys and database URL
3. Run `node test-db.js` to verify connectivity

## 📱 Usage

1. **Live Detection Tab**: Real-time facial and posture analysis
2. **Speech Analysis Tab**: Record and analyze speech patterns
3. **Assessment History Tab**: View past assessments and trends

Your application is production-ready! 🎉 