import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import HomeGuest from '../../src/pages/HomeGuest/HomeGuest.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import FlightSearchResults from '../../src/pages/FlightSearchResults/FlightSearchResults.jsx'
import { renderWithRouter } from '../testUtils.jsx'

describe('机票预订 - 首页搜索入口 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      null
    }
  })

  it('Scenario: 点击搜索框中的搜索跳转到搜索结果页（已登录）', async () => {
    const user = userEvent.setup()
    try {
      localStorage.setItem('auth_token', 'token')
    } catch {
      null
    }

    const { router } = renderWithRouter(
      [
        { path: '/', element: <HomeGuest headerVariant="authed" /> },
        { path: '/flights/results', element: <FlightSearchResults /> },
      ],
      { initialEntries: ['/?from=%E5%8C%97%E4%BA%AC&to=%E4%B8%8A%E6%B5%B7&date=2026-02-01'] }
    )

    await user.click(screen.getByRole('link', { name: '搜索' }))
    expect(router.state.location.pathname).toBe('/flights/list')
  })

  it('Scenario: 用户未登录时点击搜索跳转至登录页，登录成功后携带条件到结果页', async () => {
    const user = userEvent.setup()

    const { router } = renderWithRouter(
      [
        { path: '/', element: <HomeGuest /> },
        { path: '/login', element: <Login mode="sms" /> },
        { path: '/flights/results', element: <FlightSearchResults /> },
      ],
      { initialEntries: ['/?from=%E5%8C%97%E4%BA%AC&to=%E4%B8%8A%E6%B5%B7&date=2026-02-01'] }
    )
    await user.click(screen.getByRole('link', { name: '搜索' }))

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toContain('from=%E5%8C%97%E4%BA%AC')
  })
})
