import React from 'react';
import { ArrowLeft, Copy, Hash, Megaphone, Send } from 'lucide-react';
import { Post } from '../types';

interface SocialContentDetailProps {
  post: Post;
  allPosts: Post[];
  onBack: () => void;
  onSelectPost?: (id: string) => void;
}

const SocialContentDetail: React.FC<SocialContentDetailProps> = ({ post, allPosts, onBack, onSelectPost }) => {
  const relatedItems = allPosts
    .filter(item => item.id !== post.id && (item.platform === post.platform || item.contentType === post.contentType))
    .slice(0, 3);

  const copyContent = async () => {
    const text = [post.hook, post.body, post.cta, post.hashtags.join(' ')].filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="aspect-[16/6] bg-slate-100 overflow-hidden">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">{post.platform}</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">{post.contentType}</span>
                {post.sourceType && <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">{post.sourceType}</span>}
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">{post.approvalStatus}</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900">{post.title}</h2>
            </div>
            <button onClick={copyContent} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100">
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>

          {post.hook && (
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                <Megaphone className="w-3.5 h-3.5" />
                Hook
              </div>
              <p className="text-sm font-bold text-slate-800">{post.hook}</p>
            </div>
          )}

          <div className="rounded-2xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              <Send className="w-3.5 h-3.5" />
              Body
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{post.body || post.videoScript}</p>
          </div>

          {post.carouselOutline?.length ? (
            <div className="rounded-2xl bg-white border border-slate-100 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Carousel Outline</div>
              <ol className="space-y-2 text-sm text-slate-600">
                {post.carouselOutline.map((item, index) => <li key={`${item}-${index}`}>{index + 1}. {item}</li>)}
              </ol>
            </div>
          ) : null}

          {post.sceneOutline?.length ? (
            <div className="rounded-2xl bg-white border border-slate-100 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Scene Outline</div>
              <ol className="space-y-2 text-sm text-slate-600">
                {post.sceneOutline.map((item, index) => <li key={`${item}-${index}`}>{index + 1}. {item}</li>)}
              </ol>
            </div>
          ) : null}

          {(post.creativeDirection || post.thumbnailPrompt) && (
            <div className="rounded-2xl bg-white border border-slate-100 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Creative Direction</div>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{post.creativeDirection || post.thumbnailPrompt}</p>
            </div>
          )}

          {post.cta && <p className="text-sm font-bold text-slate-800">CTA: {post.cta}</p>}

          {post.hashtags.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-indigo-600">
              <Hash className="w-4 h-4 mt-0.5" />
              <span>{post.hashtags.join(' ')}</span>
            </div>
          )}
        </div>
      </section>

      {relatedItems.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Related Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedItems.map(item => (
              <button key={item.id} onClick={() => onSelectPost?.(item.id)} className="text-left bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">{item.platform}</div>
                <h4 className="font-bold text-slate-800 line-clamp-2">{item.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-2">{item.body || item.hook}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SocialContentDetail;
