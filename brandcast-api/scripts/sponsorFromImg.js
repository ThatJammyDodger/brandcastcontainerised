import { processRemoteImage, getMimeTypeFromSignature } from './imgToBase64.js';

import Anthropic from '@anthropic-ai/sdk';


const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
    // defaults to process.env["ANTHROPIC_API_KEY"]
});

export async function sponsorFromImg(imageURL) {
    const imgbase64 = await processRemoteImage(imageURL);
    const type = getMimeTypeFromSignature(imgbase64);
    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": type,
                            "data": imgbase64,
                        },
                    },
                    {
                        "type": "text",
                        "text": "If this image contains a company or website, respond ONLY with their name. If not, reply with NO_SPONSOR_DETECTED. Ignore anything about Twitch"
                    }
                ],
            }
        ],
    });
    return msg.content[0].text;
}

// const x = await sponsorFromImg("https://panels.twitch.tv/panel-92038375-image-89a80ecc-8fd5-41b8-879a-7ec0c9fe41db")
// console.log(x);