export const maxDuration = 60;

import type { NextApiRequest, NextApiResponse } from 'next';
import { TwitchStreamer, Streamer } from '@/types/streamer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const twitchData: TwitchStreamer = req.body;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 999,
        messages: [{
          role: 'user',
          content: `Analyze this Twitch streamer data and provide an evaluation. Return ONLY a JSON object (no other text) matching this TypeScript interface:

interface Streamer {
  id: string;
  name: string;
  description: string;
  tags: string[];
  categories: string[];
  sponsors: string[]; // Changed from { name: string; logo: string; }[]
  aiSummary: string;
  aiScore: number; // 0-10 rating
  aiRecommendation: string;
  followers: number;
  views: number;
  socials: { link: string; website: string; }[];
}

Here's the streamer data to analyze:
${JSON.stringify(twitchData, null, 2)}

Focus on brand collaborations and audience engagement. Extract categories and tags from their content. If no sponsors are detected, return an empty array for sponsors. Return ONLY the JSON object with no additional text or explanation.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze with Claude');
    }

    const claudeResponse = await response.json();
    console.log('Claude API Response:', claudeResponse.content[0].text);
    const analysis: Streamer = JSON.parse(claudeResponse.content[0].text);

    return res.status(200).json({ ... analysis, image: twitchData.image });
  } catch (error) {
    console.error('Claude API error:', error);
    return res.status(500).json({ message: 'Failed to analyze streamer data' });
  }
} 