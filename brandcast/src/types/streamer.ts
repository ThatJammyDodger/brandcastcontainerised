export interface Social {
  link: string;
  website: string;
}

export interface TwitchStreamer {
  name: string;
  image: string;
  followers: number;
  description: string;
  socials: Social[];
  panelElements: string[];
  panelImageURLs: string[];
  panelLinkUrls: string[];
  address?: string;
  countryCode?: string;
}

export interface Streamer {
  id: string;
  name: string;
  image: string;
  description: string;
  tags: string[];
  categories: string[];
  sponsors: string[];
  aiSummary: string;
  aiScore: number;
  aiRecommendation: string;
  followers: number;
  socials: Social[];
  relevanceScore?: number;
} 