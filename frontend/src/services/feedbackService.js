import api from '../api/axios';

const feedbackService = {
  getFeedback: async (params = {}) => {
    const res = await api.get('/feedback', { params });
    return res.data;
  },

  getMyFeedback: async (params = {}) => {
    const res = await api.get('/feedback/my', { params });
    return res.data;
  },

  getFeedbackById: async (id) => {
    const res = await api.get(`/feedback/${id}`);
    return res.data;
  },

  getFeedbackStats: async () => {
    const res = await api.get('/feedback/stats');
    return res.data;
  },

  getEligibleOrders: async (params = {}) => {
    const res = await api.get('/feedback/eligible-orders', { params });
    return res.data;
  },

  submitFeedback: async (data) => {
    const res = await api.post('/feedback', data);
    return res.data;
  },

  updateFeedback: async (id, data) => {
    const res = await api.put(`/feedback/${id}`, data);
    return res.data;
  },

  deleteFeedback: async (id) => {
    const res = await api.delete(`/feedback/${id}`);
    return res.data;
  }
};

export default feedbackService;
