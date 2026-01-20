import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import OrderDetail from '../../src/pages/OrderDetail/OrderDetail.jsx'
import { renderWithRouter } from '../testUtils.jsx'

function mockJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('订单详情 - 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      null
    }
  })

  it('UI-OrderDetailPage: 打开详情页会请求订单详情接口', () => {
    renderWithRouter([{ path: '/orders/:orderId', element: <OrderDetail /> }], { initialEntries: ['/orders/o1'] })
    expect(fetch).toHaveBeenCalledWith('/api/orders/o1', { method: 'GET' })
  })

  it('UI-OrderDetailPage: 点击取消订单弹出二次确认', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/orders/:orderId', element: <OrderDetail /> }], { initialEntries: ['/orders/o1'] })

    await user.click(screen.getByRole('button', { name: '取消订单' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('确认取消订单？')).toBeInTheDocument()
  })

  it('UI-OrderDetailPage: 确认取消会调用取消订单接口', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/orders/:orderId', element: <OrderDetail /> }], { initialEntries: ['/orders/o1'] })

    await user.click(screen.getByRole('button', { name: '取消订单' }))
    await user.click(screen.getByRole('button', { name: '确认取消' }))

    expect(fetch).toHaveBeenCalledWith('/api/orders/o1/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('Scenario: 取消订单确认后刷新并展示已取消横幅', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          orderId: 'o1',
          orderNo: 'NO0001',
          createdAt: '2026-01-20T00:00:00.000Z',
          type: 'flight',
          status: 'upcoming',
          title: '上海-北京',
          departureAt: '2026-02-01T08:00:00.000Z',
          arrivalAt: '2026-02-01T10:30:00.000Z',
          travelers: [{ name: '张三', idNo: 'IDNO' }],
          segments: [],
          priceBreakdown: [],
          totalAmount: 500,
        })
      )
      .mockResolvedValueOnce(mockJsonResponse(200, { orderId: 'o1', status: 'canceled' }))
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          orderId: 'o1',
          orderNo: 'NO0001',
          createdAt: '2026-01-20T00:00:00.000Z',
          type: 'flight',
          status: 'canceled',
          title: '上海-北京',
          departureAt: '2026-02-01T08:00:00.000Z',
          arrivalAt: '2026-02-01T10:30:00.000Z',
          travelers: [{ name: '张三', idNo: 'IDNO' }],
          segments: [],
          priceBreakdown: [],
          totalAmount: 500,
        })
      )

    renderWithRouter([{ path: '/orders/:orderId', element: <OrderDetail /> }], { initialEntries: ['/orders/o1'] })

    await user.click(await screen.findByRole('button', { name: '取消订单' }))
    await user.click(screen.getByRole('button', { name: '确认取消' }))

    expect(fetch).toHaveBeenCalledWith('/api/orders/o1/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(fetch).toHaveBeenCalledWith('/api/orders/o1', { method: 'GET' })
    expect(await screen.findByText('已取消')).toBeInTheDocument()
  })

  it('Scenario: 打开详情页应展示航班号/旅客信息/价格明细字段', async () => {
    fetch.mockResolvedValueOnce(
      mockJsonResponse(200, {
        orderId: 'o1',
        orderNo: 'NO0001',
        createdAt: '2026-01-20T00:00:00.000Z',
        type: 'flight',
        status: 'upcoming',
        title: '上海-北京',
        departureAt: '2026-02-01T08:00:00.000Z',
        arrivalAt: '2026-02-01T10:30:00.000Z',
        travelers: [{ name: '张三', idNo: 'IDNO' }],
        segments: [
          {
            departStation: '上海',
            arriveStation: '北京',
            departAt: '2026-02-01T08:00:00.000Z',
            arriveAt: '2026-02-01T10:30:00.000Z',
            transportNo: 'MU0001',
            seatType: '经济舱',
          },
        ],
        priceBreakdown: [{ label: '票价', amount: 500 }],
        totalAmount: 500,
      })
    )

    renderWithRouter([{ path: '/orders/:orderId', element: <OrderDetail /> }], { initialEntries: ['/orders/o1'] })

    expect(fetch).toHaveBeenCalledWith('/api/orders/o1', { method: 'GET' })
    expect(await screen.findByText('MU0001')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('票价')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('UI-OrderDetailPage: 待支付订单可点击“去支付”跳转到支付页', async () => {
    const user = userEvent.setup()

    fetch.mockResolvedValueOnce(
      mockJsonResponse(200, {
        orderId: 'o1',
        orderNo: 'NO0001',
        createdAt: '2026-01-20T00:00:00.000Z',
        type: 'flight',
        status: 'pending_payment',
        title: '上海-北京',
        departureAt: '2026-02-01T08:00:00.000Z',
        arrivalAt: '2026-02-01T10:30:00.000Z',
        travelers: [{ name: '张三', idNo: 'IDNO' }],
        segments: [
          {
            departStation: '上海',
            arriveStation: '北京',
            departAt: '2026-02-01T08:00:00.000Z',
            arriveAt: '2026-02-01T10:30:00.000Z',
            transportNo: 'MU0001',
            seatType: '经济舱',
          },
        ],
        priceBreakdown: [{ label: '票价', amount: 500 }],
        totalAmount: 500,
      })
    )

    const { router } = renderWithRouter(
      [
        { path: '/orders/:orderId', element: <OrderDetail /> },
        { path: '/booking/payment/:orderId', element: <div>订单支付页</div> },
      ],
      { initialEntries: ['/orders/o1'] }
    )

    await user.click(await screen.findByRole('button', { name: '去支付' }))

    expect(router.state.location.pathname).toBe('/booking/payment/o1')
    expect(await screen.findByText('订单支付页')).toBeInTheDocument()
  })
})
