BEGIN;

CREATE SCHEMA IF NOT EXISTS ag_social_media_content;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$ BEGIN
  CREATE TYPE ag_social_media_content.content_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ag_social_media_content.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ag_social_media_content.publishing_mode AS ENUM ('manual', 'auto_publish');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ag_social_media_content.suggestion_status AS ENUM ('pending', 'approved', 'rejected', 'replaced');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ag_social_media_content.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  website_url TEXT,
  industry TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  brand_description TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT 'Professional',
  language TEXT NOT NULL DEFAULT 'English',
  platforms TEXT[] NOT NULL DEFAULT ARRAY['Instagram'],
  content_types TEXT[] NOT NULL DEFAULT ARRAY['Caption'],
  posting_frequency TEXT NOT NULL DEFAULT '',
  publishing_mode ag_social_media_content.publishing_mode NOT NULL DEFAULT 'manual',
  location TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  settings_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ag_social_media_content.project_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ag_social_media_content.projects(id) ON DELETE CASCADE,
  products_services TEXT NOT NULL DEFAULT '',
  unique_selling_points TEXT NOT NULL DEFAULT '',
  service_areas TEXT NOT NULL DEFAULT '',
  audience_age_group TEXT NOT NULL DEFAULT '',
  audience_pain_points TEXT NOT NULL DEFAULT '',
  audience_interests TEXT NOT NULL DEFAULT '',
  customer_goals TEXT NOT NULL DEFAULT '',
  customer_objections TEXT NOT NULL DEFAULT '',
  writing_style TEXT NOT NULL DEFAULT 'Clear and concise',
  emoji_preference TEXT NOT NULL DEFAULT 'Minimal',
  hashtag_style TEXT NOT NULL DEFAULT 'Balanced broad and niche',
  cta_style TEXT NOT NULL DEFAULT 'Soft CTA',
  content_goal TEXT NOT NULL DEFAULT 'Awareness',
  main_offer TEXT NOT NULL DEFAULT '',
  current_campaign TEXT NOT NULL DEFAULT '',
  promotion_details TEXT NOT NULL DEFAULT '',
  important_keywords TEXT NOT NULL DEFAULT '',
  words_to_avoid TEXT NOT NULL DEFAULT '',
  competitor_reference_links TEXT NOT NULL DEFAULT '',
  source_details TEXT NOT NULL DEFAULT '',
  reference_materials TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE TABLE IF NOT EXISTS ag_social_media_content.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ag_social_media_content.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, slug)
);

CREATE TABLE IF NOT EXISTS ag_social_media_content.content_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ag_social_media_content.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  status ag_social_media_content.suggestion_status NOT NULL DEFAULT 'pending',
  generation_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ag_social_media_content.social_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ag_social_media_content.projects(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES ag_social_media_content.content_suggestions(id) ON DELETE SET NULL,
  category_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  hook TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  carousel_outline TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  short_video_script TEXT,
  video_script TEXT GENERATED ALWAYS AS (short_video_script) STORED,
  status ag_social_media_content.content_status NOT NULL DEFAULT 'draft',
  approval_status ag_social_media_content.approval_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  image_provider TEXT,
  image_prompt TEXT,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  generation_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  publishing_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ag_social_media_content.publishing_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ag_social_media_content.projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  channel_name TEXT,
  publishing_mode ag_social_media_content.publishing_mode NOT NULL DEFAULT 'manual',
  oauth_status TEXT NOT NULL DEFAULT 'not_connected',
  oauth_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, platform)
);

CREATE TABLE IF NOT EXISTS ag_social_media_content.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ag_social_media_content.projects(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES ag_social_media_content.social_content_items(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL DEFAULT 'social-media-assets',
  storage_path TEXT,
  public_url TEXT,
  filename TEXT,
  file_size BIGINT,
  mime_type TEXT,
  alt_text TEXT,
  image_provider TEXT,
  image_prompt TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ag_social_media_content.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ag_social_media_content.projects(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES ag_social_media_content.social_content_items(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  platform TEXT,
  content_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_projects_owner ON ag_social_media_content.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_configurations_project ON ag_social_media_content.project_configurations(project_id);
CREATE INDEX IF NOT EXISTS idx_social_categories_project ON ag_social_media_content.categories(project_id);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_project ON ag_social_media_content.content_suggestions(project_id);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_status ON ag_social_media_content.content_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_social_items_project ON ag_social_media_content.social_content_items(project_id);
CREATE INDEX IF NOT EXISTS idx_social_items_platform ON ag_social_media_content.social_content_items(platform);
CREATE INDEX IF NOT EXISTS idx_social_items_type ON ag_social_media_content.social_content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_social_items_status ON ag_social_media_content.social_content_items(status);
CREATE INDEX IF NOT EXISTS idx_social_items_approval ON ag_social_media_content.social_content_items(approval_status);
CREATE INDEX IF NOT EXISTS idx_social_items_scheduled_at ON ag_social_media_content.social_content_items(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_publishing_channels_project ON ag_social_media_content.publishing_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_project ON ag_social_media_content.media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_project ON ag_social_media_content.analytics_events(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON ag_social_media_content.analytics_events(created_at);

CREATE OR REPLACE FUNCTION ag_social_media_content.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ag_social_media_content, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_projects_updated_at ON ag_social_media_content.projects;
CREATE TRIGGER tr_projects_updated_at BEFORE UPDATE ON ag_social_media_content.projects FOR EACH ROW EXECUTE FUNCTION ag_social_media_content.set_updated_at();
DROP TRIGGER IF EXISTS tr_project_configurations_updated_at ON ag_social_media_content.project_configurations;
CREATE TRIGGER tr_project_configurations_updated_at BEFORE UPDATE ON ag_social_media_content.project_configurations FOR EACH ROW EXECUTE FUNCTION ag_social_media_content.set_updated_at();
DROP TRIGGER IF EXISTS tr_categories_updated_at ON ag_social_media_content.categories;
CREATE TRIGGER tr_categories_updated_at BEFORE UPDATE ON ag_social_media_content.categories FOR EACH ROW EXECUTE FUNCTION ag_social_media_content.set_updated_at();
DROP TRIGGER IF EXISTS tr_content_suggestions_updated_at ON ag_social_media_content.content_suggestions;
CREATE TRIGGER tr_content_suggestions_updated_at BEFORE UPDATE ON ag_social_media_content.content_suggestions FOR EACH ROW EXECUTE FUNCTION ag_social_media_content.set_updated_at();
DROP TRIGGER IF EXISTS tr_social_items_updated_at ON ag_social_media_content.social_content_items;
CREATE TRIGGER tr_social_items_updated_at BEFORE UPDATE ON ag_social_media_content.social_content_items FOR EACH ROW EXECUTE FUNCTION ag_social_media_content.set_updated_at();
DROP TRIGGER IF EXISTS tr_publishing_channels_updated_at ON ag_social_media_content.publishing_channels;
CREATE TRIGGER tr_publishing_channels_updated_at BEFORE UPDATE ON ag_social_media_content.publishing_channels FOR EACH ROW EXECUTE FUNCTION ag_social_media_content.set_updated_at();

CREATE OR REPLACE VIEW ag_social_media_content.analytics_overview WITH (security_invoker = true) AS
SELECT
  project_id,
  COUNT(*)::INT AS total_generated,
  COUNT(*) FILTER (WHERE approval_status = 'approved')::INT AS approved,
  COUNT(*) FILTER (WHERE approval_status = 'rejected')::INT AS rejected,
  COUNT(*) FILTER (WHERE status IN ('draft', 'scheduled', 'published'))::INT AS saved_content
FROM ag_social_media_content.social_content_items
GROUP BY project_id;

CREATE OR REPLACE VIEW ag_social_media_content.platform_distribution WITH (security_invoker = true) AS
SELECT project_id, platform, COUNT(*)::INT AS total
FROM ag_social_media_content.social_content_items
GROUP BY project_id, platform;

CREATE OR REPLACE VIEW ag_social_media_content.content_type_distribution WITH (security_invoker = true) AS
SELECT project_id, content_type, COUNT(*)::INT AS total
FROM ag_social_media_content.social_content_items
GROUP BY project_id, content_type;

CREATE OR REPLACE VIEW ag_social_media_content.generation_trends WITH (security_invoker = true) AS
SELECT project_id, DATE_TRUNC('day', created_at)::DATE AS generated_on, COUNT(*)::INT AS total
FROM ag_social_media_content.social_content_items
GROUP BY project_id, DATE_TRUNC('day', created_at)::DATE;

ALTER TABLE ag_social_media_content.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_social_media_content.project_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_social_media_content.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_social_media_content.content_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_social_media_content.social_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_social_media_content.publishing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_social_media_content.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_social_media_content.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage own projects" ON ag_social_media_content.projects;
DROP POLICY IF EXISTS "Internal MVP manage projects" ON ag_social_media_content.projects;
CREATE POLICY "Internal MVP manage projects"
ON ag_social_media_content.projects
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Internal MVP manage project configurations" ON ag_social_media_content.project_configurations;
CREATE POLICY "Internal MVP manage project configurations"
ON ag_social_media_content.project_configurations
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage own categories" ON ag_social_media_content.categories;
DROP POLICY IF EXISTS "Internal MVP manage categories" ON ag_social_media_content.categories;
CREATE POLICY "Internal MVP manage categories"
ON ag_social_media_content.categories
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage own suggestions" ON ag_social_media_content.content_suggestions;
DROP POLICY IF EXISTS "Internal MVP manage suggestions" ON ag_social_media_content.content_suggestions;
CREATE POLICY "Internal MVP manage suggestions"
ON ag_social_media_content.content_suggestions
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage own social items" ON ag_social_media_content.social_content_items;
DROP POLICY IF EXISTS "Internal MVP manage social items" ON ag_social_media_content.social_content_items;
CREATE POLICY "Internal MVP manage social items"
ON ag_social_media_content.social_content_items
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage own publishing channels" ON ag_social_media_content.publishing_channels;
DROP POLICY IF EXISTS "Internal MVP manage publishing channels" ON ag_social_media_content.publishing_channels;
CREATE POLICY "Internal MVP manage publishing channels"
ON ag_social_media_content.publishing_channels
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage own media assets" ON ag_social_media_content.media_assets;
DROP POLICY IF EXISTS "Internal MVP manage media assets" ON ag_social_media_content.media_assets;
CREATE POLICY "Internal MVP manage media assets"
ON ag_social_media_content.media_assets
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage own analytics events" ON ag_social_media_content.analytics_events;
DROP POLICY IF EXISTS "Internal MVP manage analytics events" ON ag_social_media_content.analytics_events;
CREATE POLICY "Internal MVP manage analytics events"
ON ag_social_media_content.analytics_events
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media-assets', 'social-media-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read social media assets" ON storage.objects;
CREATE POLICY "Public read social media assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'social-media-assets');
DROP POLICY IF EXISTS "Authenticated manage social media assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated manage own social media assets" ON storage.objects;
DROP POLICY IF EXISTS "Internal MVP manage social media assets" ON storage.objects;
CREATE POLICY "Internal MVP manage social media assets"
ON storage.objects
FOR ALL TO anon, authenticated
USING (bucket_id = 'social-media-assets')
WITH CHECK (bucket_id = 'social-media-assets');

GRANT USAGE ON SCHEMA ag_social_media_content TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ag_social_media_content TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ag_social_media_content TO anon, authenticated, service_role;
GRANT USAGE ON ALL TYPES IN SCHEMA ag_social_media_content TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ag_social_media_content
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ag_social_media_content
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ag_social_media_content
GRANT USAGE ON TYPES TO anon, authenticated, service_role;
GRANT SELECT ON ag_social_media_content.analytics_overview TO anon, authenticated, service_role;
GRANT SELECT ON ag_social_media_content.platform_distribution TO anon, authenticated, service_role;
GRANT SELECT ON ag_social_media_content.content_type_distribution TO anon, authenticated, service_role;
GRANT SELECT ON ag_social_media_content.generation_trends TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';

COMMIT;
