import { render } from '@testing-library/react'
import { AuthContext } from '../../src/auth/AuthContext.jsx'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'

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

export function renderWithAuth(ui, { route = '/', auth, login, logout, routes } = {}) {
  const value = {
    auth: auth ?? { isLoggedIn: false },
    login: login ?? vi.fn(),
    logout: logout ?? vi.fn(),
    setAuth: vi.fn(),
  }

  function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            {routes ? (
              <Route element={<TestShell />}>
                {routes}
                <Route path="*" element={<div />} />
              </Route>
            ) : (
              <Route element={<TestShell />}>
                <Route path="*" element={children} />
              </Route>
            )}
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )
  }

  return render(ui, { wrapper: Wrapper })
}
