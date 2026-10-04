import api from './api';

export const taskService = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  completeTask: (id) => api.put(`/tasks/${id}/complete`),
  cancelTask: (id) => api.put(`/tasks/${id}/cancel`),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export default taskService;
