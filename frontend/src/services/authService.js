import axios from 'axios'
import { API_BASE_URL } from './api'

const base = axios.create({ baseURL:`${API_BASE_URL}/auth`, timeout:30000 })
export const registerUser = async data => (await base.post('/register', data)).data
export const loginUser = async data => (await base.post('/login', data)).data
export const forgotPassword = async email => (await base.post('/forgot-password', { email })).data
export const resetPassword = async (token, newPassword) => (await base.post('/reset-password', { token, newPassword })).data
