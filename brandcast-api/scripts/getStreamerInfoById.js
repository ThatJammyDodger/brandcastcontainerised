import { getTwitchAuthToken } from "./getTwitchToken.js";

const clientId = process.env.TWITCH_APP_CLIENT_ID;
const token = await getTwitchAuthToken();

export async function getStreamerInfoById(broadcasterId, clientId, accessToken) {
    const url = `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Client-Id": clientId
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data[0];
    } catch (error) {
        console.error("Failed to fetch Twitch channel info:", error);
    }
}


