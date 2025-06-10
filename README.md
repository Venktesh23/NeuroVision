# NeuroVision

NeuroVision is an advanced AI-powered stroke detection platform that combines cutting-edge technologies to provide real-time health monitoring and early warning signs of stroke. By analyzing facial asymmetry, posture anomalies, and speech patterns, the system offers comprehensive stroke risk assessment.

> 📁 **New Organization**: Deployment documentation moved to [`docs/deployment/`](./docs/deployment/), build scripts moved to [`scripts/`](./scripts/). See [docs/deployment/README.md](./docs/deployment/README.md) for deployment guides.

## Features

- **Real-time Facial Asymmetry Detection**: Uses MediaPipe Face Mesh to detect subtle changes in facial symmetry that may indicate stroke.
- **Posture Analysis**: Monitors shoulder imbalance, head tilt, and body lean to identify potential stroke symptoms.
- **Speech Pattern Analysis**: Analyzes speech patterns for coherence, slurring, and word-finding difficulties using AI.
- **Comprehensive Risk Assessment**: Combines multiple detection methods for accurate stroke risk evaluation.
- **Real-time Results**: Instant feedback on potential stroke symptoms.
- **Educational Interface**: Provides guidance on stroke detection and emergency response.
- **Data Persistence**: MongoDB integration for storing assessments and historical data.

## Technology Stack

- **Frontend**: React.js, HTML, CSS, JavaScript with Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas (cloud) or local MongoDB
- **AI/ML**: MediaPipe for face and pose recognition, Google Gemini for speech analysis
- **Speech Recognition**: Web Speech API for real-time transcription
- **Cloud Services**: MongoDB Atlas, Google AI, AssemblyAI

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (recommended) or local MongoDB installation
- Google AI API key (for speech analysis)
- AssemblyAI API key (for audio transcription)

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd stroke-shield-main
```

**Quick Start** (Automated setup):
```bash
# Clean install and build test
./scripts/clean-install.sh

# Local build testing
./scripts/build.sh
```

**Manual Setup**:
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install
```

### 2. Database Setup (MongoDB Atlas)

#### Option A: MongoDB Atlas (Recommended - Free Tier Available)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free account and cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string from "Connect" > "Connect your application"

#### Option B: Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service: `mongod`
3. Use connection string: `mongodb://localhost:27017/neurovision`

### 3. Environment Configuration
1. Navigate to server directory: `cd server`
2. Copy the template: `cp env.template .env`
3. Edit `.env` file with your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/neurovision
DB_NAME=neurovision

# Google AI Configuration
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# AssemblyAI Configuration
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

### 4. Get API Keys

#### Google AI (for speech analysis)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to your `.env` file

#### AssemblyAI (for audio transcription)
1. Visit [AssemblyAI](https://www.assemblyai.com/app/account)
2. Sign up and get your API key
3. Add to your `.env` file

### 5. Start the Application

#### Start the backend server:
```bash
cd server
npm start
```

#### Start the React frontend (in a new terminal):
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
