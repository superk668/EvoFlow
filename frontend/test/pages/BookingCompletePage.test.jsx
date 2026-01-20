import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import BookingCompletePage from '../../src/pages/BookingCompletePage/BookingCompletePage.jsx'
import HomeGuest from '../../src/pages/HomeGuest/HomeGuest.jsx'
import { renderWithRouter } from '../testUtils.jsx'

describe('机票预订 - 完成页 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      null
    }
  })

  it('Scenario: 正常展示完成页并更新订单状态为 pending_travel', async () => {
    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'o1',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: '2026-01-20T00:00:00.000Z',
          departAt: '2026-02-01T08:00:00.000Z',
          totalAmount: 528,
        },
      ])
    )

    renderWithRouter([{ path: '/booking/complete', element: <BookingCompletePage /> }], {
      initialEntries: ['/booking/complete'],
    })

    expect(fetch).toHaveBeenCalledWith('/api/orders/o1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending_travel' }),
    })
    expect(screen.getByText('成功出票')).toBeInTheDocument()
    expect(screen.queryByText('pending_travel')).not.toBeNull()
  })

  it('Scenario: 系统异常（订单更新失败）仍展示完成态并提示错误', async () => {
    renderWithRouter([{ path: '/booking/complete', element: <BookingCompletePage /> }], {
      initialEntries: ['/booking/complete'],
    })

    expect(screen.queryByText('订单更新失败，稍后查看订单中心')).not.toBeNull()
  })

  it('Scenario: 导航返回首页', async () => {
    const { router } = renderWithRouter(
      [
        { path: '/', element: <HomeGuest /> },
        { path: '/booking/complete', element: <BookingCompletePage /> },
      ],
      { initialEntries: ['/booking/complete'] }
    )

    const link = screen.getByRole('link', { name: '返回首页' })
    expect(link).toBeInTheDocument()
    await link.click()
    expect(router.state.location.pathname).toBe('/')
  })
})
