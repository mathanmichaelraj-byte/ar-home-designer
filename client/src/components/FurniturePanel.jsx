import React, { useState, useEffect } from 'react';
import { furnitureAPI } from '../utils/api';
import { useProject } from '../context/ProjectContext';
import { FURNITURE_CATEGORIES } from '../utils/constants';

const CATS = FURNITURE_CATEGORIES.map(c => c.id);

export default function FurniturePanel() {
  const [furniture, setFurniture] = useState([]);
  const [category,  setCategory]  = useState('all');
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const { addObject } = useProject();

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== 'all') params.type = category;
    if (search)             params.search = search;
    const t = setTimeout(() => {
      furnitureAPI.list(params)
        .then(({ data }) => setFurniture(Array.isArray(data.furniture) ? data.furniture : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(t);
  }, [category, search]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Search */}
      <div className="p-3 border-b border-gray-800 shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2
                       text-white text-xs placeholder-gray-700 focus:outline-none
                       focus:border-gray-600 transition-colors"
            placeholder="Search furniture…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto border-b border-gray-800 shrink-0
                      scrollbar-none [&::-webkit-scrollbar]:hidden">
        {CATS.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap
                        transition-all duration-150 shrink-0
                        ${category===cat
                          ? 'bg-white text-black'
                          : 'bg-gray-900 border border-gray-800 text-gray-500 hover:text-white hover:border-gray-700'
                        }`}>
            {cat.charAt(0).toUpperCase()+cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="aspect-square rounded-xl bg-gray-900 animate-pulse"/>
            ))}
          </div>
        ) : furniture.length===0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-3">
            <svg className="w-8 h-8 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <p className="text-gray-700 text-xs">No furniture found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {furniture.map(item => (
              <FurnitureCard key={item._id} item={item} onAdd={addObject}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FurnitureCard({ item, onAdd }) {
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try { await onAdd(item); }
    finally { setTimeout(() => setAdding(false), 600); }
  };

  return (
    <button onClick={handleAdd}
      className="group bg-gray-900 border border-gray-800 rounded-xl p-2.5
                 hover:border-gray-600 transition-all duration-150 text-left
                 active:scale-[0.97] relative overflow-hidden">

      {/* Adding flash */}
      {adding && (
        <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse pointer-events-none z-10"/>
      )}

      {/* Thumbnail */}
      <div className="aspect-square bg-gray-850 rounded-lg mb-2 flex items-center
                      justify-center overflow-hidden border border-gray-800
                      group-hover:border-gray-700 transition-colors">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name}
               className="w-full h-full object-cover"/>
        ) : (
          <svg className="w-8 h-8 text-gray-700" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1">
            <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
          </svg>
        )}
      </div>

      <p className="text-white text-[11px] font-medium truncate leading-tight">
        {item.name}
      </p>
      {item.price!=null && (
        <p className="text-gray-600 text-[10px] font-mono mt-0.5">${item.price}</p>
      )}

      {/* Add indicator */}
      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white
                      flex items-center justify-center opacity-0 group-hover:opacity-100
                      transition-opacity duration-150">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none"
             stroke="#000" strokeWidth="3">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
    </button>
  );
}
