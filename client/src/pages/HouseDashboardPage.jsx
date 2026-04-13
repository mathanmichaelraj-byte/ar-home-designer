import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHouse } from '../context/HouseContext';

const ROOM_EMOJIS = {
  living: '🛋️', bedroom: '🛏️', office: '💼',
  dining: '🍽️', kitchen: '🍳', bathroom: '🚿', other: '🏠',
};

const ROOM_COLORS = {
  living: 'bg-blue-500/10 border-blue-500/20',
  bedroom: 'bg-purple-500/10 border-purple-500/20',
  office: 'bg-green-500/10 border-green-500/20',
  dining: 'bg-orange-500/10 border-orange-500/20',
  kitchen: 'bg-red-500/10 border-red-500/20',
  bathroom: 'bg-teal-500/10 border-teal-500/20',
  other: 'bg-gray-800 border-gray-700',
};

const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="aspect-video rounded-xl skeleton mb-4" />
    <div className="skeleton h-4 rounded w-3/4 mb-2" />
    <div className="skeleton h-3 rounded w-1/3" />
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
    <h3 className="text-white font-semibold text-lg mb-2">No houses yet</h3>
    <p className="text-gray-600 text-sm mb-8 text-center max-w-xs leading-relaxed">
      Create your first house to start designing multiple rooms together.
    </p>
    <button onClick={onCreate} className="btn-primary text-sm px-6 py-2.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Create first house
    </button>
  </div>
);

const HouseDashboardPage = () => {
  const { user } = useAuth();
  const { houses, loadHouses, createHouse, deleteHouse } = useHouse();
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadHouses().finally(() => setLoading(false));
  }, [loadHouses]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const house = await createHouse({
        name: 'My House',
        rooms: [
          { name: 'Living Room', type: 'living', dimensions: { width: 5, length: 6, height: 2.8 } },
        ],
      });
      navigate(`/houses/${house._id}`);
    } finally { setCreating(false); }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this house and all its rooms? This cannot be undone.')) return;
    setDeleting(id);
    try { await deleteHouse(id); }
    finally { setDeleting(null); }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-5">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10 animate-fade-up">
          <div>
            <p className="text-xs font-mono text-gray-600 mb-1 tracking-wider uppercase">House Designer</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {loading ? '—' : `${houses.length} house${houses.length !== 1 ? 's' : ''} designed`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="btn-ghost text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
              Room Projects
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
                  New house
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────── */}
        <div className="flex items-center gap-1 mb-8 border-b border-gray-800">
          <button className="px-4 py-2.5 text-sm font-medium text-white border-b-2 border-white -mb-px">
            All houses
          </button>
        </div>

        {/* ── Grid ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : houses.length === 0 ? (
            <EmptyState onCreate={handleCreate} />
          ) : (
            houses.filter(Boolean).map((house, i) => (
              <Link
                key={house._id}
                to={`/houses/${house._id}`}
                className="group card card-hover block relative animate-fade-up"
                style={{ animationDelay: `${i * 70}ms`, opacity: 0, animationFillMode: 'forwards' }}
              >
                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, house._id)}
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg
                             bg-gray-800 border border-gray-700 text-gray-600
                             hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400
                             opacity-0 group-hover:opacity-100 transition-all duration-200
                             flex items-center justify-center"
                >
                  {deleting === house._id ? (
                    <span className="w-3 h-3 border border-gray-500 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    </svg>
                  )}
                </button>

                {/* Room preview */}
                <div className="aspect-video rounded-xl bg-gray-850 border border-gray-800 mb-4
                                flex items-center justify-center flex-wrap gap-2 p-4 relative
                                group-hover:border-gray-700 transition-colors overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-30" />
                  {(house.rooms || []).length === 0 ? (
                    <span className="text-4xl opacity-20 relative z-10">🏡</span>
                  ) : (
                    (house.rooms || []).slice(0, 6).map((room, ri) => (
                      <div key={ri}
                           className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                       border text-xs font-medium relative z-10
                                       ${ROOM_COLORS[room.type] || ROOM_COLORS.other}`}>
                        <span className="text-sm leading-none">{ROOM_EMOJIS[room.type] || '🏠'}</span>
                        <span className="text-gray-300 max-w-[60px] truncate">{room.name}</span>
                      </div>
                    ))
                  )}
                  {(house.rooms?.length || 0) > 6 && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700
                                    text-xs text-gray-500 relative z-10">
                      +{house.rooms.length - 6} more
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3 className="text-white text-sm font-semibold truncate mb-1
                               group-hover:text-accent transition-colors duration-200">
                  {house.name}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    {house.rooms?.length || 0} room{house.rooms?.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-700 font-mono">
                    {new Date(house.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

export default HouseDashboardPage;
