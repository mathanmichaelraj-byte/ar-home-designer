import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { projectsAPI } from '../utils/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const { projects, loadProjects, createProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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
    if (!window.confirm('Delete this project?')) return;
    await projectsAPI.delete(projectId);
    loadProjects();
  };

  const validProjects = (projects || []).filter(Boolean);

  return (
    <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {validProjects.length} project{validProjects.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button onClick={handleCreate} disabled={creating} className="btn-primary flex items-center gap-2">
          <span>+</span> {creating ? 'Creating…' : 'New Project'}
        </button>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : validProjects.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-white font-semibold text-xl mb-2">No projects yet</h2>
          <p className="text-gray-500 text-sm mb-6">Create your first room design to get started.</p>
          <button onClick={handleCreate} className="btn-primary">Create your first project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {validProjects.map((project) => (
            <Link
              key={project._id}
              to={`/designer/${project._id}`}
              className="card hover:border-brand-500/60 group block relative"
            >
              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(e, project._id)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500/20 hover:bg-red-500/60 text-red-400 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
              >
                ✕
              </button>

              {/* Thumbnail */}
              <div className="aspect-video bg-surface rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl opacity-30 group-hover:opacity-60 transition-opacity">🛋️</span>
                )}
              </div>

              <h3 className="text-white font-medium truncate group-hover:text-brand-500 transition-colors">
                {project.name || 'Untitled Room'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {project.roomDimensions?.width || 5}m × {project.roomDimensions?.length || 5}m
                · {project.objects?.length || 0} items
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;