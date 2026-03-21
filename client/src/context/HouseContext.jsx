import React, { createContext, useContext, useState, useCallback } from 'react';
import { housesAPI } from '../utils/api';

const HouseContext = createContext(null);

export const HouseProvider = ({ children }) => {
  const [houses, setHouses] = useState([]);
  const [currentHouse, setCurrentHouse] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadHouses = useCallback(async () => {
    try {
      const { data } = await housesAPI.list();
      setHouses(Array.isArray(data.houses) ? data.houses : []);
      return data.houses;
    } catch {
      setHouses([]);
      return [];
    }
  }, []);

  const loadHouse = useCallback(async (id) => {
    const { data } = await housesAPI.get(id);
    setCurrentHouse(data.house);
    return data.house;
  }, []);

  const createHouse = async (houseData) => {
    const { data } = await housesAPI.create(houseData);
    setHouses((prev) => [data.house, ...prev]);
    setCurrentHouse(data.house);
    return data.house;
  };

  const saveHouse = useCallback(async (updates) => {
    if (!currentHouse?._id) return;
    setSaving(true);
    try {
      const { data } = await housesAPI.update(currentHouse._id, {
        ...currentHouse,
        ...updates,
      });
      setCurrentHouse(data.house);
    } finally {
      setSaving(false);
    }
  }, [currentHouse]);

  const deleteHouse = async (id) => {
    await housesAPI.delete(id);
    setHouses((prev) => prev.filter((h) => h._id !== id));
    if (currentHouse?._id === id) setCurrentHouse(null);
  };

  const addRoom = async (roomData) => {
    const { data } = await housesAPI.addRoom(currentHouse._id, roomData);
    setCurrentHouse(data.house);
    return data.house;
  };

  const updateRoom = async (roomId, updates) => {
    const { data } = await housesAPI.updateRoom(currentHouse._id, roomId, updates);
    setCurrentHouse(data.house);
  };

  const deleteRoom = async (roomId) => {
    const { data } = await housesAPI.deleteRoom(currentHouse._id, roomId);
    setCurrentHouse(data.house);
  };

  return (
    <HouseContext.Provider value={{
      houses, currentHouse, setCurrentHouse, saving,
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