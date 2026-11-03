export interface MonitoredKeyword {
  id: number;
  userId: number;
  keyword: string;
  category: string;
  priority: string;
  active: boolean;
  createdAt: string;
}

export interface SupportingLink {
  title: string;
  url: string;
  verified: boolean;
}

export interface TrendRecord {
  id: number;
  userId: number;
  title: string;
  category: string;
  sourceUrl: string;
  sourceType: string;
  isVerifiedSource: boolean;
  priority: string;
  status: string;
  scoreTrendRelevance: number;
  scoreRecency: number;
  scoreAudienceInterest: number;
  scoreEngagementPotential: number;
  scoreBrandRelevance: number;
  opportunityScore: number;
  scoreExplanation: string;
  verifiedSummary: string;
  whyGainingAttention: string;
  predictionMarketRelevance: string;
  audienceInterestAnalysis: string;
  suggestedContentAngle: string;
  recommendedPlatform: string;
  suggestedHook: string;
  supportingLinks: string;
  detectedAt: string;
  createdAt: string;
}

export interface SocialMetricRecord {
  id: number;
  userId: number;
  platform: string;
  postTitle: string;
  category: string;
  contentFormat: string;
  publishedDate: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  clickThroughRate: number;
  audienceRetention: number;
  dataOrigin: string;
  createdAt: string;
}

export interface AiRecommendationRecord {
  id: number;
  userId: number;
  recommendationType: string;
  title: string;
  targetPlatform: string;
  impactEstimate: string;
  dataExplanation: string;
  actionableStep: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface CalendarItemRecord {
  id: number;
  userId: number;
  trendId: number | null;
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  platform: string;
  contentFormat: string;
  status: string;
  priority: string;
  category: string;
  hookDraft: string;
  checklistJson: string;
  createdAt: string;
}

export interface WorkspacePayload {
  user?: {
    id: number;
    email: string;
    uid: string;
  };
  keywords: MonitoredKeyword[];
  trends: TrendRecord[];
  socialMetrics: SocialMetricRecord[];
  recommendations: AiRecommendationRecord[];
  calendarItems: CalendarItemRecord[];
}

export type ActiveModule =
  | 'discovery'
  | 'analysis'
  | 'scoring'
  | 'analytics'
  | 'dashboard'
  | 'recommendations'
  | 'calendar';

export const TREND_CATEGORIES = [
  'Prediction Markets',
  'Macro & Finance',
  'Cryptocurrency',
  'Global Events',
  'Internet Culture',
  'Social Media Trends',
] as const;

export const SOCIAL_PLATFORMS = [
  'X',
  'YouTube',
  'TikTok',
  'Instagram',
  'LinkedIn',
] as const;

export const CONTENT_FORMATS = [
  'Data Chart Graphic',
  'Short-Form Video',
  'Thread / Long-Form Post',
  'Carousel',
  'Live Stream / Breakdown',
] as const;
