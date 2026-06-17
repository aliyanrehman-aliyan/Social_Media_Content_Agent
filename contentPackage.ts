import { Platform, SocialContentType, SourceType } from './types';

export interface SocialContentPackage {
  platform: Platform;
  contentType: SocialContentType;
  sourceType?: SourceType;
  title: string;
  hook?: string;
  body?: string;
  cta?: string;
  hashtags?: string[];
  carouselOutline?: string[];
  videoScript?: string;
  sceneOutline?: string[];
  creativeDirection?: string;
  thumbnailPrompt?: string;
}

export const getAssetIdeaText = (item: SocialContentPackage) => {
  const providedIdea = (item.creativeDirection || item.thumbnailPrompt || '').trim();
  if (providedIdea) return providedIdea;

  return [
    `Visual concept for ${item.platform} ${item.contentType}: create a platform-native creative for "${item.title}".`,
    item.hook ? `Main text idea: use "${item.hook}" as the first visible hook or opening overlay.` : '',
    item.body ? `Scene direction: build the visual around the main message: ${item.body.slice(0, 220)}` : '',
    item.videoScript ? 'Motion idea: use the strongest moment from the script as the opening frame, then move through clear short-form scenes.' : '',
    item.sceneOutline?.length ? `Scene flow: ${item.sceneOutline.join(' ')}` : '',
    item.carouselOutline?.length ? `Carousel direction: give each slide a clear visual anchor, using this flow: ${item.carouselOutline.join(' ')}` : '',
    item.cta ? `CTA placement: reserve a clean lower-third or final frame for "${item.cta}".` : '',
    item.hashtags?.length ? `Mood and style cues: ${item.hashtags.join(' ')}` : '',
  ].filter(Boolean).join('\n');
};

export const formatContentPackage = (item: SocialContentPackage) => {
  const assetIdea = getAssetIdeaText(item);

  return [
    `Platform: ${item.platform}`,
    `Content type: ${item.contentType}`,
    item.sourceType ? `Source type: ${item.sourceType}` : '',
    `Title:\n${item.title}`,
    item.hook ? `Hook:\n${item.hook}` : '',
    item.body ? `Caption / Body:\n${item.body}` : '',
    item.cta ? `CTA:\n${item.cta}` : '',
    item.hashtags?.length ? `Hashtags:\n${item.hashtags.join(' ')}` : '',
    item.carouselOutline?.length ? `Carousel Outline:\n${item.carouselOutline.map((line, index) => `${index + 1}. ${line}`).join('\n')}` : '',
    item.videoScript ? `Video Script:\n${item.videoScript}` : '',
    item.sceneOutline?.length ? `Scene Outline:\n${item.sceneOutline.map((line, index) => `${index + 1}. ${line}`).join('\n')}` : '',
    assetIdea ? `Asset Idea / Image Description:\n${assetIdea}` : '',
    item.thumbnailPrompt ? `Thumbnail Prompt:\n${item.thumbnailPrompt}` : '',
  ].filter(Boolean).join('\n\n');
};
