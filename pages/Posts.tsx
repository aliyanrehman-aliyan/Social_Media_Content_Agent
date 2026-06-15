import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit2,
  Filter,
  LayoutGrid,
  List,
  Search,
  Trash2
} from 'lucide-react';
import { Post } from '../types';
import InfoPopover from '../components/InfoPopover';

interface PostsProps {
  posts: Post[];
  projectName: string;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onEditPost?: (post: Post) => void;
}

const Posts: React.FC<PostsProps> = ({ posts, projectName, onDelete, onToggleStatus, onEditPost }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = posts.filter(post => {
    const term = searchTerm.toLowerCase();
    return post.title.toLowerCase().includes(term) ||
      post.platform.toLowerCase().includes(term) ||
      post.contentType.toLowerCase().includes(term) ||
      post.body.toLowerCase().includes(term);
  });

  const copyPost = async (post: Post) => {
    const text = [post.hook, post.body, post.cta, post.hashtags.join(' '), post.creativeDirection].filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  const downloadPost = (post: Post) => {
    const text = [
      `Platform: ${post.platform}`,
      `Content type: ${post.contentType}`,
      post.sourceType ? `Source type: ${post.sourceType}` : '',
      `Title:\n${post.title}`,
      post.hook ? `Hook:\n${post.hook}` : '',
      post.body ? `Caption / Body:\n${post.body}` : '',
      post.cta ? `CTA:\n${post.cta}` : '',
      post.hashtags.length ? `Hashtags:\n${post.hashtags.join(' ')}` : '',
      post.carouselOutline?.length ? `Carousel Outline:\n${post.carouselOutline.map((line, index) => `${index + 1}. ${line}`).join('\n')}` : '',
      post.videoScript ? `Video Script:\n${post.videoScript}` : '',
      post.sceneOutline?.length ? `Scene Outline:\n${post.sceneOutline.map((line, index) => `${index + 1}. ${line}`).join('\n')}` : '',
      post.creativeDirection ? `Creative Direction / Image Description:\n${post.creativeDirection}` : '',
      post.thumbnailPrompt ? `YouTube Thumbnail Prompt:\n${post.thumbnailPrompt}` : '',
    ].filter(Boolean).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'social-content'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {projectName} Posts
            <InfoPopover text="Content Library for saved social posts." />
          </h2>
          <p className="text-slate-500">Manage, edit, copy, and publish your social content</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white border border-slate-200 p-1 rounded-lg">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search social content..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 text-black placeholder:text-slate-400" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <div key={post.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="flex gap-2">
                    <button onClick={() => onEditPost?.(post)} className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-lg text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => copyPost(post)} className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-lg text-white transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => downloadPost(post)} className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-lg text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(post.id)} className="p-2 bg-rose-500/20 backdrop-blur-md hover:bg-rose-500/40 rounded-lg text-rose-200 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${post.status === 'Published' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-900/60 backdrop-blur text-white'}`}>
                    {post.status}
                  </span>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-slate-800 shadow-sm">
                    {post.platform}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">{post.contentType}</div>
                <h3 className="font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug h-12">{post.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed">{post.body || post.hook || post.videoScript}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-xs font-semibold text-slate-600">{post.approvalStatus}</span>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Clock className="w-3 h-3" /> {post.date}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPosts.map(post => (
                <tr key={post.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={post.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-semibold text-slate-800 truncate max-w-[240px]">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => onToggleStatus(post.id)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${post.status === 'Published' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {post.status === 'Published' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {post.status}
                    </button>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">{post.platform}</span></td>
                  <td className="px-6 py-4"><span className="text-sm font-medium text-slate-600">{post.contentType}</span></td>
                  <td className="px-6 py-4"><span className="text-xs text-slate-500">{post.date}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEditPost?.(post)} className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => copyPost(post)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => downloadPost(post)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><Download className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors" onClick={() => onDelete(post.id)}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredPosts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No posts found</h3>
          <p className="text-slate-500">Approve generated social content to fill this workspace.</p>
        </div>
      )}
    </div>
  );
};

export default Posts;
