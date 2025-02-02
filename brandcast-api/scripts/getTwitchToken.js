import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Load environment variables
dotenv.config();

// Retrieve credentials from environment variables
const clientId = process.env.TWITCH_APP_CLIENT_ID;
const clientSecret = process.env.TWITCH_APP_CLIENT_SECRET;

// Function to get Twitch OAuth2 token
export async function getTwitchAuthToken() {
    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.access_token; // Return only the access token
    } catch (error) {
        console.error('Error fetching Twitch auth token:', error);
        throw error; // Propagate the error
    }
}