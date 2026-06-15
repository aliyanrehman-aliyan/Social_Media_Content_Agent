import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

type Platform = 'Instagram' | 'Facebook' | 'TikTok' | 'YouTube';
type SocialContentType =
  | 'Caption'
  | 'Image Post'
  | 'Carousel'
  | 'Reel Script'
  | 'Story Idea'
  | 'Hashtags'
  | 'Caption Post'
  | 'Link Post'
  | 'Short Video Script'
  | 'Hook'
  | 'Scene Outline'
  | 'Shorts Script'
  | 'Video Title'
  | 'Description'
  | 'Thumbnail Prompt';
type SourceType =
  | 'General Topic'
  | 'Product / Service'
  | 'Campaign'
  | 'Event'
  | 'Offer / Promotion'
  | 'Website Content'
  | 'Existing Post Idea'
  | 'Custom Brief';

type ProjectContext = {
  id: string;
  businessName: string;
  websiteUrl: string;
  industry: string;
  targetAudience: string;
  brandDescription: string;
  tone: string;
  language: string;
  platforms: Platform[];
  contentTypes: SocialContentType[];
  selectedPlatform: Platform;
  sourceType: SourceType;
  postingFrequency: string;
  campaign: string;
};

const SUPPORTED_PLATFORMS: Platform[] = ['Instagram', 'Facebook', 'TikTok', 'YouTube'];
const SOURCE_TYPES: SourceType[] = ['General Topic', 'Product / Service', 'Campaign', 'Event', 'Offer / Promotion', 'Website Content', 'Existing Post Idea', 'Custom Brief'];
const ALLOWED_SCHEMAS = ['ag_social_media_content', 'ag_social_media_content_dev', 'ag_social_media_content_test'];

const PLATFORM_CONTENT_TYPES: Record<Platform, SocialContentType[]> = {
  Instagram: ['Caption', 'Image Post', 'Carousel', 'Reel Script', 'Story Idea', 'Hashtags'],
  Facebook: ['Caption Post', 'Image Post', 'Carousel', 'Reel Script', 'Story Idea', 'Link Post'],
  TikTok: ['Short Video Script', 'Hook', 'Caption', 'Hashtags', 'Scene Outline'],
  YouTube: ['Shorts Script', 'Video Title', 'Description', 'Hashtags', 'Thumbnail Prompt'],
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const normalizeArray = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];

const toTitle = (value: string) =>
  value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const isPlatform = (value: unknown): value is Platform =>
  typeof value === 'string' && SUPPORTED_PLATFORMS.includes(value as Platform);

const isSourceType = (value: unknown): value is SourceType =>
  typeof value === 'string' && SOURCE_TYPES.includes(value as SourceType);

const platformContentTypes = (platform: Platform, projectContentTypes: SocialContentType[]) => {
  const allowed = PLATFORM_CONTENT_TYPES[platform];
  const selected = projectContentTypes.filter(type => allowed.includes(type));
  return selected.length ? selected : allowed;
};

const normalizeContentType = (value: unknown, allowed: SocialContentType[]) => {
  const direct = typeof value === 'string' ? value : '';
  const titled = toTitle(direct);
  const match = allowed.find(type => type === direct || type === titled);
  return match || allowed[0];
};

const normalizeContentItem = (item: Record<string, unknown>, context: ProjectContext) => {
  const contentType = normalizeContentType(item.contentType || item.content_type, context.contentTypes);

  return {
    title: String(item.title || '').trim(),
    platform: context.selectedPlatform,
    contentType,
    hook: String(item.hook || '').trim(),
    body: String(item.body || item.caption || item.description || '').trim(),
    cta: String(item.cta || '').trim(),
    hashtags: normalizeArray(item.hashtags),
    carouselOutline: normalizeArray(item.carouselOutline || item.carousel_outline),
    sceneOutline: normalizeArray(item.sceneOutline || item.scene_outline),
    shortVideoScript: String(item.shortVideoScript || item.short_video_script || item.videoScript || item.video_script || '').trim(),
    creativeDirection: String(item.creativeDirection || item.creative_direction || item.imageDescription || item.image_description || '').trim(),
    thumbnailPrompt: String(item.thumbnailPrompt || item.thumbnail_prompt || '').trim(),
    sourceType: context.sourceType,
    status: String(item.status || 'draft').toLowerCase(),
  };
};

const callOpenAiJson = async (prompt: string) => {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY Supabase Secret is not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Return valid JSON only. Do not include markdown fences or commentary.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `OpenAI request failed with status ${response.status}`);
  }

  const payload = JSON.parse(text);
  return JSON.parse(payload?.choices?.[0]?.message?.content || '{}');
};

const buildContentPrompt = (context: ProjectContext, count: number, excludeTitles: string[], mode: 'ideas' | 'content') => `
Generate ${count} social-media-native content item${count === 1 ? '' : 's'} for the selected business.

Business context:
- Business name: ${context.businessName || 'Selected business'}
- Website: ${context.websiteUrl || 'Not provided'}
- Industry: ${context.industry || 'Not provided'}
- Target audience: ${context.targetAudience || 'Not provided'}
- Brand description: ${context.brandDescription || 'Not provided'}
- Tone: ${context.tone || 'Professional'}
- Language: ${context.language || 'English'}
- Selected platform: ${context.selectedPlatform}
- Selected content types: ${context.contentTypes.join(', ')}
- Source type: ${context.sourceType}
- Posting frequency: ${context.postingFrequency || 'Not provided'}
- Campaign or brief override: ${context.campaign || 'Not provided'}
- Avoid these titles: ${excludeTitles.length ? excludeTitles.join(' | ') : 'None'}

Create only ${context.selectedPlatform} content. Use only these content types: ${context.contentTypes.join(', ')}.
Use the source type to decide the angle and level of detail. Audience override and campaign override should win over saved project defaults when present.

Platform requirements:
- Instagram: captions, hashtags, carousel outlines, reel scripts, story ideas, and image-post creative direction.
- Facebook: caption posts, image-post copy, carousel outlines, reel scripts, story ideas, and link post copy.
- TikTok: hooks, captions, hashtags, scene outlines, and short video scripts.
- YouTube: shorts scripts, video titles, descriptions, hashtags, and thumbnail prompts.

For image-related content, do not generate or request image files. Write creative direction as text with visual concept, background style, subject/object idea, text overlay idea, mood/style, carousel slide visual direction, and thumbnail concept where relevant.

${mode === 'ideas' ? 'Focus on compact content ideas and hooks that can later become full posts.' : 'Create complete platform-ready content.'}

Return JSON:
{
  "content": [
    {
      "title": "Internal content title",
      "platform": "${context.selectedPlatform}",
      "contentType": "${context.contentTypes[0]}",
      "hook": "Short opening hook",
      "body": "Platform-ready caption, post copy, idea, title, or description",
      "cta": "Clear CTA",
      "hashtags": ["#tag"],
      "carouselOutline": ["Slide 1", "Slide 2"],
      "sceneOutline": ["Scene 1", "Scene 2"],
      "shortVideoScript": "Short-form video script when relevant",
      "creativeDirection": "Text-only creative direction or image description",
      "thumbnailPrompt": "YouTube thumbnail concept when relevant",
      "status": "draft"
    }
  ]
}
`.trim();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Supabase function environment is missing database credentials.' }, 500);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch (_error) {
      return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
    }

    const action = String(body.action || '');
    const projectId = String(body.projectId || '');
    const supportedActions = ['generate_ideas', 'generate_content', 'replace_suggestion', 'regenerate_content'];

    if (!supportedActions.includes(action)) {
      return jsonResponse({ error: 'Invalid action.' }, 400);
    }

    if (!projectId) {
      return jsonResponse({ error: 'projectId is required.' }, 400);
    }

    const requestedSchema = String(body.schema || Deno.env.get('SUPABASE_SCHEMA') || 'ag_social_media_content');
    const schema = ALLOWED_SCHEMAS.includes(requestedSchema) ? requestedSchema : 'ag_social_media_content';

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      db: { schema },
    });

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return jsonResponse({ error: projectError?.message || 'Project not found.' }, 404);
    }

    const projectPlatforms = normalizeArray(project.platforms).filter(isPlatform);
    const projectContentTypes = normalizeArray(project.content_types) as SocialContentType[];
    const requestedPlatform = body.selectedPlatform;
    const selectedPlatform = isPlatform(requestedPlatform) ? requestedPlatform : projectPlatforms[0];

    if (!selectedPlatform) {
      return jsonResponse({ error: 'No supported platform is configured for this project.' }, 400);
    }

    if (requestedPlatform && (!isPlatform(requestedPlatform) || !projectPlatforms.includes(requestedPlatform))) {
      return jsonResponse({ error: 'Selected platform is not enabled for this project.' }, 400);
    }

    const settingsMetadata = project.settings_metadata && typeof project.settings_metadata === 'object' ? project.settings_metadata : {};
    const bodySourceType = body.sourceType || body.source_type;
    const sourceType = isSourceType(bodySourceType)
      ? bodySourceType
      : isSourceType(settingsMetadata.source_type)
        ? settingsMetadata.source_type
        : 'General Topic';

    const selectedContentTypes = platformContentTypes(selectedPlatform, projectContentTypes);
    const context: ProjectContext = {
      id: project.id,
      businessName: project.business_name || project.name || '',
      websiteUrl: project.website_url || '',
      industry: project.industry || '',
      targetAudience: String(body.audienceOverride || project.target_audience || ''),
      brandDescription: project.brand_description || '',
      tone: project.tone || 'Professional',
      language: project.language || 'English',
      platforms: [selectedPlatform],
      contentTypes: selectedContentTypes,
      selectedPlatform,
      sourceType,
      postingFrequency: project.posting_frequency || '',
      campaign: String(body.campaignOverride || ''),
    };

    const excludeTitles = Array.isArray(body.excludeTitles) ? body.excludeTitles.map(String) : [];
    const count = action === 'replace_suggestion' || action === 'regenerate_content' ? 1 : 12;
    const mode = action === 'generate_ideas' ? 'ideas' : 'content';
    const result = await callOpenAiJson(buildContentPrompt(context, count, excludeTitles, mode));
    const generated = (Array.isArray(result.content) ? result.content : [])
      .map((value: Record<string, unknown>) => normalizeContentItem(value, context))
      .filter(item => item.title && (item.body || item.hook || item.shortVideoScript || item.carouselOutline.length || item.sceneOutline.length || item.creativeDirection || item.thumbnailPrompt));

    if (action === 'replace_suggestion' || action === 'regenerate_content') {
      return jsonResponse({ content: generated[0] || null, suggestion: generated[0] || null });
    }

    if (action === 'generate_ideas') {
      return jsonResponse({ ideas: generated, content: generated });
    }

    return jsonResponse({ content: generated });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Unexpected auto generation error.',
    }, 500);
  }
});
