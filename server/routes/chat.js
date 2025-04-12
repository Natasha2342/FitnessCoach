// chat.js (server-side controller for chat)
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');

// Check if GEMINI_API_KEY is set
if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System message defining the AI's persona and responsibilities
const SYSTEM_MESSAGE = `You are an expert AI fitness coach with deep knowledge of exercise science, nutrition, and health. 
Your role is to provide accurate, helpful, and motivating guidance to users while maintaining a professional and supportive tone.
You should:
1. Provide evidence-based advice
2. Explain concepts clearly and concisely
3. Adapt recommendations based on user's fitness level and goals
4. Prioritize safety and proper form
5. Encourage sustainable habits over quick fixes
6. Be motivating while maintaining realism`;

// Chat route - accepts user message and returns AI response
router.post('/', auth, async (req, res) => {
    try {
        console.log('Chat request received from user:', req.user.userId);
        const { message } = req.body;

        if (!message || message.trim() === "") {
            console.log('Empty message received');
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        console.log('Initializing Gemini model');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        console.log('Starting chat session');
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: SYSTEM_MESSAGE,
                },
            ],
        });

        console.log('Sending message to Gemini:', message);
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        console.log('Received response from Gemini');

        res.status(200).json({ response: text });

    } catch (error) {
        console.error('Chat Error:', error);
        // Send more specific error messages based on the error type
        if (error.message.includes('API key')) {
            res.status(500).json({ error: 'AI service configuration error' });
        } else if (error.message.includes('network')) {
            res.status(503).json({ error: 'AI service is temporarily unavailable' });
        } else if (error.message.includes('models/gemini')) {
            res.status(500).json({ error: 'AI model configuration error. Please contact support.' });
        } else {
            res.status(500).json({ error: 'Failed to process chat message: ' + error.message });
        }
    }
});

module.exports = router;
