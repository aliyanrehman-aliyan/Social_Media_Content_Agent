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
  productsServices: string;
  uniqueSellingPoints: string;
  serviceAreas: string;
  audienceAgeGroup: string;
  audiencePainPoints: string;
  audienceInterests: string;
  customerGoals: string;
  customerObjections: string;
  writingStyle: string;
  emojiPreference: string;
  hashtagStyle: string;
  ctaStyle: string;
  contentGoal: string;
  mainOffer: string;
  currentCampaign: string;
  promotionDetails: string;
  importantKeywords: string;
  wordsToAvoid: string;
  competitorReferenceLinks: string;
  sourceDetails: string;
  referenceMaterials: string;
  platforms: Platform[];
  contentTypes: SocialContentType[];
  selectedPlatform: Platform;
  sourceType: SourceType;
  postingFrequency: string;
  campaign: string;
  location: string;
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

const PLATFORM_ASSET_IDEAS: Record<Platform, string> = {
  Facebook: 'Feed Post, Carousel, Banner, Link Preview, Community Post, Event Visual',
  Instagram: 'Feed Post, Carousel, Story, Reel Cover, Quote Card, Product/Lifestyle Visual',
  TikTok: 'Hook Scene, Thumbnail, Video Frame, Creator-Style Scene Layout, Text-Led Opening Shot',
  YouTube: 'YouTube Shorts Thumbnail, Opening Scene, Hook Visual, End Screen, Vertical Short Frame',
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

const normalizeArray = (value: unknown) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
};

const metadataString = (metadata: Record<string, unknown>, key: string) =>
  typeof metadata[key] === 'string' ? String(metadata[key]).trim() : '';

const rowString = (row: Record<string, unknown> | null | undefined, key: string) =>
  typeof row?.[key] === 'string' ? String(row[key]).trim() : '';

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

const getTodayLabel = () =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

const formatSerpPayload = (payload: Record<string, unknown>) => {
  const organicResults = Array.isArray(payload.organic_results)
    ? payload.organic_results.slice(0, 5).map((item: Record<string, unknown>, index: number) =>
      `${index + 1}. ${String(item.title || '').trim()} - ${String(item.snippet || '').trim()}`
    ).filter((line: string) => line.replace(/^[0-9]+\. -?/, '').trim())
    : [];
  const newsResults = Array.isArray(payload.news_results)
    ? payload.news_results.slice(0, 5).map((item: Record<string, unknown>, index: number) =>
      `${index + 1}. ${String(item.title || '').trim()} - ${String(item.snippet || item.source || item.date || '').trim()}`
    ).filter((line: string) => line.replace(/^[0-9]+\. -?/, '').trim())
    : [];
  const topStories = Array.isArray(payload.top_stories)
    ? payload.top_stories.slice(0, 5).map((item: Record<string, unknown>, index: number) =>
      `${index + 1}. ${String(item.title || '').trim()} - ${String(item.source || item.date || '').trim()}`
    ).filter((line: string) => line.replace(/^[0-9]+\. -?/, '').trim())
    : [];
  const relatedSearches = Array.isArray(payload.related_searches)
    ? payload.related_searches.slice(0, 5).map((item: Record<string, unknown>) => String(item.query || '').trim()).filter(Boolean)
    : [];
  const questions = Array.isArray(payload.related_questions)
    ? payload.related_questions.slice(0, 4).map((item: Record<string, unknown>) => String(item.question || '').trim()).filter(Boolean)
    : [];

  return [
    newsResults.length ? `News results:\n${newsResults.join('\n')}` : '',
    topStories.length ? `Top stories:\n${topStories.join('\n')}` : '',
    organicResults.length ? `Search results:\n${organicResults.join('\n')}` : '',
    relatedSearches.length ? `Related searches/topics: ${relatedSearches.join(' | ')}` : '',
    questions.length ? `Common questions: ${questions.join(' | ')}` : '',
  ].filter(Boolean).join('\n');
};

const fetchSerpQuery = async (apiKey: string, query: string, location: string, options: Record<string, string> = {}) => {
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', options.engine || 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('num', options.num || '5');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('hl', options.hl || 'en');
  url.searchParams.set('gl', options.gl || 'us');
  if (options.tbs) url.searchParams.set('tbs', options.tbs);
  if (location) url.searchParams.set('location', location);

  const response = await fetch(url);
  if (!response.ok) return `Search unavailable for "${query}": SerpAPI returned ${response.status}.`;
  return formatSerpPayload(await response.json());
};

const fetchSerpContext = async (context: ProjectContext) => {
  const apiKey = Deno.env.get('SERPAPI_KEY') || Deno.env.get('SERPAPI_API_KEY') || Deno.env.get('SERP_API_KEY');
  if (!apiKey) return 'SERP API key is not configured. No live search context was used.';

  const today = getTodayLabel();
  const category = context.industry || context.businessName || 'social media';
  const sourceAngle = context.sourceType === 'General Topic' ? 'general topic' : context.sourceType;
  const audience = context.targetAudience || 'target audience';
  const campaign = context.campaign ? ` ${context.campaign}` : '';
  const base = `${category} ${sourceAngle}${campaign}`.trim();
  const queries = [
    {
      label: `Breaking news and spotlight topics for ${today}`,
      query: `${base} latest breaking news today hot topics`,
      options: { engine: 'google_news', num: '8' },
    },
    {
      label: `Today's fast-moving Google topics`,
      query: `${base} trending today in demand discussions current spotlight`,
      options: { engine: 'google', num: '8', tbs: 'qdr:d' },
    },
    {
      label: `Audience demand and questions`,
      query: `${category} questions people are asking ${sourceAngle} ${audience} current concerns`,
      options: { engine: 'google', num: '6' },
    },
    {
      label: `${context.selectedPlatform} discussion and content angles`,
      query: `${category} ${context.selectedPlatform} trending discussions content ideas hooks ${sourceAngle}`,
      options: { engine: 'google', num: '6', tbs: 'qdr:w' },
    },
  ];

  try {
    const results = await Promise.all(queries.map(item => fetchSerpQuery(apiKey, item.query, context.location, item.options)));
    const usefulResults = queries
      .map((item, index) => ({ ...item, result: results[index] }))
      .filter(item => item.result && !item.result.startsWith('Search unavailable') && item.result !== 'No useful live search context was returned.');

    if (!usefulResults.length) return 'SERP API returned no useful live trend data for this request.';

    return [
      `SERP trend discovery date: ${today}`,
      `Discovery target: ${category}`,
      `Source type / content angle: ${context.sourceType}`,
      `Selected platform: ${context.selectedPlatform}`,
      ...usefulResults.map(item => `${item.label}:\nQuery: ${item.query}\n${item.result}`),
    ].join('\n\n');
  } catch (_error) {
    return 'Live search context unavailable due to a SerpAPI request error.';
  }
};

const buildContentPrompt = (context: ProjectContext, count: number, excludeTitles: string[], mode: 'ideas' | 'content', serpContext: string) => `
Generate ${count} social-media-native content item${count === 1 ? '' : 's'} for the selected business.

Business context:
- Business name: ${context.businessName || 'Selected business'}
- Website: ${context.websiteUrl || 'Not provided'}
- Industry: ${context.industry || 'Not provided'}
- Products / services: ${context.productsServices || 'Not provided'}
- Unique selling points: ${context.uniqueSellingPoints || 'Not provided'}
- Location / region: ${context.location || 'Not provided'}
- Service areas: ${context.serviceAreas || 'Not provided'}
- Target audience: ${context.targetAudience || 'Not provided'}
- Audience age group: ${context.audienceAgeGroup || 'Not provided'}
- Audience pain points: ${context.audiencePainPoints || 'Not provided'}
- Audience interests: ${context.audienceInterests || 'Not provided'}
- Customer goals: ${context.customerGoals || 'Not provided'}
- Customer objections: ${context.customerObjections || 'Not provided'}
- Brand description: ${context.brandDescription || 'Not provided'}
- Tone: ${context.tone || 'Professional'}
- Language: ${context.language || 'English'}
- Writing style: ${context.writingStyle || 'Clear and concise'}
- Emoji preference: ${context.emojiPreference || 'Minimal'}
- Hashtag style: ${context.hashtagStyle || 'Balanced broad and niche'}
- CTA style: ${context.ctaStyle || 'Soft CTA'}
- Content goal: ${context.contentGoal || 'Awareness'}
- Main offer: ${context.mainOffer || 'Not provided'}
- Current campaign: ${context.currentCampaign || 'Not provided'}
- Promotion details: ${context.promotionDetails || 'Not provided'}
- Important keywords: ${context.importantKeywords || 'Not provided'}
- Words to avoid: ${context.wordsToAvoid || 'Not provided'}
- Competitor / reference links: ${context.competitorReferenceLinks || 'Not provided'}
- Source information / brief: ${context.sourceDetails || 'Not provided'}
- Reference materials: ${context.referenceMaterials || 'Not provided'}
- Selected platform: ${context.selectedPlatform}
- Selected content types: ${context.contentTypes.join(', ')}
- Source type: ${context.sourceType}
- Posting frequency: ${context.postingFrequency || 'Not provided'}
- Campaign or brief override: ${context.campaign || 'Not provided'}
- Avoid these titles: ${excludeTitles.length ? excludeTitles.join(' | ') : 'None'}

Current trends, related topics, popular search results, and market context:
${serpContext}

SERP-first generation rule:
- Treat the SERP trend discovery above as the primary topic source.
- When useful SERP data is available, generate content around those current hot topics, breaking news themes, trending discussions, audience questions, and in-demand angles.
- Do not generate random evergreen or generic topics when SERP data contains usable current topics.
- Convert SERP findings into safe, brand-relevant social content angles. Do not copy titles/snippets verbatim, do not cite sources in the output, and do not claim facts that are not supported by the provided context.
- If SERP data is unavailable or empty, then and only then fall back to evergreen content based on the project settings.

Create only ${context.selectedPlatform} content. Use only these content types: ${context.contentTypes.join(', ')}.
If more than one content type is selected, distribute the generated items across every selected content type and include each selected content type at least once.
Use the source type to decide the angle and level of detail. Audience override and campaign override should win over saved project defaults when present.
Before writing, use the live search context to understand current topics, breaking/news themes, competitor angles, repeated hooks, and gaps. Create differentiated content for the selected business. Do not copy competitor wording, do not over-cite search results, and do not make unverifiable claims.

Platform requirements:
- Instagram: captions, hashtags, carousel outlines, reel scripts, story ideas, and asset ideas for ${PLATFORM_ASSET_IDEAS.Instagram}.
- Facebook: caption posts, carousel outlines, reel scripts, story ideas, link post copy, and asset ideas for ${PLATFORM_ASSET_IDEAS.Facebook}.
- TikTok: hooks, captions, hashtags, scene outlines, short video scripts, and asset ideas for ${PLATFORM_ASSET_IDEAS.TikTok}.
- YouTube Shorts: shorts scripts, video titles, descriptions, hashtags, thumbnail concepts, and asset ideas for ${PLATFORM_ASSET_IDEAS.YouTube}.

Quality and length requirements:
- Hook: write a specific, attention-grabbing opening line with tension, curiosity, benefit, or a clear promise. Avoid generic hooks.
- Body: write richer, more useful copy. For captions/posts/descriptions, use 90-180 words when platform-appropriate, with practical value, context, and a natural flow. For titles/hooks, keep them concise but sharper.
- CTA: make the action clear, direct, and matched to the platform and content goal.
- Hashtags: return 6-10 relevant hashtags, mixing broad, niche, and intent-based tags. Avoid spammy or unrelated tags.
- Carousel outline: when relevant, include 5-8 slide ideas with a clear narrative arc and a useful takeaway per slide.
- Scene outline: when relevant, include 5-7 detailed scenes. Each scene should mention shot/action, on-screen text or voiceover, visual framing, and transition or pacing notes.
- Short video script: when relevant, include a complete short-form script with hook, beats, voiceover/dialogue, on-screen text cues, and CTA.
- Asset idea: keep it detailed, platform-specific, and practical for a designer. Include visual concept, people/object/background, layout, colors, text placement, mood, and overall scene direction.
- Respect emoji preference, hashtag style, CTA style, important keywords, and words to avoid.
- Use products/services, USPs, audience pain points, customer goals, objections, offer/campaign details, and service areas to make the content specific.

Do not generate or request image files. Write a strong text-only asset idea in creativeDirection. The asset idea must describe what a designer could create, using the platform, source type, title, hook, caption/body, CTA, hashtags, and content. Include asset format, visual concept, main subject, background, text overlay, composition, color/mood, and platform-native framing. Keep it specific, human-like, and unique.

${mode === 'ideas' ? 'Focus on strong content ideas, but still include enough hook/body/asset detail for review.' : 'Create complete, platform-ready content with enough depth to be useful without another rewrite.'}

Return JSON:
{
  "content": [
    {
      "title": "Internal content title",
      "platform": "${context.selectedPlatform}",
      "contentType": "${context.contentTypes[0]}",
      "hook": "Strong attention-grabbing opening hook",
      "body": "Detailed platform-ready caption, post copy, idea, title, script context, or description",
      "cta": "Clear platform-native CTA",
      "hashtags": ["#relevantTag"],
      "carouselOutline": ["Slide 1: detailed slide purpose and visual direction", "Slide 2: detailed slide purpose and visual direction"],
      "sceneOutline": ["Scene 1: shot/action, on-screen text, framing, and pacing", "Scene 2: shot/action, on-screen text, framing, and pacing"],
      "shortVideoScript": "Complete short-form video script when relevant",
      "creativeDirection": "Detailed platform-specific asset idea describing visual concept, subject, background, layout, colors, text placement, and scene direction",
      "thumbnailPrompt": "YouTube Shorts thumbnail or hook visual concept when relevant",
      "status": "draft"
    }
  ]
}
`.trim();

const buildAssetIdeaPrompt = (context: ProjectContext, item: Record<string, unknown>, serpContext: string) => {
  const hashtags = normalizeArray(item.hashtags).join(' ');
  const carouselOutline = normalizeArray(item.carouselOutline || item.carousel_outline).join(' | ');
  const sceneOutline = normalizeArray(item.sceneOutline || item.scene_outline).join(' | ');
  const videoScript = String(item.videoScript || item.video_script || item.shortVideoScript || item.short_video_script || '').trim();
  const contentType = normalizeContentType(item.contentType || item.content_type, context.contentTypes);

  return `
Generate one strong text-only asset idea for this social content item. Do not generate or request image files.

Business and generation context:
- Business name: ${context.businessName || 'Selected business'}
- Industry: ${context.industry || 'Not provided'}
- Products / services: ${context.productsServices || 'Not provided'}
- Unique selling points: ${context.uniqueSellingPoints || 'Not provided'}
- Location / region: ${context.location || 'Not provided'}
- Service areas: ${context.serviceAreas || 'Not provided'}
- Target audience: ${context.targetAudience || 'Not provided'}
- Audience age group: ${context.audienceAgeGroup || 'Not provided'}
- Audience pain points: ${context.audiencePainPoints || 'Not provided'}
- Customer goals: ${context.customerGoals || 'Not provided'}
- Brand description: ${context.brandDescription || 'Not provided'}
- Tone: ${context.tone || 'Professional'}
- Language: ${context.language || 'English'}
- Writing style: ${context.writingStyle || 'Clear and concise'}
- Content goal: ${context.contentGoal || 'Awareness'}
- Main offer: ${context.mainOffer || 'Not provided'}
- Current campaign: ${context.currentCampaign || 'Not provided'}
- Important keywords: ${context.importantKeywords || 'Not provided'}
- Words to avoid: ${context.wordsToAvoid || 'Not provided'}
- Source information / brief: ${context.sourceDetails || 'Not provided'}
- Reference materials: ${context.referenceMaterials || 'Not provided'}
- Platform: ${context.selectedPlatform}
- Content type: ${contentType}
- Source type: ${context.sourceType}
- Campaign or brief override: ${context.campaign || 'Not provided'}

Content item:
- Title: ${String(item.title || '').trim() || 'Untitled content'}
- Hook: ${String(item.hook || '').trim() || 'Not provided'}
- Caption/body: ${String(item.body || item.caption || item.description || '').trim() || 'Not provided'}
- CTA: ${String(item.cta || '').trim() || 'Not provided'}
- Hashtags: ${hashtags || 'Not provided'}
- Carousel outline: ${carouselOutline || 'Not provided'}
- Scene outline: ${sceneOutline || 'Not provided'}
- Video script: ${videoScript || 'Not provided'}
- Existing thumbnail prompt: ${String(item.thumbnailPrompt || item.thumbnail_prompt || '').trim() || 'Not provided'}

Current trends, related topics, popular search results, and market context:
${serpContext}

Platform-native asset rules:
- Instagram: match feed posts, carousel slides, Stories, Reel covers, quote cards, or product/lifestyle visuals.
- Facebook: match feed posts, carousels, banners, link previews, community posts, or event-style visuals.
- TikTok: match vertical creator-style video frames, hook scenes, thumbnails, text-led opening shots, or scene layouts.
- YouTube Shorts: match vertical Shorts thumbnails, opening scenes, hook visuals, end screens, or short-form frames.

Use the source type, platform, title, hook, caption/body, CTA, hashtags, and content details to create a concrete asset idea. Include asset format, visual concept, people or object focus, background style, text overlay placement, composition, color palette, mood/style, lighting, platform framing, and how the scene should feel at first glance. Keep it detailed enough for a designer to execute without needing another brief.
Use live search context only as background inspiration. Do not cite sources or make unverifiable claims.

Return JSON:
{
  "assetIdea": "Detailed platform-specific asset idea as plain text",
  "creativeDirection": "Same as assetIdea",
  "thumbnailPrompt": "Only include a YouTube Shorts thumbnail/hook visual idea when useful, otherwise empty string"
}
`.trim();
};

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
    const supportedActions = ['generate_ideas', 'generate_content', 'replace_suggestion', 'regenerate_content', 'generate_asset_idea'];

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

    const { data: projectConfiguration } = await supabase
      .from('project_configurations')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

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

    const configValue = (key: string) =>
      rowString(projectConfiguration as Record<string, unknown> | null, key) || metadataString(settingsMetadata, key);

    const projectPlatformContentTypes = platformContentTypes(selectedPlatform, projectContentTypes);
    const bodyContentTypes = normalizeArray(body.selectedContentTypes || body.selectedContentType || body.contentTypes) as SocialContentType[];
    const requestedContentTypes = bodyContentTypes.filter(type => projectPlatformContentTypes.includes(type));
    const selectedContentTypes = requestedContentTypes.length ? requestedContentTypes : projectPlatformContentTypes;
    const context: ProjectContext = {
      id: project.id,
      businessName: project.business_name || project.name || '',
      websiteUrl: project.website_url || '',
      industry: project.industry || '',
      targetAudience: String(body.audienceOverride || project.target_audience || ''),
      brandDescription: project.brand_description || '',
      tone: project.tone || 'Professional',
      language: project.language || 'English',
      productsServices: configValue('products_services'),
      uniqueSellingPoints: configValue('unique_selling_points'),
      serviceAreas: configValue('service_areas'),
      audienceAgeGroup: configValue('audience_age_group'),
      audiencePainPoints: configValue('audience_pain_points'),
      audienceInterests: configValue('audience_interests'),
      customerGoals: configValue('customer_goals'),
      customerObjections: configValue('customer_objections'),
      writingStyle: configValue('writing_style'),
      emojiPreference: configValue('emoji_preference'),
      hashtagStyle: configValue('hashtag_style'),
      ctaStyle: configValue('cta_style'),
      contentGoal: configValue('content_goal'),
      mainOffer: configValue('main_offer'),
      currentCampaign: configValue('current_campaign'),
      promotionDetails: configValue('promotion_details'),
      importantKeywords: configValue('important_keywords'),
      wordsToAvoid: configValue('words_to_avoid'),
      competitorReferenceLinks: configValue('competitor_reference_links'),
      sourceDetails: configValue('source_details'),
      referenceMaterials: configValue('reference_materials'),
      platforms: [selectedPlatform],
      contentTypes: selectedContentTypes,
      selectedPlatform,
      sourceType,
      postingFrequency: project.posting_frequency || '',
      campaign: String(body.campaignOverride || ''),
      location: project.location || '',
    };

    const excludeTitles = Array.isArray(body.excludeTitles) ? body.excludeTitles.map(String) : [];
    const serpContext = await fetchSerpContext(context);

    if (action === 'generate_asset_idea') {
      const item = body.item && typeof body.item === 'object' ? body.item as Record<string, unknown> : {};
      if (!Object.keys(item).length) {
        return jsonResponse({ error: 'item is required for asset idea generation.' }, 400);
      }

      const result = await callOpenAiJson(buildAssetIdeaPrompt(context, item, serpContext));
      const assetIdea = String(result.assetIdea || result.creativeDirection || '').trim();
      const thumbnailPrompt = String(result.thumbnailPrompt || result.thumbnail_prompt || '').trim();
      return jsonResponse({
        assetIdea,
        creativeDirection: assetIdea,
        thumbnailPrompt,
      });
    }

    const count = action === 'replace_suggestion' || action === 'regenerate_content' ? 1 : 12;
    const mode = action === 'generate_ideas' ? 'ideas' : 'content';
    const result = await callOpenAiJson(buildContentPrompt(context, count, excludeTitles, mode, serpContext));
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
