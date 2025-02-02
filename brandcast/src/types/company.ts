export interface CompanyProfile {
  name: string;
  description: string;
  industry: string;
  targetAudience: {
    ageRange: string;
    interests: string[];
    demographics: string[];
  };
  adContent: {
    description: string;
    tone: string;
    keywords: string[];
  };
} 