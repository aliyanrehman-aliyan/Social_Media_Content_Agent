import React, { useState } from 'react';
import { ArrowLeft, Hash, Save } from 'lucide-react';
import { Platform, Post, Project, SocialContentType } from '../types';

interface EditorProps {
  post: Post | null;
  project: Project;
  onSave: (post: Post) => void;
  onCancel: () => void;
}

const Editor: React.FC<EditorProps> = ({ post, project, onSave, onCancel }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [platform, setPlatform] = useState<Platform>(post?.platform || project.platforms?.[0] || 'Instagram');
  const [contentType, setContentType] = useState<SocialContentType>(post?.contentType || project.contentTypes?.[0] || 'Caption');
  const [hook, setHook] = useState(post?.hook || '');
  const [body, setBody] = useState(post?.body || '');
  const [cta, setCta] = useState(post?.cta || '');
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(' ') || '');
  const [carouselOutline, setCarouselOutline] = useState(post?.carouselOutline?.join('\n') || '');
  const [videoScript, setVideoScript] = useState(post?.videoScript || '');
  const [status, setStatus] = useState(post?.status || 'Draft');
  const [approvalStatus, setApprovalStatus] = useState(post?.approvalStatus || 'Pending');
  const [scheduledAt, setScheduledAt] = useState(post?.scheduledAt?.slice(0, 16) || '');
  const [imageUrl, setImageUrl] = useState(post?.imageUrl || post?.image || '');
  const platformOptions = Array.from(new Set([...(project.platforms || []), platform]));
  const contentTypeOptions = Array.from(new Set([...(project.contentTypes || []), contentType]));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextPost: Post = {
      id: post?.id || `new-${Date.now()}`,
      projectId: project.id,
      categoryIds: [],
      title: title.trim() || `${platform} ${contentType}`,
      platform,
      contentType,
      hook,
      body,
      cta,
      hashtags: hashtags.split(/\s+/).map(tag => tag.trim()).filter(Boolean),
      carouselOutline: carouselOutline.split('\n').map(item => item.trim()).filter(Boolean),
      videoScript,
      status,
      approvalStatus,
      category: 'Social Content',
      author: 'Admin',
      date: new Intl.DateTimeFormat('en-CA').format(new Date()),
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      image: imageUrl.trim() || post?.image || '',
      imageUrl: imageUrl.trim(),
      tags: post?.tags || [],
    };

    onSave(nextPost);
  };

  const inputClass = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm text-slate-900 placeholder:text-slate-400';
  const labelClass = 'text-[10px] font-black text-slate-400 uppercase tracking-widest';

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100">
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-900">{post ? 'Edit Social Content' : 'Create Social Content'}</h2>
          <p className="text-sm text-slate-500 mt-1">Prepare platform-ready content for manual publishing.</p>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>Title</label>
              <input required className={inputClass} value={title} onChange={event => setTitle(event.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Platform</label>
                <select className={`${inputClass} appearance-none`} value={platform} onChange={event => setPlatform(event.target.value as Platform)}>
                  {platformOptions.map(option => <option key={option}>{option}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Content Type</label>
                <select className={`${inputClass} appearance-none`} value={contentType} onChange={event => setContentType(event.target.value as SocialContentType)}>
                  {contentTypeOptions.map(option => <option key={option}>{option}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Hook</label>
              <input className={inputClass} value={hook} onChange={event => setHook(event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Caption / Body</label>
              <textarea rows={8} className={`${inputClass} resize-none`} value={body} onChange={event => setBody(event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>CTA</label>
              <input className={inputClass} value={cta} onChange={event => setCta(event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Hashtags</label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className={`${inputClass} pl-10`} placeholder="#brand #campaign" value={hashtags} onChange={event => setHashtags(event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Carousel Outline</label>
                <textarea rows={5} className={`${inputClass} resize-none`} value={carouselOutline} onChange={event => setCarouselOutline(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Video Script</label>
                <textarea rows={5} className={`${inputClass} resize-none`} value={videoScript} onChange={event => setVideoScript(event.target.value)} />
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Status</label>
                <select className={`${inputClass} appearance-none`} value={status} onChange={event => setStatus(event.target.value as any)}>
                  <option>Draft</option>
                  <option>Scheduled</option>
                  <option>Published</option>
                  <option>Failed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Approval</label>
                <select className={`${inputClass} appearance-none`} value={approvalStatus} onChange={event => setApprovalStatus(event.target.value as any)}>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Schedule</label>
                <input type="datetime-local" className={inputClass} value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Image URL</label>
                <input className={inputClass} value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="Paste replacement image URL" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
};

export default Editor;
