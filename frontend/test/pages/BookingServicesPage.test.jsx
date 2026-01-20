import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import BookingServicesPage from '../../src/pages/BookingServicesPage/BookingServicesPage.jsx'
import BookingPaymentPage from '../../src/pages/BookingPaymentPage/BookingPaymentPage.jsx'
import { renderWithRouter } from '../testUtils.jsx'

describe('机票预订 - 增值服务页 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      null
    }
  })

  it('Scenario: 正常选择服务进入支付（创建订单写入共享订单存储）', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/booking/services', element: <BookingServicesPage /> },
        { path: '/booking/payment/:orderId', element: <BookingPaymentPage /> },
      ],
      { initialEntries: ['/booking/services'] }
    )

    await user.click(screen.getByLabelText('行李额升级'))
    await user.click(screen.getByRole('link', { name: '下一步' }))

    expect(fetch).toHaveBeenCalledWith('/api/orders', expect.anything())
    const raw = localStorage.getItem('evoflow_orders')
    expect(raw).toBeTruthy()
    expect(router.state.location.pathname).toContain('/booking/payment/')
  })

  it('Scenario: 系统异常（服务列表加载失败）仍允许继续至支付', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/booking/services', element: <BookingServicesPage /> },
        { path: '/booking/payment/:orderId', element: <BookingPaymentPage /> },
      ],
      { initialEntries: ['/booking/services'] }
    )

    expect(screen.queryByText('加载失败')).not.toBeNull()
    await user.click(screen.getByRole('link', { name: '下一步' }))
    expect(router.state.location.pathname).toContain('/booking/payment/')
  })

  it('Scenario: 已登录创建订单会携带 Authorization', async () => {
    const user = userEvent.setup()
    localStorage.setItem('auth_token', 't_123')

    renderWithRouter(
      [
        { path: '/booking/services', element: <BookingServicesPage /> },
        { path: '/booking/payment/:orderId', element: <BookingPaymentPage /> },
      ],
      { initialEntries: ['/booking/services'] }
    )

    await user.click(screen.getByRole('link', { name: '下一步' }))

    expect(fetch).toHaveBeenCalledWith(
      '/api/orders',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer t_123' }) })
    )
  })
})
