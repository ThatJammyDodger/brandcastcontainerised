import { Streamer } from '@/types/streamer';

export const formatNumber = (num: number | undefined): string => {
  if (!num) return '0';
  return num.toLocaleString();
};

export const formatScore = (score: number | undefined): string => {
  if (score === undefined || score === null) return 'N/A';
  return score.toFixed(1);
};

export const sortStreamers = (
  streamers: Array<Streamer & { relevanceScore?: number }>,
  sortType: string
): Array<Streamer & { relevanceScore?: number }> => {
  return [...streamers].sort((a, b) => {
    switch (sortType) {
      case 'relevance':
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      case 'followers':
        return (b.followers || 0) - (a.followers || 0);
      case 'aiScore':
        return (b.aiScore || 0) - (a.aiScore || 0);
      default:
        return 0;
    }
  });
}; 