import { getTwitchAuthToken } from './getTwitchToken.js';

import axios from 'axios'

const clientId = process.env.TWITCH_APP_CLIENT_ID;

export async function getLiveStreamerIds() {
    let accessToken;
    try {
        accessToken = await getTwitchAuthToken();
    } catch (error) {
        console.error('Failed to retrieve token:', error);
    }

    // Fetch live streams
    const streamsResponse = await axios.get('https://api.twitch.tv/helix/streams', {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`
        },
        params: {
            first: 100 // Number of streams to fetch (max 100)
        }
    });

    // return user IDs
    return streamsResponse.data.data.map(stream => stream.user_login);
}

// getLiveStreamerIds()
//     .then(ids => console.log('Live Streamer IDs:', ids))
//     .catch(error => console.error('Error fetching streamer IDs:', error));