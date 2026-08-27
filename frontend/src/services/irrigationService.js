import api from './api'
export const predictIrrigation = async (payload) => {
  try {
    const res = await api.post('/irrigation/predict', payload)
    return res.data
  } catch (err) {
    const msg = err.response?.data?.error || err.message || ''
    if (msg.includes('ML service') || msg.includes('port 8000') || msg.includes('Connection refused')) {
      throw Object.assign(new Error('ML_DOWN'), { isMLDown: true })
    }
    throw err
  }
}
export const getIrrigationHistory = async () => {
  try { const res = await api.get('/irrigation/history'); return res.data || [] }
  catch { return [] }
}
