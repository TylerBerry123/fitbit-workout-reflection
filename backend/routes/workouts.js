const express = require('express');
const router = express.Router();

const { getRecentWorkouts, getWorkoutById } = require('../services/fitbitService');

router.get('/', async (req, res) => {
    try {
        const workouts = await getRecentWorkouts(50);
        res.json({ activities: workouts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:logId', async (req, res) => {
    try {
        const workout = await getWorkoutById(req.params.logId);
        if (!workout) return res.status(404).json({ error: 'Workout not found' })
        
        res.json(workout);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;