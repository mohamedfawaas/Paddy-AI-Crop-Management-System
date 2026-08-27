import api from './api'
export const getAdminStats   = () => api.get('/admin/stats').then(r => r.data)
export const getAdminUsers   = () => api.get('/admin/users').then(r => r.data)
export const getAdminPredictions = () => api.get('/admin/predictions').then(r => r.data)
export const changeUserRole  = (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(r => r.data)
export const deleteUser      = (id) => api.delete(`/admin/users/${id}`).then(r => r.data)
