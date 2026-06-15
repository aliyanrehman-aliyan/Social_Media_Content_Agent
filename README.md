# Social Media Content Agent

Vite/React workspace for generating and managing social media content across customer projects.

The active Supabase schema is `ag_social_media_content`.

## Commands

```bash
npm run dev
npm run build
```

## Supabase

Apply the migration in `supabase/migrations/20260611123000_create_ag_social_media_content_schema.sql`, deploy the `auto-generate-social-content` Edge Function, and configure Supabase secrets for OpenAI.
