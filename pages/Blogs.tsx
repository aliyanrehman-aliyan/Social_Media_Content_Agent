import React from 'react';
import { Post } from '../types';

interface ContentLibraryProps {
  posts: Post[];
  onPreview?: (id: string) => void;
}

const ContentLibrary: React.FC<ContentLibraryProps> = ({ posts, onPreview }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {posts.map(post => (
      <button key={post.id} type="button" onClick={() => onPreview?.(post.id)} className="text-left bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all">
        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">{post.platform} / {post.contentType}</div>
        <h3 className="font-bold text-slate-800 line-clamp-2">{post.title}</h3>
        <p className="text-xs text-slate-500 line-clamp-2 mt-2">{post.body || post.hook}</p>
      </button>
    ))}
  </div>
);

export default ContentLibrary;
