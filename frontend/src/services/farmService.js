import api from './api'

export const getFarms = async () => {
  try { const res = await api.get('/farms'); return res.data || [] }
  catch { return [] }
}
export const createFarm = async (payload) => {
  const res = await api.post('/farms', payload)
  return res.data
}
export const updateFarm = async (id, payload) => {
  const res = await api.put(`/farms/${id}`, payload)
  return res.data
}
export const deleteFarm = async (id) => {
  const res = await api.delete(`/farms/${id}`)
  return res.data
}
export const getFarmActivities = async (farmId) => {
  try { const res = await api.get(`/farms/${farmId}/activities`); return res.data || [] }
  catch { return [] }
}
export const addFarmActivity = async (farmId, payload) => {
  const res = await api.post(`/farms/${farmId}/activities`, payload)
  return res.data
}
export const deleteFarmActivity = async (farmId, activityId) => {
  const res = await api.delete(`/farms/${farmId}/activities/${activityId}`)
  return res.data
}
