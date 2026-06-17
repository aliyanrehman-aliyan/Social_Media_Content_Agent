# Social Media Content Agent Project Context

## Overview

Social Media Content Agent is a Vite/React application for managing platform-ready social media content across customer projects. It supports project settings, a customer workspace, analytics, and an Auto Generate workflow powered by Supabase Edge Functions and OpenAI.

Supported platforms only:

- Instagram
- Facebook
- TikTok
- YouTube

Removed platforms:

- X
- LinkedIn
- Shorts as a separate platform

## Platform Content Types

Instagram:

- Caption
- Image Post
- Carousel
- Reel Script
- Story Idea
- Hashtags

Facebook:

- Caption Post
- Image Post
- Carousel
- Reel Script
- Story Idea
- Link Post

TikTok:

- Short Video Script
- Hook
- Caption
- Hashtags
- Scene Outline

YouTube:

- Shorts Script
- Video Title
- Description
- Hashtags
- Thumbnail Prompt

Content Types are dynamic in Settings and are derived from the selected platforms.
Settings uses a separate Platforms step with checkbox-based platform and content type selection.

## Supabase Schemas

Production schema:

```sql
ag_social_media_content
```

Additional identical schemas:

```sql
ag_social_media_content_dev
ag_social_media_content_test
```

The app selects the Data API schema from:

```env
VITE_SUPABASE_SCHEMA
```

Default fallback:

```env
VITE_SUPABASE_SCHEMA=ag_social_media_content
```

The Auto Generate Edge Function also receives the selected schema from the frontend and allows only:

- `ag_social_media_content`
- `ag_social_media_content_dev`
- `ag_social_media_content_test`

## Architecture

Frontend -> Supabase Edge Function -> OpenAI -> Supabase.

OpenAI API keys are server-side only in Supabase Edge Function secrets. The frontend calls:

```ts
supabase.functions.invoke('auto-generate-social-content', { body })
```

The function supports:

- `generate_ideas`
- `generate_content`
- `replace_suggestion`
- `regenerate_content`
- `generate_asset_idea`

SERP API integration is server-side in the `auto-generate-social-content` Edge Function. The frontend does not receive or expose SERP/OpenAI API keys.
The Edge Function reads `SERPAPI_KEY` or supported server-side aliases from `Deno.env`, fetches trend/related-search context and competitor context, then passes that context into OpenAI before content generation. `SERPAPI_KEY` is configured as a Supabase Edge Function secret, not a frontend environment variable.

SERP is used first during Auto Generate:

```txt
Auto Generate -> Edge Function -> SERP API trend discovery -> OpenAI content generation -> display/save generated content
```

SERP discovery searches Google for:

- today's breaking/news topics for the selected industry/category/source type
- current hot topics and in-demand discussions
- audience questions and concerns
- platform-specific discussion and content angles

When SERP data is available, OpenAI must generate around those current topics instead of random generic evergreen ideas.

The app does not call image-generation APIs.

## Main Tables

- `projects`
- `project_configurations`
- `categories`
- `content_suggestions`
- `social_content_items`
- `publishing_channels`
- `media_assets`
- `analytics_events`

The analytics views are:

- `analytics_overview`
- `platform_distribution`
- `content_type_distribution`
- `generation_trends`

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
- products/services in `settings_metadata.products_services`
- unique selling points in `settings_metadata.unique_selling_points`
- service areas in `settings_metadata.service_areas`
- audience age group, pain points, interests, goals, and objections in `settings_metadata`
- writing style, emoji preference, hashtag style, CTA style, and content goal in `settings_metadata`
- main offer, current campaign, promotion details, important keywords, words to avoid, and competitor/reference links in `settings_metadata`
- posting frequency
- publishing mode

`project_configurations` stores the scalable business intake data for each project with a one-to-one `project_id` relationship. It keeps the richer onboarding context separate from the core project row while the app also mirrors values into `projects.settings_metadata` for backward compatibility.

Project configuration stores:

- products/services
- unique selling points
- service areas
- audience age group
- audience pain points
- audience interests
- customer goals
- customer objections
- writing style
- emoji preference
- hashtag style
- CTA style
- content goal
- main offer
- current campaign
- promotion details
- important keywords
- words to avoid
- competitor/reference links
- source details
- reference materials

Source Type options:

- General Topic
- Product / Service
- Campaign
- Event
- Offer / Promotion
- Website Content
- Existing Post Idea
- Custom Brief

Social content stores:

- platform
- content type
- hook
- body
- CTA
- hashtags
- carousel outline
- video script
- asset idea in `image_prompt` and `generation_metadata.creative_direction`
- scene outline in `generation_metadata.scene_outline`
- thumbnail prompt in `generation_metadata.thumbnail_prompt`
- source type in `generation_metadata.source_type`
- status
- approval status
- scheduled date
- publishing metadata

## UI Structure

Sidebar sections:

- Customer Workspace
  - Auto Generate
- Analytics
- Settings

For this MVP, Customer Workspace only contains Auto Generate. Posts and Calendar are not shown as workspace sections.

Auto Generate route:

```txt
/customer-workspace/auto-generate
```

Legacy `/auto-generate` redirects to `/customer-workspace/auto-generate`.

Settings has six onboarding-style steps:

- Business Profile
- Business Information
- Audience & Brand
- Marketing & Content Strategy
- Platforms & Content Types
- Channels & Publishing

Business Profile is a welcome/intro page only and does not contain a large form.

Business Information collects only business facts:

- Business Name
- Website URL
- Industry / Niche
- Business Description
- Products & Services
- Unique Selling Points
- Location / Region
- Service Areas

Audience & Brand collects audience and brand identity fields:

- Target Audience
- Audience Age Group
- Audience Interests
- Audience Pain Points
- Customer Goals
- Customer Objections
- Brand Tone
- Language
- Writing Style
- Emoji Preference

Marketing & Content Strategy collects campaign, promotion, source, and keyword context:

- Content Goal
- CTA Style
- Hashtag Style
- Main Offer
- Current Campaign
- Promotion Details
- Important Keywords
- Words to Avoid
- Competitor References
- Source Type
- Source Details
- Reference Materials

Platforms & Content Types is a separate Settings step. It uses checkboxes for the four supported platforms only:

- Instagram
- Facebook
- TikTok
- YouTube

Under each platform, content types are also checkboxes and include short descriptions so users understand each asset/content format. Platforms are displayed as a single-open accordion list; only one platform's content types are expanded at a time. Content type selections are saved in Supabase through the existing `projects.content_types` field, while platforms are saved through `projects.platforms`.

Channels & Publishing includes:

- Manual Mode
- Auto Publish Mode UI only

The Settings redesign did not require a new migration because the existing `projects` and `project_configurations` tables already store the new grouped fields.

## Auto Generate

Auto Generate uses:

- selected project
- selected platforms
- selected content types, including multiple content types in one generation run
- source type
- full business intake metadata from Settings, including products/services, USPs, audience details, content style, offer/campaign details, keywords, words to avoid, and competitor/reference links
- audience override
- campaign override
- SERP trend/related-search context fetched server-side
- competitor scan context fetched server-side
- today's hot topics, breaking/news themes, trending discussions, and in-demand angles discovered before OpenAI runs

The Generate For dropdown only shows platforms selected in Settings.
The Content Types control only shows content types allowed for the selected platform.
Source Type exists in the Marketing & Content Strategy step, is saved in project settings, and is passed to the Edge Function as AI context.
The richer Settings intake fields are stored in `projects.settings_metadata` and `project_configurations`, then read server-side by the Auto Generate Edge Function. They are injected into OpenAI prompts so generated content can use the business offer, service area, target audience, customer pain points, objections, tone/style rules, keyword rules, and campaign context.
SERP API context is fetched in the Edge Function before OpenAI generation to support current/trending and competitor-aware content ideas. SERP context is treated as the primary topic source when useful results are available.
No SERP/OpenAI API key is exposed to frontend code.

Generated output quality rules:

- hooks should be strong, specific, and attention-grabbing
- body/caption/description should be richer and more useful, not one-line filler
- scene outlines should include multiple detailed scenes with action, framing, on-screen text, and pacing
- CTAs should be clear and platform-native
- hashtags should be relevant, mixed between broad/niche/intent tags, and not spammy
- asset ideas should stay detailed, visual, and platform-specific

Generated output is platform-specific:

- Instagram: captions, hashtags, carousel outlines, reel scripts, story ideas, and asset ideas.
- Facebook: caption posts, image-post copy, carousel outlines, reel scripts, story ideas, link posts, and asset ideas.
- TikTok: hooks, captions, hashtags, scene outlines, short video scripts, and asset ideas.
- YouTube: shorts scripts, video titles, descriptions, hashtags, thumbnail prompts, and asset ideas.

Supported actions:

- Generate
- Replace
- Regenerate
- Approve
- Reject
- Copy
- Download
- Save through approval into `social_content_items`

## Asset Idea Generation

Actual image generation is disabled.

Do not call:

- OpenAI image models
- Nano Banana
- Gemini image APIs

For image-related content, generate text-only Asset Idea / Image Description:

- visual concept
- background style
- subject/object idea
- text overlay idea
- mood/style
- carousel slide visual direction
- YouTube thumbnail concept

Asset Ideas are generated through the existing server-side OpenAI Edge Function flow. They should explain what type of image or creative is needed, including people/object/background, layout, colors, text placement, and overall scene direction.

Analytics and preview/detail pages should show Asset Idea as text, not image placeholders.

## Download Behavior

Download exports a complete text package only. It includes:

- platform
- content type
- source type
- title
- hook
- caption/body
- CTA
- hashtags
- carousel outline
- video script
- scene outline
- asset idea / image description
- YouTube thumbnail prompt when available

No image file is required.

## Info Icons

The app uses small clickable `i` info icons through `components/InfoPopover.tsx`.

Behavior:

- click opens a short description popover
- click does not trigger parent navigation/action buttons
- Enter/Space also toggles the popover

Info icons are intentionally limited to useful field-level or content-level help. They are not shown on main sidebar items, Customer Workspace navigation, Settings step navigation, or Settings section headers.

Info icons remain useful beside actual form fields and content/detail labels, such as Source Type, Auto Generate field inputs, and detail/preview labels like Platform, Content Type, Hook, Body, Scene Outline, CTA, Hashtags, and Asset Idea.

## Analytics

Analytics uses saved project content and shows:

- Total Generated
- Approved
- Rejected
- Platform Distribution
- Content Type Distribution
- Saved Content
- Generation Trends

Saved Content cards do not show image previews or placeholders because image generation is disabled. Cards show platform, content type, title, hook/body preview, status, and date in a clean text-first layout.

## GitHub Branches

Remote repository:

```txt
https://github.com/aliyanrehman-aliyan/Social_Media_Content_Agent.git
```

Branches:

- `main` - production/default branch
- `dev`
- `test` - initial working branch pushed first
