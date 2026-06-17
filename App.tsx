import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  FileText,
  FolderKanban,
  Globe,
  Loader2,
  LogOut,
  Monitor,
  Plus,
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { ApprovalStatus, ContentStatus, Platform, Project, ProjectConfiguration, SocialContent, SocialContentType, Tab } from './types';
import Analytics from './pages/Analytics';
import AutoGenerate from './pages/AutoGenerate';
import Calendar from './pages/Calendar';
import Demo from './pages/Demo';
import Editor from './pages/Editor';
import Posts from './pages/Posts';
import ProjectsPage from './pages/Projects';
import Settings from './pages/Settings';
import { isSourceType, sanitizeContentTypes, sanitizePlatforms } from './socialConfig';

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const getTabFromPath = (path: string): Tab => {
  switch (normalizePath(path)) {
    case '/projects':
      return 'Projects';
    case '/analytics':
      return 'Analytics';
    case '/settings':
      return 'Settings';
    case '/demo':
      return 'Demo';
    case '/auto-generate':
    case '/customer-workspace/auto-generate':
    case '/customer-workspace/calendar':
    case '/customer-workspace':
    case '/customer-workspace/posts':
    case '/':
      return 'AutoGenerate';
    default:
      return 'AutoGenerate';
  }
};

const getRouteForTab = (tab: Tab) => {
  switch (tab) {
    case 'Projects':
      return '/projects';
    case 'Analytics':
      return '/analytics';
    case 'Settings':
      return '/settings';
    case 'Demo':
      return '/demo';
    case 'AutoGenerate':
      return '/customer-workspace/auto-generate';
    case 'Calendar':
    case 'Posts':
    case 'Editor':
    default:
      return '/customer-workspace/auto-generate';
  }
};

const toTitleCaseStatus = <T extends string>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') as T;
};

const toDbValue = (value: string) => value.toLowerCase().replace(/\s+/g, '_');

const normalizeDbKey = (value: string | null | undefined) =>
  String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

const PLATFORM_FROM_DB: Record<string, Platform> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  tik_tok: 'TikTok',
  youtube: 'YouTube',
  youtube_shorts: 'YouTube',
  shorts: 'YouTube',
};

const CONTENT_TYPE_FROM_DB: Record<string, SocialContentType> = {
  caption: 'Caption',
  image_post: 'Image Post',
  carousel: 'Carousel',
  carousel_outline: 'Carousel',
  reel_script: 'Reel Script',
  story_idea: 'Story Idea',
  hashtags: 'Hashtags',
  caption_post: 'Caption Post',
  link_post: 'Link Post',
  short_video_script: 'Short Video Script',
  hook: 'Hook',
  scene_outline: 'Scene Outline',
  shorts_script: 'Shorts Script',
  video_title: 'Video Title',
  description: 'Description',
  thumbnail_prompt: 'Thumbnail Prompt',
};

const mapPlatformValue = (value: string | null | undefined): Platform =>
  PLATFORM_FROM_DB[normalizeDbKey(value)] || 'Instagram';

const mapContentTypeValue = (value: string | null | undefined, platform: Platform): SocialContentType => {
  const mapped = CONTENT_TYPE_FROM_DB[normalizeDbKey(value)];
  return sanitizeContentTypes(mapped ? [mapped] : [], [platform])[0];
};

const mapConfiguration = (row: any): ProjectConfiguration | undefined => {
  if (!row) return undefined;
  return {
    projectId: row.project_id,
    productsServices: row.products_services || '',
    uniqueSellingPoints: row.unique_selling_points || '',
    serviceAreas: row.service_areas || '',
    audienceAgeGroup: row.audience_age_group || '',
    audiencePainPoints: row.audience_pain_points || '',
    audienceInterests: row.audience_interests || '',
    customerGoals: row.customer_goals || '',
    customerObjections: row.customer_objections || '',
    writingStyle: row.writing_style || 'Clear and concise',
    emojiPreference: row.emoji_preference || 'Minimal',
    hashtagStyle: row.hashtag_style || 'Balanced broad and niche',
    ctaStyle: row.cta_style || 'Soft CTA',
    contentGoal: row.content_goal || 'Awareness',
    mainOffer: row.main_offer || '',
    currentCampaign: row.current_campaign || '',
    promotionDetails: row.promotion_details || '',
    importantKeywords: row.important_keywords || '',
    wordsToAvoid: row.words_to_avoid || '',
    competitorReferenceLinks: row.competitor_reference_links || '',
    sourceDetails: row.source_details || '',
    referenceMaterials: row.reference_materials || '',
  };
};

const configurationToMetadata = (configuration?: ProjectConfiguration) => configuration ? {
  products_services: configuration.productsServices,
  unique_selling_points: configuration.uniqueSellingPoints,
  service_areas: configuration.serviceAreas,
  audience_age_group: configuration.audienceAgeGroup,
  audience_pain_points: configuration.audiencePainPoints,
  audience_interests: configuration.audienceInterests,
  customer_goals: configuration.customerGoals,
  customer_objections: configuration.customerObjections,
  writing_style: configuration.writingStyle,
  emoji_preference: configuration.emojiPreference,
  hashtag_style: configuration.hashtagStyle,
  cta_style: configuration.ctaStyle,
  content_goal: configuration.contentGoal,
  main_offer: configuration.mainOffer,
  current_campaign: configuration.currentCampaign,
  promotion_details: configuration.promotionDetails,
  important_keywords: configuration.importantKeywords,
  words_to_avoid: configuration.wordsToAvoid,
  competitor_reference_links: configuration.competitorReferenceLinks,
  source_details: configuration.sourceDetails,
  reference_materials: configuration.referenceMaterials,
} : {};

const mapProject = (p: any, configurationRow?: any): Project => {
  const configuration = mapConfiguration(configurationRow);
  const settingsMetadata = p.settings_metadata && typeof p.settings_metadata === 'object' ? p.settings_metadata : {};
  const platforms = sanitizePlatforms(p.platforms);
  const contentTypes = sanitizeContentTypes(p.content_types, platforms);

  return {
    id: p.id,
    name: p.name || p.business_name || 'Untitled Business',
    businessName: p.business_name || p.name || '',
    websiteUrl: p.website_url || '',
    industry: p.industry || '',
    targetAudience: p.target_audience || '',
    brandDescription: p.brand_description || '',
    tone: p.tone || 'Professional',
    language: p.language || 'English',
    platforms,
    contentTypes,
    sourceType: isSourceType(settingsMetadata.source_type) ? settingsMetadata.source_type : 'General Topic',
    postingFrequency: p.posting_frequency || '',
    publishingMode: p.publishing_mode === 'auto_publish' ? 'auto_publish' : 'manual',
    location: p.location || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    settingsMetadata: { ...settingsMetadata, ...configurationToMetadata(configuration) },
    configuration,
    createdAt: p.created_at,
  };
};

const mapContent = (p: any): SocialContent => {
  const categoryIds = p.category_ids || [];
  const platform = mapPlatformValue(p.platform);
  const contentType = mapContentTypeValue(p.content_type, platform);

  return {
    id: p.id,
    projectId: p.project_id,
    categoryId: categoryIds[0],
    categoryIds,
    title: p.title || `${p.platform || 'Social'} ${p.content_type || 'Content'}`,
    platform,
    contentType,
    hook: p.hook || '',
    body: p.body || '',
    cta: p.cta || '',
    hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
    carouselOutline: Array.isArray(p.carousel_outline) ? p.carousel_outline : [],
    videoScript: p.short_video_script || '',
    sceneOutline: Array.isArray(p.generation_metadata?.scene_outline) ? p.generation_metadata.scene_outline : [],
    creativeDirection: p.image_prompt || p.generation_metadata?.creative_direction || '',
    thumbnailPrompt: p.generation_metadata?.thumbnail_prompt || '',
    sourceType: isSourceType(p.generation_metadata?.source_type) ? p.generation_metadata.source_type : undefined,
    status: toTitleCaseStatus<ContentStatus>(p.status, 'Draft'),
    approvalStatus: toTitleCaseStatus<ApprovalStatus>(p.approval_status, 'Pending'),
    category: 'Social Content',
    author: 'Admin',
    date: new Intl.DateTimeFormat('en-CA').format(new Date(p.scheduled_at || p.created_at)),
    scheduledAt: p.scheduled_at,
    image: p.image_url || '',
    imageProvider: p.image_provider || '',
    imagePrompt: p.image_prompt || '',
    imageUrl: p.image_url || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
  };
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(() => getTabFromPath(window.location.pathname));
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [posts, setPosts] = useState<SocialContent[]>([]);
  const [editingPost, setEditingPost] = useState<SocialContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (normalizePath(window.location.pathname) === '/') {
      window.history.replaceState(null, '', '/customer-workspace');
    } else if (normalizePath(window.location.pathname) === '/auto-generate') {
      window.history.replaceState(null, '', '/customer-workspace/auto-generate');
    }

    const handlePopState = () => setActiveTab(getTabFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initDashboard = async () => {
      try {
        const loadedProjects = await fetchProjects();
        if (isMounted && loadedProjects.length === 0 && normalizePath(window.location.pathname) !== '/settings') {
          setActiveTab('Settings');
          window.history.replaceState(null, '', '/settings');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchProjects = async (preferredSelectedProjectId?: string | null) => {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Project fetch error:', error);
      return [];
    }

    const projectIds = (data || []).map(project => project.id);
    let configurations: any[] = [];
    if (projectIds.length) {
      const { data: configData, error: configError } = await supabase
        .from('project_configurations')
        .select('*')
        .in('project_id', projectIds);
      if (configError) console.error('Project configuration fetch error:', configError);
      configurations = configData || [];
    }

    const configMap = new Map(configurations.map(config => [config.project_id, config]));
    const mapped = (data || []).map(project => mapProject(project, configMap.get(project.id)));
    setProjects(mapped);

    const nextSelectedId = preferredSelectedProjectId || null;
    if (nextSelectedId && mapped.some(project => project.id === nextSelectedId)) {
      setSelectedProjectId(nextSelectedId);
    } else {
      setSelectedProjectId(null);
    }

    return mapped;
  };

  const fetchProjectData = async (projectId: string) => {
    const { data: content } = await supabase
      .from('social_content_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    setPosts((content || []).map(item => mapContent(item)));
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectData(selectedProjectId);
    } else {
      setPosts([]);
      setEditingPost(null);
    }
  }, [selectedProjectId]);

  const activeProject = useMemo(() => projects.find(project => project.id === selectedProjectId) || null, [projects, selectedProjectId]);

  const sidebarItems = [
    { id: 'AutoGenerate', icon: FileText, label: 'Customer Workspace' },
    { id: 'Analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'Settings', icon: SettingsIcon, label: 'Settings' },
    { id: 'Demo', icon: Monitor, label: 'Demo' },
  ];

  const workspaceItems = [
    { id: 'AutoGenerate', icon: Sparkles, label: 'Auto Generate' },
  ];

  const isWorkspaceTab = (tab: Tab) =>
    tab === 'AutoGenerate';

  const navigateTo = (tab: Tab, route = getRouteForTab(tab)) => {
    setActiveTab(tab);
    if (normalizePath(window.location.pathname) !== normalizePath(route)) {
      window.history.pushState(null, '', route);
    }
  };

  const projectPayload = (project: Project) => ({
    name: project.name || project.businessName,
    business_name: project.businessName || project.name,
    website_url: project.websiteUrl || null,
    industry: project.industry,
    target_audience: project.targetAudience,
    brand_description: project.brandDescription,
    tone: project.tone,
    language: project.language,
    platforms: project.platforms || [],
    content_types: project.contentTypes || [],
    publishing_mode: project.publishingMode || 'manual',
    location: project.location || null,
    tags: project.tags || [],
      settings_metadata: {
        ...(project.settingsMetadata || {}),
        ...configurationToMetadata(project.configuration),
        source_type: project.sourceType || 'General Topic',
      },
  });

  const configurationPayload = (projectId: string, project: Project) => {
    const metadata = {
      ...(project.settingsMetadata || {}),
      ...configurationToMetadata(project.configuration),
    };
    return {
      project_id: projectId,
      products_services: String(metadata.products_services || ''),
      unique_selling_points: String(metadata.unique_selling_points || ''),
      service_areas: String(metadata.service_areas || ''),
      audience_age_group: String(metadata.audience_age_group || ''),
      audience_pain_points: String(metadata.audience_pain_points || ''),
      audience_interests: String(metadata.audience_interests || ''),
      customer_goals: String(metadata.customer_goals || ''),
      customer_objections: String(metadata.customer_objections || ''),
      writing_style: String(metadata.writing_style || 'Clear and concise'),
      emoji_preference: String(metadata.emoji_preference || 'Minimal'),
      hashtag_style: String(metadata.hashtag_style || 'Balanced broad and niche'),
      cta_style: String(metadata.cta_style || 'Soft CTA'),
      content_goal: String(metadata.content_goal || 'Awareness'),
      main_offer: String(metadata.main_offer || ''),
      current_campaign: String(metadata.current_campaign || ''),
      promotion_details: String(metadata.promotion_details || ''),
      important_keywords: String(metadata.important_keywords || ''),
      words_to_avoid: String(metadata.words_to_avoid || ''),
      competitor_reference_links: String(metadata.competitor_reference_links || ''),
      source_details: String(metadata.source_details || ''),
      reference_materials: String(metadata.reference_materials || ''),
    };
  };

  const handleAddProject = async (newProj: Project, options: { navigateAfterCreate?: boolean } = { navigateAfterCreate: true }) => {
    const { data, error } = await supabase.from('projects').insert(projectPayload(newProj)).select().single();
    if (error) return { error };

    const { error: configError } = await supabase
      .from('project_configurations')
      .upsert(configurationPayload(data.id, newProj), { onConflict: 'project_id' });
    if (configError) return { error: configError };

    await fetchProjects(data.id);
    setSelectedProjectId(data.id);
    if (options.navigateAfterCreate) navigateTo('AutoGenerate', '/customer-workspace/auto-generate');
    return { data: mapProject(data, configurationPayload(data.id, newProj)) };
  };

  const handleUpdateProject = async (updated: Project) => {
    const { data, error } = await supabase.from('projects').update(projectPayload(updated)).eq('id', updated.id).select().single();
    if (error) return { error };

    const { error: configError } = await supabase
      .from('project_configurations')
      .upsert(configurationPayload(updated.id, updated), { onConflict: 'project_id' });
    if (configError) return { error: configError };

    await fetchProjects(updated.id || selectedProjectId);
    return { data: data ? mapProject(data, configurationPayload(updated.id, updated)) : undefined };
  };

  const handleClearProjectSelection = () => {
    setSelectedProjectId(null);
    if (activeTab === 'Editor') navigateTo('AutoGenerate', '/customer-workspace/auto-generate');
  };

  const handleStartNewProject = () => {
    setSelectedProjectId(null);
    navigateTo('Settings');
  };

  const handleSavePost = async (post: SocialContent) => {
    if (!selectedProjectId) return;

    const payload = {
      project_id: selectedProjectId,
      category_ids: [],
      title: post.title,
      platform: toDbValue(post.platform),
      content_type: toDbValue(post.contentType),
      hook: post.hook,
      body: post.body,
      cta: post.cta,
      hashtags: post.hashtags || [],
      carousel_outline: post.carouselOutline || [],
      short_video_script: post.videoScript || null,
      status: toDbValue(post.status),
      approval_status: toDbValue(post.approvalStatus),
      scheduled_at: post.scheduledAt || null,
      image_url: post.imageUrl || post.image || null,
      image_provider: post.imageProvider || null,
      image_prompt: post.creativeDirection || post.imagePrompt || null,
      tags: post.tags || [],
      generation_metadata: {
        source_type: post.sourceType || activeProject?.sourceType || 'General Topic',
        scene_outline: post.sceneOutline || [],
        creative_direction: post.creativeDirection || '',
        thumbnail_prompt: post.thumbnailPrompt || '',
      },
      publishing_metadata: {},
    };

    if (post.id.length < 10) {
      await supabase.from('social_content_items').insert(payload);
    } else {
      await supabase
        .from('social_content_items')
        .update(payload)
        .eq('id', post.id)
        .eq('project_id', selectedProjectId);
    }

    await fetchProjectData(selectedProjectId);
    navigateTo('AutoGenerate', '/customer-workspace/auto-generate');
  };

  const handleClearWorkspace = () => {
    setSelectedProjectId(null);
    navigateTo('AutoGenerate', '/customer-workspace/auto-generate');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-200 animate-pulse">
          <Globe className="w-12 h-12 text-white" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Restoring Session...</p>
        </div>
      </div>
    );
  }

  const renderEmptyProjectState = () => (
    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
      <FolderKanban className="w-16 h-16 mb-4 opacity-10" />
      <h2 className="text-lg font-black text-slate-800">No project selected</h2>
      <p className="text-sm font-semibold mt-1">Select an existing project or create a new agent to start working.</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => navigateTo('Projects')} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-2">
          <FolderKanban className="w-4 h-4" />
          Select Project
        </button>
        <button type="button" onClick={handleStartNewProject} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100">
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!activeProject && activeTab !== 'Projects' && activeTab !== 'Settings' && activeTab !== 'Demo') {
      return renderEmptyProjectState();
    }

    switch (activeTab) {
      case 'Posts':
        return <Posts posts={posts} projectName={activeProject?.name || ''} onDelete={async (id) => { if (!selectedProjectId) return; await supabase.from('social_content_items').delete().eq('id', id).eq('project_id', selectedProjectId); fetchProjectData(selectedProjectId); }} onToggleStatus={async (id) => { if (!selectedProjectId) return; const p = posts.find(item => item.id === id); await supabase.from('social_content_items').update({ status: p?.status === 'Published' ? 'draft' : 'published' }).eq('id', id).eq('project_id', selectedProjectId); fetchProjectData(selectedProjectId); }} onCreatePost={() => { setEditingPost(null); navigateTo('Editor', '/customer-workspace/posts'); }} onEditPost={(p) => { setEditingPost(p); navigateTo('Editor', '/customer-workspace/posts'); }} />;
      case 'Projects':
        return <ProjectsPage projects={projects} activeProjectId={selectedProjectId || ''} onSelect={(id) => { setSelectedProjectId(id); navigateTo('AutoGenerate', '/customer-workspace/auto-generate'); }} onAdd={handleAddProject} onUpdate={handleUpdateProject} onCreateNew={handleStartNewProject} />;
      case 'Analytics':
        return <Analytics project={activeProject!} posts={posts} />;
      case 'Settings':
        return <Settings project={activeProject} onUpdate={handleUpdateProject} onCreate={(project) => handleAddProject(project, { navigateAfterCreate: false })} />;
      case 'Demo':
        return <Demo />;
      case 'AutoGenerate':
        return <AutoGenerate project={activeProject} onContentSaved={() => selectedProjectId && fetchProjectData(selectedProjectId)} />;
      case 'Calendar':
        return <Calendar posts={posts} onEditPost={(p) => { setEditingPost(p); navigateTo('Editor', '/customer-workspace/posts'); }} />;
      case 'Editor':
        return <Editor post={editingPost} project={activeProject!} onSave={handleSavePost} onCancel={() => navigateTo('AutoGenerate', '/customer-workspace/auto-generate')} />;
      default:
        return <div className="p-20 text-center">Coming Soon</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg"><Globe className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold text-white tracking-tight">Social Media Content Agent</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => navigateTo(item.id as Tab, getRouteForTab(item.id as Tab))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  (item.id === 'AutoGenerate' ? isWorkspaceTab(activeTab) : activeTab === item.id)
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>

              {item.id === 'AutoGenerate' && (
                <div className="ml-4 pl-3 border-l border-slate-700/70 space-y-1">
                  {workspaceItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => navigateTo(subItem.id as Tab)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === subItem.id || (subItem.id === 'Posts' && activeTab === 'Editor')
                          ? 'bg-slate-800 text-white'
                          : 'hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <subItem.icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-1">
          <button onClick={handleClearWorkspace} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
            <LogOut className="w-4 h-4" /> Clear Selection
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full text-sm font-semibold text-slate-700 border border-slate-200 transition-all hover:bg-slate-200" onClick={() => navigateTo('Projects')}>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {activeProject?.name || 'Select Project'}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={handleClearProjectSelection}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                !activeProject
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Clear Selection
            </button>
            <button
              onClick={handleStartNewProject}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Project
            </button>
            <span className="text-slate-300">|</span>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
              {isWorkspaceTab(activeTab) ? 'Customer Workspace' : activeTab}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">A</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">{renderContent()}</main>
      </div>
    </div>
  );
};

export default App;
