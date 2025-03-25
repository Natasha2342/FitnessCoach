# AI Fitness Coach

An intelligent fitness coaching platform that provides personalized workout plans and AI-powered guidance for your fitness journey.

## Features

- **Personalized Workout Plans**: Get customized workout plans based on your goals, fitness level, and preferences
- **AI Chatbot**: Ask questions about fitness, nutrition, and receive evidence-based guidance
- **Progress Tracking**: Track your workouts and get AI-powered insights for improvement
- **Adaptive Programming**: Plans that adjust based on your progress and feedback

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js with Express
- Database: MongoDB
- AI/ML: OpenAI GPT for chatbot, TensorFlow for recommendations

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
OPENAI_API_KEY=your_openai_api_key
```

## Project Structure

```
/
├── client/           # Frontend files
│   ├── css/         # Stylesheets
│   ├── js/          # JavaScript files
│   └── index.html   # Main HTML file
├── server/          # Backend files
│   ├── routes/      # API routes
│   ├── models/      # Database models
│   ├── controllers/ # Request handlers
│   └── services/    # Business logic
└── package.json     # Project dependencies
``` 