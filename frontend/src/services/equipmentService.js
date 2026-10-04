import api from '../api/axios';

export const equipmentService = {
  getEquipment: (params) => api.get('/equipment', { params }),
  getEquipmentById: (id) => api.get(`/equipment/${id}`),
  createEquipment: (data) => api.post('/equipment', data),
  updateEquipment: (id, data) => api.put(`/equipment/${id}`, data),
  updateStatus: (id, status) => api.put(`/equipment/${id}/status`, { status }),
  assignBranch: (id, branchId) => api.put(`/equipment/${id}/branch`, { branchId }),
  deleteEquipment: (id) => api.delete(`/equipment/${id}`),

  // Maintenance
  getMaintenanceHistory: (id) => api.get(`/equipment/${id}/maintenance`),
  scheduleMaintenance: (id, data) => api.post(`/equipment/${id}/maintenance`, data),
  updateMaintenanceStatus: (maintenanceId, data) => api.put(`/maintenance/${maintenanceId}/status`, data),

  // Breakdown
  getBreakdownHistory: (id) => api.get(`/equipment/${id}/breakdowns`),
  reportBreakdown: (id, data) => api.post(`/equipment/${id}/breakdowns`, data),
  updateBreakdownStatus: (breakdownId, data) => api.put(`/breakdowns/${breakdownId}/status`, data),
};

export default equipmentService;
