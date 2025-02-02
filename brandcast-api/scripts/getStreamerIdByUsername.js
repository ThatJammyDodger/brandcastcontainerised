import { getTwitchAuthToken } from "./getTwitchToken.js";

const clientId = process.env.TWITCH_APP_CLIENT_ID;
const token = await getTwitchAuthToken();

export async function getStreamerIdByUsername(targetLogin, clientId, accessToken) {
    const url = `https://api.twitch.tv/helix/users?login=${targetLogin.toLowerCase()}`;

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
        return data.data[0].id;
    } catch (error) {
        console.error("Failed to fetch Twitch channel info:", error);
    }
}