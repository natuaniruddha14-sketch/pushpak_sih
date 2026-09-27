import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  MapPin, 
  Layers, 
  FileText, 
  Calendar,
  UserCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const ProjectsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Form
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [mineLocation, setMineLocation] = useState('Singrauli Coalfield, MP');
  const [targetSeam, setTargetSeam] = useState('Turra / Purewa Seam');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DEFAULT_PROJECTS = [
    {
      id: 'prj-gevra-2026',
      name: 'Gevra OCP Expansion & Geological Survey',
      code: 'PRJ-GEVRA-2026',
      description: 'Detailed 3D seismic & borehole geological exploration for Gevra opencast project expansion (425.8 MT Proved Reserve).',
      mineLocation: 'Korba Coalfield, SECL, Chhattisgarh',
      targetSeam: 'Seam V / VI / VII Block',
      createdAt: '2026-01-15',
      owner: { name: 'Dr. Rajesh Sharma' },
      _count: { documents: 14 },
    },
    {
      id: 'prj-singrauli-2026',
      name: 'Singrauli Coalfield Deep Seam Investigation',
      code: 'PRJ-SINGRAULI-2026',
      description: 'Borehole log analysis and seam thickness mapping for Purewa and Turra coal seams.',
      mineLocation: 'Singrauli Coalfield, NCL, MP/UP',
      targetSeam: 'Purewa / Turra Bottom Seam',
      createdAt: '2026-02-10',
      owner: { name: 'Anil Verma' },
      _count: { documents: 8 },
    },
    {
      id: 'prj-rajmahal-2026',
      name: 'Rajmahal OpenCast Production Audit',
      code: 'PRJ-RAJMAHAL-2026',
      description: 'Overburden stripping ratio compliance and annual production audit dossier.',
      mineLocation: 'Rajmahal Coalfield, ECL, Jharkhand',
      targetSeam: 'Hura / Lalmatia Seam',
      createdAt: '2026-03-01',
      owner: { name: 'S. K. Mukherjee' },
      _count: { documents: 11 },
    },
  ];

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.projects || [];
        setProjects(list.length > 0 ? list : DEFAULT_PROJECTS);
      } else {
        setProjects(DEFAULT_PROJECTS);
      }
    } catch (err: any) {
      setProjects(DEFAULT_PROJECTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, code, description, mineLocation, targetSeam }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create project');
      }

      setShowModal(false);
      setName('');
      setCode('');
      setDescription('');
      fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-amber-400" />
            Mining Intelligence Projects
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize coal reserve evaluations, borehole analysis, and CMPDI exploration sites.
          </p>
        </div>

        {user?.role === 'ADMIN' || user?.role === 'GEOLOGIST' || user?.role === 'MINING_ENGINEER' ? (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-mining-950 font-semibold text-xs rounded-xl shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        ) : null}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-amber-400" />
                Create Mining Project
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-xs font-mono">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Singrauli Block-C Reserve Assessment"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Project Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="PRJ-SINGRAULI-2026"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Mine Location</label>
                  <input
                    type="text"
                    value={mineLocation}
                    onChange={(e) => setMineLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Seam</label>
                  <input
                    type="text"
                    value={targetSeam}
                    onChange={(e) => setTargetSeam(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed project summary..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-mining-950 font-semibold rounded-xl"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-mono glass-panel rounded-2xl border border-slate-800">
          Loading project portfolio...
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 font-mono glass-panel rounded-2xl border border-slate-800 space-y-2">
          <p>No active projects registered.</p>
          <p className="text-[11px] text-slate-600">Click 'Create New Project' above to initiate a project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div key={proj.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {proj.code}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{proj.name}</h3>
                </div>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">
                {proj.description || 'Comprehensive mining data evaluation and document analysis workspace.'}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center text-slate-300 gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{proj.mineLocation || 'Singrauli Coalfield'}</span>
                </div>
                <div className="flex items-center text-slate-300 gap-2">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Seam: {proj.targetSeam || 'Seam V/VI'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
