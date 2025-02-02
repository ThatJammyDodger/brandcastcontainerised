import { Streamer } from '@/types/streamer';
import { CompanyProfile } from '@/types/company';

export const calculateAIScore = (streamer: Streamer): number => {
  // Base score starts at 5
  let score = 5;

  // Follower score (up to 3 points)
  if (streamer.followers) {
    score += Math.min(streamer.followers / 1000000, 3);
  }

  // Content diversity score (up to 1 point)
  if (streamer.tags) {
    score += Math.min(streamer.tags.length * 0.2, 1);
  }

  // Social media presence (up to 1 point)
  if (streamer.socials) {
    score += Math.min(streamer.socials.length * 0.2, 1);
  }

  return Math.min(Math.round(score * 10) / 10, 10);
};

export const calculateFallbackScore = (streamer: Streamer): number => {
  // Base score starts at 0.5
  let score = 0.5;

  // Add small bonus for having a complete profile
  if (streamer.description && streamer.tags && streamer.tags.length > 0) {
    score += 0.1;
  }

  // Add bonus for engagement metrics
  if (streamer.followers) {
    score += Math.min(streamer.followers / 2000000, 0.2);
  }

  return Math.max(0, Math.min(1, score));
};

export const getScoreColor = (score: number | undefined): string => {
  if (score === undefined || score === null) return 'gray';
  if (score >= 0.8) return 'green';
  if (score >= 0.6) return 'blue';
  if (score >= 0.4) return 'orange';
  return 'red';
}; 