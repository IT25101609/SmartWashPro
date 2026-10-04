import api from './api';

export const orderService = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, status, remarks) => api.put(`/orders/${id}/status`, { status, remarks }),
  getMyOrders: (params) => api.get('/orders/my', { params }),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
};
