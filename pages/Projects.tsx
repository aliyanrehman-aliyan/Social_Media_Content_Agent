import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  Globe,
  Loader2,
  Plus,
  Send,
  Settings2,
  Target,
  X
} from 'lucide-react';
import { Project } from '../types';
import InfoPopover from '../components/InfoPopover';

interface ProjectsPageProps {
  projects: Project[];
  activeProjectId: string;
  onSelect: (id: string) => void;
  onAdd: (project: Project) => Promise<{ data?: any; error?: any }>;
  onUpdate: (project: Project) => void;
  onCreateNew?: () => void;
}

const emptyForm = {
  businessName: '',
  websiteUrl: '',
  industry: '',
  targetAudience: '',
  brandDescription: '',
  tone: 'Professional',
  language: 'English',
};

const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, activeProjectId, onSelect, onAdd, onUpdate, onCreateNew }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const newProjectData: Project = {
      id: '',
      name: formData.businessName,
      businessName: formData.businessName,
      websiteUrl: formData.websiteUrl,
      industry: formData.industry,
      targetAudience: formData.targetAudience,
      brandDescription: formData.brandDescription,
      tone: formData.tone,
      language: formData.language,
      platforms: ['Instagram', 'Facebook'],
      contentTypes: ['Caption', 'Image Post', 'Hashtags'],
      sourceType: 'General Topic',
      postingFrequency: '',
      publishingMode: 'manual',
      location: '',
      tags: [],
      settingsMetadata: {},
      createdAt: new Date().toISOString(),
    };

    const result = await onAdd(newProjectData);
    if (result.error) {
      setErrorMsg(result.error.message || 'Failed to create project.');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setShowAddModal(false);
    setFormData(emptyForm);
  };

  const handleUpdateProjectSettings = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingProject) {
      onUpdate(editingProject);
      setEditingProject(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Your Projects
            <InfoPopover text="Manage social media content projects and their settings." />
          </h2>
          <p className="text-slate-500">Manage business workspaces and social content settings</p>
        </div>
        <button onClick={() => { setErrorMsg(null); onCreateNew ? onCreateNew() : setShowAddModal(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
          <Plus className="w-5 h-5" />
          Add New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(project => (
          <div key={project.id} onClick={() => onSelect(project.id)} className={`relative group cursor-pointer bg-white rounded-3xl border p-8 transition-all duration-300 ${activeProjectId === project.id ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-2xl' : 'border-slate-100 hover:border-indigo-200 hover:shadow-xl'}`}>
            {activeProjectId === project.id && (
              <div className="absolute top-6 right-6 text-indigo-600 bg-indigo-50 p-1.5 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className={`p-4 rounded-2xl ${activeProjectId === project.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'} transition-all`}>
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                  <Target className="w-3 h-3" />
                  {project.industry || 'No industry set'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Audience</div>
                <div className="text-slate-700 font-semibold line-clamp-2">{project.targetAudience || 'Not set'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Publishing</div>
                <div className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${project.publishingMode === 'auto_publish' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  {project.publishingMode === 'auto_publish' ? 'Auto Publish' : 'Manual'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <button onClick={(event) => { event.stopPropagation(); setEditingProject(project); }} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <Settings2 className="w-4 h-4" /> Settings
              </button>
              <button className={`text-sm font-bold flex items-center gap-1.5 transition-all ${activeProjectId === project.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                Go to Posts <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 pb-6">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-2.5 rounded-2xl"><Settings2 className="w-6 h-6 text-indigo-600" /></div>
                  <h3 className="text-2xl font-bold text-slate-800">{editingProject.name} Settings</h3>
                </div>
                <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
              </div>
              <p className="text-slate-500 text-sm">Configure social content context and publishing mode.</p>
            </div>

            <form onSubmit={handleUpdateProjectSettings} className="p-10 pt-0 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900" value={editingProject.businessName} onChange={event => setEditingProject({ ...editingProject, businessName: event.target.value, name: event.target.value })} />
                <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900" value={editingProject.industry} onChange={event => setEditingProject({ ...editingProject, industry: event.target.value })} />
              </div>
              <textarea rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 resize-none" value={editingProject.targetAudience} onChange={event => setEditingProject({ ...editingProject, targetAudience: event.target.value })} />
              <textarea rows={4} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 resize-none" value={editingProject.brandDescription} onChange={event => setEditingProject({ ...editingProject, brandDescription: event.target.value })} />

              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setEditingProject({ ...editingProject, publishingMode: 'manual' })} className={`flex flex-col items-start gap-3 p-5 rounded-2xl border-2 transition-all text-left ${editingProject.publishingMode === 'manual' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <Send className="w-5 h-5 text-indigo-600" />
                  <div className="font-bold text-slate-800 text-sm">Manual Mode</div>
                </button>
                <button type="button" onClick={() => setEditingProject({ ...editingProject, publishingMode: 'auto_publish' })} className={`flex flex-col items-start gap-3 p-5 rounded-2xl border-2 transition-all text-left ${editingProject.publishingMode === 'auto_publish' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <Database className="w-5 h-5 text-slate-600" />
                  <div className="font-bold text-slate-800 text-sm">Auto Publish Mode</div>
                  <div className="text-xs text-slate-400">Coming Soon</div>
                </button>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setEditingProject(null)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-200 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Create Project</h3>
                <p className="text-slate-500 text-xs mt-1">Add a business to Social Media Content Agent</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs font-bold leading-relaxed">{errorMsg}</div>
                </div>
              )}

              <input required disabled={isSaving} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50" placeholder="Business name" value={formData.businessName} onChange={event => setFormData({ ...formData, businessName: event.target.value })} />
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input disabled={isSaving} type="url" className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50" placeholder="https://example.com" value={formData.websiteUrl} onChange={event => setFormData({ ...formData, websiteUrl: event.target.value })} />
              </div>
              <input required disabled={isSaving} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50" placeholder="Industry" value={formData.industry} onChange={event => setFormData({ ...formData, industry: event.target.value })} />
              <textarea required disabled={isSaving} rows={3} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 disabled:opacity-50 resize-none" placeholder="Target audience" value={formData.targetAudience} onChange={event => setFormData({ ...formData, targetAudience: event.target.value })} />

              <div className="flex gap-4 pt-4">
                <button type="button" disabled={isSaving} onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
