# AGENTS.md - Social Media Content Agent

## Project Overview

Social Media Content Agent is a Vite/React application for managing social media content across projects. It includes project settings, customer workspace content management, analytics, and an Auto Generate workflow powered by Supabase Edge Functions and OpenAI.

Main app root:

`C:\Users\Aliyan Rehman\Desktop\Social Media Content Agent`

## Working Style

- Work only on the exact task requested.
- Make minimal surgical changes where possible.
- Inspect first, then explain the plan before editing unless the user clearly says "apply now".
- Do not expose secret values from `.env.local`.
- Use PowerShell on Windows.
- Prefer `rg` and `rg --files` for searching.
- Run `npm run build` only when asked or after important changes.

## Tech Stack

- React 19
- TypeScript
- Vite
- Supabase JavaScript client
- Supabase Database under schema `ag_social_media_content`
- Supabase Edge Functions
- OpenAI via Supabase Edge Functions only
- Lucide React icons
- Recharts for analytics

## Important Files

- `App.tsx` - main routing, project selection, shared data loading, save handlers.
- `supabaseClient.ts` - Supabase client configuration.
- `types.ts` - shared application types.
- `pages/Settings.tsx` - three-step project settings flow.
- `pages/AutoGenerate.tsx` - Auto Generate page and Edge Function invoke flow.
- `pages/Posts.tsx` - customer workspace content list.
- `pages/Editor.tsx` - manual social content editing flow.
- `pages/Analytics.tsx` - analytics page.
- `pages/Projects.tsx` - project list and project modal.
- `supabase/functions/auto-generate-social-content/index.ts` - Auto Generate Edge Function.
- `supabase/migrations/` - database migrations.
- `skills/social-media-content.md` - social content writing rules.

## Protected App Structure

The left-side app structure must remain:

- Customer Workspace
- Analytics
- Settings
- Auto Generate

## Supabase Rules

- Use schema `ag_social_media_content`.
- Main tables:
  - `projects`
  - `categories`
  - `social_content_items`
  - `media_assets`
- OpenAI must only run inside Supabase Edge Functions.
- Frontend must use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Edge Functions must handle CORS, including `OPTIONS`.

## Settings Rules

Settings has only three steps:

- Business Profile
- Content Configuration
- Channels & Publishing

Content Configuration fields:

- Business Name
- Industry
- Target Audience
- Brand Description
- Tone
- Language
- Platforms
- Content Types
- Posting Frequency

Channels & Publishing:

- Manual Mode
- Auto Publish Mode UI only

## Auto Generate Rules

Auto Generate creates social-media-native content:

- Captions
- Hooks
- Hashtags
- Carousel outlines
- Reels ideas
- Shorts ideas
- TikTok scripts

Supported user actions:

- Generate
- Replace
- Regenerate
- Approve
- Reject
- Save

## Analytics Rules

Analytics should use saved project content and show:

- Total Generated
- Approved
- Rejected
- Platform Distribution
- Content Type Distribution
- Saved Content
- Generation Trends
