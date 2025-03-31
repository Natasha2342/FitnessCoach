const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['strength', 'cardio', 'hiit', 'flexibility']
    },
    // For strength exercises
    sets: {
        type: Number,
        required: function() {
            return this.type === 'strength';
        }
    },
    reps: {
        type: Number,
        required: function() {
            return this.type === 'strength';
        }
    },
    // For cardio, hiit, and flexibility exercises
    duration: {
        type: Number,
        required: function() {
            return this.type === 'cardio' || this.type === 'hiit' || this.type === 'flexibility';
        }
    },
    // For hiit exercises
    rest: {
        type: Number,
        required: function() {
            return this.type === 'hiit';
        }
    },
    notes: String,
    completed: {
        type: Boolean,
        default: false
    }
});

const workoutSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['strength', 'cardio', 'hiit', 'flexibility']
    },
    duration: {
        type: Number,
        required: true
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced']
    },
    exercises: [exerciseSchema]
});

const workoutPlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    fitnessLevel: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced']
    },
    goal: {
        type: String,
        required: true,
        enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility']
    },
    physicalInfo: {
        height: Number,
        weight: Number,
        age: Number
    },
    healthInfo: {
        injuries: [String],
        medicalConditions: [String],
        limitations: [String]
    },
    healthRecommendations: [{
        warning: String,
        recommendations: [String]
    }],
    schedule: {
        daysPerWeek: {
            type: Number,
            required: true,
            min: 1,
            max: 7
        },
        sessionDuration: {
            type: Number,
            required: true,
            min: 15,
            max: 180
        }
    },
    workouts: [workoutSchema],
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to adapt workout plan based on progress
workoutPlanSchema.methods.adapt = async function(progressData) {
    // Implement AI-based adaptation logic here
    const adaptation = {
        date: new Date(),
        changes: 'Plan adapted based on progress',
        reason: 'Progress assessment'
    };
    
    this.adaptations.push(adaptation);
    return this.save();
};

// Method to generate next workout
workoutPlanSchema.methods.getNextWorkout = function() {
    const today = new Date().getDay();
    return this.schedule.find(s => s.day === today)?.workout;
};

// Method to check if rest day
workoutPlanSchema.methods.isRestDay = function() {
    const today = new Date().getDay();
    return !this.schedule.some(s => s.day === today);
};

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema); 