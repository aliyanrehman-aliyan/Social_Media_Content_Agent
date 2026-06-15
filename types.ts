export type Platform = 'Instagram' | 'Facebook' | 'TikTok' | 'YouTube';
export type SocialContentType =
  | 'Caption'
  | 'Image Post'
  | 'Carousel'
  | 'Reel Script'
  | 'Story Idea'
  | 'Hashtags'
  | 'Caption Post'
  | 'Link Post'
  | 'Short Video Script'
  | 'Hook'
  | 'Scene Outline'
  | 'Shorts Script'
  | 'Video Title'
  | 'Description'
  | 'Thumbnail Prompt';
export type SourceType =
  | 'General Topic'
  | 'Product / Service'
  | 'Campaign'
  | 'Event'
  | 'Offer / Promotion'
  | 'Website Content'
  | 'Existing Post Idea'
  | 'Custom Brief';
export type ContentStatus = 'Draft' | 'Scheduled' | 'Published' | 'Failed';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type PublishingMode = 'manual' | 'auto_publish';
export type CategoryStatus = 'Active' | 'Hidden';

export interface SocialContent {
  id: string;
  projectId: string;
  categoryId?: string;
  categoryIds?: string[];
  title: string;
  platform: Platform;
  contentType: SocialContentType;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  carouselOutline?: string[];
  videoScript?: string;
  sceneOutline?: string[];
  creativeDirection?: string;
  thumbnailPrompt?: string;
  sourceType?: SourceType;
  status: ContentStatus;
  approvalStatus: ApprovalStatus;
  category: string;
  author: string;
  date: string;
  scheduledAt?: string;
  image: string;
  imageProvider?: string;
  imagePrompt?: string;
  imageUrl?: string;
  tags?: string[];
}

export type Post = SocialContent;

export interface Project {
  id: string;
  name: string;
  businessName: string;
  websiteUrl: string;
  industry: string;
  targetAudience: string;
  brandDescription: string;
  tone: string;
  language: string;
  platforms: Platform[];
  contentTypes: SocialContentType[];
  sourceType: SourceType;
  postingFrequency: string;
  publishingMode: PublishingMode;
  location: string;
  tags?: string[];
  settingsMetadata?: Record<string, unknown>;
  createdAt: string;
  apiBaseUrl?: string;
  apiKey?: string;
}

export interface Category {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  description: string;
  status: CategoryStatus;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  projectId: string;
  url: string;
  filename: string;
  fileSize: string;
  mimeType: string;
  altText: string;
  createdAt: string;
  usedInPosts: string[];
}

export type Tab = 'Projects' | 'Posts' | 'Calendar' | 'Editor' | 'Analytics' | 'Settings' | 'AutoGenerate';
