import api from '../api/axios';

export const reportService = {
  getMeta: () => api.get('/reports/meta'),

  getReportData: (params) => api.get('/reports/data', { params }),

  exportReportCsv: (params) => {
    return api.get('/reports/export', {
      params,
      responseType: 'blob'
    });
  }
};

export default reportService;
