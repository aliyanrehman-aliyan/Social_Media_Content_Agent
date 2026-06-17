import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Database,
  Globe,
  Loader2,
  Megaphone,
  Save,
  Send,
  Sparkles,
  Target,
  Type,
  Users
} from 'lucide-react';
import { Platform, Project, SocialContentType } from '../types';
import { PLATFORM_CONTENT_TYPES, sanitizeContentTypes, sanitizePlatforms, SOURCE_TYPE_OPTIONS, SUPPORTED_PLATFORMS } from '../socialConfig';
import InfoPopover from '../components/InfoPopover';

interface SettingsProps {
  project: Project | null;
  onUpdate: (project: Project) => Promise<void> | void;
  onCreate: (project: Project) => Promise<{ data?: Project; error?: any }>;
}

const TONE_OPTIONS = ['Professional', 'Casual', 'Witty', 'Educational', 'Friendly', 'Bold'];
const LANGUAGE_OPTIONS = ['English', 'Arabic', 'English and Arabic'];
const WRITING_STYLE_OPTIONS = ['Clear and concise', 'Storytelling', 'Educational', 'Persuasive', 'Conversational', 'Authority-led'];
const EMOJI_OPTIONS = ['Minimal', 'Moderate', 'None'];
const HASHTAG_STYLE_OPTIONS = ['Balanced broad and niche', 'Niche only', 'Local + niche', 'Trending + intent', 'Minimal'];
const CTA_STYLE_OPTIONS = ['Soft CTA', 'Direct CTA', 'Question CTA', 'Lead generation CTA', 'Sales CTA'];
const CONTENT_GOAL_OPTIONS = ['Awareness', 'Engagement', 'Leads', 'Sales', 'Education', 'Trust Building', 'Community Growth'];
type SettingsStepId = 'profile' | 'business' | 'audience' | 'strategy' | 'platforms' | 'method';

const CONTENT_TYPE_DESCRIPTIONS: Record<Platform, Partial<Record<SocialContentType, string>>> = {
  Instagram: {
    Caption: 'Main text for an Instagram post.',
    'Image Post': 'Single visual post with caption.',
    Carousel: 'Multiple slides/images for swipeable content.',
    'Reel Script': 'Short video script for Instagram Reels.',
    'Story Idea': 'Quick 24-hour story concept.',
    Hashtags: 'Relevant hashtags for reach.',
  },
  Facebook: {
    'Caption Post': 'Text/caption for Facebook feed.',
    'Image Post': 'Single image post with text.',
    Carousel: 'Multiple images/slides in one post.',
    'Reel Script': 'Short video script for Facebook Reels.',
    'Story Idea': 'Short story concept for Facebook.',
    'Link Post': 'Post designed to promote a URL.',
  },
  TikTok: {
    'Short Video Script': 'Script for a TikTok video.',
    Hook: 'Opening line to grab attention.',
    Caption: 'TikTok caption text.',
    Hashtags: 'TikTok discovery hashtags.',
    'Scene Outline': 'Scene-by-scene video flow.',
  },
  YouTube: {
    'Shorts Script': 'Script for YouTube Shorts.',
    'Video Title': 'Optimized title idea.',
    Description: 'YouTube video/Shorts description.',
    Hashtags: 'YouTube hashtags.',
    'Thumbnail Prompt': 'Text description of thumbnail idea.',
  },
};

const FieldLabel: React.FC<{ children: React.ReactNode; help: string }> = ({ children, help }) => (
  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
    {children}
    <InfoPopover text={help} />
  </label>
);

const metadataValue = (metadata: Record<string, unknown> | undefined, key: string, fallback = '') =>
  typeof metadata?.[key] === 'string' ? String(metadata[key]) : fallback;

const getInitialFormData = (project: Project | null) => {
  const metadata = project?.settingsMetadata;
  const config = project?.configuration;
  return {
    businessName: project?.businessName || project?.name || '',
    websiteUrl: project?.websiteUrl || '',
    industry: project?.industry || '',
    targetAudience: project?.targetAudience || '',
    brandDescription: project?.brandDescription || '',
    tone: project?.tone || 'Professional',
    language: project?.language || 'English',
    productsServices: config?.productsServices || metadataValue(metadata, 'products_services'),
    uniqueSellingPoints: config?.uniqueSellingPoints || metadataValue(metadata, 'unique_selling_points'),
    serviceAreas: config?.serviceAreas || metadataValue(metadata, 'service_areas'),
    audienceAgeGroup: config?.audienceAgeGroup || metadataValue(metadata, 'audience_age_group'),
    audiencePainPoints: config?.audiencePainPoints || metadataValue(metadata, 'audience_pain_points'),
    audienceInterests: config?.audienceInterests || metadataValue(metadata, 'audience_interests'),
    customerGoals: config?.customerGoals || metadataValue(metadata, 'customer_goals'),
    customerObjections: config?.customerObjections || metadataValue(metadata, 'customer_objections'),
    writingStyle: config?.writingStyle || metadataValue(metadata, 'writing_style', 'Clear and concise'),
    emojiPreference: config?.emojiPreference || metadataValue(metadata, 'emoji_preference', 'Minimal'),
    hashtagStyle: config?.hashtagStyle || metadataValue(metadata, 'hashtag_style', 'Balanced broad and niche'),
    ctaStyle: config?.ctaStyle || metadataValue(metadata, 'cta_style', 'Soft CTA'),
    contentGoal: config?.contentGoal || metadataValue(metadata, 'content_goal', 'Awareness'),
    mainOffer: config?.mainOffer || metadataValue(metadata, 'main_offer'),
    currentCampaign: config?.currentCampaign || metadataValue(metadata, 'current_campaign'),
    promotionDetails: config?.promotionDetails || metadataValue(metadata, 'promotion_details'),
    importantKeywords: config?.importantKeywords || metadataValue(metadata, 'important_keywords'),
    wordsToAvoid: config?.wordsToAvoid || metadataValue(metadata, 'words_to_avoid'),
    competitorReferenceLinks: config?.competitorReferenceLinks || metadataValue(metadata, 'competitor_reference_links'),
    sourceDetails: config?.sourceDetails || metadataValue(metadata, 'source_details'),
    referenceMaterials: config?.referenceMaterials || metadataValue(metadata, 'reference_materials'),
    platforms: sanitizePlatforms(project?.platforms),
    contentTypes: sanitizeContentTypes(project?.contentTypes, sanitizePlatforms(project?.platforms)),
    sourceType: project?.sourceType || 'General Topic',
    publishingMode: project?.publishingMode || 'manual',
    location: project?.location || '',
  };
};

const toggleArrayValue = <T extends string>(items: T[], value: T) =>
  items.includes(value) ? items.filter(item => item !== value) : [...items, value];

const Settings: React.FC<SettingsProps> = ({ project, onUpdate, onCreate }) => {
  const [activeStep, setActiveStep] = useState<SettingsStepId>('profile');
  const [expandedPlatform, setExpandedPlatform] = useState<Platform | null>(() => sanitizePlatforms(project?.platforms)[0] || SUPPORTED_PLATFORMS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => getInitialFormData(project));
  const isOnboarding = !project;
  const displayName = formData.businessName.trim() || (isOnboarding ? 'New Business' : project?.name || 'Business');

  useEffect(() => {
    const nextFormData = getInitialFormData(project);
    setFormData(nextFormData);
    setExpandedPlatform(nextFormData.platforms[0] || SUPPORTED_PLATFORMS[0]);
    setSaved(false);
    setErrorMsg(null);
  }, [project]);

  const steps = [
    { id: 'profile', title: 'Business Profile', description: 'Welcome and overview', icon: Building2 },
    { id: 'business', title: 'Business Information', description: 'Company facts', icon: Target },
    { id: 'audience', title: 'Audience & Brand', description: 'Customer and voice', icon: Users },
    { id: 'strategy', title: 'Marketing & Content Strategy', description: 'Goals and campaigns', icon: Megaphone },
    { id: 'platforms', title: 'Platforms & Content Types', description: 'Channel formats', icon: Sparkles },
    { id: 'method', title: 'Channels & Publishing', description: 'Publishing mode', icon: Database }
  ] satisfies Array<{ id: SettingsStepId; title: string; description: string; icon: React.ElementType }>;

  const stepDescriptions: Record<SettingsStepId, string> = {
    profile: 'Start with a calm overview before collecting setup details.',
    business: 'Capture the business facts the content agent should understand.',
    audience: 'Define the people, brand voice, and writing preferences behind every post.',
    strategy: 'Set campaign, keyword, CTA, and source context for more relevant generation.',
    platforms: 'Choose platform-specific content formats in a compact accordion.',
    method: 'Choose how approved content is handled after generation.',
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!formData.industry.trim() || !formData.targetAudience.trim()) {
      setActiveStep(!formData.industry.trim() ? 'business' : 'audience');
      setErrorMsg('Please complete industry and target audience.');
      return;
    }

    if (formData.websiteUrl.trim()) {
      try {
        new URL(formData.websiteUrl);
      } catch {
        setActiveStep('business');
        setErrorMsg('Please enter a valid website URL or leave it empty.');
        return;
      }
    }

    if (formData.platforms.length === 0 || formData.contentTypes.length === 0) {
      setActiveStep('platforms');
      setErrorMsg('Please choose at least one platform and one content type.');
      return;
    }

    setIsSaving(true);
    setSaved(false);

    const updatedProject: Project = {
      ...(project || {}),
      id: project?.id || '',
      name: formData.businessName.trim() || project?.name || 'New Business',
      businessName: formData.businessName.trim() || project?.businessName || project?.name || 'New Business',
      websiteUrl: formData.websiteUrl.trim(),
      industry: formData.industry.trim(),
      targetAudience: formData.targetAudience.trim(),
      brandDescription: formData.brandDescription.trim(),
      tone: formData.tone,
      language: formData.language,
      platforms: formData.platforms,
      contentTypes: formData.contentTypes,
      sourceType: formData.sourceType,
      postingFrequency: project?.postingFrequency || '',
      publishingMode: formData.publishingMode as Project['publishingMode'],
      location: formData.location.trim(),
      tags: project?.tags || [],
      settingsMetadata: {
        ...(project?.settingsMetadata || {}),
        source_type: formData.sourceType,
        products_services: formData.productsServices.trim(),
        unique_selling_points: formData.uniqueSellingPoints.trim(),
        service_areas: formData.serviceAreas.trim(),
        audience_age_group: formData.audienceAgeGroup.trim(),
        audience_pain_points: formData.audiencePainPoints.trim(),
        audience_interests: formData.audienceInterests.trim(),
        customer_goals: formData.customerGoals.trim(),
        customer_objections: formData.customerObjections.trim(),
        writing_style: formData.writingStyle,
        emoji_preference: formData.emojiPreference,
        hashtag_style: formData.hashtagStyle,
        cta_style: formData.ctaStyle,
        content_goal: formData.contentGoal,
        main_offer: formData.mainOffer.trim(),
        current_campaign: formData.currentCampaign.trim(),
        promotion_details: formData.promotionDetails.trim(),
        important_keywords: formData.importantKeywords.trim(),
        words_to_avoid: formData.wordsToAvoid.trim(),
        competitor_reference_links: formData.competitorReferenceLinks.trim(),
        source_details: formData.sourceDetails.trim(),
        reference_materials: formData.referenceMaterials.trim(),
      },
      configuration: {
        productsServices: formData.productsServices.trim(),
        uniqueSellingPoints: formData.uniqueSellingPoints.trim(),
        serviceAreas: formData.serviceAreas.trim(),
        audienceAgeGroup: formData.audienceAgeGroup.trim(),
        audiencePainPoints: formData.audiencePainPoints.trim(),
        audienceInterests: formData.audienceInterests.trim(),
        customerGoals: formData.customerGoals.trim(),
        customerObjections: formData.customerObjections.trim(),
        writingStyle: formData.writingStyle,
        emojiPreference: formData.emojiPreference,
        hashtagStyle: formData.hashtagStyle,
        ctaStyle: formData.ctaStyle,
        contentGoal: formData.contentGoal,
        mainOffer: formData.mainOffer.trim(),
        currentCampaign: formData.currentCampaign.trim(),
        promotionDetails: formData.promotionDetails.trim(),
        importantKeywords: formData.importantKeywords.trim(),
        wordsToAvoid: formData.wordsToAvoid.trim(),
        competitorReferenceLinks: formData.competitorReferenceLinks.trim(),
        sourceDetails: formData.sourceDetails.trim(),
        referenceMaterials: formData.referenceMaterials.trim(),
      },
      createdAt: project?.createdAt || new Date().toISOString(),
    };

    try {
      const result = isOnboarding ? await onCreate(updatedProject) : await onUpdate(updatedProject);
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        throw result.error;
      }
      setSaved(true);
      setShowReadyModal(true);
      window.setTimeout(() => setSaved(false), 2400);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full min-w-0 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-[11px] text-slate-900 placeholder:text-slate-400 disabled:opacity-50';
  const compactCard = 'min-w-0 bg-white border border-slate-100 rounded-xl p-3 shadow-sm';
  const denseCard = 'min-w-0 bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm';
  const currentIndex = Math.max(steps.findIndex(step => step.id === activeStep), 0);
  const settingField = (key: keyof typeof formData, value: string) => setFormData(current => ({ ...current, [key]: value }));

  const textInput = (key: keyof typeof formData, label: string, help: string, placeholder = '') => (
    <div className="space-y-0.5">
      <FieldLabel help={help}>{label}</FieldLabel>
      <input className={inputClass} value={String(formData[key] || '')} placeholder={placeholder} onChange={event => settingField(key, event.target.value)} />
    </div>
  );

  const textArea = (key: keyof typeof formData, label: string, help: string, rows = 2, placeholder = '') => (
    <div className="space-y-0.5">
      <FieldLabel help={help}>{label}</FieldLabel>
      <textarea rows={rows} className={`${inputClass} resize-none leading-snug`} value={String(formData[key] || '')} placeholder={placeholder} onChange={event => settingField(key, event.target.value)} />
    </div>
  );

  const selectInput = (key: keyof typeof formData, label: string, help: string, options: string[]) => (
    <div className="space-y-0.5">
      <FieldLabel help={help}>{label}</FieldLabel>
      <select className={`${inputClass} appearance-none`} value={String(formData[key] || '')} onChange={event => settingField(key, event.target.value)}>
        {options.map(option => <option key={option}>{option}</option>)}
      </select>
    </div>
  );

  const setPlatforms = (platforms: Platform[]) => {
    const nextPlatforms = platforms.length ? platforms : [];
    setFormData(current => ({
      ...current,
      platforms: nextPlatforms,
      contentTypes: sanitizeContentTypes(current.contentTypes, nextPlatforms),
    }));
  };

  const togglePlatform = (platform: Platform) => {
    const nextPlatforms = toggleArrayValue(formData.platforms, platform);
    setPlatforms(nextPlatforms);
    setExpandedPlatform(platform);
  };

  const toggleExpandedPlatform = (platform: Platform) => {
    setExpandedPlatform(current => current === platform ? null : platform);
  };

  const goNext = () => {
    const nextStep = steps[Math.min(currentIndex + 1, steps.length - 1)];
    setActiveStep(nextStep.id);
  };

  const goBack = () => {
    const previousStep = steps[Math.max(currentIndex - 1, 0)];
    setActiveStep(previousStep.id);
  };

  const toggleContentType = (contentType: SocialContentType) => {
    setFormData(current => ({
      ...current,
      contentTypes: toggleArrayValue(current.contentTypes, contentType),
    }));
  };

  const activeStepConfig = steps[currentIndex] || steps[0];
  const ActiveIcon = activeStepConfig.icon;
  const isFinalStep = activeStep === 'method';
  const selectedTypeCount = (platform: Platform) =>
    PLATFORM_CONTENT_TYPES[platform].filter(contentType => formData.contentTypes.includes(contentType)).length;

  return (
    <div className="w-full min-w-0 mx-auto animate-in fade-in duration-500" style={{ width: 'min(100%, calc(100vw - 4rem))', maxWidth: '80rem' }}>
      <div className="w-full min-w-0 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[560px] lg:h-[calc(100vh-8rem)] flex flex-col lg:flex-row">
        <aside className="w-full min-w-0 lg:w-72 bg-slate-950 text-slate-300 p-4 flex flex-col shrink-0">
          <button className="text-slate-400 text-[11px] font-semibold mb-4 flex items-center gap-2 cursor-default">
            <span className="text-lg leading-none">&lsaquo;</span>
            {isOnboarding ? 'Business Setup' : 'Business Settings'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white leading-tight truncate">{displayName}</h2>
              <p className="text-[10px] text-slate-400 font-medium">Social Media Content Agent</p>
            </div>
          </div>

          <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
                  activeStep === step.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  activeStep === step.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'
                }`}>
                  <step.icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate">{step.title}</div>
                  <div className="text-[9px] text-slate-500 truncate flex items-center gap-1">
                    {step.description}
                  </div>
                </div>
                <div className={`ml-auto w-4 h-4 rounded-full border ${
                  index <= currentIndex ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'
                }`} />
              </button>
            ))}
          </nav>
        </aside>

        <form onSubmit={handleSubmit} className="w-full flex-1 flex flex-col min-w-0">
          <div className="min-w-0 px-4 py-3 border-b border-slate-100">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ActiveIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  {activeStepConfig.title}
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5 break-words">
                  {stepDescriptions[activeStep]}
                </p>
              </div>
            </div>
            {errorMsg && (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-3 overflow-y-auto bg-slate-50/60 custom-scrollbar">
            {activeStep === 'profile' && (
              <div className="space-y-3 max-w-5xl">
                <div className={compactCard}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{isOnboarding ? 'Set up a social media workspace' : `Welcome to ${displayName}`}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-3xl">
                        Social Media Content Agent helps your team generate, review, save, and prepare platform-ready content for every active channel.
                      </p>
                    </div>
                    <button type="button" onClick={goNext} className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100">
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className={compactCard}>
                    <Sparkles className="w-4 h-4 text-indigo-600 mb-2" />
                    <h4 className="text-xs font-bold text-slate-900 mb-1">Platform Content</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Generate captions, hooks, CTAs, hashtags, outlines, and scripts.</p>
                  </div>
                  <div className={compactCard}>
                    <Send className="w-4 h-4 text-emerald-600 mb-2" />
                    <h4 className="text-xs font-bold text-slate-900 mb-1">Manual Publishing</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Copy or download approved content and post it manually.</p>
                  </div>
                  <div className={compactCard}>
                    <Target className="w-4 h-4 text-amber-600 mb-2" />
                    <h4 className="text-xs font-bold text-slate-900 mb-1">Brand Context</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Keep audience, tone, language, and channel choices aligned.</p>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'business' && (
              <div className="space-y-3 max-w-5xl">
                <div className={denseCard}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Business Information</h3>
                      <p className="text-[10px] text-slate-500">Company facts, market position, location, and services.</p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-600">Foundation</span>
                  </div>
                </div>

                <div className={`${compactCard} space-y-3`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <FieldLabel help="Optional website context for content ideas.">Website URL</FieldLabel>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input type="url" className={`${inputClass} pl-8`} value={formData.websiteUrl} onChange={event => settingField('websiteUrl', event.target.value)} placeholder="https://example.com" />
                      </div>
                    </div>
                    {textInput('industry', 'Industry / Niche', 'The market or category this business serves.', 'Healthcare, real estate, beauty...')}
                    {textInput('location', 'Location / Region', 'Primary city, country, or region for local context.', 'Dubai, UAE')}
                  </div>

                  {textArea('brandDescription', 'Business Description', 'A short summary of what the business does.', 3)}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {textArea('productsServices', 'Products & Services', 'Main products, services, packages, or offers.', 3)}
                    {textArea('uniqueSellingPoints', 'Unique Selling Points', 'What makes the business different or better.', 3)}
                    {textArea('serviceAreas', 'Service Areas', 'Areas, cities, or customer segments this business serves.', 2, 'Dubai Marina, Abu Dhabi, remote...')}
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'audience' && (
              <div className="space-y-3 max-w-5xl">
                <div className={denseCard}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Audience & Brand</h3>
                      <p className="text-[10px] text-slate-500">Customer profile, motivations, objections, and brand voice.</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700">Voice</span>
                  </div>
                </div>

                <div className={`${compactCard} space-y-4`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {textInput('targetAudience', 'Target Audience', 'Who the content should speak to.', 'Busy parents, clinic owners...')}
                    {textInput('audienceAgeGroup', 'Audience Age Group', 'Typical age range or life stage.', '25-44, families, seniors...')}
                    {textArea('audienceInterests', 'Audience Interests', 'Topics, hobbies, motivations, or lifestyle cues.', 2)}
                    {textArea('audiencePainPoints', 'Audience Pain Points', 'Problems, worries, or frustrations to address.', 2)}
                    {textArea('customerGoals', 'Customer Goals', 'What customers want to achieve.', 2)}
                    {textArea('customerObjections', 'Customer Objections', 'Reasons they may hesitate before buying or booking.', 2)}
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      <div className="space-y-0.5">
                        <FieldLabel help="The writing style used by the AI.">Brand Tone</FieldLabel>
                        <div className="relative">
                          <Type className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <select className={`${inputClass} pl-8 appearance-none`} value={formData.tone} onChange={event => settingField('tone', event.target.value)}>
                            {TONE_OPTIONS.map(option => <option key={option}>{option}</option>)}
                          </select>
                        </div>
                      </div>
                      {selectInput('language', 'Language', 'The language for generated content.', LANGUAGE_OPTIONS)}
                      {selectInput('writingStyle', 'Writing Style', 'Preferred structure and writing approach.', WRITING_STYLE_OPTIONS)}
                      {selectInput('emojiPreference', 'Emoji Preference', 'How often emojis should appear.', EMOJI_OPTIONS)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'strategy' && (
              <div className="space-y-3 max-w-5xl">
                <div className={denseCard}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Marketing & Content Strategy</h3>
                      <p className="text-[10px] text-slate-500">Goals, offers, campaigns, keywords, source context, and references.</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-700">Strategy</span>
                  </div>
                </div>

                <div className={`${compactCard} space-y-4`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectInput('contentGoal', 'Content Goal', 'Primary outcome for generated content.', CONTENT_GOAL_OPTIONS)}
                    {selectInput('ctaStyle', 'CTA Style', 'How direct or soft calls-to-action should be.', CTA_STYLE_OPTIONS)}
                    {selectInput('hashtagStyle', 'Hashtag Style', 'How hashtags should be selected.', HASHTAG_STYLE_OPTIONS)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {textInput('mainOffer', 'Main Offer', 'Primary offer or service to promote.')}
                    {textInput('currentCampaign', 'Current Campaign', 'Campaign, season, or theme to prioritize.')}
                    {textArea('promotionDetails', 'Promotion Details', 'Discounts, deadlines, bundles, or requirements.', 2)}
                    {textArea('importantKeywords', 'Important Keywords', 'Words or phrases the AI should include when natural.', 2)}
                    {textArea('wordsToAvoid', 'Words to Avoid', 'Terms, claims, or phrasing the AI should not use.', 2)}
                    {textArea('competitorReferenceLinks', 'Competitor References', 'Competitor URLs or references for inspiration only.', 2)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                    <div className="space-y-0.5">
                      <FieldLabel help="The source or brief type for generation.">Source Type</FieldLabel>
                      <select className={`${inputClass} appearance-none`} value={formData.sourceType} onChange={event => setFormData({ ...formData, sourceType: event.target.value as Project['sourceType'] })}>
                        {SOURCE_TYPE_OPTIONS.map(option => <option key={option}>{option}</option>)}
                      </select>
                    </div>
                    {textArea('sourceDetails', 'Source Details', 'Notes, brief details, existing idea, or context the AI should understand.', 2)}
                    {textArea('referenceMaterials', 'Reference Materials', 'Links, copied notes, or examples to use as inspiration.', 2)}
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'platforms' && (
              <div className="space-y-4 max-w-6xl">
                <div className={denseCard}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Platforms & Content Types</h3>
                      <p className="text-[10px] text-slate-500">Platform formats are grouped in a single-open accordion.</p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-600">{formData.platforms.length} enabled</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {SUPPORTED_PLATFORMS.map(platform => {
                    const selected = formData.platforms.includes(platform);
                    const expanded = expandedPlatform === platform;
                    const selectedCount = selectedTypeCount(platform);
                    return (
                      <div key={platform} className={`rounded-2xl border bg-white shadow-sm transition-all ${selected ? 'border-indigo-100 ring-1 ring-indigo-100' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <label className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${selected ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                            <input
                              aria-label={`Enable ${platform}`}
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              checked={selected}
                              onChange={() => togglePlatform(platform)}
                            />
                          </label>
                          <button
                            type="button"
                            aria-expanded={expanded}
                            onClick={() => toggleExpandedPlatform(platform)}
                            className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-black text-slate-900">{platform}</span>
                              <span className="block text-[10px] font-semibold text-slate-400">
                                {selected ? `${selectedCount} of ${PLATFORM_CONTENT_TYPES[platform].length} content types selected` : 'Not enabled'}
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest ${selected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                {selected ? 'Enabled' : 'Off'}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                            </span>
                          </button>
                        </div>

                        {expanded && (
                          <div className="border-t border-slate-100 px-4 py-4">
                            {selected ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {PLATFORM_CONTENT_TYPES[platform].map(contentType => (
                                  <label key={`${platform}-${contentType}`} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 transition-colors hover:bg-white">
                                    <input
                                      type="checkbox"
                                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                      checked={formData.contentTypes.includes(contentType)}
                                      onChange={() => toggleContentType(contentType)}
                                    />
                                    <span className="min-w-0">
                                      <span className="block text-[11px] font-bold text-slate-800">{contentType}</span>
                                      <span className="block text-[10px] leading-relaxed text-slate-500">{CONTENT_TYPE_DESCRIPTIONS[platform][contentType]}</span>
                                    </span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[11px] font-semibold text-slate-400">
                                Enable {platform} to select its content types.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeStep === 'method' && (
              <div className="space-y-3 max-w-5xl">
                <div className={compactCard}>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Channels & Publishing</h3>
                  <p className="text-xs text-slate-500">Manual mode is available now. Auto publish is prepared as UI only.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormData({ ...formData, publishingMode: 'manual' })} className={`p-3 rounded-2xl border-2 text-left transition-all min-h-[108px] ${formData.publishingMode === 'manual' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'}`}>
                    <Send className="w-5 h-5 text-indigo-600 mb-2" />
                    <div className="text-sm font-bold text-slate-900">Manual Mode</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Generate content, then copy or download it for manual posting.</p>
                  </button>

                  <button type="button" onClick={() => setFormData({ ...formData, publishingMode: 'auto_publish' })} className={`p-3 rounded-2xl border-2 text-left transition-all min-h-[108px] ${formData.publishingMode === 'auto_publish' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'}`}>
                    <Database className="w-5 h-5 text-slate-600 mb-2" />
                    <div className="text-sm font-bold text-slate-900">Auto Publish Mode</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Coming Soon: OAuth support for Instagram, Facebook, TikTok, and YouTube.</p>
                    <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-amber-600">Coming Soon</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {currentIndex + 1} of {steps.length}</div>
            <div className="flex flex-wrap items-center gap-3">
              {saved && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </div>
              )}
              {activeStep !== 'profile' && (
                <button type="button" onClick={goBack} className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50">
                  Previous
                </button>
              )}
              {!isFinalStep ? (
                <button type="button" onClick={goNext} className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-200">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isOnboarding ? 'Create Agent' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {showReadyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={() => setShowReadyModal(false)} role="dialog" aria-modal="true" aria-labelledby="ready-title">
          <div className="w-full max-w-sm rounded-[1.75rem] border border-slate-100 bg-white p-6 text-center shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 fade-in duration-200" onMouseDown={event => event.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 id="ready-title" className="text-xl font-black text-slate-900">Your Social Media Content Agent is ready.</h2>
            <button type="button" onClick={() => setShowReadyModal(false)} className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/15">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
