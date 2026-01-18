import { useMemo, useState } from 'react'
import { AuthContext } from './AuthContext.jsx'

const STORAGE_KEY = 'evf_auth'

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
      isLoggedIn: true,
      username: '恒色初心',
      tier: '白银贵宾',
      points: 2114,
    },
  )

  const value = useMemo(() => {
    function logout() {
      const next = { ...auth, isLoggedIn: false }
      setAuth(next)
      writeStoredAuth(next)
    }

    function login(nextUser) {
      const next = {
        isLoggedIn: true,
        username: nextUser?.username ?? auth.username,
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

