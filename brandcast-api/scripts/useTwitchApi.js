import { getTwitchAuthToken } from "./getTwitchToken.js";

(async () => {
    try {
        const token = await getTwitchAuthToken();
        console.log('Twitch Auth Token:', token);
    } catch (error) {
        console.error('Failed to retrieve token:', error);
    }
})();

