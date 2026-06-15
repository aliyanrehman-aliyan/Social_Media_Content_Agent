import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  ChevronDown,
  CheckCircle2,
  Database,
  Globe,
  Loader2,
  Save,
  Send,
  Sparkles,
  Target,
  Type
} from 'lucide-react';
import { Platform, Project, SocialContentType } from '../types';
import { getContentTypesForPlatforms, sanitizeContentTypes, sanitizePlatforms, SOURCE_TYPE_OPTIONS, SUPPORTED_PLATFORMS } from '../socialConfig';
import InfoPopover from '../components/InfoPopover';

interface SettingsProps {
  project: Project | null;
  onUpdate: (project: Project) => Promise<void> | void;
  onCreate: (project: Project) => Promise<{ data?: Project; error?: any }>;
}

const TONE_OPTIONS = ['Professional', 'Casual', 'Witty', 'Educational', 'Friendly', 'Bold'];
const LANGUAGE_OPTIONS = ['English', 'Arabic', 'English and Arabic'];

const FieldLabel: React.FC<{ children: React.ReactNode; help: string }> = ({ children, help }) => (
  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
    {children}
    <InfoPopover text={help} />
  </label>
);

const getInitialFormData = (project: Project | null) => ({
  businessName: project?.businessName || project?.name || '',
  websiteUrl: project?.websiteUrl || '',
  industry: project?.industry || '',
  targetAudience: project?.targetAudience || '',
  brandDescription: project?.brandDescription || '',
  tone: project?.tone || 'Professional',
  language: project?.language || 'English',
  platforms: sanitizePlatforms(project?.platforms),
  contentTypes: sanitizeContentTypes(project?.contentTypes, sanitizePlatforms(project?.platforms)),
  sourceType: project?.sourceType || 'General Topic',
  publishingMode: project?.publishingMode || 'manual',
  location: project?.location || '',
});

const toggleArrayValue = <T extends string>(items: T[], value: T) =>
  items.includes(value) ? items.filter(item => item !== value) : [...items, value];

const Settings: React.FC<SettingsProps> = ({ project, onUpdate, onCreate }) => {
  const [activeStep, setActiveStep] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => getInitialFormData(project));
  const isOnboarding = !project;
  const displayName = formData.businessName.trim() || (isOnboarding ? 'New Business' : project?.name || 'Business');
  const availableContentTypes = useMemo(() => getContentTypesForPlatforms(formData.platforms), [formData.platforms]);

  useEffect(() => {
    setFormData(getInitialFormData(project));
    setSaved(false);
    setErrorMsg(null);
  }, [project]);

  const steps = [
    { id: 'profile', title: 'Business Profile', description: 'Welcome and overview', icon: Building2 },
    { id: 'details', title: 'Content Configuration', description: 'Social content fields', icon: Target },
    { id: 'method', title: 'Channels & Publishing', description: 'Publishing mode', icon: Database }
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!formData.businessName.trim() || !formData.industry.trim() || !formData.targetAudience.trim()) {
      setActiveStep('details');
      setErrorMsg('Please complete business name, industry, and target audience.');
      return;
    }

    if (formData.websiteUrl.trim()) {
      try {
        new URL(formData.websiteUrl);
      } catch {
        setActiveStep('details');
        setErrorMsg('Please enter a valid website URL or leave it empty.');
        return;
      }
    }

    if (formData.platforms.length === 0 || formData.contentTypes.length === 0) {
      setActiveStep('details');
      setErrorMsg('Please choose at least one platform and one content type.');
      return;
    }

    setIsSaving(true);
    setSaved(false);

    const updatedProject: Project = {
      ...(project || {}),
      id: project?.id || '',
      name: formData.businessName.trim(),
      businessName: formData.businessName.trim(),
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
      settingsMetadata: project?.settingsMetadata || {},
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

  const inputClass = 'w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-[11px] text-slate-900 placeholder:text-slate-400 disabled:opacity-50';
  const compactCard = 'bg-white border border-slate-100 rounded-xl p-3 shadow-sm';
  const denseCard = 'bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm';
  const currentIndex = steps.findIndex(step => step.id === activeStep);

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
  };

  const selectedPlatformLabel = formData.platforms.length ? formData.platforms.join(', ') : 'Choose platforms';

  const goNext = () => {
    if (activeStep === 'profile') setActiveStep('details');
    if (activeStep === 'details') setActiveStep('method');
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden h-[calc(100vh-8rem)] min-h-[560px] flex">
        <aside className="w-72 bg-slate-950 text-slate-300 p-4 flex flex-col">
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

          <nav className="space-y-1.5">
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
                  <div className="text-[11px] font-bold">{step.title}</div>
                  <div className="text-[9px] text-slate-500 truncate flex items-center gap-1">
                    {step.description}
                    <InfoPopover text={step.id === 'profile' ? 'Set the business foundation.' : step.id === 'details' ? 'Choose platforms and content inputs.' : 'Choose manual or future auto publishing.'} panelClassName="left-0 translate-x-0" />
                  </div>
                </div>
                <div className={`ml-auto w-4 h-4 rounded-full border ${
                  index <= currentIndex ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'
                }`} />
              </button>
            ))}
          </nav>
        </aside>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {activeStep === 'profile' && <Building2 className="w-4 h-4" />}
                {activeStep === 'details' && <Target className="w-4 h-4" />}
                {activeStep === 'method' && <Database className="w-4 h-4" />}
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  <span className="inline-flex items-center gap-1.5">
                    {steps.find(step => step.id === activeStep)?.title}
                    <InfoPopover text={activeStep === 'profile' ? 'Business Profile guides brand context.' : activeStep === 'details' ? 'Content Configuration controls generation.' : 'Channels & Publishing controls output flow.'} />
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {activeStep === 'profile' && 'Welcome users to the Social Media Content Agent.'}
                  {activeStep === 'details' && 'Configure the business context that guides social content generation.'}
                  {activeStep === 'method' && 'Choose how approved content is handled after generation.'}
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

          <div className="flex-1 p-3 overflow-hidden bg-slate-50/60">
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

            {activeStep === 'details' && (
              <div className="space-y-2 max-w-5xl">
                <div className={denseCard}>
                  <h3 className="text-xs font-bold text-slate-900">Content Configuration</h3>
                  <p className="text-[10px] text-slate-500">These fields guide social media generation and review.</p>
                </div>

                <div className={`${denseCard} space-y-2`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                      <FieldLabel help="The brand or business name used in content.">Business Name</FieldLabel>
                      <input required className={inputClass} value={formData.businessName} onChange={event => setFormData({ ...formData, businessName: event.target.value })} />
                    </div>
                    <div className="space-y-0.5">
                      <FieldLabel help="Optional website context for content ideas.">Website URL</FieldLabel>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input type="url" className={`${inputClass} pl-8`} value={formData.websiteUrl} onChange={event => setFormData({ ...formData, websiteUrl: event.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <FieldLabel help="The market or category this business serves.">Industry</FieldLabel>
                      <input required className={inputClass} value={formData.industry} onChange={event => setFormData({ ...formData, industry: event.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <FieldLabel help="The writing style used by the AI.">Tone</FieldLabel>
                      <div className="relative">
                        <Type className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <select className={`${inputClass} pl-8 appearance-none`} value={formData.tone} onChange={event => setFormData({ ...formData, tone: event.target.value })}>
                          {TONE_OPTIONS.map(option => <option key={option}>{option}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <FieldLabel help="The language for generated content.">Language</FieldLabel>
                      <select className={`${inputClass} appearance-none`} value={formData.language} onChange={event => setFormData({ ...formData, language: event.target.value })}>
                        {LANGUAGE_OPTIONS.map(option => <option key={option}>{option}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <FieldLabel help="Who the content should speak to.">Target Audience</FieldLabel>
                    <input required className={inputClass} value={formData.targetAudience} onChange={event => setFormData({ ...formData, targetAudience: event.target.value })} />
                  </div>

                  <div className="space-y-0.5">
                    <FieldLabel help="A short brand summary for context.">Brand Description</FieldLabel>
                    <textarea rows={2} className={`${inputClass} resize-none leading-snug`} value={formData.brandDescription} onChange={event => setFormData({ ...formData, brandDescription: event.target.value })} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <FieldLabel help="Pick one or more active social channels.">Platforms</FieldLabel>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPlatformMenu(value => !value)}
                          className={`${inputClass} flex items-center justify-between gap-2 text-left`}
                        >
                          <span className="truncate">{selectedPlatformLabel}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                        {showPlatformMenu && (
                          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200">
                            {SUPPORTED_PLATFORMS.map(option => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => togglePlatform(option)}
                                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${formData.platforms.includes(option) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                {option}
                                {formData.platforms.includes(option) && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <FieldLabel help="Only options for selected platforms are shown.">Content Types</FieldLabel>
                      <div className="flex flex-wrap gap-1.5 max-h-[76px] overflow-y-auto pr-1 custom-scrollbar">
                        {availableContentTypes.map(option => (
                          <button key={option} type="button" onClick={() => setFormData({ ...formData, contentTypes: toggleArrayValue(formData.contentTypes, option) })} className={`px-2 py-1 rounded-md text-[9px] font-black border ${formData.contentTypes.includes(option) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                            {option}
                          </button>
                        ))}
                        {availableContentTypes.length === 0 && (
                          <div className="text-[10px] font-bold text-slate-400 py-1">Select a platform first.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <FieldLabel help="The source or brief type for generation.">Source Type</FieldLabel>
                    <select className={`${inputClass} appearance-none`} value={formData.sourceType} onChange={event => setFormData({ ...formData, sourceType: event.target.value as Project['sourceType'] })}>
                      {SOURCE_TYPE_OPTIONS.map(option => <option key={option}>{option}</option>)}
                    </select>
                  </div>
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
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">Manual Mode <InfoPopover text="Copy or download content for manual posting." /></div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Generate content, then copy or download it for manual posting.</p>
                  </button>

                  <button type="button" onClick={() => setFormData({ ...formData, publishingMode: 'auto_publish' })} className={`p-3 rounded-2xl border-2 text-left transition-all min-h-[108px] ${formData.publishingMode === 'auto_publish' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white'}`}>
                    <Database className="w-5 h-5 text-slate-600 mb-2" />
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">Auto Publish Mode <InfoPopover text="Future direct publishing workflow." /></div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Coming Soon: OAuth support for Instagram, Facebook, TikTok, and YouTube.</p>
                    <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-amber-600">Coming Soon</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-white">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {currentIndex + 1} of 3</div>
            <div className="flex items-center gap-3">
              {saved && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </div>
              )}
              {activeStep !== 'method' ? (
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
