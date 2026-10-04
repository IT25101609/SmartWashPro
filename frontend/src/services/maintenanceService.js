import api from '../api/axios';

export const maintenanceService = {
  getMaintenance: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  getUpcoming: (branchId) => api.get('/maintenance/upcoming', { params: { branchId } }),
  getHistory: (branchId) => api.get('/maintenance/history', { params: { branchId } }),
  getByEquipment: (equipmentId) => api.get(`/maintenance/equipment/${equipmentId}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  updateStatus: (id, data) => api.put(`/maintenance/${id}/status`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

export default maintenanceService;
