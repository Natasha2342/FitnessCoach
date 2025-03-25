const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        fitnessLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner'
        },
        goals: [{
            type: String,
            enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility']
        }],
        medicalConditions: [String],
        height: Number,
        weight: Number,
        age: Number,
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'prefer_not_to_say']
        }
    },
    workoutPlans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkoutPlan'
    }],
    progress: [{
        date: Date,
        weight: Number,
        measurements: {
            chest: Number,
            waist: Number,
            hips: Number,
            arms: Number,
            legs: Number
        },
        notes: String
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Update user stats method
userSchema.methods.updateStats = async function(stats) {
    Object.assign(this.profile, stats);
    return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 