# Social Media Content Agent Project Context

## Overview

Social Media Content Agent is a Vite/React application for managing platform-ready social media content across customer projects.

Supported platforms:

- Instagram
- Facebook
- TikTok
- YouTube

The app generates captions, hooks, CTAs, hashtags, carousel outlines, short video scripts, story ideas, link posts, YouTube titles/descriptions, thumbnail prompts, and text-only creative direction.

The active Supabase schema is:

```sql
ag_social_media_content
```

## Architecture

Frontend -> Supabase Edge Function -> OpenAI -> Supabase.

OpenAI API keys are server-side only in Supabase Edge Function secrets. The frontend calls:

```ts
supabase.functions.invoke('auto-generate-social-content', { body })
```

The function supports `generate_ideas`, `generate_content`, `replace_suggestion`, and `regenerate_content`.

## Main Tables

- `ag_social_media_content.projects`
- `ag_social_media_content.categories`
- `ag_social_media_content.social_content_items`
- `ag_social_media_content.media_assets`

## Important Fields

Projects store:

- business name
- website URL
- industry
- target audience
- brand description
- tone
- language
- platforms
- content types
- source type in `settings_metadata.source_type`
- posting frequency
- publishing mode

Social content stores:

- platform
- content type
- hook
- body
- CTA
- hashtags
- carousel outline
- video script
- creative direction in `image_prompt` and `generation_metadata.creative_direction`
- scene outline and thumbnail prompt in generation metadata
- status
- approval status
- scheduled date
- publishing metadata

## UI Structure

Sidebar sections:

- Customer Workspace
  - Posts
  - Calendar
  - Auto Generate
- Analytics
- Settings

Settings has three steps:

- Business Profile
- Content Configuration
- Channels & Publishing

Auto Generate creates social-media-native content and supports generate, replace, approve, reject, copy, and download.

Auto Generate uses the selected project's saved platforms, content types, source type, audience override, and campaign override. Approving a generated card inserts it directly into `social_content_items` with the active `project_id`.

Copy and Download treat each generated card as a complete text package. No real image files are generated or downloaded. Image-related outputs are text-only creative direction or thumbnail prompts.

Analytics uses saved project content and shows:

- Total Generated
- Approved
- Rejected
- Platform Distribution
- Content Type Distribution
- Saved Content
- Generation Trends
