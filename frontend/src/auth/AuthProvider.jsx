import { useMemo, useState } from 'react'
import { AuthContext } from './AuthContext.jsx'

const STORAGE_KEY = 'evoflow_auth'

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredAuth(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    void 0
  }
}

export default function AuthProvider({ children }) {
  const stored = typeof window !== 'undefined' ? readStoredAuth() : null
  const [auth, setAuth] = useState(
    stored ?? {
      isLoggedIn: false,
      loginAt: null,
      userDisplayName: null,
      phoneNumber: null,
      token: null,
      tier: '白银贵宾',
      points: 0,
    },
  )

  const value = useMemo(() => {
    function logout() {
      const next = {
        isLoggedIn: false,
        loginAt: null,
        userDisplayName: null,
        phoneNumber: null,
        token: null,
        tier: auth.tier,
        points: auth.points,
      }
      setAuth(next)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        void 0
      }
    }

    function login(nextUser) {
      const next = {
        isLoggedIn: true,
        loginAt: nextUser?.loginAt ?? new Date().toISOString(),
        userDisplayName: nextUser?.userDisplayName ?? auth.userDisplayName,
        phoneNumber: nextUser?.phoneNumber ?? auth.phoneNumber,
        token: nextUser?.token ?? auth.token,
        tier: nextUser?.tier ?? auth.tier,
        points: nextUser?.points ?? auth.points,
      }
      setAuth(next)
      writeStoredAuth(next)
    }

    return { auth, setAuth, login, logout }
  }, [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
