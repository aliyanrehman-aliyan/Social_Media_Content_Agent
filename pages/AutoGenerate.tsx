import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCcw,
  Image as ImageIcon,
  Sparkles,
  X
} from 'lucide-react';
import { supabase, supabaseSchema } from '../supabaseClient';
import { ApprovalStatus, ContentStatus, Platform, Project, SocialContentType, SourceType } from '../types';
import { sanitizePlatforms, toPlatformContentType } from '../socialConfig';
import InfoPopover from '../components/InfoPopover';

type ItemState = ApprovalStatus;

interface GeneratedSocialItem {
  id: string;
  title: string;
  platform: Platform;
  contentType: SocialContentType;
  sourceType: SourceType;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  carouselOutline?: string[];
  sceneOutline?: string[];
  videoScript?: string;
  creativeDirection?: string;
  thumbnailPrompt?: string;
  status: ContentStatus;
  approvalStatus: ItemState;
  scheduledAt?: string;
}

interface AutoGenerateProps {
  project: Project | null;
  onContentSaved?: () => void;
}

const labelClass = 'text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1';
const inputClass = 'w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs text-slate-900 placeholder:text-slate-400 disabled:opacity-50';

const makeId = () => Math.random().toString(36).slice(2, 10);
const toDbValue = (value: string) => value.toLowerCase().replace(/\s+/g, '_');
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'social-content';

const toTitleCase = <T extends string>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback;
  return value.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') as T;
};

const normalizeLines = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];

const triggerTextDownload = (text: string, filename: string) => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AutoGenerate: React.FC<AutoGenerateProps> = ({ project, onContentSaved }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | ''>('');
  const [audienceOverride, setAudienceOverride] = useState('');
  const [campaignOverride, setCampaignOverride] = useState('');
  const [items, setItems] = useState<GeneratedSocialItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [directingId, setDirectingId] = useState<string | null>(null);
  const [cardNotice, setCardNotice] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const platformOptions = useMemo(() => sanitizePlatforms(project?.platforms, []), [project?.platforms]);

  useEffect(() => {
    setItems([]);
    setErrorMsg(null);
    setSelectedPlatform(current => {
      if (current && platformOptions.includes(current)) return current;
      return platformOptions[0] || '';
    });
  }, [project?.id, platformOptions]);

  const sourceType = project?.sourceType || 'General Topic';
  const selectedContentTypes = useMemo(() => {
    if (!project || !selectedPlatform) return [];
    const projectTypes = project.contentTypes || [];
    const validTypes = projectTypes.filter(type => type === toPlatformContentType(selectedPlatform, type));
    return validTypes.length ? validTypes : [toPlatformContentType(selectedPlatform)];
  }, [project, selectedPlatform]);

  const context = useMemo(() => ({
    businessName: project?.businessName || project?.name || '',
    industry: project?.industry || '',
    targetAudience: audienceOverride.trim() || project?.targetAudience || '',
    brandDescription: project?.brandDescription || '',
    tone: project?.tone || 'Professional',
    language: project?.language || 'English',
    platforms: selectedPlatform ? [selectedPlatform] : [],
    contentTypes: selectedContentTypes,
    sourceType,
    postingFrequency: project?.postingFrequency || '',
    campaign: campaignOverride.trim()
  }), [project, selectedPlatform, selectedContentTypes, audienceOverride, campaignOverride, sourceType]);

  const invokeAutoGenerate = async (payload: Record<string, any>) => {
    const body = {
      projectId: project?.id,
      schema: supabaseSchema,
      selectedPlatform: selectedPlatform || undefined,
      selectedContentTypes,
      sourceType,
      audienceOverride: audienceOverride.trim() || undefined,
      campaignOverride: campaignOverride.trim() || undefined,
      ...payload
    };

    const { data, error } = await supabase.functions.invoke('auto-generate-social-content', { body });
    if (error) {
      const response = error.context instanceof Response ? error.context : null;
      let responseBody = '';
      if (response) {
        try {
          responseBody = await response.clone().text();
        } catch {
          responseBody = '';
        }
      }
      throw new Error(responseBody || error.message || 'No response was returned by the Edge Function.');
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const normalizeItems = (rawItems: any[], forcedPlatform?: Platform): GeneratedSocialItem[] =>
    rawItems.map(item => {
      const platform = forcedPlatform || toTitleCase<Platform>(item.platform, platformOptions[0] || 'Instagram');
      const contentType = selectedContentTypes.includes(item.contentType || item.content_type)
        ? item.contentType || item.content_type
        : toPlatformContentType(platform, item.contentType || item.content_type);
      return {
        id: item.id || makeId(),
        title: String(item.title || `${platform} ${contentType}`).trim(),
        platform,
        contentType,
        sourceType,
        hook: String(item.hook || '').trim(),
        body: String(item.body || item.caption || item.description || '').trim(),
        cta: String(item.cta || '').trim(),
        hashtags: normalizeLines(item.hashtags),
        carouselOutline: normalizeLines(item.carouselOutline || item.carousel_outline),
        sceneOutline: normalizeLines(item.sceneOutline || item.scene_outline),
        videoScript: String(item.shortVideoScript || item.short_video_script || item.videoScript || item.video_script || '').trim(),
        creativeDirection: String(item.creativeDirection || item.creative_direction || item.imageDescription || item.image_description || '').trim(),
        thumbnailPrompt: String(item.thumbnailPrompt || item.thumbnail_prompt || '').trim(),
        status: 'Draft' as ContentStatus,
        approvalStatus: 'Pending' as ItemState,
      };
    }).filter(item => item.title && (item.body || item.hook || item.videoScript || item.carouselOutline?.length || item.sceneOutline?.length || item.creativeDirection || item.thumbnailPrompt));

  const generateContent = async () => {
    if (!project?.id) return;
    if (!selectedPlatform) {
      setErrorMsg('Add at least one supported platform in Settings before generating content.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const data = await invokeAutoGenerate({ action: 'generate_content' });
      setItems(normalizeItems(Array.isArray(data?.content) ? data.content : [], selectedPlatform));
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to generate social content.');
    } finally {
      setIsGenerating(false);
    }
  };

  const approveItem = async (item: GeneratedSocialItem) => {
    if (!project?.id) return;
    setErrorMsg(null);
    setApprovingId(item.id);

    try {
      const { error } = await supabase
        .from('social_content_items')
        .insert({
          project_id: project.id,
          title: item.title,
          platform: toDbValue(item.platform),
          content_type: toDbValue(item.contentType),
          hook: item.hook,
          body: item.body,
          cta: item.cta,
          hashtags: item.hashtags,
          carousel_outline: item.carouselOutline || [],
          short_video_script: item.videoScript || null,
          status: 'draft',
          approval_status: 'approved',
          scheduled_at: item.scheduledAt || null,
          image_provider: 'creative_direction',
          image_prompt: item.creativeDirection || item.thumbnailPrompt || null,
          image_url: null,
          generation_metadata: {
            source: 'auto-generate-social-content',
            source_type: item.sourceType,
            campaign: campaignOverride.trim(),
            selected_platform: item.platform,
            content_type: item.contentType,
            scene_outline: item.sceneOutline || [],
            creative_direction: item.creativeDirection || '',
            thumbnail_prompt: item.thumbnailPrompt || '',
          },
          publishing_metadata: {},
        });

      if (error) throw error;

      setItems(list => list.filter(value => value.id !== item.id));
      onContentSaved?.();
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to approve content.');
    } finally {
      setApprovingId(null);
    }
  };

  const rejectItem = (id: string) => {
    setItems(list => list.filter(item => item.id !== id));
  };

  const replaceItem = async (id: string) => {
    if (!project?.id || !selectedPlatform) return;
    setErrorMsg(null);
    setReplacingId(id);

    try {
      const current = items.find(item => item.id === id);
      const data = await invokeAutoGenerate({
        action: 'replace_suggestion',
        item: current,
        excludeTitles: items.map(item => item.title)
      });
      const replacement = normalizeItems([data?.content || data?.suggestion || {}], selectedPlatform)[0];
      if (!replacement) throw new Error('No replacement content was returned.');
      setItems(list => list.map(item => item.id === id ? { ...replacement, id } : item));
      setCardNotice(current => ({ ...current, [id]: '' }));
    } catch (error: any) {
      setErrorMsg(error?.message || 'Failed to replace this item.');
    } finally {
      setReplacingId(null);
    }
  };

  const packageText = (item: GeneratedSocialItem) => [
    `Platform: ${item.platform}`,
    `Content type: ${item.contentType}`,
    `Source type: ${item.sourceType}`,
    `Title:\n${item.title}`,
    item.hook ? `Hook:\n${item.hook}` : '',
    item.body ? `Caption / Body:\n${item.body}` : '',
    item.cta ? `CTA:\n${item.cta}` : '',
    item.hashtags.length ? `Hashtags:\n${item.hashtags.join(' ')}` : '',
    item.carouselOutline?.length ? `Carousel Outline:\n${item.carouselOutline.map((line, index) => `${index + 1}. ${line}`).join('\n')}` : '',
    item.videoScript ? `Video Script:\n${item.videoScript}` : '',
    item.sceneOutline?.length ? `Scene Outline:\n${item.sceneOutline.map((line, index) => `${index + 1}. ${line}`).join('\n')}` : '',
    item.creativeDirection ? `Creative Direction / Image Description:\n${item.creativeDirection}` : '',
    item.thumbnailPrompt ? `YouTube Thumbnail Prompt:\n${item.thumbnailPrompt}` : '',
  ].filter(Boolean).join('\n\n');

  const setNotice = (id: string, message: string) => {
    setCardNotice(current => ({ ...current, [id]: message }));
    window.setTimeout(() => {
      setCardNotice(current => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }, 3200);
  };

  const copyItem = async (item: GeneratedSocialItem) => {
    await navigator.clipboard.writeText(packageText(item));
    setNotice(item.id, 'Text package copied.');
  };

  const downloadItem = (item: GeneratedSocialItem) => {
    triggerTextDownload(packageText(item), `${slugify(item.title)}-social-package.txt`);
    setNotice(item.id, 'Text package downloaded.');
  };

  const createCreativeDirection = (item: GeneratedSocialItem) => {
    setDirectingId(item.id);
    const fallback = [
      `Visual concept: ${item.title}`,
      `Background style: clean ${item.platform} layout with brand-safe contrast.`,
      `Subject/object idea: show the main offer, topic, or customer benefit clearly.`,
      `Text overlay idea: use the hook as a short headline.`,
      `Mood/style: ${project?.tone || 'Professional'} and native to ${item.platform}.`,
      item.carouselOutline?.length ? `Carousel visual direction: ${item.carouselOutline.map((line, index) => `Slide ${index + 1}: ${line}`).join(' | ')}` : '',
      item.platform === 'YouTube' ? `Thumbnail concept: bold subject, simple background, clear benefit-led title text.` : '',
    ].filter(Boolean).join('\n');

    window.setTimeout(() => {
      setItems(list => list.map(current => current.id === item.id ? { ...current, creativeDirection: current.creativeDirection || fallback } : current));
      setDirectingId(null);
      setNotice(item.id, 'Creative direction added.');
    }, 150);
  };

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
          <Sparkles className="w-9 h-9 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-black text-slate-900">Select a project first</h2>
          <p className="text-xs text-slate-500 mt-1">Auto Generate uses the active project's saved social media configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            Auto Generate
            <InfoPopover text="Generate content from the selected project settings." />
          </h2>
          <p className="text-sm text-slate-500">Generate platform-ready captions, hooks, hashtags, outlines, ideas, scripts, and creative direction.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
          <span className="px-2 py-1 rounded-lg bg-white border border-slate-100">{context.industry || 'No industry'}</span>
          <span className="px-2 py-1 rounded-lg bg-white border border-slate-100">{context.tone}</span>
          <span className="px-2 py-1 rounded-lg bg-white border border-slate-100">{context.language}</span>
          <span className="px-2 py-1 rounded-lg bg-white border border-slate-100">{context.sourceType}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Generate For <InfoPopover text="Only platforms selected in Settings appear here." /></label>
            <select className={`${inputClass} appearance-none`} value={selectedPlatform} onChange={event => setSelectedPlatform(event.target.value as Platform)}>
              {platformOptions.length === 0 ? (
                <option value="">No platforms configured</option>
              ) : (
                platformOptions.map(option => <option key={option}>{option}</option>)
              )}
            </select>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Audience Override <InfoPopover text="Temporarily focus this generation on a specific audience." /></label>
            <input className={inputClass} placeholder={project.targetAudience || 'Use project audience'} value={audienceOverride} onChange={event => setAudienceOverride(event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Campaign Override <InfoPopover text="Add a campaign, offer, event, or brief for this run." /></label>
            <input className={inputClass} placeholder="Optional campaign, offer, event, or theme" value={campaignOverride} onChange={event => setCampaignOverride(event.target.value)} />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="break-all">{errorMsg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm min-h-[520px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">Generated Content <InfoPopover text="Review AI output before saving it to posts." /></h3>
            <p className="text-xs text-slate-500">OpenAI runs through the `auto-generate-social-content` Edge Function.</p>
          </div>
          <button type="button" onClick={generateContent} disabled={isGenerating || !selectedPlatform} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-100">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
            <InfoPopover text="Create a new batch from project settings." panelClassName="left-auto right-0 translate-x-0" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="h-[420px] border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
            <Sparkles className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-xs font-bold text-slate-500">Generate social content for the selected project platform.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
            {items.map(item => (
              <div key={item.id} className="border rounded-2xl p-3 transition-all border-slate-100 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-xs font-black text-slate-900 leading-snug">{item.title}</h4>
                  <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{item.approvalStatus}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black uppercase">{item.platform}</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black uppercase">{item.contentType}</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black uppercase">{item.sourceType}</span>
                </div>
                {item.hook && <p className="text-[11px] text-slate-700 mt-2 font-bold">{item.hook}</p>}
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed whitespace-pre-line">{item.body || item.videoScript}</p>
                {item.carouselOutline?.length ? <p className="text-[10px] text-slate-500 mt-2">{item.carouselOutline.join(' / ')}</p> : null}
                {item.sceneOutline?.length ? <p className="text-[10px] text-slate-500 mt-2">{item.sceneOutline.join(' / ')}</p> : null}
                {item.cta && <p className="text-[10px] text-slate-600 mt-2 font-bold">CTA: {item.cta}</p>}
                {item.hashtags.length > 0 && <p className="text-[10px] text-indigo-600 mt-2">{item.hashtags.join(' ')}</p>}

                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 overflow-hidden">
                  <div className="p-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-600">Creative Direction</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-line line-clamp-4">
                          {item.creativeDirection || item.thumbnailPrompt || 'No creative direction added yet.'}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => createCreativeDirection(item)} disabled={directingId === item.id} className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-black hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1">
                      {directingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      Creative Direction
                    </button>
                  </div>
                </div>

                {cardNotice[item.id] && (
                  <div className="mt-2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white">
                    {cardNotice[item.id]}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => approveItem(item)} disabled={approvingId === item.id} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1">
                    {approvingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                    <InfoPopover text="Save this content to Posts." />
                  </button>
                  <button type="button" onClick={() => rejectItem(item.id)} className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-black hover:bg-rose-100 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" />
                    Reject
                    <InfoPopover text="Remove this generated item." />
                  </button>
                  <button type="button" onClick={() => replaceItem(item.id)} disabled={replacingId === item.id} className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-[10px] font-black hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1">
                    {replacingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    Replace
                    <InfoPopover text="Ask for a new version." />
                  </button>
                  <button type="button" onClick={() => copyItem(item)} className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-[10px] font-black hover:bg-slate-100 flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                    <InfoPopover text="Copy the complete text package." />
                  </button>
                  <button type="button" onClick={() => downloadItem(item)} className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-[10px] font-black hover:bg-slate-100 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    Download
                    <InfoPopover text="Download the complete text package." />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoGenerate;
