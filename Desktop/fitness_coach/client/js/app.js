// State management
const state = {
    user: null,
    workoutPlan: null,
    progress: {
        weight: [],
        strength: []
    }
};

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const userProfileForm = document.getElementById('userProfileForm');
const sections = document.querySelectorAll('.section');
const navbar = document.querySelector('.navbar');

// Navigation
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').slice(1);
        showSection(targetId);
    });
});

function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}

// Authentication
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        window.location.href = '/login';
    });
}

if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        window.location.href = '/signup';
    });
}

// Form Handling
document.addEventListener('DOMContentLoaded', () => {
    const userProfileForm = document.getElementById('userProfileForm');
    const workoutPlanSection = document.getElementById('workout-plan');
    const onboardingSection = document.getElementById('onboarding');
    const workoutContainer = document.getElementById('workoutContainer');
    const heroSection = document.getElementById('hero');
    const featuresSection = document.getElementById('features');

    // Show notification function
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Handle form submission
    if (userProfileForm) {
        userProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show loading state
            workoutContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
            workoutPlanSection.classList.remove('hidden');
            onboardingSection.classList.add('hidden');

            try {
                // Get form data
                const formData = {
                    height: document.getElementById('height').value,
                    weight: document.getElementById('weight').value,
                    age: document.getElementById('age').value,
                    gender: document.getElementById('gender').value,
                    goal: document.querySelector('input[name="goal"]:checked').value,
                    fitnessLevel: document.getElementById('fitnessLevel').value,
                    medicalConditions: document.getElementById('medicalConditions').value
                };

                // Update user profile
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Please log in to create a workout plan');
                }

                const profileResponse = await fetch('/api/auth/profile', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });

                if (!profileResponse.ok) {
                    throw new Error('Failed to update profile');
                }

                // Generate workout plan
                const workoutResponse = await fetch('/api/workouts/plan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        goal: formData.goal,
                        level: formData.fitnessLevel,
                        preferences: {
                            medicalConditions: formData.medicalConditions
                        }
                    })
                });

                if (!workoutResponse.ok) {
                    const error = await workoutResponse.json();
                    throw new Error(error.message || 'Failed to generate workout plan');
                }

                const workoutPlan = await workoutResponse.json();
                displayWorkoutPlan(workoutPlan);
                showNotification('Workout plan generated successfully!');

            } catch (error) {
                console.error('Error:', error);
                showNotification(error.message, 'error');
                workoutContainer.innerHTML = `
                    <div class="error-message">
                        <p>${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
                    </div>
                `;
            }
        });
    }

    // Display workout plan
    function displayWorkoutPlan(plan) {
        workoutContainer.innerHTML = `
            <div class="workout-plan">
                <div class="plan-header">
                    <h3>${plan.name}</h3>
                    <div class="plan-details">
                        <span>Duration: ${plan.duration}</span>
                        <span>Level: ${plan.level}</span>
                        <span>Goals: ${plan.goals.join(', ')}</span>
                    </div>
                </div>
                <div class="workouts-list">
                    ${plan.workouts.map(workout => `
                        <div class="workout-card">
                            <h4>${workout.name}</h4>
                            <div class="workout-details">
                                <span>Type: ${workout.type}</span>
                                <span>Duration: ${workout.duration}</span>
                                <span>Difficulty: ${workout.difficulty}</span>
                            </div>
                            <div class="exercises-list">
                                ${workout.exercises.map(exercise => `
                                    <div class="exercise-item">
                                        <div class="exercise-info">
                                            <div class="exercise-name">${exercise.name}</div>
                                            <div class="exercise-details">
                                                <span>Sets: ${exercise.sets}</span>
                                                <span>Reps: ${exercise.reps}</span>
                                                ${exercise.rest ? `<span>Rest: ${exercise.rest}</span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Initialize the application
    const token = localStorage.getItem('token');
    if (token) {
        // Show navbar for logged-in users
        if (navbar) navbar.style.display = 'flex';
        
        // Load user data
        fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            state.user = data.user;
            // Show appropriate section based on user profile
            if (state.user.profile.fitnessLevel) {
                if (onboardingSection) onboardingSection.classList.add('hidden');
                if (workoutPlanSection) workoutPlanSection.classList.remove('hidden');
                if (heroSection) heroSection.classList.add('hidden');
                if (featuresSection) featuresSection.classList.add('hidden');
            } else {
                if (onboardingSection) onboardingSection.classList.remove('hidden');
                if (workoutPlanSection) workoutPlanSection.classList.add('hidden');
                if (heroSection) heroSection.classList.add('hidden');
                if (featuresSection) featuresSection.classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('Error loading user data:', error);
            localStorage.removeItem('token');
            // Hide navbar and show public content
            if (navbar) navbar.style.display = 'none';
            if (heroSection) heroSection.classList.remove('hidden');
            if (featuresSection) featuresSection.classList.remove('hidden');
            if (onboardingSection) onboardingSection.classList.add('hidden');
            if (workoutPlanSection) workoutPlanSection.classList.add('hidden');
        });
    } else {
        // Hide navbar and show public content for non-logged in users
        if (navbar) navbar.style.display = 'none';
        if (heroSection) heroSection.classList.remove('hidden');
        if (featuresSection) featuresSection.classList.remove('hidden');
        if (onboardingSection) onboardingSection.classList.add('hidden');
        if (workoutPlanSection) workoutPlanSection.classList.add('hidden');
    }
});

// Error Handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// API Utilities
async function fetchAPI(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showError('An error occurred while communicating with the server');
        throw error;
    }
}

// Progress Tracking
function updateProgress(type, value) {
    state.progress[type].push({
        date: new Date(),
        value: parseFloat(value)
    });
    
    // Update progress charts
    updateCharts();
    
    // Save to backend
    fetchAPI('progress', {
        method: 'POST',
        body: JSON.stringify({
            type,
            value,
            date: new Date()
        })
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 