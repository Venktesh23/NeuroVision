# NeuroVision - AI Stroke Detection Platform

A web-based application that uses AI-powered computer vision and facial analysis for neurological assessment and stroke detection.

## Features

- Real-time facial asymmetry detection using computer vision
- Posture analysis and monitoring
- Speech analysis with AI transcription and evaluation
- User authentication and assessment history
- MongoDB data persistence
- Multimodal AI assessment combining facial, posture, and speech data

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Google AI API key
- AssemblyAI API key

### Installation

1. Clone the repository
2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install client dependencies:
   ```bash
   cd client
   npm install
   ```

4. Configure environment variables:

   **Server Environment (.env in server directory):**
   ```
   MONGODB_URI=your_mongodb_connection_string
   DB_NAME=neurovision
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ASSEMBLYAI_API_KEY=your_assemblyai_api_key
   PORT=5000
   ```

   **Client Environment (.env in client directory):**
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_DEMO_MODE=false
   ```

5. Start the application:
   ```bash
   # Terminal 1 - Start server
   cd server
   npm start
   
   # Terminal 2 - Start client
   cd client
   npm start
   ```

## Usage

Access the application at `http://localhost:3000` and follow the on-screen instructions for neurological assessment.

## API Keys Setup

- **Google AI API Key**: Get from https://makersuite.google.com/app/apikey
- **AssemblyAI API Key**: Get from https://www.assemblyai.com/app/account
- **MongoDB**: Use local MongoDB or get connection string from MongoDB Atlas