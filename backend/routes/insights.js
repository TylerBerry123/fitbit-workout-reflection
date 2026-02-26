const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all insights
router.get('/', (req, res) => {
    db.all(
        `SELECT workout_log_id, rule_name, message, created_at
        FROM insights
        ORDER BY created_at DESC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });


            const grouped = {};

            rows.forEach(row => {
                const id = String(row.workout_log_id);

                if (!grouped[id]) {
                    grouped[id] = {
                        workout_log_id: id,
                        created_at: row.created_at,
                        insights: []
                    };
                }

                grouped[id].insights.push({
                    rule_name: row.rule_name,
                    message: row.message
                });
            });

            res.json(Object.values(grouped));
        }
    );
});

module.exports = router;