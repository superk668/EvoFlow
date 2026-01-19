import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import MainLayout from '../../src/layouts/MainLayout/MainLayout.jsx'
import Orders from '../../src/pages/Orders/Orders.jsx'
import OrderDetail from '../../src/pages/OrderDetail/OrderDetail.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function buildOrder({ orderId, productType, status, createdAt, departAt, totalAmount, details }) {
  return {
    orderId,
    productType,
    status,
    createdAt,
    departAt,
    totalAmount,
    details,
  }
}

describe('OrderDetail Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('Scenario: 成功查看可取消订单的详情', async () => {
    const now = Date.now()
    const order = buildOrder({
      orderId: 'O-701',
      productType: 'flight',
      status: 'pending_travel',
      createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
      departAt: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 798,
      details: {
        route: { fromCity: '上海', toCity: '北京' },
        passenger: { name: '张三', idType: '身份证', idNumberMasked: '3101**********12' },
        contact: { phoneNumber: '138****3769', email: 'a@example.com' },
        priceItems: [{ name: '成人票价', unitPrice: 798, quantity: 1 }],
      },
    })

    localStorage.setItem('evoflow_orders', JSON.stringify([order]))
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ order }) })

    renderWithAuth(<div />, {
      route: '/user-center/orders/O-701',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
            <Route path="user-center/orders/:orderId" element={<OrderDetail />} />
          </Route>
        </>
      ),
    })

    expect(fetchSpy).toHaveBeenCalledWith('/api/orders/O-701', expect.any(Object))
    expect(await screen.findByText('O-701')).toBeInTheDocument()
    expect(screen.getByText('上海→北京')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('¥798')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消订单' })).toBeEnabled()
  })

  it('Scenario: 已取消详情展示与重新下单入口（状态异常）', async () => {
    const now = Date.now()
    const order = buildOrder({
      orderId: 'O-702',
      productType: 'flight',
      status: 'canceled',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      departAt: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 300,
      details: {
        route: { fromCity: '广州', toCity: '成都' },
        passenger: { name: '李四', idType: '身份证', idNumberMasked: '4401**********34' },
        contact: { phoneNumber: '138****3769' },
        priceItems: [{ name: '成人票价', unitPrice: 300, quantity: 1 }],
      },
    })

    localStorage.setItem('evoflow_orders', JSON.stringify([order]))
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ order }) })

    renderWithAuth(<div />, {
      route: '/user-center/orders/O-702',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders/:orderId" element={<OrderDetail />} />
          </Route>
        </>
      ),
    })

    expect(await screen.findByText('已取消')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '取消订单' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新下单' })).toBeInTheDocument()
  })

  it('Scenario: 详情展示字段缺失时用“—”占位且页面不崩溃', async () => {
    const order = buildOrder({
      orderId: 'O-703',
      productType: 'flight',
      status: 'pending_travel',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      departAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 100,
      details: { route: null, passenger: null, contact: null, priceItems: null },
    })

    localStorage.setItem('evoflow_orders', JSON.stringify([order]))
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ order }) })

    renderWithAuth(<div />, {
      route: '/user-center/orders/O-703',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders/:orderId" element={<OrderDetail />} />
          </Route>
        </>
      ),
    })

    expect(await screen.findByText('O-703')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('Scenario: 价格明细计算校验失败（系统异常）', async () => {
    const now = Date.now()
    const order = buildOrder({
      orderId: 'O-704',
      productType: 'flight',
      status: 'pending_travel',
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      departAt: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 500,
      details: {
        route: { fromCity: '上海', toCity: '深圳' },
        passenger: { name: '王五', idType: '身份证', idNumberMasked: '3101**********99' },
        contact: { phoneNumber: '138****3769' },
        priceItems: [{ name: '成人票价', unitPrice: 200, quantity: 1 }],
      },
    })

    localStorage.setItem('evoflow_orders', JSON.stringify([order]))
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ order }) })

    renderWithAuth(<div />, {
      route: '/user-center/orders/O-704',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders/:orderId" element={<OrderDetail />} />
          </Route>
        </>
      ),
    })

    expect(await screen.findByText('O-704')).toBeInTheDocument()
    expect(await screen.findByText('价格明细暂不可用，请稍后重试')).toBeInTheDocument()
    expect(screen.getByText('王五')).toBeInTheDocument()
  })

  it('Scenario: 用户试图访问一个不属于自己的订单 (状态异常/权限异常)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: 'Order not found.' }) })

    renderWithAuth(<div />, {
      route: '/user-center/orders/O-9999',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders/:orderId" element={<OrderDetail />} />
          </Route>
        </>
      ),
    })

    expect(await screen.findByText('订单不存在或您没有权限查看')).toBeInTheDocument()
  })

  it('Scenario: 加载详情时本地读取失败 (系统异常)', async () => {
    localStorage.setItem('evoflow_orders', '{')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 422, json: async () => ({ error: 'Order parse failed.' }) })

    renderWithAuth(<div />, {
      route: '/user-center/orders/O-800',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders/:orderId" element={<OrderDetail />} />
          </Route>
        </>
      ),
    })

    expect(await screen.findByText('订单详情加载失败，请稍后重试')).toBeInTheDocument()
  })

  it('Scenario: 用户成功取消订单', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    const now = Date.now()
    const order = buildOrder({
      orderId: 'O-705',
      productType: 'flight',
      status: 'pending_travel',
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      departAt: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 200,
      details: {
        route: { fromCity: '上海', toCity: '北京' },
        passenger: { name: '张三', idType: '身份证', idNumberMasked: '3101**********12' },
        contact: { phoneNumber: '138****3769' },
        priceItems: [{ name: '成人票价', unitPrice: 200, quantity: 1 }],
      },
    })

    localStorage.setItem('evoflow_orders', JSON.stringify([order]))
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (String(url) === '/api/orders/O-705') {
        return { ok: true, status: 200, json: async () => ({ order }) }
      }
      if (String(url) === '/api/orders/O-705/status') {
        expect(init).toEqual(
          expect.objectContaining({
            method: 'PATCH',
            headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ status: 'canceled' }),
          }),
        )
        return { ok: true, status: 204, json: async () => ({}) }
      }
      return { ok: true, status: 200, json: async () => ({}) }
    })

    renderWithAuth(<div />, {
      route: '/user-center/orders/O-705',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders/:orderId" element={<OrderDetail />} />
          </Route>
        </>
      ),
    })

    await user.click(await screen.findByRole('button', { name: '取消订单' }))
    expect(confirmSpy).toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledWith('/api/orders/O-705/status', expect.any(Object))
    expect(alertSpy).toHaveBeenCalledWith('订单取消成功')
  })
})

