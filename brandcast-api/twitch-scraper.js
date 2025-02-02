import puppeteer from "puppeteer";
import Anthropic from "@anthropic-ai/sdk";
import {getLiveStreamerIds} from "./scripts/getStreamerIds.js";
import {getTwitchAuthToken} from "./scripts/getTwitchToken.js";
import {getStreamerInfoById} from "./scripts/getStreamerInfoById.js";
import {getStreamerIdByUsername} from "./scripts/getStreamerIdByUsername.js";
import {doc, getDoc, setDoc, addDoc} from 'firebase/firestore';
import database from "./database.js";
import { getAllSponsorsFromPanel } from "./scripts/getAllSponsorsFromPanel.js";
import { getEmbeddingForText } from "./scripts/embeddings/reprocessDb.js";

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY
})

// example username thing
// {
//     channel: 'zackrawrr',
//         recentAverageViewers: '51161',
//     recentTimeStreamed: '178',
//     recentFollowersGained: '309124'
// }

function convertAbbreviatedNumber(str) {
    const mapping = {'K': 1000, 'M': 1000000, 'B': 1000000000}
    if (str.charAt(str.length - 1).match(/[a-z]/i)) {
        return Number(str.substring(0, str.length - 1)) * mapping[str.charAt(str.length - 1)]
    }

    return Number(str)
}

export default async function TwitchScraper(username, usernames = null) {
    if (usernames == null) usernames = [{
        channel: username,
        recentAverageViewers: null,
        recentTimeStreamed: null,
        recentFollowersGained: null,
    }];

    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']});
    const page = await browser.newPage();

    // Navigate the page to a URL.
    await page.goto(`https://www.twitch.tv/${usernames[0]}`, {waitUntil: "load", timeout: 0});

    // Set screen size.
    await page.setViewport({width: 1080, height: 1024});

    await page.evaluate(() => {
        localStorage.setItem('mature', 'true')
        localStorage.setItem('video-muted', '{"default":false}')
        localStorage.setItem('volume', '0.5')
        localStorage.setItem('video-quality', '{"default":"160p30"}')
    })
    await page.reload({
        waitUntil: ["networkidle2", "domcontentloaded"]
    })

    let details = null;

    for await (let myUsername of usernames) {
        if (myUsername == null || myUsername.channel == null) continue;
        username = myUsername.channel.toLowerCase();

        try {
            const clientId = process.env.TWITCH_APP_CLIENT_ID;
            const accessToken = await getTwitchAuthToken();  // Ensure this is a valid token

            let broadcasterId = await getStreamerIdByUsername(username, clientId, accessToken);
            let something = await getStreamerInfoById(broadcasterId, clientId, accessToken);

            console.log(something);
            let otherData = something;
            delete otherData['title']

            // Navigate the page to a URL.
            await page.goto(`https://www.twitch.tv/${username}/about`, {waitUntil: "load", timeout: 0});

            let channelFollowers;
            try {
                const followerSelector = await page
                    .locator('text/followers')
                    .waitHandle();
                channelFollowers = convertAbbreviatedNumber((await followerSelector?.evaluate(el => el.textContent)).split(" ")[0]);
            } catch (e) {
                console.log(e);
                return null;
            }

            let channelDescription;
            try {
                const descriptionSelector = await page
                    .locator('.ifSdA-D')
                    .waitHandle();
                channelDescription = await descriptionSelector?.evaluate(el => el.textContent);
            } catch (e) {
                console.log(e);
                return null;
            }

            let channelImage;
            try {
                const imageSelector = await page
                    .locator(`.tw-image-avatar[alt="${otherData['broadcaster_name']}"]`)
                    .waitHandle();
                channelImage = (await (await imageSelector?.getProperty('src')).jsonValue()).replace('70x70', '300x300');
            } catch (e) {
                console.log(e);
                return null;
            }

            const socialLinks = await page.$$('.lllSnl')

            let socials = [];

            for await (const socialLink of socialLinks) {
                const websites = {
                    "www.instagram.com": "Instagram",
                    "www.twitter.com": "Twitter",
                    "www.youtube.com": "YouTube",
                    "www.discord.gg": "Discord",
                    "www.tiktok.com": "TikTok"
                }

                const link = await (await socialLink.getProperty('href')).jsonValue();
                const website = (link.split('//')[1].split('/')[0] in websites) ? websites[link.split('//')[1].split('/')[0]] : link.split('//')[1].split('/')[0]

                socials.push({
                    link,
                    website
                });
            }

            // const viewsSelector = await page.locator('[data-a-target="animated-channel-viewers-count"]').waitHandle();
            // const channelViews= await (await viewsSelector?.getProperty('firstChild')).evaluate(el => el.textContent);

            const panels = await page.$$('.default-panel')
            const panelImages = await page.$$('img[alt="Panel Content"]')

            let panelElements = [];

            for await (const panel of panels) {
                const html = await (await panel.getProperty('innerHTML')).jsonValue();

                panelElements.push(html);
            }

            let panelImageURLs = [];
            let panelLinkUrls = [];

            const removePanelUrls = ["www.displate.com", "www.twitch.tv", "streamlabs.com", "www.reddit.com", "www.discord.gg", "www.instagram.com", "www.youtube.com", "imgur.com", "www.youtube.com"];

            for await (const panelImage of panelImages) {
                const src = await (await panelImage.getProperty('src')).jsonValue();
                const link = await (await (await panelImage.getProperty('parentElement')).getProperty('href')).jsonValue();

                if (link !== undefined) {
                    if (!removePanelUrls.includes(link.split('//')[1].split('/')[0])) {
                        panelLinkUrls.push(link);
                        panelImageURLs.push(src);
                    }
                } else {
                    panelImageURLs.push(src);
                }
            }

            let address = null
            let countryCode = null

            for await (const panelElement of panelElements) {
                if (panelElement.toLowerCase().includes('po box') || panelElement.toLowerCase().includes('parcel')) {
                    const msg = await anthropic.messages.create({
                        model: "claude-3-5-sonnet-20241022",
                        max_tokens: 1024,
                        messages: [{ role: "user", content: `Fetch the address from this HTML, displaying it in a readable format with no extra information: ${panelElement}` }]
                    })
                    address = msg.content[0].text;
                    const isocode = await anthropic.messages.create({
                        model: "claude-3-5-sonnet-20241022",
                        max_tokens: 1024,
                        messages: [{ role: "user", content: `Fetch the country ISO code from this HTML, displaying it with no other information: ${panelElement}` }]
                    })
                    countryCode = isocode.content[0].text;
                }
            }

            const sponsors = await getAllSponsorsFromPanel(panelLinkUrls, []);

            const channelDetails = {
                name: otherData['broadcaster_name'],
                followers: channelFollowers,
                // views: Number(channelViews.replaceAll(',', '')),
                description: channelDescription,
                socials,
                panelElements,
                panelImageURLs,
                panelLinkUrls,
                address,
                countryCode,
                recentAverageViewers: Number(myUsername.recentAverageViewers),
                recentTimeStreamed: Number(myUsername.recentTimeStreamed),
                recentFollowersGained: Number(myUsername.recentFollowersGained),
                image: channelImage,
                sponsors,
                ...otherData
            }

            details = channelDetails;

            // console.log(details);

            // if (!(await getDoc(doc(database, "streamers", username))).exists()) {
            //     await addDoc(doc(database, "streamers", username), channelDetails);
            // }
            await setDoc(doc(database, "streamers", username), {
                channelDetails: {
                    ...channelDetails,
                    vector_embeddings: await getEmbeddingForText(channelDetails.description)
                }
            }, {merge: true});
        } catch (e) {
            continue;
        }
    }

    await browser.close();

    return details;
}