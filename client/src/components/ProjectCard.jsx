import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

function formatAgo(date) {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const { deleteProject } = useProject();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${project.name}"?`)) return;
    await deleteProject(project._id);
  };

  const timeAgo = formatAgo(new Date(project.updatedAt || project.createdAt));

  return (
    <div
      onClick={() => navigate(`/designer/${project._id}`)}
      className="group card card-hover cursor-pointer relative animate-fade-up"
    >
      {/* Actions — appear on hover */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1
                      opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/ar/${project._id}`); }}
          className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center
                     text-gray-600 hover:text-white hover:border-gray-600 transition-all"
          title="View in AR"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3H3v2M19 3h2v2M5 21H3v-2M19 21h2v-2"/>
            <rect x="7" y="7" width="10" height="10" rx="1"/>
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center
                     text-gray-600 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
          title="Delete"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </button>
      </div>

      {/* Thumbnail */}
      <div className="aspect-video rounded-xl bg-gray-850 border border-gray-800 mb-4
                      flex items-center justify-center overflow-hidden relative
                      group-hover:border-gray-700 transition-colors">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="0.8" className="text-gray-800 relative z-10">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="absolute bottom-2 right-2.5 text-xs font-mono text-gray-700 z-10">
          {project.objects?.length || 0} items
        </span>
      </div>

      {/* Info */}
      <h3 className="text-white text-sm font-semibold truncate mb-1.5
                     group-hover:text-accent transition-colors duration-200">
        {project.name}
      </h3>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600 font-mono">
          {project.roomDimensions?.width}×{project.roomDimensions?.length}m
        </p>
        <p className="text-xs text-gray-700">{timeAgo}</p>
      </div>
    </div>
  );
}
