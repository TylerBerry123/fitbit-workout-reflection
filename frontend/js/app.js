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

    init();

    async function init() {
        renderMetrics('duringMetrics', duringMetrics);
        renderMetrics('afterMetrics', afterMetrics);

        initialiseStarRatings();
        await loadWorkouts();
    }

    async function loadWorkouts() {
        try {
            const workoutsResponse = await fetch('/workouts');
            const workoutsData = await workoutsResponse.json();
            const workouts = workoutsData.activities.slice(0, 10);
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

                tr.addEventListener('click', () => displayWorkout(w));
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
        button.className = 'btn btn-outline-secondary mt-3';
        button.textContent = 'View Insight';

        button.addEventListener('click', () => {
            switchToInsights(selectedWorkout.logId);
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
                window.location.reload();
            }

            //window.location.reload();
        } catch (error) {
            console.error('Error saving reflection: ', error);
        }
    });

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

                const insightHTML = group.insights
                    .map(i => `<li><strong>${i.rule_name}</strong>: ${i.message}</li>`)
                    .join('');

                div.innerHTML = `
                    <h6>${activityName} (${new Date(startTime).toLocaleString()})</h6>
                    <ul>${insightHTML}</ul>
                    <small>Reflected on ${new Date(group.created_at).toLocaleString()}</small>
                `;

                container.appendChild(div);
            }

        } catch(error) {
            console.error('Error loading insights:', error);
        }
    }

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