import { screen } from '@testing-library/react'
import { Route } from 'react-router-dom'
import MainLayout from '../../src/layouts/MainLayout/MainLayout.jsx'
import Orders from '../../src/pages/Orders/Orders.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import { renderWithAuth } from '../utils/render.jsx'

describe('MainLayout Auth Redirect Scenarios', () => {
  it('Scenario 1.4.2 未登录访问受限页面应跳转/login并记录postLoginRedirect', async () => {
    renderWithAuth(<MainLayout />, {
      route: '/orders',
      auth: { isLoggedIn: false },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="orders" element={<Orders />} />
          </Route>
          <Route path="/login" element={<Login />} />
        </>
      ),
    })

    expect(sessionStorage.getItem('postLoginRedirect')).toBe('/orders')
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })
})

