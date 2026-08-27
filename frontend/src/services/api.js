import axios from 'axios'
import toast from 'react-hot-toast'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type':'application/json' },
  timeout: 30000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('paddy_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('paddy_token')
    localStorage.removeItem('paddy_user')
    if (window.location.pathname !== '/login') {
      sessionStorage.setItem('paddy_session_notice', 'expired')
      window.location.assign('/login')
    }
  }
  if (!err.response && err.code === 'ECONNABORTED') toast.error('The request timed out. Please try again.')
  else if (!err.response && err.message === 'Network Error') toast.error('Cannot reach the server. Check that the backend is running.')
  return Promise.reject(err)
})

export default api
