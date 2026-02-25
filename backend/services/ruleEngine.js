function generateInsights(reflection) {
    const insights = [];

    if (reflection.fatigue >= 4 && reflection.effort >= 4) {
        insights.push({
            rule: 'High Fatigue + High Effort',
            message: 'Consider prioritising recovery before your next workout'
        });
    }

    if (reflection.sleep <= 2 && reflection.fatigue >= 4) {
        insights.push({
            rule: 'Poor Sleep + High Fatigue',
            message: 'Sleep quality may be impacting recovery - consider resting.'
        });
    }

    if (reflection.motivation <= 2 && reflection.satisfaction <= 2) {
        insights.push({
            rule: 'Low Motivation + Low Satisfaction',
            message: 'You may benefit from adjusting your workout intensity.'
        });
    }

    if (insights.length === 0) {
        insights.push({
            rule: 'No Trigger',
            message: 'No insights generated from this reflection.'
        })
    }

    return insights;
    
}

module.exports = { generateInsights };