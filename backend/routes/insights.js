const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/trends', (req, res) => {
    const query = `
        SELECT
            rule_id,
            rule_name,
            MIN(priority) as priority,
            COUNT(*) as count
        FROM insights
        WHERE rule_id != 'R0'
        GROUP BY rule_id, rule_name
        ORDER BY count DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!rows || rows.length === 0) return res.json([]);

        const total = rows.reduce((sum, row) => sum + row.count, 0);
        const formatted = rows.map(row => ({
            rule_id: row.rule_id,
            rule_name: row.rule_name,
            priority: row.priority,
            count: row.count,
            percentage: ((row.count / total) * 100).toFixed(1)
        }));

        res.json(formatted);
    });
});

// Get all insights
router.get('/', (req, res) => {
    db.all(
        `SELECT 
            workout_log_id,
            rule_id,
            rule_name,
            message,
            rationale,
            priority,
            created_at
        FROM insights
        ORDER BY created_at DESC, priority ASC`,
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
                    rule_id: row.rule_id,
                    rule_name: row.rule_name,
                    message: row.message,
                    rationale: row.rationale,
                    priority: row.priority
                });
            });

            res.json(Object.values(grouped));
        }
    );
});

module.exports = router;