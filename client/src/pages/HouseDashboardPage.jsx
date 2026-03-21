import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHouse } from '../context/HouseContext';

const ROOM_EMOJIS = {
  living: '🛋️', bedroom: '🛏️', office: '💼',
  dining: '🍽️', kitchen: '🍳', bathroom: '🚿', other: '🏠',
};

const HouseDashboardPage = () => {
  const { user } = useAuth();
  const { houses, loadHouses, createHouse, deleteHouse } = useHouse();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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
    if (!window.confirm('Delete this house and all its rooms?')) return;
    await deleteHouse(id);
  };

  return (
    <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {houses.length} house{houses.length !== 1 ? 's' : ''} designed
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard" className="btn-ghost text-sm">Room Projects</Link>
          <button onClick={handleCreate} disabled={creating} className="btn-primary flex items-center gap-2">
            <span>+</span> {creating ? 'Creating…' : 'New House'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : houses.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🏡</div>
          <h2 className="text-white font-semibold text-xl mb-2">No houses yet</h2>
          <p className="text-gray-500 text-sm mb-6">Create your first house to start designing multiple rooms together.</p>
          <button onClick={handleCreate} className="btn-primary">Create your first house</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {houses.filter(Boolean).map((house) => (
            <Link key={house._id} to={`/houses/${house._id}`}
              className="card hover:border-brand-500/60 group block relative">
              <button
                onClick={(e) => handleDelete(e, house._id)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500/20 hover:bg-red-500/60 text-red-400 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center"
              >✕</button>

              {/* Room preview icons */}
              <div className="aspect-video bg-surface rounded-lg mb-3 flex items-center justify-center gap-2 flex-wrap p-3">
                {(house.rooms || []).slice(0, 6).map((room, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-2xl">{ROOM_EMOJIS[room.type] || '🏠'}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[60px]">{room.name}</span>
                  </div>
                ))}
                {house.rooms?.length === 0 && (
                  <span className="text-4xl opacity-20">🏡</span>
                )}
              </div>

              <h3 className="text-white font-medium truncate group-hover:text-brand-500 transition-colors">
                {house.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {house.rooms?.length || 0} room{house.rooms?.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(house.updatedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HouseDashboardPage;