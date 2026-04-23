import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { housesAPI } from '../utils/api';

const HouseContext = createContext(null);

export const HouseProvider = ({ children }) => {
  const [houses,       setHouses]       = useState([]);
  const [currentHouse, setCurrentHouse] = useState(null);
  const [saving,       setSaving]       = useState(false);

  /* Keep a ref so callbacks always see fresh currentHouse */
  const currentHouseRef = useRef(null);
  const setHouseSync = (h) => {
    currentHouseRef.current = h;
    setCurrentHouse(h);
  };

  /* ── Load ────────────────────────────────────────────────────── */
  const loadHouses = useCallback(async () => {
    try {
      const { data } = await housesAPI.list();
      const list = Array.isArray(data.houses) ? data.houses : [];
      setHouses(list);
      return list;
    } catch {
      setHouses([]);
      return [];
    }
  }, []);

  const loadHouse = useCallback(async (id) => {
    const { data } = await housesAPI.get(id);
    setHouseSync(data.house);
    return data.house;
  }, []);

  /* ── Create / Delete ─────────────────────────────────────────── */
  const createHouse = async (houseData) => {
    const { data } = await housesAPI.create(houseData);
    setHouses((prev) => [data.house, ...prev]);
    setHouseSync(data.house);
    return data.house;
  };

  const deleteHouse = async (id) => {
    await housesAPI.delete(id);
    setHouses((prev) => prev.filter((h) => h._id !== id));
    if (currentHouseRef.current?._id === id) setHouseSync(null);
  };

  /* ── Save entire house (name / top-level fields) ─────────────── */
  const saveHouse = useCallback(async (updates) => {
    const house = currentHouseRef.current;
    if (!house?._id) return;
    setSaving(true);
    try {
      const { data } = await housesAPI.update(house._id, { ...house, ...updates });
      setHouseSync(data.house);
    } finally {
      setSaving(false);
    }
  }, []);

  /* ── Room CRUD ────────────────────────────────────────────────── */
  const addRoom = useCallback(async (roomData) => {
    const house = currentHouseRef.current;
    const { data } = await housesAPI.addRoom(house._id, roomData);
    setHouseSync(data.house);
    return data.house;
  }, []);

  const updateRoom = useCallback(async (roomId, updates) => {
    const house = currentHouseRef.current;
    if (!house?._id) return;

    /* Optimistic update — apply locally first so the UI never lags */
    const optimistic = {
      ...house,
      rooms: house.rooms.map((r) =>
        r._id === roomId ? { ...r, ...updates } : r
      ),
    };
    setHouseSync(optimistic);

    /* Persist to server */
    try {
      const { data } = await housesAPI.updateRoom(house._id, roomId, updates);
      setHouseSync(data.house);
    } catch (err) {
      /* Roll back on failure */
      setHouseSync(house);
      console.error('updateRoom failed:', err.response?.data || err.message);
    }
  }, []);

  const deleteRoom = useCallback(async (roomId) => {
    const house = currentHouseRef.current;
    const { data } = await housesAPI.deleteRoom(house._id, roomId);
    setHouseSync(data.house);
  }, []);

  return (
    <HouseContext.Provider value={{
      houses, currentHouse, setCurrentHouse: setHouseSync, saving,
      loadHouses, loadHouse, createHouse, saveHouse, deleteHouse,
      addRoom, updateRoom, deleteRoom,
    }}>
      {children}
    </HouseContext.Provider>
  );
};

export const useHouse = () => {
  const ctx = useContext(HouseContext);
  if (!ctx) throw new Error('useHouse must be used within HouseProvider');
  return ctx;
};
