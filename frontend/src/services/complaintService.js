import api from '../api/axios';

const complaintService = {
  getComplaints: async (params = {}) => {
    const res = await api.get('/complaints', { params });
    return res.data;
  },

  getMyComplaints: async (params = {}) => {
    const res = await api.get('/complaints/my', { params });
    return res.data;
  },

  getComplaintById: async (id) => {
    const res = await api.get(`/complaints/${id}`);
    return res.data;
  },

  getComplaintStats: async () => {
    const res = await api.get('/complaints/stats');
    return res.data;
  },

  createComplaint: async (data) => {
    const res = await api.post('/complaints', data);
    return res.data;
  },

  updateComplaint: async (id, data) => {
    const res = await api.put(`/complaints/${id}`, data);
    return res.data;
  },

  assignEmployee: async (id, employeeId) => {
    const res = await api.put(`/complaints/${id}/assign?employeeId=${employeeId}`);
    return res.data;
  },

  updateStatus: async (id, status, remarks = '') => {
    let url = `/complaints/${id}/status?status=${status}`;
    if (remarks) {
      url += `&remarks=${encodeURIComponent(remarks)}`;
    }
    const res = await api.put(url);
    return res.data;
  },

  resolveComplaint: async (id, resolution) => {
    const res = await api.put(`/complaints/${id}/resolve`, { resolution });
    return res.data;
  },

  closeComplaint: async (id, remarks = '') => {
    let url = `/complaints/${id}/close`;
    if (remarks) {
      url += `?remarks=${encodeURIComponent(remarks)}`;
    }
    const res = await api.put(url);
    return res.data;
  },

  deleteComplaint: async (id) => {
    const res = await api.delete(`/complaints/${id}`);
    return res.data;
  }
};

export default complaintService;
