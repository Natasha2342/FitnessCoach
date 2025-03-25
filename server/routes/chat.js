const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const auth = require('../middleware/auth');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// System message for the AI coach
const SYSTEM_MESSAGE = `You are an expert AI fitness coach with deep knowledge of exercise science, nutrition, and health. 
Your role is to provide accurate, helpful, and motivating guidance to users while maintaining a professional and supportive tone.
You should:
1. Provide evidence-based advice
2. Explain concepts clearly and concisely
3. Adapt recommendations based on user's fitness level and goals
4. Prioritize safety and proper form
5. Encourage sustainable habits over quick fixes
6. Be motivating while maintaining realism`;

// Main chat route
router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional fitness coach. Provide helpful, accurate, and safe fitness advice."
                },
                {
                    role: "user",
                    content: message
                }
            ]
        });

        res.json({
            message: completion.choices[0].message.content
        });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

// Form check route
router.post('/form-check', async (req, res) => {
    try {
        const { formData } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional fitness coach. Review the form data and provide feedback."
                },
                {
                    role: "user",
                    content: JSON.stringify(formData)
                }
            ]
        });

        res.json({
            feedback: completion.choices[0].message.content
        });
    } catch (error) {
        console.error('Form Check Error:', error);
        res.status(500).json({ error: 'Failed to process form check' });
    }
});

// Nutrition advice route
router.post('/nutrition', async (req, res) => {
    try {
        const { query } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional nutritionist. Provide helpful and accurate nutrition advice."
                },
                {
                    role: "user",
                    content: query
                }
            ]
        });

        res.json({
            advice: completion.choices[0].message.content
        });
    } catch (error) {
        console.error('Nutrition Error:', error);
        res.status(500).json({ error: 'Failed to process nutrition query' });
    }
});

// Recovery advice route
router.post('/recovery', async (req, res) => {
    try {
        const { query } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional fitness coach specializing in recovery. Provide helpful and accurate recovery advice."
                },
                {
                    role: "user",
                    content: query
                }
            ]
        });

        res.json({
            advice: completion.choices[0].message.content
        });
    } catch (error) {
        console.error('Recovery Error:', error);
        res.status(500).json({ error: 'Failed to process recovery query' });
    }
});

module.exports = router; 