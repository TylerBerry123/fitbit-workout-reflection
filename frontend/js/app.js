document.addEventListener('DOMContentLoaded', () => {

    const workoutsTableBody = document.querySelector('#workoutsTable tbody');
    const workoutSection = document.getElementById('workoutSection');
    const reflectionForm = document.getElementById('reflection');

    const workoutsTab = document.getElementById('workoutsTab');
    const insightsTab = document.getElementById('insightsTab');
    const workoutsView = document.getElementById('workoutsView');
    const insightsView = document.getElementById('insightsView');

    let cachedWorkouts = [];
    
    workoutsTab.addEventListener('click', () => {
        workoutsTab.classList.add('active');
        insightsTab.classList.remove('active');

        workoutsView.classList.remove('hidden');
        insightsView.classList.add('hidden');
    });

    insightsTab.addEventListener('click', async () => {
        insightsTab.classList.add('active');
        workoutsTab.classList.remove('active');

        workoutsView.classList.add('hidden');
        insightsView.classList.remove('hidden');

        await loadTrends();
        await loadInsights();
    });

    const duringMetrics = [
        { name: 'mood', label: 'Mood' },
        { name: 'hydration', label: 'Hydration' },
        { name: 'effort', label: 'Effort' },
        { name: 'satisfaction', label: 'Satisfaction' }
    ];

    const afterMetrics = [
        { name: 'sleep', label: 'Sleep Quality' },
        { name: 'fatigue', label: 'Fatigue' },
        { name: 'motivation', label: 'Motivation for Next Workout' },
        { name: 'pain', label: 'Pain / Soreness' }
    ];

    let selectedWorkout = null;
    let selectedWorkoutRow = null;

    init();

    async function init() {
        renderMetrics('duringMetrics', duringMetrics);
        renderMetrics('afterMetrics', afterMetrics);

        initialiseStarRatings();
        await loadWorkouts();
    }

    function daysAgoFrom(dateString) {
        const workoutDate = new Date(dateString);
        const today = new Date();

        // Removing time for accurate day difference
        workoutDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0)

        const diffMs = today - workoutDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays} days ago`;
    }

    async function loadWorkouts() {
        try {
            const workoutsResponse = await fetch('/workouts');
            const workoutsData = await workoutsResponse.json();
            const workouts = workoutsData.activities;
            cachedWorkouts = workouts;

            const reflectionsRes = await fetch('/reflections');
            const reflections = await reflectionsRes.json();
            const reflectedIds = new Set(reflections.map(r => String(r.workout_log_id)));

            workoutsTableBody.innerHTML = '';

            workouts.forEach(w => {
                const tr = document.createElement('tr');

                tr.innerHTML = `
                        <td>${w.activityName}</td>
                        <td>${new Date(w.startTime).toLocaleString()}</td>
                        <td>${Math.round(w.duration / 60000)}</td>
                    `;

                if (reflectedIds.has(String(w.logId))) tr.classList.add('reflected');

                tr.addEventListener('click', () => {
                    selectedWorkoutRow = tr;
                    displayWorkout(w);
                });
                workoutsTableBody.appendChild(tr);
            });

        } catch (error) {
            console.log('Error loading workouts:', error);
        }
    }

    async function displayWorkout(workout) {
        selectedWorkout = workout;

        workoutSection.classList.remove('hidden');

        document.getElementById('workoutID').textContent = workout.logId;
        document.getElementById('activity').textContent = workout.activityName;
        document.getElementById('start').textContent = new Date(workout.startTime).toLocaleString();
        document.getElementById('duration').textContent = Math.round(workout.duration / 60000);
        document.getElementById('heartrate').textContent = workout.averageHeartRate || 'N/A';
        document.getElementById('calories').textContent = workout.calories || 'N/A';
        document.getElementById('steps').textContent = workout.steps || 'N/A';
        document.getElementById('device').textContent = workout.source?.name || "Unknown";

       workoutSection.scrollIntoView({ behaviour: 'smooth' });

        const res = await fetch(`/reflections/${workout.logId}`);
        const reflection = await res.json();

        if (reflection) {
            populateReflectionForm(reflection);
            disableReflectionForm();
        } else {
            enableReflectionForm();
            resetStarRatings();
        }
    }

    function populateReflectionForm(reflection) {
        Object.keys(reflection).forEach(key => {
            const input = document.querySelector(`input[name="${key}"]`);
            if (!input) return;

            input.value = reflection[key];

            const container = input.previousElementSibling; // .star-rating
            const stars = container.querySelectorAll('i');

            stars.forEach(star => {
                const starValue = Number(star.dataset.value);
                star.classList.toggle('bi-star-fill', starValue <= reflection[key]);
                star.classList.toggle('bi-star', starValue > reflection[key]);
                star.classList.toggle('filled', starValue <= reflection[key]);
            });
        });
    }

    function disableReflectionForm() {
        // Disable star clicks/hover
        document.querySelectorAll('.star-rating').forEach(container => {
            container.classList.add('disabled');
        });

        // Hide submit button
        const submitButton = reflectionForm.querySelector('button[type="submit"]');
        submitButton.classList.add('hidden');

        showReflectionMessage();
        addViewInsightButton();
        addDeleteReflectionButton();
    }

    function enableReflectionForm() {
        document.querySelectorAll('.star-rating').forEach(container => {
            container.classList.remove('disabled');
        });

        const submitButton = reflectionForm.querySelector('button[type="submit"]');
        submitButton.classList.remove('hidden');

        removeReflectionMessage();

        const existingBtn = document.getElementById('viewInsightBtn');
        if (existingBtn) existingBtn.remove();

        const deleteBtn = document.getElementById('deleteReflectionBtn');
        if (deleteBtn) deleteBtn.remove();
    }

    function showReflectionMessage() {
        let message = document.getElementById('reflectionMessage');

        if (!message) {
            message = document.createElement('div');
            message.id = 'reflectionMessage';
            message.className = 'alert alert-info mt-3';
            message.textContent = 'Reflection already submitted for this workout.';
            reflectionForm.prepend(message);
        }
    }

    function removeReflectionMessage() {
        const message = document.getElementById('reflectionMessage');
        if (message) message.remove();
    }

    async function switchToInsights(workoutId) {

        // Activate Insights tab
        insightsTab.classList.add('active');
        workoutsTab.classList.remove('active');

        workoutsView.classList.add('hidden');
        insightsView.classList.remove('hidden');

        await loadTrends();
        await loadInsights();

        const target = document.getElementById(`insight-${workoutId}`);

        if (target) {
            target.scrollIntoView({ behaviour: 'smooth', block: 'center' });
            highlightInsight(target);
        }
    }

    function addViewInsightButton() {
        if (document.getElementById('viewInsightBtn')) return;

        const button = document.createElement('button');
        button.id = 'viewInsightBtn';
        button.type = 'button';
        button.className = 'btn btn-outline-white mt-3';
        button.textContent = 'View Insight';

        button.addEventListener('click', () => {
            switchToInsights(selectedWorkout.logId);
        });

        reflectionForm.appendChild(button);
    }

    
    function addDeleteReflectionButton() {
        if (document.getElementById('deleteReflectionBtn')) return;

        const button = document.createElement('button');
        button.id = 'deleteReflectionBtn';
        button.type = 'button';
        button.className = 'btn btn-outline-danger mt-3 ms-2';
        button.textContent = 'Delete Reflection';

        button.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this reflection?')) return;

            try {
                const res = await fetch(`/reflections/${selectedWorkout.logId}`, { method: 'DELETE' });
                const data = await res.json();
                
                if (data.success) {
                    enableReflectionForm();

                    document.querySelectorAll('#workoutsTable tbody tr')
                        .forEach(tr => tr.classList.remove('reflected'));

                    workoutSection.classList.add('hidden');

                    await loadWorkouts();
                    await loadInsights();
                }
            } catch (error) {
                console.error('Delete error: ', error);
            }
        });

        reflectionForm.appendChild(button);
    }

    function highlightInsight(element) {
        element.classList.add('highlighted-insight');

        setTimeout(() => {
            element.classList.remove('highlighted-insight');
        }, 3000);
    }

    reflectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedWorkout) return;

        const formData = new FormData(reflectionForm);
        const reflection = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('reflections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workoutLogId: selectedWorkout.logId,
                    ...reflection
                })
            });

            const data = await res.json();

            if (data.success) {
                disableReflectionForm();
                if (selectedWorkoutRow) selectedWorkoutRow.classList.add('reflected');
            }

        } catch (error) {
            console.error('Error saving reflection: ', error);
        }
    });

    async function loadTrends() {
        try {
            const response = await fetch('/insights/trends');
            const trends = await response.json();

            const container = document.getElementById('trendsContainer');
            const content = document.getElementById('trendsContent');

            content.innerHTML = '';

            if (!trends || trends.length === 0) {
                container.classList.add('hidden');
                return;
            }

            container.classList.remove('hidden');

            const trendsRow = document.createElement('div');
            trendsRow.className = 'd-flex flex-wrap gap-3';

            trends.forEach(trend => {
                const trendBox = document.createElement('div');
                trendBox.className = 'trend-box p-3';

                let priorityClass = '';

                if (Number(trend.priority) === 1) {
                    priorityClass = 'trend-priority-1';
                } else if (trend.priority == 2 || trend.priority == 3) {
                    priorityClass = 'trend-priority-2';
                } else {
                    priorityClass = 'trend-priority-4';
                }

                console.log(trend.rule_id, trend.priority)

                trendBox.innerHTML = `
                    <div class="trend-rule-id ${priorityClass}">${trend.rule_id}</div>
                    <div class="trend-rule-name">${trend.rule_name}</div>
                    <div class="trend-count">${trend.count} times</div>
                    <div class="trend-percentage">${trend.percentage}%</div>
                    
                `;

                trendsRow.appendChild(trendBox);
            });

            content.appendChild(trendsRow);

        } catch (error) {
            console.error('Error loading trends: ', error);
        }
    }

    async function loadInsights() {
        try {
            const response = await fetch('/insights');
            const groupedInsights = await response.json();

            const container = document.getElementById('insightsContainer');
            container.innerHTML = '';

            if (!groupedInsights || groupedInsights.length === 0) {
                container.innerHTML = '<p>No insights available yet.<p>';
                return;
            }

            for (const group of groupedInsights) {
                const workout = cachedWorkouts.find(
                    w => String(w.logId) === String(group.workout_log_id)
                );

                const activityName = workout ? workout.activityName : 'Unknown';
                const startTime = workout ? workout.startTime : 'Unknown';

                const div = document.createElement('div');
                div.className = 'card mb-3 p-3';
                div.id = `insight-${group.workout_log_id}`;

                const workoutHeader = `
                    <h6 class="mb-3">
                        ${activityName} - ${daysAgoFrom(startTime)}
                    </h6>
                `;

                div.innerHTML = workoutHeader;

                group.insights.forEach(insight => {
                    const insightCard = document.createElement('div');
                    insightCard.className = 'border rounded p-3 mb-2 bg-primary bg-opacity-25 text-white';

                    let priorityClass = '';

                    if (insight.priority === 1) {
                        priorityClass = 'bg-danger';
                    } else if (insight.priority === 2 || insight.priority === 3) {
                        priorityClass = 'bg-warning';
                    } else {
                        priorityClass = 'bg-primary';
                    }

                    insightCard.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center mb-2>
                            <span>
                                <span class="badge bg-secondary me-2">
                                ${insight.rule_id}
                                </span>
                                <strong>${insight.rule_name}</strong>
                            </span>
                            <span class="badge ${priorityClass}">
                                Priority ${insight.priority}
                            </span>
                        </div>

                        <p class="mb-2">${insight.message}</p>

                        <button class="btn btn-sm btn-outline-white toggle-rationale">
                            Show Rationale
                        </button>

                        <div class="rationale mt-2 hidden">
                            <small>${insight.rationale}</small>
                        </div> 
                    `;

                    div.appendChild(insightCard);
                });

                const reflectionFooter = document.createElement('div');
                reflectionFooter.className = 'mt-2 text-end';

                reflectionFooter.innerHTML = `
                                    <small>Reflected on: ${new Date(group.created_at).toLocaleDateString()}</small>
                `;

                div.appendChild(reflectionFooter);

                container.appendChild(div);
            }

        } catch(error) {
            console.error('Error loading insights:', error);

            const container = document.getElementById('insightsContainer');
            container.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load insights.
                </div>
            `;
        }
    }

    document.addEventListener('click', (e) => {

        // Rationale Togle
        if (e.target.classList.contains('toggle-rationale')) {

            const rationaleDiv = e.target.nextElementSibling;

            rationaleDiv.classList.toggle('hidden');

            e.target.textContent = rationaleDiv.classList.contains('hidden') ? 'Show Rationale' : 'Hide Rationale';
        }

        // Trends Toggle
        if (e.target.id === 'toggleTrendsBtn') {
            const wrapper = document.getElementById('trendsContentWrapper');

            wrapper.classList.toggle('hidden');

            e.target.textContent = wrapper.classList.contains('hidden') ? 'Show' : 'Hide';
        }
    });

    

    function renderMetrics(containerId, metrics) {
        const container = document.getElementById(containerId);

        metrics.forEach(metric => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('mb-3');

            wrapper.innerHTML = `
                <label>${metric.label}</label>
                <div class="star-rating" data-name="${metric.name}">
                ${[1,2,3,4,5].map(value => `
                    <i class="bi bi-star" data-value="${value}"></i>
                    `).join('')}
                </div>
                <input type="hidden" name="${metric.name}" value="0"> 
            `;

            container.appendChild(wrapper);
        });
    }

    function initialiseStarRatings() {
        document.querySelectorAll('.star-rating').forEach(container => {

            const stars = container.querySelectorAll('i');
            const hiddenInput = container.nextElementSibling;

            function updateStars(value) {
                stars.forEach(star => {
                    const starValue = Number(star.dataset.value);

                    star.classList.toggle('bi-star-fill', starValue <= value);
                    star.classList.toggle('bi-star', starValue > value);
                    star.classList.toggle('filled', starValue <= value);  
                });
            }

            stars.forEach(star => {
                const value = Number(star.dataset.value);

                star.addEventListener('mouseenter', () => updateStars(value));

                star.addEventListener('click', () => {
                    hiddenInput.value = value;
                    updateStars(value);
                });
            });

            container.addEventListener('mouseleave', () => {
                const currentValue = Number(hiddenInput.value);
                updateStars(currentValue);
            });
        });
    }

    function resetStarRatings() {
        document.querySelectorAll('.star-rating').forEach(container => {
            const stars = container.querySelectorAll('i');
            const hiddenInput = container.nextElementSibling;

            hiddenInput.value = 0;

            stars.forEach(star => {
                star.classList.remove('bi-star-fill', 'filled');
                star.classList.add('bi-star');
            });
        });
    }

});