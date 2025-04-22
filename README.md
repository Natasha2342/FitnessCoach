# AI Fitness Coach

An intelligent fitness coaching platform that provides personalized workout plans and AI-powered guidance for your fitness journey.

## Features

- **Personalized Workout Plans**: Get customized workout plans based on your goals, fitness level, and preferences
- **AI Chatbot**: Ask questions about fitness, nutrition, and receive evidence-based guidance
- **Progress Tracking**: Track your workouts and get AI-powered insights for improvement

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js with Express
- Database: MongoDB
- AI/ML:Gemini for chatbot

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your API keys and configuration
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:
```
PORT=3000
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_api_key
```
 