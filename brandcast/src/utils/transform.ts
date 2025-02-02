import { Streamer, Social } from '@/types/streamer';

export const transformTwitchData = (twitchData: any): Streamer => {
  const categories = ['Gaming', 'League of Legends'];
  
  const tags = [
    ...twitchData.socials.map((social: Social) => social.website),
    twitchData.countryCode || ''
  ].filter(Boolean);

  // Extract sponsors from panel elements
  const sponsors = twitchData.panelElements
    .filter((panel: string) => 
      panel.toLowerCase().includes('sponsor') || 
      panel.toLowerCase().includes('partner'))
    .map((panel: string, index: number) => ({
      name: panel.split('\n')[0] || 'Sponsor',
      logo: twitchData.panelImageURLs[index] || '/sponsors/default.png'
    }));

  // Calculate AI score based on followers and engagement
  const followerScore = Math.min(twitchData.followers / 100000, 5);
  const aiScore = Math.min(followerScore + 5, 10).toFixed(1);

  return {
    id: twitchData.name.toLowerCase(),
    name: twitchData.name,
    image: twitchData.image,
    description: twitchData.description,
    tags,
    categories,
    sponsors,
    aiSummary: `${twitchData.name} is a content creator with ${(twitchData.followers / 1000000).toFixed(1)}M followers.`,
    aiScore: parseFloat(aiScore),
    aiRecommendation: `Popular streamer with strong social media presence across ${twitchData.socials.length} platforms. ${twitchData.countryCode ? `Based in ${twitchData.countryCode}.` : ''}`,
    followers: twitchData.followers,
    socials: twitchData.socials
  };
}; 