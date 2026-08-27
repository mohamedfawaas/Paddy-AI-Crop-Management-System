import api from './api'

export const getNotifications = async () => {
  try { const res = await api.get('/notifications'); return res.data || [] }
  catch { return [] }
}
export const getUnreadCount = async () => {
  try { const res = await api.get('/notifications/unread-count'); return res.data?.count || 0 }
  catch { return 0 }
}
export const markNotificationRead = async (id) => {
  try { const res = await api.put(`/notifications/${id}/read`); return res.data }
  catch { return null }
}
export const markAllNotificationsRead = async () => {
  try { const res = await api.put('/notifications/read-all'); return res.data }
  catch { return null }
}
export const deleteNotification = async (id) => {
  try { const res = await api.delete(`/notifications/${id}`); return res.data }
  catch { return null }
}
