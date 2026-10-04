import api from './api';

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  getBranchManagers: () => api.get('/admin/branch-managers'),
  createBranchManager: (data) => api.post('/admin/branch-managers', data),
  updateBranchManager: (id, data) => api.put(`/admin/branch-managers/${id}`, data),
  deleteBranchManager: (id) => api.delete(`/admin/branch-managers/${id}`),
};

export default adminService;
