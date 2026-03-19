import React, { createContext, useContext, useState, useCallback } from 'react';
import { projectsAPI } from '../utils/api';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const { data } = await projectsAPI.list();
      setProjects(Array.isArray(data.projects) ? data.projects : []);
      return data.projects;
    } catch (err) {
      setProjects([]);
      return [];
    }
  }, []);

  const loadProject = useCallback(async (id) => {
    const { data } = await projectsAPI.get(id);
    setCurrentProject(data.project);
    return data.project;
  }, []);

  const createProject = async (projectData) => {
    const response = await projectsAPI.create(projectData);
    console.log('API response:', response.data); // see what server returns
    const newProject = response.data?.project;
    if (!newProject?._id) throw new Error('Project creation failed');
    setProjects((prev) => [newProject, ...(Array.isArray(prev) ? prev : [])]);
    setCurrentProject(newProject);
    return newProject;  
  };

  const saveProject = useCallback(async (updates) => {
    if (!currentProject?._id) return;
    setCurrentProject((prev) => ({ ...prev, ...updates }));
    setSaving(true);
    try {
      await projectsAPI.update(currentProject._id, {
        ...currentProject,
        ...updates,
      });
    } finally {
      setSaving(false);
    }
  }, [currentProject]);

  const addObject = (furnitureItem) => {
    const obj = {
      furnitureId: furnitureItem._id,
      name: furnitureItem.name,
      modelUrl: furnitureItem.modelUrl,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#cccccc',
    };
    setCurrentProject((prev) => ({
      ...prev,
      objects: [...(prev?.objects || []), obj],
    }));
  };

  const updateObject = (index, updates) => {
    setCurrentProject((prev) => {
      const objects = [...(prev?.objects || [])];
      objects[index] = { ...objects[index], ...updates };
      return { ...prev, objects };
    });
  };

  const removeObject = (index) => {
    setCurrentProject((prev) => ({
      ...prev,
      objects: (prev?.objects || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <ProjectContext.Provider value={{
      currentProject, setCurrentProject, projects, saving,
      loadProjects, loadProject, createProject, saveProject,
      addObject, updateObject, removeObject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};