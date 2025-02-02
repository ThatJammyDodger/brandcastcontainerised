export const maxDuration = 60;

import type { NextApiRequest, NextApiResponse } from 'next';
import { TwitchStreamer } from '@/types/streamer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    const response = await fetch(`http://localhost:4000/streamer/${username}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch streamer data: ${response.statusText}`);
    }

    const twitchData: TwitchStreamer = await response.json();
    console.log('API Response:', JSON.stringify(twitchData, null, 2));
    
    // Extract social media links from panel elements if socials array is empty
    if (twitchData.socials.length === 0) {
      const socialLinks = extractSocialLinks(twitchData.panelElements);
      twitchData.socials = socialLinks;
    }

    return res.status(200).json(twitchData);
  } catch (error) {
    console.error('Twitch API error:', error);
    return res.status(500).json({ message: 'Failed to fetch Twitch data' });
  }
}

function extractSocialLinks(panelElements: string[]): { link: string; website: string; }[] {
  const socialLinks: { link: string; website: string; }[] = [];
  const socialPatterns = [
    { pattern: /twitter\.com\/([^"'\s]+)/, website: 'Twitter' },
    { pattern: /instagram\.com\/([^"'\s]+)/, website: 'Instagram' },
    { pattern: /youtube\.com\/([^"'\s]+)/, website: 'YouTube' },
    { pattern: /discord\.gg\/([^"'\s]+)/, website: 'Discord' },
    { pattern: /patreon\.com\/([^"'\s]+)/, website: 'Patreon' }
  ];

  panelElements.forEach(element => {
    socialPatterns.forEach(({ pattern, website }) => {
      const match = element.match(pattern);
      if (match) {
        const link = match[0];
        // Only add if we don't already have this social platform
        if (!socialLinks.some(social => social.website === website)) {
          socialLinks.push({
            link: link.startsWith('http') ? link : `https://${link}`,
            website
          });
        }
      }
    });
  });

  return socialLinks;
} 