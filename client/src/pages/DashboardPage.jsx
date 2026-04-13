import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { projectsAPI } from '../utils/api';

const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="aspect-video rounded-xl skeleton mb-4" />
    <div className="skeleton h-4 rounded w-3/4 mb-2" />
    <div className="skeleton h-3 rounded w-1/2" />
  </div>
);

const EmptyState = ({ onCreate }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-32 animate-fade-up">
    <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800 flex items-center
                    justify-center mb-6">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1" className="text-gray-700">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
    <h3 className="text-white font-semibold text-lg mb-2">No projects yet</h3>
    <p className="text-gray-600 text-sm mb-8 text-center max-w-xs leading-relaxed">
      Create your first room design to get started. It only takes a few seconds.
    </p>
    <button onClick={onCreate} className="btn-primary text-sm px-6 py-2.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Create first project
    </button>
  </div>
);

const DashboardPage = () => {
  const { user }    = useAuth();
  const { projects, loadProjects, createProject } = useProject();
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects().finally(() => setLoading(false));
  }, [loadProjects]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const project = await createProject({
        name: 'Untitled Room',
        roomDimensions: { width: 5, length: 5, height: 2.8 },
        objects: [],
      });
      if (project?._id) navigate(`/designer/${project._id}`);
    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally { setCreating(false); }
  };

  const handleDelete = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(projectId);
    try {
      await projectsAPI.delete(projectId);
      await loadProjects();
    } finally { setDeleting(null); }
  };

  const validProjects = (projects || []).filter(Boolean);

  return (
    <div className="min-h-screen pt-24 pb-20 px-5">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10 animate-fade-up">
          <div>
            <p className="text-xs font-mono text-gray-600 mb-1 tracking-wider uppercase">Room Designer</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {loading ? '—' : `${validProjects.length} project${validProjects.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/houses" className="btn-ghost text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              House Designer
            </Link>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary text-sm"
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                  Creating…
                </span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New project
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Tabs strip ──────────────────────────── */}
        <div className="flex items-center gap-1 mb-8 border-b border-gray-800 pb-0">
          <button className="px-4 py-2.5 text-sm font-medium text-white border-b-2 border-white -mb-px">
            All projects
          </button>
          <button className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-400 transition-colors">
            Recent
          </button>
        </div>

        {/* ── Grid ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : validProjects.length === 0 ? (
            <EmptyState onCreate={handleCreate} />
          ) : (
            validProjects.map((project, i) => (
              <Link
                key={project._id}
                to={`/designer/${project._id}`}
                className="group card card-hover block relative animate-fade-up"
                style={{ animationDelay: `${i * 60}ms`, opacity: 0, animationFillMode: 'forwards' }}
              >
                {/* Delete btn */}
                <button
                  onClick={(e) => handleDelete(e, project._id)}
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg
                             bg-gray-800 border border-gray-700 text-gray-600
                             hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400
                             opacity-0 group-hover:opacity-100 transition-all duration-200
                             flex items-center justify-center"
                  title="Delete project"
                >
                  {deleting === project._id ? (
                    <span className="w-3 h-3 border border-gray-500 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                    </svg>
                  )}
                </button>

                {/* AR badge */}
                <div className="absolute top-3 left-3 z-10 badge-white text-xs opacity-0
                                group-hover:opacity-100 transition-opacity duration-200">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 3H3v2M19 3h2v2M5 21H3v-2M19 21h2v-2"/>
                    <rect x="7" y="7" width="10" height="10" rx="1"/>
                  </svg>
                  AR
                </div>

                {/* Thumbnail */}
                <div className="aspect-video rounded-xl bg-gray-850 border border-gray-800 mb-4
                                flex items-center justify-center overflow-hidden relative
                                group-hover:border-gray-700 transition-colors">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-grid opacity-50" />
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           strokeWidth="0.8" className="text-gray-800 relative z-10">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                      <span className="absolute bottom-2 right-2.5 text-xs font-mono text-gray-700">
                        {project.objects?.length || 0} items
                      </span>
                    </>
                  )}
                </div>

                {/* Info */}
                <h3 className="text-white text-sm font-semibold truncate mb-1
                               group-hover:text-accent transition-colors duration-200">
                  {project.name || 'Untitled Room'}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    {project.roomDimensions?.width || 5}m × {project.roomDimensions?.length || 5}m
                  </p>
                  <p className="text-xs text-gray-700 font-mono">
                    {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
