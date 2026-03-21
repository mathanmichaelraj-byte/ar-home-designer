import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ar-home-designer.onrender.com/api',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

export const projectsAPI = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  share: (id) => api.post(`/projects/${id}/share`),
  getShared: (token) => api.get(`/projects/shared/${token}`),
  suggest: (id, style) => api.get(`/projects/${id}/suggest`, { params: { style } }),
};

export const furnitureAPI = {
  list: (params) => api.get('/furniture', { params }),
  get: (id) => api.get(`/furniture/${id}`),
};

export const housesAPI = {
  list: () => api.get('/houses'),
  get: (id) => api.get(`/houses/${id}`),
  create: (data) => api.post('/houses', data),
  update: (id, data) => api.put(`/houses/${id}`, data),
  delete: (id) => api.delete(`/houses/${id}`),
  share: (id) => api.post(`/houses/${id}/share`),
  addRoom: (id, data) => api.post(`/houses/${id}/rooms`, data),
  updateRoom: (id, roomId, data) => api.put(`/houses/${id}/rooms/${roomId}`, data),
  deleteRoom: (id, roomId) => api.delete(`/houses/${id}/rooms/${roomId}`),
};

export default api;
