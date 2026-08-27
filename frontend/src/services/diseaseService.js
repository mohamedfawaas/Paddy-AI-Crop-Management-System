import api, { API_BASE_URL } from './api'
import axios from 'axios'

export const predictDisease = async (imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  const token = localStorage.getItem('paddy_token')
  try {
    const res = await axios.post(`${API_BASE_URL}/disease/predict`, formData, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
    })
    return res.data
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Unknown error'
    if (msg.includes('ML service') || msg.includes('port 8000') || msg.includes('Connection refused')) {
      throw Object.assign(new Error('ML_DOWN'), { isMLDown: true })
    }
    throw err
  }
}

export const getDiseaseHistory = async () => {
  try {
    const res = await api.get('/disease/history')
    return res.data || []
  } catch { return [] }
}
