import React, { useState, useEffect } from 'react';
import { furnitureAPI } from '../utils/api';
import { FURNITURE_CATEGORIES } from '../utils/constants';
import { useProject } from '../context/ProjectContext';

export default function FurnitureSidebar() {
  const { addObject } = useProject();
  const [furniture, setFurniture] = useState([]);
  const [category,  setCategory]  = useState('all');
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    furnitureAPI.getAll()
      .then(res => setFurniture(res.data.furniture))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = furniture.filter(f => {
    const matchCat = category === 'all' || f.type === category;
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <aside className="w-72 h-full flex flex-col bg-surface/50 border-r border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h3 className="font-display font-semibold text-white mb-3">Furniture Library</h3>
        <input
          type="text"
          placeholder="Search furniture…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field text-sm py-2"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 p-3 flex-wrap border-b border-white/5">
        {FURNITURE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-body font-medium transition-all duration-150
              ${category === cat.id
                ? 'bg-accent text-white'
                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-white/5 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <p className="col-span-2 text-center text-muted text-sm py-8">No items found</p>
        ) : (
          filtered.map(item => (
            <FurnitureItem key={item._id} item={item} onAdd={addObject} />
          ))
        )}
      </div>
    </aside>
  );
}

function FurnitureItem({ item, onAdd }) {
  return (
    <button
      onClick={() => onAdd({ furnitureId: item._id, name: item.name, type: item.type,
        modelUrl: item.modelUrl, dimensions: item.dimensions })}
      className="group flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5
                 border border-white/5 hover:border-accent/40 hover:bg-accent/5
                 transition-all duration-200 text-left"
      title={`Add ${item.name}`}
    >
      <div className="w-full aspect-square rounded-md bg-primary/50 flex items-center justify-center
                      group-hover:shadow-glow transition-all duration-200 overflow-hidden">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name}
               className="w-full h-full object-cover rounded-md" />
        ) : (
          <FurnitureIcon type={item.type} />
        )}
      </div>
      <div className="w-full">
        <p className="text-white text-xs font-medium truncate">{item.name}</p>
        {item.price && (
          <p className="text-gold text-xs font-mono">₹{item.price.toLocaleString()}</p>
        )}
      </div>
    </button>
  );
}

function FurnitureIcon({ type }) {
  const icons = {
    seating: 'M4 20h16M6 20V10l6-6 6 6v10',
    tables:  'M3 10h18M3 14h18M6 10V20M18 10V20',
    beds:    'M2 20v-8a2 2 0 012-2h16a2 2 0 012 2v8M2 14h20M6 14V8a2 2 0 012-2h8a2 2 0 012 2v6',
    storage: 'M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z',
    lighting:'M12 2v2M12 18v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M18 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z',
    decor:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  };
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.5" className="text-muted group-hover:text-accent transition-colors">
      <path d={icons[type] || icons.decor} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
