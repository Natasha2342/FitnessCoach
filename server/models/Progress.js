const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['weight', 'strength', 'measurements', 'cardio'],
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    notes: String,
    metrics: {
        // For weight tracking
        bodyFat: Number,
        muscleMass: Number,
        
        // For strength tracking
        volume: Number, // total weight * reps
        oneRepMax: Number,
        
        // For cardio tracking
        distance: Number,
        duration: Number,
        heartRate: {
            avg: Number,
            max: Number
        },
        
        // For measurements
        chest: Number,
        waist: Number,
        hips: Number,
        arms: Number,
        legs: Number
    }
}, {
    timestamps: true
});

// Calculate progress change
progressSchema.methods.calculateChange = async function() {
    const previousProgress = await this.model('Progress')
        .findOne({
            user: this.user,
            type: this.type,
            date: { $lt: this.date }
        })
        .sort({ date: -1 });

    if (!previousProgress) return null;

    const change = ((this.value - previousProgress.value) / previousProgress.value) * 100;
    return {
        absolute: this.value - previousProgress.value,
        percentage: change,
        timeFrame: this.date - previousProgress.date
    };
};

// Get progress trend
progressSchema.statics.getTrend = async function(userId, type, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
        user: userId,
        type: type,
        date: { $gte: startDate }
    })
    .sort({ date: 1 });
};

// Generate progress insights
progressSchema.statics.generateInsights = async function(userId) {
    const recentProgress = await this.find({
        user: userId,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
    .sort({ date: -1 });

    const insights = {
        weightTrend: null,
        strengthGain: null,
        consistencyScore: null,
        recommendations: []
    };

    if (recentProgress.length > 0) {
        // Calculate trends and generate insights
        // This would be expanded with more sophisticated analysis
        insights.weightTrend = calculateWeightTrend(recentProgress);
        insights.strengthGain = calculateStrengthGain(recentProgress);
        insights.consistencyScore = calculateConsistencyScore(recentProgress);
        insights.recommendations = generateRecommendations(recentProgress);
    }

    return insights;
};

// Helper functions for insights
function calculateWeightTrend(progress) {
    const weightEntries = progress.filter(p => p.type === 'weight');
    if (weightEntries.length < 2) return null;

    const firstEntry = weightEntries[weightEntries.length - 1];
    const lastEntry = weightEntries[0];
    const weeklyChange = (lastEntry.value - firstEntry.value) / (weightEntries.length / 7);

    return {
        direction: weeklyChange > 0 ? 'gaining' : 'losing',
        weeklyRate: Math.abs(weeklyChange)
    };
}

function calculateStrengthGain(progress) {
    const strengthEntries = progress.filter(p => p.type === 'strength');
    if (strengthEntries.length < 2) return null;

    const volumeChange = strengthEntries[0].metrics.volume - strengthEntries[strengthEntries.length - 1].metrics.volume;
    return {
        volumeIncrease: volumeChange,
        percentage: (volumeChange / strengthEntries[strengthEntries.length - 1].metrics.volume) * 100
    };
}

function calculateConsistencyScore(progress) {
    const daysWithEntries = new Set(progress.map(p => p.date.toDateString())).size;
    return (daysWithEntries / 30) * 100; // Percentage of days with logged progress
}

function generateRecommendations(progress) {
    const recommendations = [];
    
    // Example recommendation logic
    const weightTrend = calculateWeightTrend(progress);
    if (weightTrend) {
        if (weightTrend.weeklyRate > 1) {
            recommendations.push('Consider slowing down weight change to ensure sustainable progress');
        }
    }

    const consistencyScore = calculateConsistencyScore(progress);
    if (consistencyScore < 70) {
        recommendations.push('Try to log your progress more consistently for better tracking');
    }

    return recommendations;
}

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress; 