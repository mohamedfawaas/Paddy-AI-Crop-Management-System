import api from './api'

export const getProfile = async () => (await api.get('/profile')).data
export const saveProfile = async (data) => (await api.put('/profile', data)).data
