import api from './api'

// Single unified call — all types in one response
export const getAllHistory = async () => {
  try {
    const res = await api.get('/predictions/history')
    return Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('History fetch error:', err?.response?.status, err?.message)
    return []
  }
}

// Feature 1: Recent activity feed WITH images/heatmaps, for the Dashboard panel
export const getRecentPredictions = async (limit = 5) => {
  try {
    const res = await api.get(`/predictions/recent?limit=${limit}`)
    return Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('Recent predictions fetch error:', err?.response?.status, err?.message)
    return []
  }
}

// Feature 2: Farmer confirms whether a prediction was accurate or not
export const submitPredictionFeedback = async (id, feedback) => {
  const res = await api.put(`/predictions/${id}/feedback`, { feedback })
  return res.data
}
