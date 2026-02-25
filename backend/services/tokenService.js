require('dotenv').config();

const axios = require('axios');
const fs = require('fs');

const CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET;

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

module.exports = { getValidAccessToken };