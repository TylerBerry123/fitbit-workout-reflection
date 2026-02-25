const fs = require('fs');
const axios = require('axios');
const express = require('express');
const router = express.Router();

const CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET;
const REDIRECT_URI = process.env.FITBIT_REDIRECT;

// Start OAuth
router.get('/auth', (req, res) => {
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
router.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) return res.send('No code returned from Fitbit');

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
            '../tokens.json',
            JSON.stringify(tokens, null, 2)
        );

        res.send('Fitbit connected! Tokens saved.');

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.send('Error fetching access token');
    }

});

module.exports = router;