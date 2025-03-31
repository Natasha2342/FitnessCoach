// DOM Elements
const workoutContainer = document.getElementById('workoutContainer');

// Workout Plan Templates
function createWorkoutCard(workout) {
    return `
        <div class="workout-card" data-workout-id="${workout.id}">
            <div class="workout-header">
                <h3>${workout.name}</h3>
                <span class="workout-type">${workout.type}</span>
            </div>
            <div class="workout-details">
                ${createExerciseList(workout.exercises)}
            </div>
            <div class="workout-actions">
                <button class="btn btn-primary" onclick="startWorkout('${workout.id}')">Start Workout</button>
                <button class="btn btn-outline" onclick="viewDetails('${workout.id}')">View Details</button>
            </div>
        </div>
    `;
}

function createExerciseList(exercises) {
    return `
        <ul class="exercise-list">
            ${exercises.map(exercise => `
                <li class="exercise-item">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-meta">
                        ${exercise.sets}x${exercise.reps} ${exercise.weight ? `@ ${exercise.weight}kg` : ''}
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}

// Display Workout Plan
function displayWorkoutPlan(workoutPlan) {
    if (!workoutPlan || !workoutPlan.workouts) {
        workoutContainer.innerHTML = '<p>No workout plan available. Please complete the assessment form.</p>';
        return;
    }

    // Generate health recommendations section if they exist
    const healthRecommendationsSection = workoutPlan.healthRecommendations && workoutPlan.healthRecommendations.length > 0 ? `
        <div class="health-recommendations-section">
            <h3><i class="fas fa-exclamation-triangle"></i> Health Recommendations</h3>
            ${workoutPlan.healthRecommendations.map(rec => `
                <div class="health-recommendation">
                    <h4>${rec.warning}</h4>
                    <ul>
                        ${rec.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    ` : '';

    const workoutHTML = `
        <div class="workout-plan">
            ${healthRecommendationsSection}
            <div class="plan-header">
                <h2>Your Personalized Workout Plan</h2>
                <p class="plan-meta">Goal: ${workoutPlan.goal} | Level: ${workoutPlan.level}</p>
            </div>
            <div class="workout-grid">
                ${workoutPlan.workouts.map(workout => createWorkoutCard(workout)).join('')}
            </div>
        </div>
    `;

    workoutContainer.innerHTML = workoutHTML;
}

// Workout Actions
async function startWorkout(workoutId) {
    try {
        const response = await fetch(`/api/workouts/${workoutId}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to start workout');
        }

        const workout = await response.json();
        showWorkoutSession(workout);
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to start workout session');
    }
}

function showWorkoutSession(workout) {
    const sessionHTML = `
        <div class="workout-session">
            <div class="session-header">
                <h2>${workout.name}</h2>
                <div class="timer" id="workoutTimer">00:00:00</div>
            </div>
            <div class="exercise-tracker">
                ${workout.exercises.map((exercise, index) => `
                    <div class="exercise-track" data-exercise-id="${exercise.id}">
                        <div class="exercise-info">
                            <h3>${exercise.name}</h3>
                            <p>${exercise.sets}x${exercise.reps} ${exercise.weight ? `@ ${exercise.weight}kg` : ''}</p>
                        </div>
                        <div class="set-tracker">
                            ${Array(exercise.sets).fill(0).map((_, setIndex) => `
                                <div class="set">
                                    <span>Set ${setIndex + 1}</span>
                                    <input type="number" 
                                           class="reps-input" 
                                           placeholder="Reps"
                                           onchange="updateSet(${exercise.id}, ${setIndex}, this.value)">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="session-actions">
                <button class="btn btn-primary" onclick="completeWorkout()">Complete Workout</button>
                <button class="btn btn-outline" onclick="cancelWorkout()">Cancel</button>
            </div>
        </div>
    `;

    workoutContainer.innerHTML = sessionHTML;
    startWorkoutTimer();
}

// Workout Timer
let workoutTime = 0;
let workoutTimer;

function startWorkoutTimer() {
    const timerElement = document.getElementById('workoutTimer');
    workoutTime = 0;
    
    workoutTimer = setInterval(() => {
        workoutTime++;
        const hours = Math.floor(workoutTime / 3600);
        const minutes = Math.floor((workoutTime % 3600) / 60);
        const seconds = workoutTime % 60;
        
        timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// Workout Progress Tracking
function updateSet(exerciseId, setIndex, reps) {
    // Validate reps
    if (reps < 0) return;

    // Update progress in state
    const exercise = state.currentWorkout.exercises.find(e => e.id === exerciseId);
    if (exercise) {
        if (!exercise.progress) exercise.progress = [];
        exercise.progress[setIndex] = parseInt(reps);
    }
}

async function completeWorkout() {
    try {
        clearInterval(workoutTimer);
        
        const workoutData = {
            workoutId: state.currentWorkout.id,
            duration: workoutTime,
            exercises: state.currentWorkout.exercises.map(exercise => ({
                id: exercise.id,
                sets: exercise.progress || []
            }))
        };

        const response = await fetch('/api/workouts/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workoutData)
        });

        if (!response.ok) {
            throw new Error('Failed to save workout completion');
        }

        // Show completion summary
        showWorkoutSummary(workoutData);
        
        // Update progress
        updateProgress('strength', calculateWorkoutVolume(workoutData));
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to save workout completion');
    }
}

function calculateWorkoutVolume(workoutData) {
    // Calculate total volume (weight * reps * sets)
    let totalVolume = 0;
    workoutData.exercises.forEach(exercise => {
        const exerciseData = state.currentWorkout.exercises.find(e => e.id === exercise.id);
        if (exerciseData.weight) {
            totalVolume += exerciseData.weight * exercise.sets.reduce((a, b) => a + b, 0);
        }
    });
    return totalVolume;
}

function showWorkoutSummary(workoutData) {
    const hours = Math.floor(workoutData.duration / 3600);
    const minutes = Math.floor((workoutData.duration % 3600) / 60);
    const seconds = workoutData.duration % 60;
    
    const summaryHTML = `
        <div class="workout-summary">
            <h2>Workout Complete! 💪</h2>
            <div class="summary-stats">
                <div class="stat">
                    <span class="stat-label">Duration</span>
                    <span class="stat-value">${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Exercises</span>
                    <span class="stat-value">${workoutData.exercises.length}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Volume</span>
                    <span class="stat-value">${calculateWorkoutVolume(workoutData)}kg</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="showSection('workout-plan')">Back to Workout Plan</button>
        </div>
    `;

    workoutContainer.innerHTML = summaryHTML;
}

function cancelWorkout() {
    if (confirm('Are you sure you want to cancel this workout?')) {
        clearInterval(workoutTimer);
        showSection('workout-plan');
    }
}

// Workout Details View
async function viewDetails(workoutId) {
    try {
        const response = await fetch(`/api/workouts/${workoutId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch workout details');
        }

        const workout = await response.json();
        showWorkoutDetails(workout);
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load workout details');
    }
}

function showWorkoutDetails(workout) {
    const detailsContainer = document.getElementById('workout-details');
    if (!detailsContainer) return;

    // Generate health recommendations section if they exist
    const healthRecommendationsSection = workout.healthRecommendations && workout.healthRecommendations.length > 0 ? `
        <div class="health-recommendations-section">
            <h3><i class="fas fa-exclamation-triangle"></i> Health Recommendations</h3>
            ${workout.healthRecommendations.map(rec => `
                <div class="health-recommendation">
                    <h4>${rec.warning}</h4>
                    <ul>
                        ${rec.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    ` : '';

    const detailsHTML = `
        <div class="workout-details">
            ${healthRecommendationsSection}
            <div class="details-section">
                <h3>Workout Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <i class="fas fa-dumbbell"></i>
                        <span>Fitness Level: ${workout.fitnessLevel}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-bullseye"></i>
                        <span>Goal: ${workout.goal}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>Days per Week: ${workout.schedule?.daysPerWeek || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>Session Duration: ${workout.schedule?.sessionDuration || 'N/A'} minutes</span>
                    </div>
                </div>
            </div>
            ${workout.healthInfo?.injuries || workout.healthInfo?.medicalConditions || workout.healthInfo?.limitations ? `
                <div class="details-section">
                    <h3>Health Information</h3>
                    ${workout.healthInfo.injuries ? `
                        <div class="info-item">
                            <i class="fas fa-band-aid"></i>
                            <span>Injuries: ${workout.healthInfo.injuries}</span>
                        </div>
                    ` : ''}
                    ${workout.healthInfo.medicalConditions ? `
                        <div class="info-item">
                            <i class="fas fa-notes-medical"></i>
                            <span>Medical Conditions: ${workout.healthInfo.medicalConditions}</span>
                        </div>
                    ` : ''}
                    ${workout.healthInfo.limitations ? `
                        <div class="info-item">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>Limitations: ${workout.healthInfo.limitations}</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="details-section">
                <h3>Your Personalized Workout Routine</h3>
                ${workout.workouts.map((workout, index) => `
                    <div class="workout-day">
                        <h4>Day ${index + 1}</h4>
                        <div class="exercises-list">
                            ${workout.exercises.map(exercise => `
                                <div class="exercise-item">
                                    <h5>${exercise.name}</h5>
                                    <p>Sets: ${exercise.sets} | Reps: ${exercise.reps}</p>
                                    ${exercise.weight ? `<p>Weight: ${exercise.weight}kg</p>` : ''}
                                    ${exercise.notes ? `<p>Notes: ${exercise.notes}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    detailsContainer.innerHTML = detailsHTML;
}

class WorkoutManager {
    constructor() {
        this.modal = document.getElementById('createWorkoutModal');
        this.createBtn = document.getElementById('createWorkoutBtn');
        this.cancelBtn = document.getElementById('cancelWorkoutBtn');
        this.createForm = document.getElementById('createWorkoutForm');
        this.workoutContainer = document.getElementById('workoutContainer');
        
        this.initializeEventListeners();
        this.loadWorkoutPlans();
    }

    initializeEventListeners() {
        // Create workout button
        if (this.createBtn) {
            this.createBtn.addEventListener('click', () => this.showModal());
        }

        // Cancel button
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.hideModal());
        }

        // Form submission
        if (this.createForm) {
            this.createForm.addEventListener('submit', (e) => this.handleCreatePlan(e));
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    showModal() {
        if (this.modal) {
            this.modal.classList.remove('hidden');
            setTimeout(() => this.modal.classList.add('show'), 10);
        }
    }

    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => this.modal.classList.add('hidden'), 300);
        }
    }

    async handleCreatePlan(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        // Validate required fields
        const requiredFields = ['workoutName', 'fitnessLevel', 'goal', 'daysPerWeek', 'sessionDuration'];
        for (const field of requiredFields) {
            if (!formData.get(field)) {
                this.showNotification(`Please fill in all required fields: ${field}`, 'error');
                return;
            }
        }

        // Get the goal value and ensure it uses underscores
        const goal = formData.get('goal').replace(/-/g, '_');

        const data = {
            name: formData.get('workoutName'),
            fitnessLevel: formData.get('fitnessLevel'),
            goal: goal, // Use the formatted goal value
            physicalInfo: {
                height: formData.get('height') ? Number(formData.get('height')) : undefined,
                weight: formData.get('weight') ? Number(formData.get('weight')) : undefined,
                age: formData.get('age') ? Number(formData.get('age')) : undefined
            },
            healthInfo: {
                injuries: formData.get('injuries') ? formData.get('injuries').split(',').map(i => i.trim()) : [],
                medicalConditions: formData.get('medicalConditions') ? formData.get('medicalConditions').split(',').map(m => m.trim()) : [],
                limitations: formData.get('limitations') ? formData.get('limitations').split(',').map(l => l.trim()) : []
            },
            schedule: {
                daysPerWeek: Number(formData.get('daysPerWeek')),
                sessionDuration: Number(formData.get('sessionDuration'))
            }
        };

        try {
            const response = await fetch('/api/workouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create workout plan');
            }

            const workoutPlan = await response.json();
            this.hideModal();
            this.createForm.reset();
            this.loadWorkoutPlans();
            this.showNotification('Workout plan created successfully!', 'success');
        } catch (error) {
            console.error('Error creating workout plan:', error);
            this.showNotification(error.message || 'Failed to create workout plan', 'error');
        }
    }

    async loadWorkoutPlans() {
        try {
            // Check if token exists
            const token = localStorage.getItem('token');
            if (!token) {
                this.showNotification('Please log in to view workout plans', 'error');
                return;
            }

            console.log('Fetching workout plans with token:', token);
            const response = await fetch('/api/workouts', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server response:', errorData);
                throw new Error(errorData.error || 'Failed to load workout plans');
            }

            const plans = await response.json();
            console.log('Received workout plans:', plans);
            this.renderWorkoutPlans(plans);
        } catch (error) {
            console.error('Error loading workout plans:', error);
            this.showNotification(error.message || 'Failed to load workout plans. Please try logging in again.', 'error');
        }
    }

    renderWorkoutPlans(plans) {
        if (!this.workoutContainer) return;

        if (!plans || plans.length === 0) {
            this.workoutContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-dumbbell"></i>
                    <h3>No Workout Plans Yet</h3>
                    <p>Create your first workout plan to get started!</p>
                </div>
            `;
            return;
        }

        this.workoutContainer.innerHTML = plans.map(plan => {
            // Safely access nested properties
            const schedule = plan.schedule || {};
            const daysPerWeek = schedule.daysPerWeek || 'N/A';
            const sessionDuration = schedule.sessionDuration || 'N/A';
            const fitnessLevel = plan.fitnessLevel || 'Not specified';
            const goal = plan.goal || 'Not specified';

            return `
                <div class="workout-card" data-id="${plan._id}">
                    <div class="workout-header">
                        <h3><i class="fas fa-dumbbell"></i> ${plan.name || 'Unnamed Plan'}</h3>
                        <span class="workout-type">${fitnessLevel}</span>
                    </div>
                    <div class="workout-details">
                        <div class="detail-item">
                            <i class="fas fa-bullseye"></i>
                            <span>Goal: ${goal}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${daysPerWeek} days/week</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${sessionDuration} min/session</span>
                        </div>
                    </div>
                    <div class="workout-actions">
                        <button class="btn btn-secondary view-btn" data-id="${plan._id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-danger delete-btn" data-id="${plan._id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to buttons
        this.workoutContainer.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', () => this.viewWorkoutPlan(button.dataset.id));
        });

        this.workoutContainer.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => this.deleteWorkoutPlan(button.dataset.id));
        });
    }

    async viewWorkoutPlan(planId) {
        try {
            const response = await fetch(`/api/workouts/${planId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch workout plan details');
            }

            const plan = await response.json();
            this.showWorkoutDetails(plan);
        } catch (error) {
            console.error('Error viewing workout plan:', error);
            this.showNotification(error.message || 'Failed to load workout plan details', 'error');
        }
    }

    showWorkoutDetails(plan) {
        if (!this.workoutContainer) return;

        // Generate health recommendations section if they exist
        const healthRecommendationsSection = plan.healthRecommendations && plan.healthRecommendations.length > 0 ? `
            <div class="health-recommendations-section">
                <h3><i class="fas fa-exclamation-triangle"></i> Health Recommendations</h3>
                ${plan.healthRecommendations.map(rec => `
                    <div class="health-recommendation">
                        <h4>${rec.warning}</h4>
                        <ul>
                            ${rec.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        ` : '';

        const detailsHTML = `
            <div class="workout-details-view">
                <div class="details-header">
                    <h2>${plan.name || 'Unnamed Plan'}</h2>
                </div>
                <div class="details-content">
                    ${healthRecommendationsSection}
                    <div class="details-section">
                        <h3>Basic Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <i class="fas fa-level-up-alt"></i>
                                <span>Fitness Level: ${plan.fitnessLevel || 'Not specified'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-bullseye"></i>
                                <span>Goal: ${plan.goal || 'Not specified'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-calendar"></i>
                                <span>Duration: ${plan.duration || 'Not specified'} minutes</span>
                            </div>
                        </div>
                    </div>
                    <div class="details-section">
                        <h3>Physical Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <i class="fas fa-ruler-vertical"></i>
                                <span>Height: ${plan.physicalInfo?.height || 'N/A'}cm</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-weight"></i>
                                <span>Weight: ${plan.physicalInfo?.weight || 'N/A'}kg</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-birthday-cake"></i>
                                <span>Age: ${plan.physicalInfo?.age || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="details-section">
                        <h3>Schedule</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <i class="fas fa-calendar"></i>
                                <span>Days per Week: ${plan.schedule?.daysPerWeek || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span>Session Duration: ${plan.schedule?.sessionDuration || 'N/A'} minutes</span>
                            </div>
                        </div>
                    </div>
                    ${plan.healthInfo?.injuries || plan.healthInfo?.medicalConditions || plan.healthInfo?.limitations ? `
                        <div class="details-section">
                            <h3>Health Information</h3>
                            ${plan.healthInfo.injuries ? `
                                <div class="info-item">
                                    <i class="fas fa-band-aid"></i>
                                    <span>Injuries: ${plan.healthInfo.injuries}</span>
                                </div>
                            ` : ''}
                            ${plan.healthInfo.medicalConditions ? `
                                <div class="info-item">
                                    <i class="fas fa-notes-medical"></i>
                                    <span>Medical Conditions: ${plan.healthInfo.medicalConditions}</span>
                                </div>
                            ` : ''}
                            ${plan.healthInfo.limitations ? `
                                <div class="info-item">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span>Limitations: ${plan.healthInfo.limitations}</span>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    <div class="details-section">
                        <h3>Your Personalized Workout Routine</h3>
                        ${plan.workouts && plan.workouts.length > 0 ? `
                            <div class="workouts-list">
                                ${plan.workouts.map((workout, index) => `
                                    <div class="workout-item">
                                        <h4>${workout.name}</h4>
                                        <div class="workout-meta">
                                            <span><i class="fas fa-clock"></i> ${workout.duration} minutes</span>
                                            <span><i class="fas fa-level-up-alt"></i> ${workout.difficulty}</span>
                                            <span><i class="fas fa-dumbbell"></i> ${workout.type}</span>
                                        </div>
                                        <div class="exercises-list">
                                            ${workout.exercises.map(exercise => `
                                                <div class="exercise-item">
                                                    <h5>${exercise.name}</h5>
                                                    <div class="exercise-details">
                                                        ${exercise.sets ? `
                                                            <span>${exercise.sets} sets × ${exercise.reps} reps</span>
                                                            ${exercise.weight ? `<span>@ ${exercise.weight}kg</span>` : ''}
                                                        ` : `
                                                            <span>Duration: ${exercise.duration} seconds</span>
                                                            ${exercise.rest ? `<span>Rest: ${exercise.rest} seconds</span>` : ''}
                                                        `}
                                                        ${exercise.notes ? `<p class="exercise-notes">${exercise.notes}</p>` : ''}
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="no-workouts">
                                <p>No workouts have been generated for this plan yet.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        this.workoutContainer.innerHTML = detailsHTML;
    }

    async deleteWorkoutPlan(planId) {
        if (!confirm('Are you sure you want to delete this workout plan? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/workouts/${planId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete workout plan');
            }

            this.showNotification('Workout plan deleted successfully', 'success');
            this.loadWorkoutPlans();
        } catch (error) {
            console.error('Error deleting workout plan:', error);
            this.showNotification(error.message || 'Failed to delete workout plan', 'error');
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    async addWorkout(planId) {
        try {
            const response = await fetch(`/api/workouts/${planId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch workout plan details');
            }

            const plan = await response.json();
            this.currentPlan = plan;
            this.showAddWorkoutModal(planId);
        } catch (error) {
            console.error('Error loading workout plan:', error);
            this.showNotification('Failed to load workout plan details', 'error');
        }
    }

    showAddWorkoutModal(planId) {
        const modalHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-plus"></i> Add New Workout</h3>
                <form id="addWorkoutForm">
                    <div class="form-group">
                        <label for="workoutName">Workout Name</label>
                        <input type="text" id="workoutName" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="workoutType">Type</label>
                        <select id="workoutType" name="type" required>
                            <option value="strength">Strength</option>
                            <option value="cardio">Cardio</option>
                            <option value="flexibility">Flexibility</option>
                            <option value="hiit">HIIT</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="workoutDuration">Duration (minutes)</label>
                        <input type="number" id="workoutDuration" name="duration" required min="15" max="180">
                    </div>
                    <div class="form-group">
                        <label for="workoutDifficulty">Difficulty</label>
                        <select id="workoutDifficulty" name="difficulty" required>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Exercises</label>
                        <div id="exercisesList"></div>
                        <button type="button" class="btn btn-secondary" onclick="workoutManager.addExerciseForm()">
                            <i class="fas fa-plus"></i> Add Exercise
                        </button>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Workout</button>
                        <button type="button" class="btn btn-outline" onclick="workoutManager.hideModal()">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        const modal = document.getElementById('createWorkoutModal');
        modal.innerHTML = modalHTML;
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('show'), 10);

        // Add form submit handler
        const form = document.getElementById('addWorkoutForm');
        form.addEventListener('submit', (e) => this.handleAddWorkout(e, planId));
    }

    addExerciseForm() {
        const exercisesList = document.getElementById('exercisesList');
        const exerciseIndex = exercisesList.children.length;

        const exerciseHTML = `
            <div class="exercise-form" data-index="${exerciseIndex}">
                <h4>Exercise ${exerciseIndex + 1}</h4>
                <div class="form-group">
                    <label for="exerciseName${exerciseIndex}">Name</label>
                    <input type="text" id="exerciseName${exerciseIndex}" name="exercises[${exerciseIndex}][name]" required>
                </div>
                <div class="form-group">
                    <label for="exerciseSets${exerciseIndex}">Sets</label>
                    <input type="number" id="exerciseSets${exerciseIndex}" name="exercises[${exerciseIndex}][sets]" required min="1" max="10">
                </div>
                <div class="form-group">
                    <label for="exerciseReps${exerciseIndex}">Reps</label>
                    <input type="number" id="exerciseReps${exerciseIndex}" name="exercises[${exerciseIndex}][reps]" required min="1">
                </div>
                <div class="form-group">
                    <label for="exerciseWeight${exerciseIndex}">Weight (kg)</label>
                    <input type="number" id="exerciseWeight${exerciseIndex}" name="exercises[${exerciseIndex}][weight]" min="0" step="0.5">
                </div>
                <div class="form-group">
                    <label for="exerciseNotes${exerciseIndex}">Notes</label>
                    <textarea id="exerciseNotes${exerciseIndex}" name="exercises[${exerciseIndex}][notes]" rows="2"></textarea>
                </div>
                <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i> Remove Exercise
                </button>
            </div>
        `;

        exercisesList.insertAdjacentHTML('beforeend', exerciseHTML);
    }

    async handleAddWorkout(e, planId) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const workoutData = {
                name: formData.get('name'),
                type: formData.get('type'),
                duration: parseInt(formData.get('duration')),
                difficulty: formData.get('difficulty'),
                exercises: this.getExercisesFromForm(formData)
            };

            const response = await fetch(`/api/workouts/${planId}/workouts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(workoutData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add workout');
            }

            const updatedPlan = await response.json();
            this.hideModal();
            this.showWorkoutDetails(updatedPlan);
            this.showNotification('Workout added successfully!', 'success');
        } catch (error) {
            console.error('Error adding workout:', error);
            this.showNotification(error.message || 'Failed to add workout', 'error');
        }
    }

    getExercisesFromForm(formData) {
        const exercises = [];
        const exerciseForms = document.querySelectorAll('.exercise-form');
        
        exerciseForms.forEach(form => {
            const index = form.dataset.index;
            exercises.push({
                name: formData.get(`exercises[${index}][name]`),
                sets: parseInt(formData.get(`exercises[${index}][sets]`)),
                reps: parseInt(formData.get(`exercises[${index}][reps]`)),
                weight: parseFloat(formData.get(`exercises[${index}][weight]`)) || 0,
                notes: formData.get(`exercises[${index}][notes]`)
            });
        });

        return exercises;
    }
}

// Initialize workout manager when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new WorkoutManager();
}); 