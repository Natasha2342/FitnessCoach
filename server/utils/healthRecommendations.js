const healthRecommendations = {
    diseases: {
        'diabetes': {
            warning: '⚠️ Diabetes Management',
            recommendations: [
                'Monitor blood sugar before and after workouts',
                'Avoid high-intensity exercises if blood sugar is too high or too low',
                'Stay hydrated throughout the workout',
                'Keep glucose tablets or snacks nearby during exercise'
            ]
        },
        'hypertension': {
            warning: '⚠️ High Blood Pressure',
            recommendations: [
                'Avoid exercises that cause sudden spikes in blood pressure',
                'Focus on controlled breathing during exercises',
                'Include more low-impact cardio activities',
                'Monitor heart rate during workouts'
            ]
        },
        'asthma': {
            warning: '⚠️ Asthma Management',
            recommendations: [
                'Keep inhaler readily available during workouts',
                'Start with a proper warm-up to prevent exercise-induced asthma',
                'Choose exercises with controlled breathing patterns',
                'Avoid outdoor workouts during high pollen or pollution days'
            ]
        },
        'heart condition': {
            warning: '⚠️ Heart Condition',
            recommendations: [
                'Start with low-intensity exercises',
                'Monitor heart rate closely during workouts',
                'Include regular rest periods',
                'Avoid exercises that cause chest pain or discomfort'
            ]
        },
        'arthritis': {
            warning: '⚠️ Arthritis Management',
            recommendations: [
                'Focus on low-impact exercises',
                'Include proper warm-up and cool-down',
                'Use joint-friendly movements',
                'Avoid exercises that put excessive stress on affected joints'
            ]
        }
    },
    injuries: {
        'knee injury': {
            warning: '⚠️ Knee Injury',
            recommendations: [
                'Avoid high-impact exercises',
                'Focus on strengthening surrounding muscles',
                'Use proper knee support during workouts',
                'Include gentle stretching exercises'
            ]
        },
        'back injury': {
            warning: '⚠️ Back Injury',
            recommendations: [
                'Avoid exercises that strain the lower back',
                'Maintain proper form during all exercises',
                'Include core strengthening exercises',
                'Use proper lifting techniques'
            ]
        },
        'shoulder injury': {
            warning: '⚠️ Shoulder Injury',
            recommendations: [
                'Avoid overhead exercises',
                'Focus on shoulder stability exercises',
                'Use lighter weights with proper form',
                'Include gentle shoulder mobility work'
            ]
        },
        'ankle sprain': {
            warning: '⚠️ Ankle Sprain',
            recommendations: [
                'Avoid exercises that put stress on the ankle',
                'Use ankle support during workouts',
                'Focus on balance and stability exercises',
                'Include gentle ankle mobility work'
            ]
        },
        'wrist injury': {
            warning: '⚠️ Wrist Injury',
            recommendations: [
                'Avoid exercises that strain the wrists',
                'Use wrist wraps for support',
                'Focus on exercises that don\'t require wrist flexion',
                'Include gentle wrist mobility work'
            ]
        },
        'hip injury': {
            warning: '⚠️ Hip Injury',
            recommendations: [
                'Avoid exercises that put stress on the hips',
                'Focus on hip stability exercises',
                'Include gentle hip mobility work',
                'Use proper form during lower body exercises'
            ]
        },
        'elbow injury': {
            warning: '⚠️ Elbow Injury',
            recommendations: [
                'Avoid exercises that strain the elbows',
                'Use elbow support during workouts',
                'Focus on exercises that don\'t require elbow flexion',
                'Include gentle elbow mobility work'
            ]
        },
        'neck injury': {
            warning: '⚠️ Neck Injury',
            recommendations: [
                'Avoid exercises that strain the neck',
                'Maintain proper neck alignment during exercises',
                'Focus on neck stability exercises',
                'Include gentle neck mobility work'
            ]
        },
        'hamstring strain': {
            warning: '⚠️ Hamstring Strain',
            recommendations: [
                'Avoid exercises that stretch or strain hamstrings',
                'Focus on gentle hamstring mobility work',
                'Include strengthening exercises for surrounding muscles',
                'Use proper warm-up before lower body exercises'
            ]
        },
        'calf strain': {
            warning: '⚠️ Calf Strain',
            recommendations: [
                'Avoid exercises that strain the calves',
                'Focus on gentle calf mobility work',
                'Include strengthening exercises for surrounding muscles',
                'Use proper warm-up before lower body exercises'
            ]
        }
    },
    limitations: {
        'limited mobility': {
            warning: '⚠️ Limited Mobility',
            recommendations: [
                'Focus on exercises within your range of motion',
                'Include gentle stretching exercises',
                'Use modifications for exercises as needed',
                'Take regular breaks during workouts'
            ]
        },
        'balance issues': {
            warning: '⚠️ Balance Issues',
            recommendations: [
                'Include balance training exercises',
                'Use support when needed',
                'Start with stable exercises before progressing',
                'Focus on core strengthening'
            ]
        },
        'joint pain': {
            warning: '⚠️ Joint Pain',
            recommendations: [
                'Avoid exercises that cause pain',
                'Use proper joint support',
                'Focus on low-impact exercises',
                'Include gentle joint mobility work'
            ]
        },
        'fatigue': {
            warning: '⚠️ Fatigue Management',
            recommendations: [
                'Start with shorter workout sessions',
                'Include regular rest periods',
                'Focus on proper nutrition and hydration',
                'Listen to your body\'s signals'
            ]
        },
        'breathing difficulties': {
            warning: '⚠️ Breathing Difficulties',
            recommendations: [
                'Focus on controlled breathing exercises',
                'Start with low-intensity activities',
                'Include regular rest periods',
                'Monitor breathing during workouts'
            ]
        },
        'posture issues': {
            warning: '⚠️ Posture Issues',
            recommendations: [
                'Focus on posture-correcting exercises',
                'Include core strengthening',
                'Use proper form during all exercises',
                'Include gentle stretching exercises'
            ]
        },
        'coordination issues': {
            warning: '⚠️ Coordination Issues',
            recommendations: [
                'Start with simple exercises',
                'Focus on basic movement patterns',
                'Include coordination exercises',
                'Use clear verbal cues during exercises'
            ]
        },
        'strength limitations': {
            warning: '⚠️ Strength Limitations',
            recommendations: [
                'Start with bodyweight exercises',
                'Use lighter weights with proper form',
                'Focus on proper technique',
                'Gradually increase intensity'
            ]
        },
        'flexibility limitations': {
            warning: '⚠️ Flexibility Limitations',
            recommendations: [
                'Include gentle stretching exercises',
                'Focus on mobility work',
                'Use modifications for exercises',
                'Avoid forcing movements'
            ]
        },
        'endurance limitations': {
            warning: '⚠️ Endurance Limitations',
            recommendations: [
                'Start with shorter workout sessions',
                'Include regular rest periods',
                'Focus on building endurance gradually',
                'Monitor intensity during workouts'
            ]
        }
    }
};

module.exports = healthRecommendations; 