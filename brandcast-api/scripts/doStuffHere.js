// Replace with your actual credentials
import {getLiveStreamerIds} from "./getStreamerIds.js";
import {getTwitchAuthToken} from "./getTwitchToken.js";
import {getStreamerInfoById} from "./getStreamerInfoById.js";

const manyIds = await getLiveStreamerIds();
const broadcasterId = manyIds[0];
const clientId = process.env.TWITCH_APP_CLIENT_ID;
const accessToken = await getTwitchAuthToken();  // Ensure this is a valid token

const something = await getStreamerInfoById(broadcasterId, clientId, accessToken);

console.log(something.data[0]);