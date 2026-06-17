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

CREATE INDEX IF NOT EXISTS idx_project_configurations_project
ON ag_social_media_content.project_configurations(project_id);

ALTER TABLE ag_social_media_content.project_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal MVP manage project configurations" ON ag_social_media_content.project_configurations;
CREATE POLICY "Internal MVP manage project configurations"
ON ag_social_media_content.project_configurations
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS tr_project_configurations_updated_at ON ag_social_media_content.project_configurations;
CREATE TRIGGER tr_project_configurations_updated_at
BEFORE UPDATE ON ag_social_media_content.project_configurations
FOR EACH ROW EXECUTE FUNCTION ag_social_media_content.set_updated_at();

INSERT INTO ag_social_media_content.project_configurations (
  project_id,
  products_services,
  unique_selling_points,
  service_areas,
  audience_age_group,
  audience_pain_points,
  audience_interests,
  customer_goals,
  customer_objections,
  writing_style,
  emoji_preference,
  hashtag_style,
  cta_style,
  content_goal,
  main_offer,
  current_campaign,
  promotion_details,
  important_keywords,
  words_to_avoid,
  competitor_reference_links,
  source_details,
  reference_materials
)
SELECT
  id,
  COALESCE(settings_metadata->>'products_services', ''),
  COALESCE(settings_metadata->>'unique_selling_points', ''),
  COALESCE(settings_metadata->>'service_areas', ''),
  COALESCE(settings_metadata->>'audience_age_group', ''),
  COALESCE(settings_metadata->>'audience_pain_points', ''),
  COALESCE(settings_metadata->>'audience_interests', ''),
  COALESCE(settings_metadata->>'customer_goals', ''),
  COALESCE(settings_metadata->>'customer_objections', ''),
  COALESCE(settings_metadata->>'writing_style', 'Clear and concise'),
  COALESCE(settings_metadata->>'emoji_preference', 'Minimal'),
  COALESCE(settings_metadata->>'hashtag_style', 'Balanced broad and niche'),
  COALESCE(settings_metadata->>'cta_style', 'Soft CTA'),
  COALESCE(settings_metadata->>'content_goal', 'Awareness'),
  COALESCE(settings_metadata->>'main_offer', ''),
  COALESCE(settings_metadata->>'current_campaign', ''),
  COALESCE(settings_metadata->>'promotion_details', ''),
  COALESCE(settings_metadata->>'important_keywords', ''),
  COALESCE(settings_metadata->>'words_to_avoid', ''),
  COALESCE(settings_metadata->>'competitor_reference_links', ''),
  COALESCE(settings_metadata->>'source_details', ''),
  COALESCE(settings_metadata->>'reference_materials', '')
FROM ag_social_media_content.projects
ON CONFLICT (project_id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON ag_social_media_content.project_configurations TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
