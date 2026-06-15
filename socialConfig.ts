import { Platform, SocialContentType, SourceType } from './types';

export const SUPPORTED_PLATFORMS: Platform[] = ['Instagram', 'Facebook', 'TikTok', 'YouTube'];

export const PLATFORM_CONTENT_TYPES: Record<Platform, SocialContentType[]> = {
  Instagram: ['Caption', 'Image Post', 'Carousel', 'Reel Script', 'Story Idea', 'Hashtags'],
  Facebook: ['Caption Post', 'Image Post', 'Carousel', 'Reel Script', 'Story Idea', 'Link Post'],
  TikTok: ['Short Video Script', 'Hook', 'Caption', 'Hashtags', 'Scene Outline'],
  YouTube: ['Shorts Script', 'Video Title', 'Description', 'Hashtags', 'Thumbnail Prompt'],
};

export const SOURCE_TYPE_OPTIONS: SourceType[] = [
  'General Topic',
  'Product / Service',
  'Campaign',
  'Event',
  'Offer / Promotion',
  'Website Content',
  'Existing Post Idea',
  'Custom Brief',
];

export const isSupportedPlatform = (value: unknown): value is Platform =>
  typeof value === 'string' && SUPPORTED_PLATFORMS.includes(value as Platform);

export const isSourceType = (value: unknown): value is SourceType =>
  typeof value === 'string' && SOURCE_TYPE_OPTIONS.includes(value as SourceType);

export const getContentTypesForPlatforms = (platforms: Platform[]) =>
  Array.from(new Set(platforms.flatMap(platform => PLATFORM_CONTENT_TYPES[platform] || [])));

export const getDefaultContentType = (platform: Platform = 'Instagram') =>
  PLATFORM_CONTENT_TYPES[platform][0];

export const sanitizePlatforms = (values: unknown, fallback: Platform[] = ['Instagram']) => {
  const platforms = Array.isArray(values) ? values.filter(isSupportedPlatform) : [];
  return platforms.length ? platforms : fallback;
};

export const sanitizeContentTypes = (values: unknown, platforms: Platform[]) => {
  const allowed = getContentTypesForPlatforms(platforms);
  const contentTypes = Array.isArray(values)
    ? values.filter((value): value is SocialContentType => typeof value === 'string' && allowed.includes(value as SocialContentType))
    : [];

  return contentTypes.length ? contentTypes : allowed.slice(0, 1);
};

export const toPlatformContentType = (platform: Platform, preferred?: SocialContentType) => {
  const options = PLATFORM_CONTENT_TYPES[platform];
  return preferred && options.includes(preferred) ? preferred : options[0];
};
