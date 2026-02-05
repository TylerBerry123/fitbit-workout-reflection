require('dotenv').config();

const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();

// Secrets
const CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET;
const REDIRECT_URI = process.env.FITBIT_REDIRECT;

// Token Management
function loadTokens() {
    if (fs.existsSync('tokens.json')) {
        return JSON.parse(fs.readFileSync('tokens.json'));
    }
    return null;
}

function saveTokens(tokens) {
    fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 2));
}

async function refreshAccessToken(refreshToken) {
    const response = await axios.post(
        'https://api.fitbit.com/oauth2/token',
        new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                'Basic ' + 
                Buffer.from(
                    CLIENT_ID + ':' + CLIENT_SECRET
                ).toString('base64')
            }
        }
    );

    const newTokens = {
        ...response.data,
        expires_at: Date.now() + response.data.expires_in * 1000
    };

    saveTokens(newTokens);

    return newTokens;
}

async function getValidAccessToken() {
    let tokens = loadTokens();

    if (!tokens) {
        throw new Error('Not authenticated. Go to /auth first.');
    }

    if (Date.now() > tokens.expires_at) {
        tokens = await refreshAccessToken(tokens.refresh_token);
    }

    return tokens.access_token;
}


// Start OAuth
app.get('/auth', (req, res) => {
    const scopes = [
        'activity',
        'heartrate',
        'sleep',
        'profile'
    ].join(' ');

    const authUrl = 
        'https://www.fitbit.com/oauth2/authorize' +
        '?response_type=code' +
        `&client_id=${CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(scopes)}`;

    res.redirect(authUrl);

});

// OAuth Callback
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.send('No code returned from Fitbit');
    }

    try {
        const tokenResponse = await axios.post(
            'https://api.fitbit.com/oauth2/token',
            new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
                code: code
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization:
                        'Basic ' +
                        Buffer.from(
                            CLIENT_ID + ':' + CLIENT_SECRET
                        ).toString('base64')
                }
            }
        );

        const tokens = {
            ...tokenResponse.data,
            expires_at: Date.now() + tokenResponse.data.expires_in * 1000
        };

        fs.writeFileSync(
            'tokens.json',
            JSON.stringify(tokens, null, 2)
        );

        res.send('Fitbit connected! Tokens saved.');

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.send('Error fetching access token');
    }

});

// Test Route
app.get('/', (req, res) => {
    res.send('Server running. Go to /auth to connect Fitbit');
});

// Port Check
app.listen(3000, () => {
    console.log('Server running on port 3000');
});

// Workouts endpoint
app.get('/workouts', async (req, res) => {
    try {
        const token = await getValidAccessToken();

        const date = new Date();
        date.setDate(date.getDate() - 30);

        const afterDate = date.toISOString().split('T')[0];

        const url = 
        `https://api.fitbit.com/1/user/-/activities/list.json` +
        `?afterDate=${afterDate}` +
        `&sort=desc` +
        `&limit=10` +
        `&offset=0`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error(error.message);
        res.send('Error fetching workouts');
    }
    
});