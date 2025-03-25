// Chart Configuration
const chartConfig = {
    weight: {
        type: 'line',
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Weight Progress'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }
                },
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    },
    strength: {
        type: 'line',
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Strength Progress'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume (kg)'
                    }
                },
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    }
};

// Chart Instances
let weightChart;
let strengthChart;

// Initialize Charts
function initializeCharts() {
    const weightCtx = document.getElementById('weightChart').getContext('2d');
    const strengthCtx = document.getElementById('strengthChart').getContext('2d');

    weightChart = new Chart(weightCtx, {
        type: chartConfig.weight.type,
        data: {
            datasets: [{
                label: 'Weight',
                data: [],
                borderColor: '#4F46E5',
                tension: 0.1
            }]
        },
        options: chartConfig.weight.options
    });

    strengthChart = new Chart(strengthCtx, {
        type: chartConfig.strength.type,
        data: {
            datasets: [{
                label: 'Strength',
                data: [],
                borderColor: '#10B981',
                tension: 0.1
            }]
        },
        options: chartConfig.strength.options
    });
}

// Update Charts
function updateCharts() {
    // Update weight chart
    weightChart.data.datasets[0].data = state.progress.weight.map(entry => ({
        x: entry.date,
        y: entry.value
    }));
    weightChart.update();

    // Update strength chart
    strengthChart.data.datasets[0].data = state.progress.strength.map(entry => ({
        x: entry.date,
        y: entry.value
    }));
    strengthChart.update();

    // Update progress analytics
    updateProgressAnalytics();
}

// Progress Analytics
function updateProgressAnalytics() {
    const weightData = state.progress.weight;
    const strengthData = state.progress.strength;

    if (weightData.length > 1) {
        const weightChange = calculateChange(weightData);
        const weightTrend = analyzeTrend(weightData);
        displayWeightAnalytics(weightChange, weightTrend);
    }

    if (strengthData.length > 1) {
        const strengthChange = calculateChange(strengthData);
        const strengthTrend = analyzeTrend(strengthData);
        displayStrengthAnalytics(strengthChange, strengthTrend);
    }
}

function calculateChange(data) {
    if (data.length < 2) return 0;
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    return ((latest - previous) / previous) * 100;
}

function analyzeTrend(data) {
    if (data.length < 3) return 'Not enough data';
    
    const recentValues = data.slice(-3).map(entry => entry.value);
    const differences = recentValues.slice(1).map((value, index) => value - recentValues[index]);
    
    if (differences.every(diff => diff > 0)) return 'Increasing';
    if (differences.every(diff => diff < 0)) return 'Decreasing';
    return 'Fluctuating';
}

function displayWeightAnalytics(change, trend) {
    const analyticsHTML = `
        <div class="analytics-card">
            <h3>Weight Progress</h3>
            <div class="analytics-stats">
                <div class="stat">
                    <span class="stat-label">Change</span>
                    <span class="stat-value ${change > 0 ? 'positive' : 'negative'}">${change.toFixed(1)}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Trend</span>
                    <span class="stat-value">${trend}</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('weightAnalytics').innerHTML = analyticsHTML;
}

function displayStrengthAnalytics(change, trend) {
    const analyticsHTML = `
        <div class="analytics-card">
            <h3>Strength Progress</h3>
            <div class="analytics-stats">
                <div class="stat">
                    <span class="stat-label">Change</span>
                    <span class="stat-value ${change > 0 ? 'positive' : 'negative'}">${change.toFixed(1)}%</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Trend</span>
                    <span class="stat-value">${trend}</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('strengthAnalytics').innerHTML = analyticsHTML;
}

// Load Progress Data
async function loadProgressData() {
    try {
        const response = await fetch('/api/progress');
        if (!response.ok) {
            throw new Error('Failed to load progress data');
        }

        const data = await response.json();
        state.progress = data;
        updateCharts();
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load progress data');
    }
}

// Initialize Progress Tracking
document.querySelector('a[href="#progress"]').addEventListener('click', () => {
    if (!weightChart || !strengthChart) {
        initializeCharts();
        loadProgressData();
    }
}); 