const express = require('express');
const router = express.Router();
const WorkoutPlan = require('../models/WorkoutPlan');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const healthRecommendations = require('../utils/healthRecommendations');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate workout plan
router.post('/plan', auth, async (req, res) => {
    try {
        const { goal, level, preferences } = req.body;
        console.log('Generating workout plan with:', { goal, level, preferences });

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Start a chat
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: "You are a professional fitness coach creating personalized workout plans. Create a structured workout plan with specific exercises, sets, reps, and rest periods. Return the response in JSON format with the following structure: { workouts: [{ name: string, type: string, duration: number, difficulty: string, exercises: [{ name: string, sets: number, reps: number, weight?: number, duration?: number, notes?: string }] }] }"
                },
            ],
        });

        // Send message and get response
        const result = await chat.sendMessage(`Create a workout plan for a ${level} level user with the goal of ${goal}. User preferences: ${JSON.stringify(preferences)}`);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini response:', text);

        // Parse the AI response and create structured workout plan
        const workoutPlan = new WorkoutPlan({
            user: req.user.userId,
            name: `${goal} - ${level} Plan`,
            description: text,
            duration: 4, // 4 weeks default
            goals: [goal],
            fitnessLevel: level,
            workouts: parseAIWorkoutPlan(text)
        });

        console.log('Saving workout plan:', workoutPlan);

        await workoutPlan.save();

        // Update user's current plan
        const user = await User.findById(req.user.userId);
        if (!user) {
            throw new Error('User not found');
        }
        user.currentPlan = workoutPlan._id;
        await user.save();

        res.status(201).json(workoutPlan);
    } catch (error) {
        console.error('Error generating workout plan:', error);
        res.status(500).json({ 
            error: 'Failed to generate workout plan',
            details: error.message 
        });
    }
});

// Get user's current workout plan
router.get('/plan/current', auth, async (req, res) => {
    try {
        const plan = await WorkoutPlan.findById(req.user.currentPlan);
        if (!plan) {
            return res.status(404).json({ error: 'No active workout plan found' });
        }
        res.json(plan);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start workout session
router.post('/start/:workoutId', auth, async (req, res) => {
    try {
        const plan = await WorkoutPlan.findById(req.user.currentPlan);
        const workout = plan.workouts.id(req.params.workoutId);

        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        res.json(workout);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Complete workout session
router.post('/complete', auth, async (req, res) => {
    try {
        const { workoutId, exercises, duration } = req.body;

        // Update workout history
        req.user.workoutHistory.push({
            workout: workoutId,
            completed: exercises,
            duration
        });

        await req.user.save();

        // Get AI feedback on the workout
        const feedback = await generateWorkoutFeedback(exercises, duration);

        res.json({
            message: 'Workout completed successfully',
            feedback
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update workout plan
router.patch('/plan/:planId', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'workouts', 'schedule', 'duration'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates' });
        }

        const plan = await WorkoutPlan.findOne({
            _id: req.params.planId,
            user: req.user._id
        });

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        updates.forEach(update => {
            plan[update] = req.body[update];
        });

        await plan.save();
        res.json(plan);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get workout history
router.get('/history', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('workoutHistory.workout');

        res.json(user.workoutHistory);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Helper function to parse AI response into structured workout plan
function parseAIWorkoutPlan(aiResponse) {
    try {
        // Try to parse the AI response as JSON first
        const parsedResponse = JSON.parse(aiResponse);
        if (!parsedResponse.workouts || !Array.isArray(parsedResponse.workouts)) {
            throw new Error('Invalid workout plan format');
        }
        return parsedResponse.workouts;
    } catch (error) {
        console.error('Error parsing AI response:', error);
        // If parsing fails, create a default workout structure
        return [
            {
                name: 'Full Body Workout A',
                type: 'strength',
                duration: 60,
                difficulty: 'intermediate',
                exercises: [
                    {
                        name: 'Squats',
                        sets: 3,
                        reps: 12,
                        rest: 90,
                        notes: 'Keep back straight, knees aligned with toes'
                    },
                    {
                        name: 'Push-ups',
                        sets: 3,
                        reps: 10,
                        rest: 60,
                        notes: 'Keep core tight, elbows close to body'
                    },
                    {
                        name: 'Pull-ups',
                        sets: 3,
                        reps: 8,
                        rest: 90,
                        notes: 'Full range of motion, controlled descent'
                    }
                ]
            }
        ];
    }
}

// Generate AI feedback for completed workout
async function generateWorkoutFeedback(exercises, duration) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: "You are a fitness coach providing feedback on completed workouts."
                },
            ],
        });

        const result = await chat.sendMessage(`Provide feedback for this workout: Duration: ${duration} minutes Exercises: ${JSON.stringify(exercises)}`);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error('Error generating workout feedback:', error);
        return 'Great job completing your workout!';
    }
}

// Helper function to get health recommendations
function getHealthRecommendations(healthInfo) {
    const recommendations = [];
    
    if (healthInfo.medicalConditions) {
        healthInfo.medicalConditions.forEach(condition => {
            const conditionLower = condition.toLowerCase();
            if (healthRecommendations.diseases[conditionLower]) {
                recommendations.push(healthRecommendations.diseases[conditionLower]);
            }
        });
    }
    
    if (healthInfo.injuries) {
        healthInfo.injuries.forEach(injury => {
            const injuryLower = injury.toLowerCase();
            if (healthRecommendations.injuries[injuryLower]) {
                recommendations.push(healthRecommendations.injuries[injuryLower]);
            }
        });
    }
    
    if (healthInfo.limitations) {
        healthInfo.limitations.forEach(limitation => {
            const limitationLower = limitation.toLowerCase();
            if (healthRecommendations.limitations[limitationLower]) {
                recommendations.push(healthRecommendations.limitations[limitationLower]);
            }
        });
    }
    
    return recommendations;
}

// Create a new workout plan
router.post('/', auth, async (req, res) => {
    try {
        const { name, fitnessLevel, goal, physicalInfo, healthInfo, schedule } = req.body;
        
        // Validate required fields
        if (!name || !fitnessLevel || !goal || !schedule) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get health recommendations
        const healthRecommendations = getHealthRecommendations(healthInfo);

        // Generate workout routine
        const workouts = await generateWorkoutRoutine({
            fitnessLevel,
            goal,
            schedule,
            physicalInfo,
            healthInfo
        });

        // Create new workout plan
        const workoutPlan = new WorkoutPlan({
            user: req.user.id,
            name,
            fitnessLevel,
            goal,
            physicalInfo,
            healthInfo,
            schedule,
            workouts,
            status: 'active',
            healthRecommendations // Add health recommendations to the plan
        });

        await workoutPlan.save();
        res.status(201).json(workoutPlan);
    } catch (error) {
        console.error('Error creating workout plan:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to generate workout routine
async function generateWorkoutRoutine(userInfo) {
    try {
        const { fitnessLevel, goal, schedule } = userInfo;
        const { daysPerWeek, sessionDuration } = schedule;
        
        if (!fitnessLevel || !goal || !schedule || !daysPerWeek || !sessionDuration) {
            throw new Error('Missing required information for workout plan generation');
        }

        const workoutTypes = {
            'weight_loss': ['cardio', 'hiit', 'strength'],
            'muscle_gain': ['strength', 'hiit'],
            'strength': ['strength', 'hiit'],
            'endurance': ['cardio', 'hiit'],
            'flexibility': ['flexibility', 'strength']
        };

        const types = workoutTypes[goal] || ['strength', 'hiit'];
        
        const exercises = {
            strength: {
                beginner: [
                    { name: 'Bodyweight Squats', type: 'strength', sets: 3, reps: 12, rest: 60, notes: 'Keep back straight, knees aligned with toes' },
                    { name: 'Push-ups (Knee)', type: 'strength', sets: 3, reps: 10, rest: 60, notes: 'Keep core tight, elbows close to body' },
                    { name: 'Dumbbell Rows', type: 'strength', sets: 3, reps: 12, rest: 60, notes: 'Keep back straight, pull elbows up' }
                ],
                intermediate: [
                    { name: 'Barbell Squats', type: 'strength', sets: 4, reps: 10, rest: 90, notes: 'Keep back straight, knees aligned with toes' },
                    { name: 'Push-ups', type: 'strength', sets: 4, reps: 12, rest: 90, notes: 'Keep core tight, elbows close to body' },
                    { name: 'Pull-ups', type: 'strength', sets: 4, reps: 8, rest: 90, notes: 'Full range of motion, controlled descent' }
                ],
                advanced: [
                    { name: 'Weighted Squats', type: 'strength', sets: 5, reps: 8, rest: 120, notes: 'Keep back straight, knees aligned with toes' },
                    { name: 'Weighted Push-ups', type: 'strength', sets: 5, reps: 10, rest: 120, notes: 'Keep core tight, elbows close to body' },
                    { name: 'Weighted Pull-ups', type: 'strength', sets: 5, reps: 6, rest: 120, notes: 'Full range of motion, controlled descent' }
                ]
            },
            cardio: {
                beginner: [
                    { name: 'Walking', type: 'cardio', duration: 20, notes: 'Brisk pace, maintain good posture' },
                    { name: 'Light Jogging', type: 'cardio', duration: 10, notes: 'Maintain conversation pace' }
                ],
                intermediate: [
                    { name: 'Jogging', type: 'cardio', duration: 25, notes: 'Moderate pace, maintain conversation' },
                    { name: 'High Knees', type: 'cardio', duration: 10, notes: 'Keep core tight, high knees' }
                ],
                advanced: [
                    { name: 'Running', type: 'cardio', duration: 30, notes: 'Challenging pace, maintain form' },
                    { name: 'Burpees', type: 'cardio', duration: 10, notes: 'Full range of motion, maintain form' }
                ]
            },
            hiit: {
                beginner: [
                    { name: 'Jumping Jacks', type: 'hiit', duration: 30, rest: 30, notes: 'Light impact, maintain form' },
                    { name: 'Mountain Climbers', type: 'hiit', duration: 30, rest: 30, notes: 'Keep core tight, controlled movement' }
                ],
                intermediate: [
                    { name: 'Burpees', type: 'hiit', duration: 45, rest: 15, notes: 'Full range of motion, maintain form' },
                    { name: 'Kettlebell Swings', type: 'hiit', duration: 45, rest: 15, notes: 'Keep back straight, controlled movement' }
                ],
                advanced: [
                    { name: 'Burpee Pull-ups', type: 'hiit', duration: 60, rest: 30, notes: 'Full range of motion, maintain form' },
                    { name: 'Kettlebell Complex', type: 'hiit', duration: 60, rest: 30, notes: 'Keep back straight, controlled movement' }
                ]
            },
            flexibility: {
                beginner: [
                    { name: 'Cat-Cow Stretch', type: 'flexibility', duration: 60, notes: 'Slow, controlled movements' },
                    { name: 'Hip Flexor Stretch', type: 'flexibility', duration: 60, notes: 'Keep back straight, gentle stretch' }
                ],
                intermediate: [
                    { name: 'Dynamic Stretching', type: 'flexibility', duration: 90, notes: 'Controlled movements, full range' },
                    { name: 'Yoga Flow', type: 'flexibility', duration: 90, notes: 'Maintain breath, controlled movements' }
                ],
                advanced: [
                    { name: 'Advanced Yoga Flow', type: 'flexibility', duration: 120, notes: 'Complex poses, maintain breath' },
                    { name: 'Mobility Work', type: 'flexibility', duration: 120, notes: 'Full range of motion, controlled movements' }
                ]
            }
        };

        const workouts = [];
        
        for (let i = 0; i < daysPerWeek; i++) {
            const type = types[i % types.length];
            if (!exercises[type] || !exercises[type][fitnessLevel]) {
                throw new Error(`Invalid workout type or fitness level: ${type}, ${fitnessLevel}`);
            }
            
            const workout = {
                name: `${type.charAt(0).toUpperCase() + type.slice(1)} Workout ${i + 1}`,
                type,
                duration: sessionDuration,
                difficulty: fitnessLevel,
                exercises: exercises[type][fitnessLevel].map(exercise => ({
                    ...exercise,
                    completed: false
                }))
            };
            workouts.push(workout);
        }

        return workouts;
    } catch (error) {
        console.error('Error generating workout routine:', error);
        throw new Error('Failed to generate workout routine: ' + error.message);
    }
}

// Get all workout plans for a user
router.get('/', auth, async (req, res) => {
    try {
        const workoutPlans = await WorkoutPlan.find({ user: req.user.userId });
        res.json(workoutPlans);
    } catch (error) {
        console.error('Error fetching workout plans:', error);
        res.status(500).json({ error: 'Failed to fetch workout plans' });
    }
});

// Get a specific workout plan
router.get('/:id', auth, async (req, res) => {
    try {
        const workoutPlan = await WorkoutPlan.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!workoutPlan) {
            return res.status(404).json({ error: 'Workout plan not found' });
        }

        res.json(workoutPlan);
    } catch (error) {
        console.error('Error fetching workout plan:', error);
        res.status(500).json({ error: 'Failed to fetch workout plan' });
    }
});

// Update a workout plan
router.put('/:id', auth, async (req, res) => {
    try {
        const workoutPlan = await WorkoutPlan.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            { $set: req.body },
            { new: true }
        );

        if (!workoutPlan) {
            return res.status(404).json({ error: 'Workout plan not found' });
        }

        res.json(workoutPlan);
    } catch (error) {
        console.error('Error updating workout plan:', error);
        res.status(500).json({ error: 'Failed to update workout plan' });
    }
});

// Delete a workout plan
router.delete('/:id', auth, async (req, res) => {
    try {
        // Find the workout plan and ensure it belongs to the user
        const workoutPlan = await WorkoutPlan.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!workoutPlan) {
            return res.status(404).json({ error: 'Workout plan not found' });
        }

        // Delete the workout plan
        await WorkoutPlan.deleteOne({ _id: req.params.id });

        // If this was the user's current plan, clear it
        const user = await User.findById(req.user.userId);
        if (user && user.currentPlan && user.currentPlan.toString() === req.params.id) {
            user.currentPlan = null;
            await user.save();
        }

        res.json({ message: 'Workout plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting workout plan:', error);
        res.status(500).json({ error: 'Failed to delete workout plan' });
    }
});

// Add a workout to a plan
router.post('/:id/workouts', auth, async (req, res) => {
    try {
        const workoutPlan = await WorkoutPlan.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!workoutPlan) {
            return res.status(404).json({ error: 'Workout plan not found' });
        }

        workoutPlan.workouts.push(req.body);
        await workoutPlan.save();
        res.status(201).json(workoutPlan);
    } catch (error) {
        console.error('Error adding workout:', error);
        res.status(500).json({ error: 'Failed to add workout' });
    }
});

// Update a workout in a plan
router.put('/:id/workouts/:workoutId', auth, async (req, res) => {
    try {
        const workoutPlan = await WorkoutPlan.findOne({
            _id: req.params.id,
            user: req.user.userId
        });
        if (!workoutPlan) {
            return res.status(404).json({ message: 'Workout plan not found' });
        }
        const workout = workoutPlan.workouts.id(req.params.workoutId);
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }
        Object.assign(workout, req.body);
        await workoutPlan.save();
        res.json(workoutPlan);
    } catch (error) {
        res.status(500).json({ message: 'Error updating workout', error: error.message });
    }
});

// Delete a workout from a plan
router.delete('/:id/workouts/:workoutId', auth, async (req, res) => {
    try {
        const workoutPlan = await WorkoutPlan.findOne({
            _id: req.params.id,
            user: req.user.userId
        });
        if (!workoutPlan) {
            return res.status(404).json({ message: 'Workout plan not found' });
        }
        workoutPlan.workouts.pull(req.params.workoutId);
        await workoutPlan.save();
        res.json(workoutPlan);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting workout', error: error.message });
    }
});

module.exports = router; 