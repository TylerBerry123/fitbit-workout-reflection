require('dotenv').config();

const express = require('express');
const path = require('path');

const workoutsRoute = require('./routes/workouts');
const authRoute = require('./routes/auth');
const reflectionsRoute = require('./routes/reflections');
const insightsRoute = require('./routes/insights');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Homepage
app.use('/', express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/', authRoute);
app.use('/workouts', workoutsRoute);

// Reflection Route
app.use('/reflections', reflectionsRoute);

// Insights Route
app.use('/insights', insightsRoute);

// Fallback Route
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
}); 

// Port Check
app.listen(3000, () => {
    console.log('Server running on port 3000');
});