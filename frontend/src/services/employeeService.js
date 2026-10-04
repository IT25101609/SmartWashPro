import api from './api';

export const employeeService = {
  getEmployees: (params) => api.get('/employees', { params }),
  getEmployee: (id) => api.get(`/employees/${id}`),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
  assignBranch: (id, branchId) => api.put(`/employees/${id}/branch`, { branchId }),
  activateEmployee: (id) => api.put(`/employees/${id}/activate`),
  deactivateEmployee: (id) => api.put(`/employees/${id}/deactivate`),
  toggleStatus: (id) => api.put(`/employees/${id}/toggle-status`),
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
  getEmployeeTasks: (id, params) => api.get(`/employees/${id}/tasks`, { params }),
  getEmployeeAttendance: (id, params) => api.get(`/employees/${id}/attendance`, { params }),
};

export default employeeService;
