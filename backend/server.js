require('dotenv').config();

const express = require('express');
const path = require('path');

const workoutsRoute = require('./routes/workouts');
const authRoute = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Homepage
app.use('/', express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/', authRoute);
app.use('/workouts', workoutsRoute);

// Fallback Route
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
}); 

// Port Check
app.listen(3000, () => {
    console.log('Server running on port 3000');
});