const RULES = [
    // SUBJECTIVE + SUBJECTIVE RULES
    {
        id: 'R01',
        name: "High Fatigue + High Effort",
        priority: 1,
        condition: (r) => r.fatigue >= 4 && r.effort >=4,
        message: 'Consider prioritising recovery before your next workout.',
        rationale: 'High subjective fatigue combined with high exertion may indicate inadequate recovery.'
    },
    {
        id: 'R02',
        name: "Poor Sleep + High Fatigue",
        priority: 2,
        condition: (r) => r.sleep <= 2 && r.fatigue >=4,
        message: 'Sleep quality may be impacting recovery - consider resting.',
        rationale: 'Low reported sleep quality alongside high fatigue suggests recovery impairement.'
    },
    {
        id: 'R03',
        name: "Low Motivation + Low Satisfaction",
        priority: 3,
        condition: (r) => r.motivation <= 2 && r.satisfaction <= 2,
        message: 'You may benefit from adjusting your workout intensity.',
        rationale: 'Low motivation and satisfaction may indicate misalignment between training load and psychological readiness.'
    },

    // SUBJECTIVE + OBJECTIVE RULES
    {
        id: 'R04',
        name: 'High Effort + Low Heart Rate',
        priority: 3,
        condition: (r, w) => r.effort >= 4 && w.averageHeartRate && w.averageHeartRate < 120,
        message: 'You reported high effort, but heart rate suggests low physiological intensity.',
        rationale: 'Mismatch between perceived extortion and cardiovascular load may indicate physiological strain or inaccurate pacing.'
    },
        {
        id: 'R05',
        name: 'Short Duration + High Fatigue',
        priority: 4,
        condition: (r, w) => r.fatigue >= 4 && w.duration && (w.duration / 60000) < 20,
        message: 'High fatigue following a short workout may indicate insufficient recovery.',
        rationale: 'Experiencing high fatigue after low-duration training may reflect cumlative fatigue or poor recovery status.'
    },
        {
        id: 'R06',
        name: 'High Heart Rate + Low Effort',
        priority: 5,
        condition: (r, w) => r.effort <= 2 && w.averageHeartRate && w.averageHeartRate > 160,
        message: 'Heart rate was high despite low perceived effort.',
        rationale: 'Elevated cardiovascular load despite low perceived effort exertion may indicate cardiovascular strain or adaption changes.'
    }
]

function generateInsights(reflection, workout) {
    const triggered = [];

    RULES.forEach(rule => {
        try {
            if (rule.condition(reflection, workout)) {
                triggered.push({
                    rule_id: rule.id,
                    rule_name: rule.name,
                    message: rule.message,
                    rationale: rule.rationale,
                    priority: rule.priority
                });
            }
        } catch (error) {
            console.error(`Error evaluating ${rule.id}:`, error);
        }
    });

    if (triggered.length === 0) {
        triggered.push({
            rule_id: 'R0',
            rule_name: 'No Trigger',
            message: 'No significant recovery or performance concerns detected.',
            rationale: 'Reflection and physiological metrics did not meet any rule thresholds.',
            priority: 99
        });
    }

    triggered.sort((a, b) => a.priority - b.priority);

    return triggered;
}


module.exports = { generateInsights };