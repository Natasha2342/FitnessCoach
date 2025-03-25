// Workout plan management
class WorkoutManager {
    constructor() {
        this.workoutPlans = [];
        this.currentPlan = null;
        this.initializeEventListeners();
        this.loadWorkoutPlans();
    }

    initializeEventListeners() {
        // Create workout plan button
        const createWorkoutBtn = document.getElementById('createWorkoutBtn');
        if (createWorkoutBtn) {
            createWorkoutBtn.addEventListener('click', () => {
                const onboardingSection = document.getElementById('onboarding');
                if (onboardingSection) {
                    onboardingSection.classList.remove('hidden');
                    // Hide other sections if needed
                    const workoutContainer = document.getElementById('workoutContainer');
                    if (workoutContainer) workoutContainer.classList.add('hidden');
                }
            });
        }

        // Create workout plan form
        const createPlanForm = document.getElementById('create-workout-plan-form');
        if (createPlanForm) {
            createPlanForm.addEventListener('submit', (e) => this.handleCreatePlan(e));
        }

        // Add exercise button
        const addExerciseBtn = document.getElementById('add-exercise-btn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => this.addExerciseForm());
        }

        // Workout plan list
        const planList = document.getElementById('workout-plans-list');
        if (planList) {
            planList.addEventListener('click', (e) => this.handlePlanClick(e));
        }

        // Add workout form
        const addWorkoutForm = document.getElementById('add-workout-form');
        if (addWorkoutForm) {
            addWorkoutForm.addEventListener('submit', (e) => this.handleAddWorkout(e));
        }
    }

    async loadWorkoutPlans() {
        try {
            const response = await fetch('/api/workouts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch workout plans');
            }
            
            this.workoutPlans = await response.json();
            this.renderWorkoutPlans();
        } catch (error) {
            console.error('Error loading workout plans:', error);
            this.showError('Failed to load workout plans');
        }
    }

    renderWorkoutPlans() {
        const planList = document.getElementById('workout-plans-list');
        if (!planList) return;

        planList.innerHTML = this.workoutPlans.map(plan => `
            <div class="workout-plan-card" data-id="${plan._id}">
                <h3>${plan.name}</h3>
                <p>${plan.description || 'No description'}</p>
                <div class="plan-details">
                    <span>Duration: ${plan.duration} weeks</span>
                    <span>Level: ${plan.fitnessLevel}</span>
                    <span>Goals: ${plan.goals.join(', ')}</span>
                </div>
                <div class="plan-actions">
                    <button class="view-plan-btn">View Details</button>
                    <button class="edit-plan-btn">Edit</button>
                    <button class="delete-plan-btn">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async handleCreatePlan(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const planData = {
            name: formData.get('name'),
            description: formData.get('description'),
            duration: parseInt(formData.get('duration')),
            goals: Array.from(formData.getAll('goals')),
            fitnessLevel: formData.get('fitnessLevel')
        };

        try {
            const response = await fetch('/api/workouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(planData)
            });

            if (!response.ok) {
                throw new Error('Failed to create workout plan');
            }
            
            const newPlan = await response.json();
            this.workoutPlans.push(newPlan);
            this.renderWorkoutPlans();
            e.target.reset();
            this.showSuccess('Workout plan created successfully');
        } catch (error) {
            console.error('Error creating workout plan:', error);
            this.showError('Failed to create workout plan');
        }
    }

    addExerciseForm() {
        const container = document.getElementById('exercises-container');
        const exerciseCount = container.children.length;
        
        const exerciseForm = document.createElement('div');
        exerciseForm.className = 'exercise-form';
        exerciseForm.innerHTML = `
            <div class="form-group">
                <label for="exercise-${exerciseCount}-name">Exercise Name</label>
                <input type="text" id="exercise-${exerciseCount}-name" name="exercise-${exerciseCount}-name" required>
            </div>
            <div class="form-group">
                <label for="exercise-${exerciseCount}-sets">Sets</label>
                <input type="number" id="exercise-${exerciseCount}-sets" name="exercise-${exerciseCount}-sets" min="1" required>
            </div>
            <div class="form-group">
                <label for="exercise-${exerciseCount}-reps">Reps</label>
                <input type="number" id="exercise-${exerciseCount}-reps" name="exercise-${exerciseCount}-reps" min="1" required>
            </div>
            <div class="form-group">
                <label for="exercise-${exerciseCount}-weight">Weight (kg)</label>
                <input type="number" id="exercise-${exerciseCount}-weight" name="exercise-${exerciseCount}-weight" min="0" step="0.5">
            </div>
            <div class="form-group">
                <label for="exercise-${exerciseCount}-duration">Duration (minutes)</label>
                <input type="number" id="exercise-${exerciseCount}-duration" name="exercise-${exerciseCount}-duration" min="0">
            </div>
            <div class="form-group">
                <label for="exercise-${exerciseCount}-notes">Notes</label>
                <textarea id="exercise-${exerciseCount}-notes" name="exercise-${exerciseCount}-notes"></textarea>
            </div>
            <button type="button" class="btn btn-danger remove-exercise-btn">Remove Exercise</button>
        `;

        container.appendChild(exerciseForm);

        // Add remove button functionality
        const removeBtn = exerciseForm.querySelector('.remove-exercise-btn');
        removeBtn.addEventListener('click', () => {
            container.removeChild(exerciseForm);
        });
    }

    async handlePlanClick(e) {
        const planCard = e.target.closest('.workout-plan-card');
        if (!planCard) return;

        const planId = planCard.dataset.id;
        const plan = this.workoutPlans.find(p => p._id === planId);
        if (!plan) return;

        if (e.target.classList.contains('view-plan-btn')) {
            this.viewPlanDetails(plan);
        } else if (e.target.classList.contains('edit-plan-btn')) {
            this.editPlan(plan);
        } else if (e.target.classList.contains('delete-plan-btn')) {
            this.deletePlan(plan);
        }
    }

    async viewPlanDetails(plan) {
        try {
            const response = await fetch(`/api/workouts/${plan._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch plan details');
            }
            
            const planDetails = await response.json();
            this.displayPlanDetails(planDetails);
        } catch (error) {
            console.error('Error viewing plan details:', error);
            this.showError('Failed to load plan details');
        }
    }

    displayPlanDetails(plan) {
        const detailsContainer = document.getElementById('workout-plan-details');
        if (!detailsContainer) return;

        detailsContainer.innerHTML = `
            <h2>${plan.name}</h2>
            <p>${plan.description || 'No description'}</p>
            <div class="plan-info">
                <p>Duration: ${plan.duration} weeks</p>
                <p>Fitness Level: ${plan.fitnessLevel}</p>
                <p>Goals: ${plan.goals.join(', ')}</p>
                <p>Status: ${plan.status}</p>
            </div>
            <div class="workouts-list">
                <h3>Workouts</h3>
                ${plan.workouts.map(workout => `
                    <div class="workout-item">
                        <h4>${workout.name}</h4>
                        <p>Type: ${workout.type}</p>
                        <p>Duration: ${workout.duration} minutes</p>
                        <p>Difficulty: ${workout.difficulty}</p>
                        <div class="exercises">
                            ${workout.exercises.map(exercise => `
                                <div class="exercise-item">
                                    <p>${exercise.name}</p>
                                    <p>Sets: ${exercise.sets} | Reps: ${exercise.reps}</p>
                                    ${exercise.weight ? `<p>Weight: ${exercise.weight}kg</p>` : ''}
                                    ${exercise.duration ? `<p>Duration: ${exercise.duration} minutes</p>` : ''}
                                    ${exercise.notes ? `<p>Notes: ${exercise.notes}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async handleAddWorkout(e) {
        e.preventDefault();
        if (!this.currentPlan) {
            this.showError('Please select a workout plan first');
            return;
        }

        const formData = new FormData(e.target);
        const workoutData = {
            name: formData.get('name'),
            type: formData.get('type'),
            duration: parseInt(formData.get('duration')),
            difficulty: formData.get('difficulty'),
            exercises: this.getExercisesFromForm(formData)
        };

        try {
            const response = await fetch(`/api/workouts/${this.currentPlan._id}/workouts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(workoutData)
            });

            if (!response.ok) {
                throw new Error('Failed to add workout');
            }
            
            const updatedPlan = await response.json();
            this.currentPlan = updatedPlan;
            this.displayPlanDetails(updatedPlan);
            e.target.reset();
            this.showSuccess('Workout added successfully');
        } catch (error) {
            console.error('Error adding workout:', error);
            this.showError('Failed to add workout');
        }
    }

    getExercisesFromForm(formData) {
        const exercises = [];
        const exerciseCount = parseInt(formData.get('exercise-count') || '0');
        
        for (let i = 0; i < exerciseCount; i++) {
            exercises.push({
                name: formData.get(`exercise-${i}-name`),
                sets: parseInt(formData.get(`exercise-${i}-sets`)),
                reps: parseInt(formData.get(`exercise-${i}-reps`)),
                weight: parseFloat(formData.get(`exercise-${i}-weight`)) || 0,
                duration: parseInt(formData.get(`exercise-${i}-duration`)) || 0,
                notes: formData.get(`exercise-${i}-notes`)
            });
        }
        
        return exercises;
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize workout manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WorkoutManager();
}); 