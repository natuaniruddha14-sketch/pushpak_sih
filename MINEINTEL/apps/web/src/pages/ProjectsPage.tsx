import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  MapPin, 
  Layers, 
  FileText, 
  Calendar,
  UserCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const ProjectsPage: React.FC = () => {
  const { token, user } = useAuth();
  const { globalSearch = '' } = useOutletContext<{ globalSearch?: string }>() || {};
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
    setFetchError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.projects || data.data || [];
        setProjects(list);
      } else {
        const data = await res.json().catch(() => ({}));
        setFetchError(data.message || 'Failed to load projects');
        setProjects([]);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Network error fetching projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((proj) => {
    if (!globalSearch || !globalSearch.trim()) return true;
    const q = globalSearch.toLowerCase();
    return (
      (proj.name && proj.name.toLowerCase().includes(q)) ||
      (proj.code && proj.code.toLowerCase().includes(q)) ||
      (proj.mineLocation && proj.mineLocation.toLowerCase().includes(q)) ||
      (proj.targetSeam && proj.targetSeam.toLowerCase().includes(q)) ||
      (proj.description && proj.description.toLowerCase().includes(q))
    );
  });

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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl shadow-xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            Mining Intelligence Projects
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Organize coal reserve evaluations, borehole analysis, and CMPDI exploration sites.
          </p>
        </div>

        {user?.role === 'ADMIN' || user?.role === 'GEOLOGIST' || user?.role === 'MINING_ENGINEER' ? (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        ) : null}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-blue-600/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-slate-200 bg-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                Create Mining Project
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Singrauli Block-C Reserve Assessment"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Project Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="PRJ-SINGRAULI-2026"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Mine Location</label>
                  <input
                    type="text"
                    value={mineLocation}
                    onChange={(e) => setMineLocation(e.target.value)}
                    placeholder="e.g. Singrauli Coalfield"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Target Seam</label>
                  <input
                    type="text"
                    value={targetSeam}
                    onChange={(e) => setTargetSeam(e.target.value)}
                    placeholder="e.g. Seam V/VI"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed project summary..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Cards Grid */}
      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{fetchError}</span>
          </div>
          <button
            onClick={fetchProjects}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="font-semibold text-slate-700">Loading project portfolio...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
          <p className="font-medium text-slate-700">{globalSearch ? `No projects match query "${globalSearch}".` : 'No active projects registered.'}</p>
          {!globalSearch && (user?.role === 'ADMIN' || user?.role === 'GEOLOGIST' || user?.role === 'MINING_ENGINEER') && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center space-x-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Initiate First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-white space-y-3.5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-bold">
                    {proj.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{proj.name}</h3>
                </div>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-transparent hover:border-rose-200 transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {proj.description || 'Comprehensive mining data evaluation and document analysis workspace.'}
              </p>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center text-slate-700 gap-2 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{proj.mineLocation || 'Singrauli Coalfield'}</span>
                </div>
                <div className="flex items-center text-slate-700 gap-2 font-medium">
                  <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Seam: {proj.targetSeam || 'Seam V/VI'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
