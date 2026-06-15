import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Save,
  Search,
  XCircle
} from 'lucide-react';
import { Post, Project } from '../types';
import SocialContentDetail from './SocialContentDetail';
import InfoPopover from '../components/InfoPopover';

interface AnalyticsProps {
  project: Project;
  posts: Post[];
}

const Analytics: React.FC<AnalyticsProps> = ({ project, posts }) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const selectedPost = selectedPostId ? posts.find(post => post.id === selectedPostId) : null;

  const filteredPosts = posts.filter(post => {
    const term = searchTerm.toLowerCase();
    return post.title.toLowerCase().includes(term) ||
      post.platform.toLowerCase().includes(term) ||
      post.contentType.toLowerCase().includes(term);
  });

  const metrics = useMemo(() => {
    const approved = posts.filter(post => post.approvalStatus === 'Approved').length;
    const rejected = posts.filter(post => post.approvalStatus === 'Rejected').length;
    const saved = posts.length;

    return [
      { label: 'Total Generated', value: posts.length.toString(), icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Approved', value: approved.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Rejected', value: rejected.toString(), icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
      { label: 'Saved Content', value: saved.toString(), icon: Save, color: 'text-slate-600', bg: 'bg-slate-100' }
    ];
  }, [posts]);

  const platformDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach(post => counts.set(post.platform, (counts.get(post.platform) || 0) + 1));
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
  }, [posts]);

  const contentTypeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach(post => counts.set(post.contentType, (counts.get(post.contentType) || 0) + 1));
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
  }, [posts]);

  const generationTrends = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach(post => counts.set(post.date, (counts.get(post.date) || 0) + 1));
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [posts]);

  if (selectedPost) {
    return <SocialContentDetail post={selectedPost} allPosts={posts} onBack={() => setSelectedPostId(null)} onSelectPost={setSelectedPostId} />;
  }

  const distributionBlock = (title: string, items: { label: string; count: number }[]) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">{title}</h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Data</span>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">No data yet.</div>
        ) : (
          items.map(item => {
            const percent = posts.length ? Math.round((item.count / posts.length) * 100) : 0;
            return (
              <div key={item.label} className="rounded-xl bg-slate-50/70 border border-slate-100 px-3 py-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>{item.label}</span>
                  <span className="text-slate-900">{percent}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {project.name} Analytics
            <InfoPopover text="Review saved content totals and distributions." />
          </h2>
          <p className="text-slate-500">Review generated content, approvals, saved content, distribution, and trends.</p>
        </div>
        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest">
          {project.publishingMode === 'auto_publish' ? 'Auto Publish' : 'Manual Mode'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {metrics.map(metric => (
          <div key={metric.label} className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm flex flex-col items-center justify-center gap-2">
            <div className={`${metric.bg} ${metric.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
              <metric.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex items-baseline justify-center gap-2 w-full">
              <div className="text-2xl font-black text-slate-900 leading-none">{metric.value}</div>
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider truncate">{metric.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {distributionBlock('Platform Distribution', platformDistribution)}
        {distributionBlock('Content Type Distribution', contentTypeDistribution)}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Generation Trends</h3>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-2">
            {generationTrends.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">No generated content yet.</div>
            ) : generationTrends.map(([date, count]) => (
              <div key={date} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                <span>{date}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-5 bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800">Saved Content</h3>
            <p className="text-sm text-slate-500">Preview saved social media content for the selected project.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 text-slate-900 placeholder:text-slate-400" placeholder="Search content..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredPosts.map(post => (
            <button key={post.id} type="button" onClick={() => setSelectedPostId(post.id)} className="group text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg bg-slate-900/80 text-white">
                  {post.platform}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">{post.contentType}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3" />{post.date}</span>
                </div>
                <h4 className="font-bold text-slate-800 line-clamp-2 min-h-[42px] group-hover:text-indigo-600 transition-colors">{post.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-3 leading-relaxed">{post.body || post.hook}</p>
              </div>
            </button>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800">No content matches this view</h4>
            <p className="text-sm text-slate-500 mt-1">Try a different search term.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Analytics;
