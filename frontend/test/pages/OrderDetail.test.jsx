import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import OrderDetail from '../../src/pages/OrderDetail/OrderDetail.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function isoDateTimeFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

describe('订单详情页 Scenarios', () => {
  it('Scenario: 成功查看可取消订单的详情', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'can_cancel',
          productType: 'flight',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-2),
          departAt: isoDateTimeFromNow(10),
          totalAmount: 800,
          travelers: [{ name: '张三', idNumberMasked: '110***********1234' }],
          contact: { phoneNumberMasked: '86-138*****3769', email: 'a@b.com' },
          priceBreakdown: [{ name: '票价', unitPrice: 800, quantity: 1 }],
        },
      ]),
    )

    renderWithAuth(<OrderDetail />, {
      route: '/user-center/orders/can_cancel',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders/:orderId" element={<OrderDetail />} />
          <Route path="/user-center/orders" element={<div>ORDERS_LIST</div>} />
        </>
      ),
    })

    expect(screen.getByText(/can_cancel/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消订单' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '返回' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/orders')
  })

  it('Scenario: 已取消详情展示与重新下单入口（状态异常）', () => {
    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'canceled_1',
          productType: 'flight',
          status: 'canceled',
          createdAt: isoDateTimeFromNow(-2),
          departAt: isoDateTimeFromNow(10),
          totalAmount: 800,
        },
      ]),
    )

    renderWithAuth(<OrderDetail />, {
      route: '/user-center/orders/canceled_1',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders/:orderId" element={<OrderDetail />} />
        </>
      ),
    })

    expect(screen.queryByRole('button', { name: '取消订单' })).toBeNull()
    expect(screen.getByRole('button', { name: '重新下单' })).toBeInTheDocument()
  })

  it('Scenario: 成功跳转并预填搜索（正常流程）', async () => {
    const user = userEvent.setup()
    const departAt = isoDateTimeFromNow(3)

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'rebook_1',
          productType: 'flight',
          status: 'canceled',
          createdAt: isoDateTimeFromNow(-2),
          departAt,
          totalAmount: 800,
          fromCity: '上海',
          toCity: '北京',
        },
      ]),
    )

    renderWithAuth(<OrderDetail />, {
      route: '/user-center/orders/rebook_1',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders/:orderId" element={<OrderDetail />} />
          <Route path="/flights/list" element={<div>SEARCH_RESULTS</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: '重新下单' }))

    const ymd = departAt.slice(0, 10)
    expect(screen.getByTestId('location')).toHaveTextContent('/flights/list')
    expect(screen.getByTestId('location')).toHaveTextContent(`date=${ymd}`)
  })

  it('Scenario: 用户试图访问一个不属于自己的订单 (状态异常/权限异常)', () => {
    localStorage.setItem('evoflow_orders', JSON.stringify([]))

    renderWithAuth(<OrderDetail />, {
      route: '/user-center/orders/not_exist',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders/:orderId" element={<OrderDetail />} />
        </>
      ),
    })

    expect(screen.getByText('订单不存在或您没有权限查看')).toBeInTheDocument()
  })

  it('Scenario: 价格明细计算校验失败（系统异常）', () => {
    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'price_mismatch',
          productType: 'flight',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-2),
          departAt: isoDateTimeFromNow(10),
          totalAmount: 1000,
          priceBreakdown: [{ name: '票价', unitPrice: 800, quantity: 1 }],
        },
      ]),
    )

    renderWithAuth(<OrderDetail />, {
      route: '/user-center/orders/price_mismatch',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders/:orderId" element={<OrderDetail />} />
        </>
      ),
    })

    expect(screen.getByText('价格明细暂不可用，请稍后重试')).toBeInTheDocument()
  })

  it('Scenario: 加载详情时本地读取失败 (系统异常)', () => {
    localStorage.setItem('evoflow_orders', '{bad json')

    renderWithAuth(<OrderDetail />, {
      route: '/user-center/orders/bad',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders/:orderId" element={<OrderDetail />} />
        </>
      ),
    })

    expect(screen.getByText('订单详情加载失败，请稍后重试')).toBeInTheDocument()
  })

  it('Scenario: 用户点击“取消”放弃操作（输入异常）', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'cancel_abort',
          productType: 'flight',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-2),
          departAt: isoDateTimeFromNow(10),
          totalAmount: 800,
        },
      ]),
    )

    renderWithAuth(<OrderDetail />, {
      route: '/user-center/orders/cancel_abort',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders/:orderId" element={<OrderDetail />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: '取消订单' }))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('Scenario: 用户成功取消订单', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'cancel_ok',
          productType: 'flight',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-2),
          departAt: isoDateTimeFromNow(10),
          totalAmount: 800,
        },
      ]),
    )

    renderWithAuth(<OrderDetail />, {
      route: '/user-center/orders/cancel_ok',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders/:orderId" element={<OrderDetail />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: '取消订单' }))
    expect(await screen.findByText('订单取消成功')).toBeInTheDocument()
  })

  it('Network Failure 取消订单失败应提示并允许重试', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'cancel_network',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: isoDateTimeFromNow(-2),
          departAt: isoDateTimeFromNow(10),
          totalAmount: 800,
        },
      ]),
    )

    renderWithAuth(<OrderDetail />, {
      route: '/user-center/orders/cancel_network',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders/:orderId" element={<OrderDetail />} />
        </>
      ),
    })

    const cancelBtn = screen.getByRole('button', { name: '取消订单' })
    await user.click(cancelBtn)

    expect(cancelBtn).not.toBeDisabled()
    expect(screen.getByText(/取消失败|系统繁忙|网络/)).toBeInTheDocument()
  })
})
