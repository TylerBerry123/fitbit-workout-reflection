const express = require('express');
const router = express.Router();
const db = require('../database/db');

const { generateInsights } = require('../services/ruleEngine');
const { getWorkoutById } = require('../services/fitbitService');

// Get reflections
router.get('/', (req, res) => {
    db.all("SELECT workout_log_id FROM reflections", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message});
        res.json(rows);
    });
});

// Get single reflection
router.get('/:workoutLogId', (req, res) => {
    const id = String(req.params.workoutLogId);

    db.get(
        "SELECT * FROM reflections WHERE workout_log_id = ?",
        [id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(row || null);
        }
    );
});

// Save reflection
router.post('/', async (req, res) => {
    const {
        workoutLogId,
        mood,
        hydration,
        effort,
        satisfaction,
        sleep,
        fatigue,
        motivation,
        pain
    } = req.body;

    if (!workoutLogId) {
        return res.status(400).json({ error: 'Missing workoutLogId'});
    }

    const sql = `
        INSERT INTO reflections (
            workout_log_id,
            mood,
            hydration,
            effort,
            satisfaction,
            sleep,
            fatigue,
            motivation,
            pain
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
        String(workoutLogId),
        mood,
        hydration,
        effort,
        satisfaction,
        sleep,
        fatigue,
        motivation,
        pain
    ], async function (err) {

        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }

        try {

            const workout = await getWorkoutById(workoutLogId);

            const insights = generateInsights({
                mood: Number(mood),
                hydration: Number(hydration),
                effort: Number(effort),
                satisfaction: Number(satisfaction),
                sleep: Number(sleep),
                fatigue: Number(fatigue),
                motivation: Number(motivation),
                pain: Number(pain),
            }, workout);

            insights.forEach(insight => {
                db.run(
                    `INSERT INTO insights (workout_log_id, rule_id, rule_name, message, rationale, priority)
                    VALUES(?, ?, ?, ?, ?, ?)`,
                    [
                        String(workoutLogId),
                        insight.rule_id,
                        insight.rule_name,
                        insight.message,
                        insight.rationale,
                        insight.priority
                    ]
                );
            });

            return res.json({ success: true });

        } catch (err) {
            console.error('Insight generation error:', err);
            return res.status(500).json({ error: err.message });
        }
    });
});

router.delete('/:workoutLogId', (req, res) => {
    const id = String(req.params.workoutLogId);

    db.run(
        "DELETE FROM reflections WHERE workout_log_id = ?",
    [id],
    function (err) {
        if (err) {
            console.error('Delete error: ', err);
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Reflection not found' });
        }

        return res.json({ success: true })
    });
});

module.exports = router;