import { useEffect, useRef } from 'react';

const useAutoSave = (data, saveFn, delay = 2000) => {
  const timer = useRef(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { saveFn(data); }, delay);
    return () => clearTimeout(timer.current);
  }, [data]);
};

export default useAutoSave;
