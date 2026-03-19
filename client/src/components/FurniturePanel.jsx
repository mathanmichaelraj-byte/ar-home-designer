import React, { useState, useEffect } from 'react';
import { furnitureAPI } from '../utils/api';
import { useProject } from '../context/ProjectContext';

const CATEGORIES = ['all','sofa','chair','table','bed','shelf','desk','lamp','cabinet','plant'];

const FurniturePanel = () => {
  const [furniture, setFurniture] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addObject } = useProject();

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== 'all') params.type = category;
    if (search) params.search = search;
    const t = setTimeout(() => {
      furnitureAPI.list(params)
        .then(({ data }) => setFurniture(Array.isArray(data.furniture) ? data.furniture : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [category, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-line">
        <input className="input text-sm" placeholder="Search furniture…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-1 p-3 overflow-x-auto border-b border-line">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === cat ? 'bg-brand-500 text-white' : 'bg-surface text-gray-400 hover:text-white'}`}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : furniture.length === 0 ? (
          <p className="text-gray-500 text-sm text-center pt-8">No furniture found</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {furniture.map((item) => (
              <button key={item._id} onClick={() => addObject(item)}
                className="card hover:border-brand-500 cursor-pointer text-left group">
                <div className="aspect-square bg-surface rounded-lg mb-2 flex items-center justify-center">
                  {item.thumbnailUrl
                    ? <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    : <span className="text-3xl">🪑</span>}
                </div>
                <p className="text-xs font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-500">${item.price}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default FurniturePanel;
