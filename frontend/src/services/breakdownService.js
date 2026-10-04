import api from '../api/axios';

export const breakdownService = {
  getBreakdowns: (params) => api.get('/breakdowns', { params }),
  getById: (id) => api.get(`/breakdowns/${id}`),
  getActive: (branchId) => api.get('/breakdowns/active', { params: { branchId } }),
  getResolved: (branchId) => api.get('/breakdowns/resolved', { params: { branchId } }),
  getByEquipment: (equipmentId) => api.get(`/breakdowns/equipment/${equipmentId}`),
  create: (data) => api.post('/breakdowns', data),
  update: (id, data) => api.put(`/breakdowns/${id}`, data),
  updateStatus: (id, data) => api.put(`/breakdowns/${id}/status`, data),
  close: (id, data) => api.put(`/breakdowns/${id}/close`, data),
  delete: (id) => api.delete(`/breakdowns/${id}`),
};

export default breakdownService;
