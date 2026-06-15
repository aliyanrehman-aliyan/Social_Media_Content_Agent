import React from 'react';

const sqlSnippet = `-- Social Media Content Agent uses schema ag_social_media_content.
-- Apply supabase/migrations/20260611123000_create_ag_social_media_content_schema.sql.
-- Then apply supabase/migrations/20260612061431_repair_ag_social_media_content_permissions.sql if this is an existing database.`;

const SupabaseSQL: React.FC = () => (
  <pre className="whitespace-pre-wrap rounded-2xl bg-slate-950 p-6 text-xs text-slate-100">
    {sqlSnippet}
  </pre>
);

export default SupabaseSQL;
