import { getLiveStreamerIds } from "./scripts/getStreamerIds.js";
import { acquireUsernames } from "./scripts/scraping/acquireUsernames.js";
import TwitchScraper from "./twitch-scraper.js";

const toTarget = 300

export default async function StreamFetcher() {
    const usernames = await acquireUsernames(toTarget);

    await TwitchScraper(null, usernames);
}