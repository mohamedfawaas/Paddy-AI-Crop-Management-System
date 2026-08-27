import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getProfile, saveProfile } from '../services/profileService'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem('paddy_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem('paddy_user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // SECURITY/PRIVACY MIGRATION:
    // Older builds stored every account's profile/photo under the same
    // `paddy_profile` key. That made the last uploaded photo appear for the next
    // user who signed in on the same browser. The value has no owner metadata,
    // so it cannot be migrated safely. Remove it once and use the authenticated
    // backend profile endpoint from now on.
    localStorage.removeItem('paddy_profile')

    const t = localStorage.getItem('paddy_token')
    const u = readStoredUser()
    if (t && u) {
      setToken(t)
      setUser(u)
    } else if (t || u) {
      localStorage.removeItem('paddy_token')
      localStorage.removeItem('paddy_user')
    }
    setLoading(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem('paddy_token')) {
      setProfile(null)
      return null
    }
    setProfileLoading(true)
    try {
      const data = await getProfile()
      setProfile(data)
      return data
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token || !user?.email) {
      setProfile(null)
      return
    }

    let active = true
    setProfileLoading(true)
    getProfile()
      .then(data => { if (active) setProfile(data) })
      .catch(() => { if (active) setProfile(null) })
      .finally(() => { if (active) setProfileLoading(false) })

    return () => { active = false }
  }, [token, user?.email])

  const login = d => {
    const nextUser = { name:d.name, email:d.email, role:d.role }

    // Prevent a one-frame flash of the previous account's avatar while the new
    // account profile is being loaded.
    setProfile(null)
    setToken(d.token)
    setUser(nextUser)
    localStorage.setItem('paddy_token', d.token)
    localStorage.setItem('paddy_user', JSON.stringify(nextUser))
    localStorage.removeItem('paddy_profile')
  }

  const updateProfile = async data => {
    const updated = await saveProfile(data)
    setProfile(updated)
    return updated
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setProfile(null)
    setProfileLoading(false)
    localStorage.removeItem('paddy_token')
    localStorage.removeItem('paddy_user')
    localStorage.removeItem('paddy_profile')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      profile,
      profileLoading,
      login,
      logout,
      updateProfile,
      refreshProfile,
      loading,
      isAuth:!!token,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
