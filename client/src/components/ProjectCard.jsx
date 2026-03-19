import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const { deleteProject } = useProject();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${project.name}"?`)) {
      await deleteProject(project._id);
    }
  };

  const ago = new Date(project.updatedAt || project.createdAt);
  const timeAgo = formatAgo(ago);

  return (
    <div
      onClick={() => navigate(`/designer/${project._id}`)}
      className="group card cursor-pointer hover:border-accent/30 border border-white/5
                 transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="aspect-video rounded-lg bg-primary/60 mb-4 flex items-center justify-center
                      bg-grid border border-white/5 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="1" className="text-white/10">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="absolute bottom-2 right-2 text-xs font-mono text-muted">
          {project.objects?.length || 0} items
        </span>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-white truncate group-hover:text-accent transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-muted mt-1 font-body">
            {project.roomDimensions?.width}m × {project.roomDimensions?.length}m · {timeAgo}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/viewer/${project._id}`); }}
            className="p-1.5 rounded-md hover:bg-white/10 text-muted hover:text-white transition-all"
            title="3D View"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/ar/${project._id}`); }}
            className="p-1.5 rounded-md hover:bg-white/10 text-muted hover:text-white transition-all"
            title="AR View"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 3H3v2M19 3h2v2M5 21H3v-2M19 21h2v-2"/>
              <rect x="7" y="7" width="10" height="10" rx="1"/>
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md hover:bg-accent/20 text-muted hover:text-accent transition-all"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
