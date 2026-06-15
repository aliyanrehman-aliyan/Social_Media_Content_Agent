BEGIN;

GRANT USAGE ON SCHEMA ag_social_media_content TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA ag_social_media_content
TO anon, authenticated, service_role;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA ag_social_media_content
TO anon, authenticated, service_role;

GRANT USAGE
ON ALL TYPES IN SCHEMA ag_social_media_content
TO anon, authenticated, service_role;

ALTER TABLE ag_social_media_content.projects
ALTER COLUMN owner_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;

UPDATE ag_social_media_content.projects
SET owner_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE owner_id IS NULL;

DROP POLICY IF EXISTS "Authenticated manage own projects" ON ag_social_media_content.projects;
DROP POLICY IF EXISTS "Internal MVP manage projects" ON ag_social_media_content.projects;
CREATE POLICY "Internal MVP manage projects"
ON ag_social_media_content.projects
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

DROP POLICY IF EXISTS "Authenticated manage own social media assets" ON storage.objects;
DROP POLICY IF EXISTS "Internal MVP manage social media assets" ON storage.objects;
CREATE POLICY "Internal MVP manage social media assets"
ON storage.objects
FOR ALL TO anon, authenticated
USING (bucket_id = 'social-media-assets')
WITH CHECK (bucket_id = 'social-media-assets');

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
