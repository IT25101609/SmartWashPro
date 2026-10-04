import api from './api';

export const dashboardService = {
  getCustomerStats: () => api.get('/dashboard/customer'),
  getManagerStats: () => api.get('/dashboard/manager'),
  getStaffStats: () => api.get('/dashboard/staff'),
  getFinanceStats: () => api.get('/dashboard/finance'),
};
