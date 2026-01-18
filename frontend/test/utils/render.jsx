import { render } from '@testing-library/react'
import { AuthContext } from '../../src/auth/AuthContext.jsx'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

function TestShell() {
  return (
    <>
      <Outlet />
      <LocationProbe />
    </>
  )
}

function AuthHarness({ initialAuth, login: loginOverride, logout: logoutOverride, children }) {
  const [auth, setAuth] = useState(initialAuth ?? { isLoggedIn: false })

  const login = useMemo(() => {
    if (loginOverride) return loginOverride
    return (nextAuth) => {
      setAuth(nextAuth)
    }
  }, [loginOverride])

  const logout = useMemo(() => {
    if (logoutOverride) return logoutOverride
    return () => {
      try {
        localStorage.removeItem('evoflow_auth')
      } catch {
        void 0
      }
      setAuth({ isLoggedIn: false })
    }
  }, [logoutOverride])

  const value = useMemo(() => ({ auth, login, logout, setAuth }), [auth, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function renderWithAuth(ui, { route = '/', auth, login, logout, routes } = {}) {
  return render(
    <AuthHarness initialAuth={auth} login={login} logout={logout}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          {routes ? (
            <Route element={<TestShell />}>{routes}</Route>
          ) : (
            <Route element={<TestShell />}>
              <Route path="*" element={ui} />
            </Route>
          )}
        </Routes>
      </MemoryRouter>
    </AuthHarness>,
  )
}
