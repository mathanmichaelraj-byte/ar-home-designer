import { useState, useEffect } from 'react';
import { furnitureAPI } from '../utils/api';

const useFurniture = (initialType = 'all') => {
  const [furniture, setFurniture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = {};
    if (type !== 'all') params.type = type;
    if (search) params.search = search;

    const timer = setTimeout(() => {
      furnitureAPI.list(params)
        .then(({ data }) => { if (!cancelled) setFurniture(data.furniture); })
        .catch((err) => { if (!cancelled) setError(err.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 300);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [type, search]);

  return { furniture, loading, error, type, setType, search, setSearch };
};

export default useFurniture;
