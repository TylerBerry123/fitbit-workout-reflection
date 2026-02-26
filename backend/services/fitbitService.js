const axios = require('axios');
const { getValidAccessToken } = require('./tokenService.js');

async function getRecentWorkouts(limit = 50) {
    const token = await getValidAccessToken();

    const date = new Date();
    date.setDate(date.getDate() - 30);
    const afterDate = date.toISOString().split('T')[0];

    const url = 
    `https://api.fitbit.com/1/user/-/activities/list.json` +
    `?afterDate=${afterDate}` +
    `&sort=desc` +
    `&limit=${limit}` +
    `&offset=0`;

    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.activities;
}

async function getWorkoutById(logId) {
    const workouts = await getRecentWorkouts(50);
    return workouts.find(w => String(w.logId) == String(logId)); // do not secure check - number vs string
}

module.exports = {
    getRecentWorkouts,
    getWorkoutById
}