import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AuthProvider from '../../src/auth/AuthProvider.jsx'
import MainLayout from '../../src/layouts/MainLayout/MainLayout.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import Orders from '../../src/pages/Orders/Orders.jsx'
import OrderDetail from '../../src/pages/OrderDetail/OrderDetail.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

function AppShell() {
  return (
    <>
      <Outlet />
      <LocationProbe />
    </>
  )
}

function buildOrder({
  orderId,
  productType,
  status,
  createdAt,
  departAt,
  totalAmount,
  route,
  passenger,
  contact,
  priceItems,
}) {
  return {
    orderId,
    productType,
    status,
    createdAt,
    departAt,
    totalAmount,
    details: {
      route,
      passenger,
      contact,
      priceItems,
    },
  }
}

function parseUrl(url) {
  return new URL(String(url), 'http://test.local')
}

function expectOrdersRequest(fetchSpy, { tab, productType, page }) {
  const calls = fetchSpy.mock.calls
  expect(calls.length).toBeGreaterThan(0)
  const [url] = calls[calls.length - 1]
  const u = parseUrl(url)
  expect(u.pathname).toBe('/api/orders')
  expect(u.searchParams.get('tab')).toBe(tab)
  expect(u.searchParams.get('productType')).toBe(productType)
  expect(u.searchParams.get('page')).toBe(String(page))
  const pageSizeRaw = u.searchParams.get('pageSize')
  expect(pageSizeRaw).toBeTruthy()
  const pageSize = Number(pageSizeRaw)
  expect(Number.isFinite(pageSize)).toBe(true)
  expect(pageSize).toBeGreaterThan(0)
}

describe('Orders Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('Scenario: 成功加载并显示全部订单列表', async () => {
    const now = Date.now()
    const orderA = buildOrder({
      orderId: 'O-100',
      productType: 'flight',
      status: 'pending_payment',
      createdAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      departAt: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 798,
      route: { fromCity: '上海', toCity: '北京' },
      passenger: { name: '张三', idType: '身份证', idNumberMasked: '3101**********12' },
      contact: { phoneNumber: '138****3769' },
      priceItems: [{ name: '成人票价', unitPrice: 798, quantity: 1 }],
    })
    const orderB = buildOrder({
      orderId: 'O-200',
      productType: 'flight',
      status: 'pending_travel',
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
      departAt: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 899,
      route: { fromCity: '广州', toCity: '成都' },
      passenger: { name: '李四', idType: '身份证', idNumberMasked: '4401**********34' },
      contact: { phoneNumber: '138****3769' },
      priceItems: [{ name: '成人票价', unitPrice: 899, quantity: 1 }],
    })

    localStorage.setItem('evoflow_orders', JSON.stringify([orderA, orderB]))
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ orders: [orderA, orderB] }) })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, userDisplayName: '测试用户', phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
            <Route path="user-center/orders/:orderId" element={<OrderDetail />} />
          </Route>
          <Route path="/login" element={<div>登录页</div>} />
        </>
      ),
    })

    expectOrdersRequest(fetchSpy, { tab: 'all', productType: 'all', page: 1 })
    expect(await screen.findByRole('tab', { name: '全部订单' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('O-200')).toBeInTheDocument()
    expect(screen.getByText('O-100')).toBeInTheDocument()
  })

  it('Scenario: 订单条目信息完整展示', async () => {
    const now = Date.now()
    const order = buildOrder({
      orderId: 'O-300',
      productType: 'flight',
      status: 'pending_payment',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      departAt: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 666,
      route: { fromCity: '上海', toCity: '深圳' },
      passenger: { name: '王五', idType: '身份证', idNumberMasked: '3101**********99' },
      contact: { phoneNumber: '138****3769' },
      priceItems: [{ name: '成人票价', unitPrice: 666, quantity: 1 }],
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ orders: [order] }) })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, userDisplayName: '测试用户', phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
            <Route path="buy-ticket/step3" element={<div>支付页</div>} />
          </Route>
        </>
      ),
    })

    expect(await screen.findByText('O-300')).toBeInTheDocument()
    expect(screen.getByText('上海→深圳')).toBeInTheDocument()
    expect(screen.getByText('出发日期')).toBeInTheDocument()
    expect(screen.getByText('王五')).toBeInTheDocument()
    expect(screen.getByText('¥666')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '去支付' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消订单' })).toBeInTheDocument()
  })

  it('Scenario: 用户切换订单分类标签（未出行）', async () => {
    const user = userEvent.setup()
    const now = Date.now()
    const order = buildOrder({
      orderId: 'O-401',
      productType: 'flight',
      status: 'pending_travel',
      createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      departAt: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 520,
      route: { fromCity: '杭州', toCity: '北京' },
      passenger: { name: '张三', idType: '身份证', idNumberMasked: '3301**********12' },
      contact: { phoneNumber: '138****3769' },
      priceItems: [{ name: '成人票价', unitPrice: 520, quantity: 1 }],
    })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ orders: [order] }) })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
        </>
      ),
    })

    await user.click(await screen.findByRole('tab', { name: '未出行' }))
    expectOrdersRequest(fetchSpy, { tab: 'pending_travel', productType: 'all', page: 1 })
    expect(await screen.findByText('O-401')).toBeInTheDocument()
  })

  it('Scenario: 查看“待点评”订单', async () => {
    const user = userEvent.setup()
    const now = Date.now()
    const order = buildOrder({
      orderId: 'O-402',
      productType: 'flight',
      status: 'pending_travel',
      createdAt: new Date(now - 50 * 60 * 1000).toISOString(),
      departAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 188,
      route: { fromCity: '南京', toCity: '重庆' },
      passenger: { name: '赵六', idType: '身份证', idNumberMasked: '3201**********00' },
      contact: { phoneNumber: '138****3769' },
      priceItems: [{ name: '成人票价', unitPrice: 188, quantity: 1 }],
    })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ orders: [order] }) })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
        </>
      ),
    })

    await user.click(await screen.findByRole('tab', { name: '待点评' }))
    expectOrdersRequest(fetchSpy, { tab: 'pending_review', productType: 'all', page: 1 })
    expect(await screen.findByText('O-402')).toBeInTheDocument()
  })

  it('Scenario: 用户按订单类型筛选（机票）', async () => {
    const user = userEvent.setup()
    const order = buildOrder({
      orderId: 'O-501',
      productType: 'flight',
      status: 'pending_payment',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      departAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 999,
      route: { fromCity: '上海', toCity: '厦门' },
      passenger: { name: '张三', idType: '身份证', idNumberMasked: '3101**********12' },
      contact: { phoneNumber: '138****3769' },
      priceItems: [{ name: '成人票价', unitPrice: 999, quantity: 1 }],
    })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ orders: [order] }) })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
        </>
      ),
    })

    await user.selectOptions(await screen.findByLabelText('订单类型'), 'flight')
    expectOrdersRequest(fetchSpy, { tab: 'all', productType: 'flight', page: 1 })
    expect(await screen.findByText('O-501')).toBeInTheDocument()
  })

  it('Scenario: 切换到“待支付”标签并操作支付', async () => {
    const user = userEvent.setup()
    const now = Date.now()
    const order = buildOrder({
      orderId: 'O-601',
      productType: 'flight',
      status: 'pending_payment',
      createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
      departAt: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 345,
      route: { fromCity: '上海', toCity: '北京' },
      passenger: { name: '张三', idType: '身份证', idNumberMasked: '3101**********12' },
      contact: { phoneNumber: '138****3769' },
      priceItems: [{ name: '成人票价', unitPrice: 345, quantity: 1 }],
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ orders: [order] }) })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
            <Route path="buy-ticket/step3" element={<div>支付页</div>} />
          </Route>
        </>
      ),
    })

    await user.click(await screen.findByRole('tab', { name: '待支付' }))
    await user.click(await screen.findByRole('button', { name: '去支付' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step3?orderId=O-601')
    expect(screen.getByText('支付页')).toBeInTheDocument()
  })

  it('Scenario: 用户没有任何订单 (状态异常)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => ({ orders: [] }) })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
        </>
      ),
    })

    expect(await screen.findByText('您还没有相关订单哦')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /O-\d+/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('分页')).not.toBeInTheDocument()
  })

  it('Scenario: 本地订单读取失败或解析异常 (系统异常)', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({ error: 'Orders parse failed.' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ orders: [] }) })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
        </>
      ),
    })

    expect(await screen.findByText('订单加载失败，请稍后重试')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('Scenario: 用户没有登录 (状态异常) - 登录成功后回跳订单管理列表页', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (url === '/api/auth/login/password') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            token: 't1',
            userId: 'u1',
            userDisplayName: '测试用户',
            phoneNumber: '13812343769',
            loginAt: new Date().toISOString(),
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({ orders: [] }) }
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/user-center/orders']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<MainLayout />}>
                <Route path="user-center/orders" element={<Orders />} />
                <Route path="user-center/orders/:orderId" element={<OrderDetail />} />
              </Route>
              <Route path="/login" element={<Login />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(await screen.findByRole('button', { name: '登 录' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('账号'), '13812343769')
    await user.type(screen.getByLabelText('密码'), 'abc123')
    await user.click(screen.getByLabelText('已阅读并同意服务协议'))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/user-center/orders')
    })
  })

  it('Scenario: 用户点击顶部导航栏“我的订单”入口应跳转订单列表页', async () => {
    const user = userEvent.setup()

    renderWithAuth(<div />, {
      route: '/',
      auth: { isLoggedIn: true, userDisplayName: '测试用户', phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>首页</div>} />
            <Route path="user-center/orders" element={<Orders />} />
            <Route path="orders" element={<div>旧订单页</div>} />
          </Route>
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '我的订单' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/orders')
  })

  it('Scenario: 用户尝试访问一个不存在的分页 (输入异常)', async () => {
    const now = Date.now()
    const orders = Array.from({ length: 21 }).map((_, i) =>
      buildOrder({
        orderId: `O-${String(100 + i)}`,
        productType: 'flight',
        status: 'pending_travel',
        createdAt: new Date(now - i * 60_000).toISOString(),
        departAt: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
        totalAmount: 100 + i,
        route: { fromCity: '上海', toCity: '北京' },
        passenger: { name: '张三', idType: '身份证', idNumberMasked: '3101**********12' },
        contact: { phoneNumber: '138****3769' },
        priceItems: [{ name: '成人票价', unitPrice: 100 + i, quantity: 1 }],
      }),
    )

    localStorage.setItem('evoflow_orders', JSON.stringify(orders))
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ orders: orders.slice(0, 10) }) })

    renderWithAuth(<div />, {
      route: '/user-center/orders?tab=all&productType=all&page=4',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
        </>
      ),
    })

    expect(fetchSpy).toHaveBeenCalled()
    expect(await screen.findByTestId('location')).toHaveTextContent('/user-center/orders?tab=all&productType=all&page=3')
  })

  it('Scenario: 下载历史所有订单 (正常流程)', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ filename: 'orders.txt', content: 'x' }),
    })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
        </>
      ),
    })

    await user.click(await screen.findByRole('button', { name: '下载历史所有订单' }))
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/orders/export/txt',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ orderIds: [] }),
      }),
    )
  })

  it('Scenario: 取消订单网络异常时提示错误并解除禁用态 (Network Failure)', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const now = Date.now()
    const order = buildOrder({
      orderId: 'O-999',
      productType: 'flight',
      status: 'pending_travel',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      departAt: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 321,
      route: { fromCity: '上海', toCity: '北京' },
      passenger: { name: '张三', idType: '身份证', idNumberMasked: '3101**********12' },
      contact: { phoneNumber: '138****3769' },
      priceItems: [{ name: '成人票价', unitPrice: 321, quantity: 1 }],
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (String(url).startsWith('/api/orders?')) {
        return { ok: true, status: 200, json: async () => ({ orders: [order] }) }
      }
      if (String(url) === '/api/orders/O-999/status') {
        void init
        return Promise.reject(new Error('network'))
      }
      return { ok: true, status: 200, json: async () => ({}) }
    })

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
        </>
      ),
    })

    const cancelBtn = await screen.findByRole('button', { name: '取消订单' })
    await user.click(cancelBtn)
    expect(confirmSpy).toHaveBeenCalled()
    expect(await screen.findByText('取消失败')).toBeInTheDocument()
    expect(cancelBtn).not.toBeDisabled()
  })

  it('Scenario: 加载超过 8 秒视为失败并提示可重试', async () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}))

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
        </>
      ),
    })

    await vi.advanceTimersByTimeAsync(8001)
    expect(screen.getByText('系统繁忙，请稍后重试')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
