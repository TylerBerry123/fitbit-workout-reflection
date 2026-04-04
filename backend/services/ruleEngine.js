const RULES = [
    // Subjective Rules
    {
        id: 'R01',
        name: 'High Fatigue + High Effort',
        priority: 1,
        condition: (r) => r.fatigue >= 4 && r.effort >= 4,
        message: 'Consider prioritising recovery before your next workout.',
        rationale: 'High subjective fatigue combined with high exertion may indicate inadequate recovery and increased training stress.'
    }, // Kellmann (2010), Foster (2001)
    {
        id: 'R02',
        name: 'Poor Sleep + High Fatigue',
        priority: 2,
        condition: (r) => r.sleep <= 2 && r.fatigue >= 4,
        message: 'Poor sleep and high fatigue suggest your body may not have fully recovered. Consider lighter training or rest.',
        rationale: 'Sleep plays a critical role in physiological recovery and fatigue management.'
    }, // Halson (2014), Kellmann (2010)
    {
        id: 'R03',
        name: 'High Muscle Soreness',
        priority: 2,
        condition: (r) => r.pain >= 4,
        message: 'High muscle soreness may indicate muscle damage and incomplete recovery.',
        rationale: 'Muscle soreness is commonly used as an indicator of delayed onset muscle soreness (DOMS) following exercise.'
    }, // Cheung (2003)
    {
        id: 'R04',
        name: 'Low Motivation',
        priority: 3,
        condition: (r) => r.motivation <= 2,
        message: 'Low motivation may affect future exercise adherence. Consider adjusting training intensity or scheduling rest.',
        rationale: 'Motivation is a key psychological factor influencing long-term exercise adherence.'
    }, // Deci & Ryan (2000)
    {
        id: 'R05',
        name: 'Positive Psychological Readiness',
        priority: 4,
        condition: (r) => r.mood >= 4 && r.motivation >= 4,
        message: 'Your positive mood and strong motivation suggest good readiness for future training.',
        rationale: 'Psychological readiness is an important factor influencing training engagement and performance.'
    }, // Morgan (2013), Deci & Ryan (2000)
    {
        id: 'R06',
        name: 'Balanced Positive Session',
        priority: 4,
        condition: (r) => r.effort >= 3 && r.satisfaction >= 4 && r.pain <= 3,
        message: 'This session reflects a balanced workout with meaningful effort and a positive exercise experience.',
        rationale: 'Positive affective responses to exercise support continued engagement in physical activity.'
    }, // Foster (2001), Ekkekakis (2003)

// Objective Rules
    {
        id: 'R07',
        name: 'High Heart Rate Intensity',
        priority: 2,
        condition: (r, w) => w.averageHeartRate && w.averageHeartRate >= 150,
        message: 'Your average heart rate indicates vigorous cardiovascular intensity during this workout.',
        rationale: 'Heart rate is widely used as an objective indicator of exercise intensity.'
    }, // Foster (2001)
    {
        id: 'R08',
        name: 'High Calorie Expenditure',
        priority: 3,
        condition: (r, w) => w.calories && w.calories >= 500,
        message: 'This workout required substantial energy expenditure.',
        rationale: 'High caloric expenditure reflects increased metabolic workload during exercise.'
    }, // Foster (2001)

// Subjective + Objective Rules
    {
        id: 'R09',
        name: 'Low Training Stimulus',
        priority: 3,
        condition: (r, w) => r.effort <= 2 && w.duration && (w.duration / 60000) < 20,
        message: 'This workout appears to have been relatively light and may provide limited training stimulus.',
        rationale: 'Low exertion combined with short duration typically indicates a low training load.'
    }, // Foster (2001)
    {
        id: 'R10',
        name: 'High Heart Rate + Low Effort',
        priority: 2,
        condition: (r, w) => w.averageHeartRate && w.averageHeartRate >= 150 && r.effort <= 2,
        message: 'Your heart rate was high but perceived effort was low, which may indicate improved fitness or underestimation of effort.',
        rationale: 'Comparing physiological intensity with perceived exertion can provide insight into exercise tolerance and training adaptation.'
    }, // Foster (2001)
    {
        id: 'R11',
        name: 'High Effort + Low Heart Rate',
        priority: 2,
        condition: (r, w) => r.effort >= 4 && w.averageHeartRate && w.averageHeartRate <= 110,
        message: 'You reported high effort despite relatively low physiological intensity. This may indicate fatigue or reduced readiness.',
        rationale: 'A mismatch between perceived exertion and physiological indicators may signal fatigue or poor recovery.'
    }, // Foster (2001), Kellmann (2010)
    {
        id: 'R12',
        name: 'Low Hydration + Long Duration',
        priority: 2,
        condition: (r, w) => r.hydration <= 2 && w.duration && (w.duration / 60000) >= 45,
        message: 'Low hydration during a longer workout may negatively impact performance and recovery. Consider drinking more water during your workout.',
        rationale: 'Adequate hydration is essential for maintaining exercise performance and physiological function.'
    }, // ACSM (1996)
    {
        id: 'R13',
        name: 'High Training Load + Poor Recovery',
        priority: 1,
        condition: (r, w) => r.fatigue >= 4 && w.averageHeartRate && w.averageHeartRate >= 150,
        message: 'High training load combined with fatigue may increase the risk of overtraining. Consider prioritising recovery.',
        rationale: 'Combining high workload with fatigue can indicate inadequate recovery.'
    }, // Kellmann (2010), Foster (2001)
    {
        id: 'R14',
        name: 'Short Duration + High Fatigue',
        priority: 2,
        condition: (r, w) => w.duration && (w.duration / 60000) < 20 && r.fatigue >= 4,
        message: 'High fatigue following a short workout may indicate insufficient recovery.',
        rationale: 'Experiencing high fatigue after low-duration training may reflect cumulative fatigue or poor recovery status.'
    } // Kellmann (2010), Foster (2001)
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

    return triggered
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 5);
}


module.exports = { generateInsights };