import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import BookingPaymentPage from '../../src/pages/BookingPaymentPage/BookingPaymentPage.jsx'
import BookingCompletePage from '../../src/pages/BookingCompletePage/BookingCompletePage.jsx'
import HomeGuest from '../../src/pages/HomeGuest/HomeGuest.jsx'
import { renderWithRouter } from '../testUtils.jsx'

describe('机票预订 - 支付页 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    vi.useRealTimers()
  })

  it('Scenario: 进入页面默认倒计时为 15:00 并每秒更新展示', async () => {
    vi.useFakeTimers()
    renderWithRouter([{ path: '/booking/payment/:orderId', element: <BookingPaymentPage /> }], {
      initialEntries: ['/booking/payment/o1'],
    })

    expect(screen.getByText('15:00')).toBeInTheDocument()
    vi.advanceTimersByTime(1000)
    expect(screen.queryByText('14:59')).not.toBeNull()
  })

  it('Scenario: 状态异常（倒计时到期）弹窗提示并提供“返回首页”入口', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { router } = renderWithRouter(
      [
        { path: '/', element: <HomeGuest /> },
        { path: '/booking/payment/:orderId', element: <BookingPaymentPage /> },
      ],
      { initialEntries: ['/booking/payment/o1'] }
    )

    vi.advanceTimersByTime(15 * 60 * 1000)
    expect(screen.queryByText('超出时间，请重新开始订单')).not.toBeNull()
    const back = screen.queryByRole('link', { name: '返回首页' })
    if (back) {
      await user.click(back)
    }
    expect(router.state.location.pathname).toBe('/')
  })

  it('Scenario: 正常支付并进入完成页（应请求订单详情并触发支付）', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/booking/payment/:orderId', element: <BookingPaymentPage /> },
        { path: '/booking/complete', element: <BookingCompletePage /> },
      ],
      { initialEntries: ['/booking/payment/o1'] }
    )

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/orders/o1'), expect.anything())
    await user.click(screen.getByRole('link', { name: '支付' }))
    expect(router.state.location.pathname).toBe('/booking/complete')
  })
})
