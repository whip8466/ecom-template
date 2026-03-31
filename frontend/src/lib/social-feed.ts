export type SocialFeedContentType = 'VIDEO' | 'REEL' | 'POST' | 'TIPS' | 'CUSTOMER_STORY';
export type SocialFeedPlatform = 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK';

export type SocialFeedSettings = {
  heroTitle: string;
  heroSubtitle: string;
  ctaSectionTitle: string | null;
  ctaShopUrl: string | null;
  ctaFollowUrl: string | null;
  ctaCommunityUrl: string | null;
  updatedAt: string;
};

export type SocialFeedPost = {
  id: number;
  contentType: SocialFeedContentType;
  platform: SocialFeedPlatform;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  externalUrl: string;
  ctaLabel: string;
  sortOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

/** Admin API includes optional override from DB (null = use platform default on storefront). */
export type SocialFeedPostAdmin = SocialFeedPost & {
  ctaLabelOverride?: string | null;
};

export type SocialFeedPayload = {
  settings: SocialFeedSettings;
  posts: SocialFeedPost[];
  featured: SocialFeedPost | null;
};

export const SOCIAL_FEED_FILTER_TABS: {
  key: 'all' | SocialFeedContentType;
  label: string;
}[] = [
  { key: 'all', label: 'All' },
  { key: 'VIDEO', label: 'Videos' },
  { key: 'REEL', label: 'Reels' },
  { key: 'POST', label: 'Posts' },
  { key: 'TIPS', label: 'Tips & recipes' },
  { key: 'CUSTOMER_STORY', label: 'Customer stories' },
];
