export const getIndustryKeywords = (industry: string): string[] => {
  const industryMap: { [key: string]: string[] } = {
    gaming: ['game', 'gaming', 'esports', 'streamer', 'player'],
    technology: ['tech', 'technology', 'software', 'hardware', 'digital'],
    fashion: ['fashion', 'style', 'clothing', 'beauty', 'lifestyle'],
    food: ['food', 'cooking', 'restaurant', 'beverage', 'cuisine'],
    entertainment: ['entertainment', 'media', 'film', 'music', 'show'],
    sports: ['sports', 'athlete', 'fitness', 'workout', 'competition'],
    other: []
  };
  return industryMap[industry.toLowerCase()] || [];
}; 