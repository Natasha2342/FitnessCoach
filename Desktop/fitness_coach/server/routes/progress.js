const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Log new progress entry
router.post('/', auth, async (req, res) => {
    try {
        const { type, value, unit, metrics, notes } = req.body;

        const progress = new Progress({
            user: req.user._id,
            type,
            value,
            unit,
            metrics,
            notes
        });

        await progress.save();

        // Calculate change from previous entry
        const change = await progress.calculateChange();

        // Generate AI insights if significant change
        let insights = null;
        if (change && Math.abs(change.percentage) > 5) {
            insights = await generateProgressInsights(progress, change);
        }

        res.status(201).json({
            progress,
            change,
            insights
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get progress history
router.get('/', auth, async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        
        const query = {
            user: req.user._id
        };

        if (type) query.type = type;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const progress = await Progress.find(query).sort({ date: -1 });
        
        // Generate trends and insights
        const insights = await Progress.generateInsights(req.user._id);

        res.json({
            progress,
            insights
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get progress summary
router.get('/summary', auth, async (req, res) => {
    try {
        const { timeframe = '30' } = req.query; // Days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeframe));

        const progress = await Progress.find({
            user: req.user._id,
            date: { $gte: startDate }
        }).sort({ date: 1 });

        const summary = calculateProgressSummary(progress);
        const recommendations = await generateProgressRecommendations(summary, req.user);

        res.json({
            summary,
            recommendations
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update progress entry
router.patch('/:id', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['value', 'unit', 'metrics', 'notes'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates' });
        }

        const progress = await Progress.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!progress) {
            return res.status(404).json({ error: 'Progress entry not found' });
        }

        updates.forEach(update => {
            progress[update] = req.body[update];
        });

        await progress.save();
        res.json(progress);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete progress entry
router.delete('/:id', auth, async (req, res) => {
    try {
        const progress = await Progress.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!progress) {
            return res.status(404).json({ error: 'Progress entry not found' });
        }

        res.json(progress);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Helper Functions

function calculateProgressSummary(progress) {
    const summary = {
        weight: {
            start: null,
            current: null,
            change: null,
            trend: null
        },
        strength: {
            volumeChange: null,
            maxLifts: {}
        },
        measurements: {
            changes: {}
        },
        consistency: {
            workoutFrequency: null,
            trackingAdherence: null
        }
    };

    // Weight progress
    const weightEntries = progress.filter(p => p.type === 'weight');
    if (weightEntries.length >= 2) {
        summary.weight.start = weightEntries[0].value;
        summary.weight.current = weightEntries[weightEntries.length - 1].value;
        summary.weight.change = summary.weight.current - summary.weight.start;
        summary.weight.trend = calculateTrend(weightEntries.map(e => e.value));
    }

    // Strength progress
    const strengthEntries = progress.filter(p => p.type === 'strength');
    if (strengthEntries.length >= 2) {
        const volumeStart = strengthEntries[0].metrics.volume;
        const volumeEnd = strengthEntries[strengthEntries.length - 1].metrics.volume;
        summary.strength.volumeChange = ((volumeEnd - volumeStart) / volumeStart) * 100;
        
        // Track max lifts
        strengthEntries.forEach(entry => {
            if (entry.metrics.oneRepMax) {
                Object.entries(entry.metrics.oneRepMax).forEach(([exercise, weight]) => {
                    if (!summary.strength.maxLifts[exercise] || weight > summary.strength.maxLifts[exercise]) {
                        summary.strength.maxLifts[exercise] = weight;
                    }
                });
            }
        });
    }

    // Measurements progress
    const measurementEntries = progress.filter(p => p.type === 'measurements');
    if (measurementEntries.length >= 2) {
        const firstEntry = measurementEntries[0].metrics;
        const lastEntry = measurementEntries[measurementEntries.length - 1].metrics;
        
        ['chest', 'waist', 'hips', 'arms', 'legs'].forEach(measurement => {
            if (firstEntry[measurement] && lastEntry[measurement]) {
                summary.measurements.changes[measurement] = lastEntry[measurement] - firstEntry[measurement];
            }
        });
    }

    // Calculate consistency
    const totalDays = (progress[progress.length - 1].date - progress[0].date) / (1000 * 60 * 60 * 24);
    const uniqueDays = new Set(progress.map(p => p.date.toDateString())).size;
    summary.consistency.trackingAdherence = (uniqueDays / totalDays) * 100;

    return summary;
}

function calculateTrend(values) {
    if (values.length < 2) return 'insufficient data';
    
    const changes = [];
    for (let i = 1; i < values.length; i++) {
        changes.push(values[i] - values[i-1]);
    }
    
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    if (Math.abs(avgChange) < 0.1) return 'maintaining';
    return avgChange > 0 ? 'increasing' : 'decreasing';
}

async function generateProgressInsights(progress, change) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a fitness progress analyst providing insights on user progress."
                },
                {
                    role: "user",
                    content: `Analyze this progress:
                             Type: ${progress.type}
                             Current Value: ${progress.value} ${progress.unit}
                             Change: ${change.percentage}% over ${Math.round(change.timeFrame / (1000 * 60 * 60 * 24))} days
                             Additional Metrics: ${JSON.stringify(progress.metrics)}`
                }
            ]
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating progress insights:', error);
        return null;
    }
}

async function generateProgressRecommendations(summary, user) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a fitness coach providing recommendations based on user progress."
                },
                {
                    role: "user",
                    content: `Generate recommendations based on:
                             User Goals: ${user.profile.goals.join(', ')}
                             Fitness Level: ${user.profile.fitnessLevel}
                             Progress Summary: ${JSON.stringify(summary)}`
                }
            ]
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return null;
    }
}

module.exports = router; 