import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import MainLayout from '../../src/layouts/MainLayout/MainLayout.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import Orders from '../../src/pages/Orders/Orders.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function isoDateTimeFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

describe('订单管理列表页 Scenarios', () => {
  it('Scenario: 成功加载并显示全部订单列表', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'o1',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: isoDateTimeFromNow(-2),
          departAt: isoDateTimeFromNow(10),
          totalAmount: 1000,
        },
        {
          orderId: 'o2',
          productType: 'train',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-1),
          departAt: isoDateTimeFromNow(3),
          totalAmount: 200,
        },
      ]),
    )

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
          <Route path="/user-center/orders/:orderId" element={<div>ORDER_DETAIL</div>} />
          <Route path="/booking/payment/:orderId" element={<div>PAYMENT</div>} />
        </>
      ),
    })

    expect(screen.getByText('全部订单')).toBeInTheDocument()
    expect(screen.getByText('订单号')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'o2' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/orders/o2')
    expect(screen.getByText('ORDER_DETAIL')).toBeInTheDocument()
  })

  it('Scenario: 用户没有任何订单 (状态异常)', () => {
    localStorage.setItem('evoflow_orders', JSON.stringify([]))

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true },
    })

    expect(screen.getByText('您还没有相关订单哦')).toBeInTheDocument()
  })

  it('Scenario: 用户切换订单分类标签', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'pending_travel_future',
          productType: 'flight',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-1),
          departAt: isoDateTimeFromNow(1),
          totalAmount: 100,
        },
        {
          orderId: 'pending_travel_past',
          productType: 'flight',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-1),
          departAt: isoDateTimeFromNow(-1),
          totalAmount: 100,
        },
      ]),
    )

    renderWithAuth(<Orders />, {
      route: '/user-center/orders?tab=all',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
        </>
      ),
    })

    await user.click(screen.getByRole('tab', { name: '未出行' }))

    expect(screen.getByTestId('location')).toHaveTextContent('tab=pending_travel')
    expect(screen.getByText('pending_travel_future')).toBeInTheDocument()
    expect(screen.queryByText('pending_travel_past')).toBeNull()
  })

  it('Scenario: 查看“待点评”订单', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'review_me',
          productType: 'flight',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-2),
          departAt: isoDateTimeFromNow(-1),
          totalAmount: 100,
        },
        {
          orderId: 'not_review',
          productType: 'flight',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-2),
          departAt: isoDateTimeFromNow(2),
          totalAmount: 100,
        },
      ]),
    )

    renderWithAuth(<Orders />, {
      route: '/user-center/orders?tab=pending_review',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
        </>
      ),
    })

    await user.click(screen.getByText('待点评'))
    expect(screen.getByText('review_me')).toBeInTheDocument()
    expect(screen.queryByText('not_review')).toBeNull()
  })

  it('Scenario: 用户按订单类型筛选（正常流程）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'flight_1',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: isoDateTimeFromNow(-1),
          departAt: isoDateTimeFromNow(2),
          totalAmount: 100,
        },
        {
          orderId: 'train_1',
          productType: 'train',
          status: 'pending_payment',
          createdAt: isoDateTimeFromNow(-1),
          departAt: isoDateTimeFromNow(2),
          totalAmount: 100,
        },
      ]),
    )

    renderWithAuth(<Orders />, {
      route: '/user-center/orders?productType=all',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
        </>
      ),
    })

    await user.click(screen.getByText('订单类型'))
    await user.click(screen.getByRole('option', { name: '机票' }))

    expect(screen.getByTestId('location')).toHaveTextContent('productType=flight')
    expect(screen.getByText('flight_1')).toBeInTheDocument()
    expect(screen.queryByText('train_1')).toBeNull()
  })

  it('Scenario: 切换到“待支付”标签并操作支付', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'pay_me',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: isoDateTimeFromNow(-1),
          departAt: isoDateTimeFromNow(2),
          totalAmount: 999,
        },
      ]),
    )

    renderWithAuth(<Orders />, {
      route: '/user-center/orders?tab=pending_payment',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
          <Route path="/booking/payment/:orderId" element={<div>PAYMENT_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '去支付-pay_me' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/booking/payment/pay_me')
    expect(screen.getByText('PAYMENT_PAGE')).toBeInTheDocument()
  })

  it('Scenario: 用户尝试访问一个不存在的分页 (输入异常)', () => {
    const orders = Array.from({ length: 25 }).map((_, idx) => ({
      orderId: `o_${idx + 1}`,
      productType: 'flight',
      status: 'pending_payment',
      createdAt: isoDateTimeFromNow(-1),
      departAt: isoDateTimeFromNow(2),
      totalAmount: 100,
    }))
    localStorage.setItem('evoflow_orders', JSON.stringify(orders))

    renderWithAuth(<Orders />, {
      route: '/user-center/orders?page=999',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
        </>
      ),
    })

    expect(screen.getByTestId('location').textContent).toMatch(/\/user-center\/orders(\?.*(page=1|page=3).*)?$/)
    expect(screen.getByText('订单号')).toBeInTheDocument()
  })

  it('Scenario: 待支付/未出行订单展示“取消”入口并在成功后更新展示状态', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'cancel_me',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: isoDateTimeFromNow(-1),
          departAt: isoDateTimeFromNow(2),
          totalAmount: 100,
        },
      ]),
    )

    renderWithAuth(<Orders />, {
      route: '/user-center/orders?tab=pending_payment',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: /取消/ }))

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/user-center/orders/cancel',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'cancel_me' }),
      }),
    )
    expect(screen.queryByText('cancel_me')).toBeNull()
  })

  it('Network Failure 列表页取消失败应提示并解除禁用态', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'cancel_network',
          productType: 'flight',
          status: 'pending_travel',
          createdAt: isoDateTimeFromNow(-1),
          departAt: isoDateTimeFromNow(2),
          totalAmount: 100,
        },
      ]),
    )

    renderWithAuth(<Orders />, {
      route: '/user-center/orders?tab=pending_travel',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
        </>
      ),
    })

    const cancelBtn = screen.getByRole('button', { name: /取消/ })
    await user.click(cancelBtn)
    expect(cancelBtn).not.toBeDisabled()
    expect(screen.getByText('取消失败，请稍后重试')).toBeInTheDocument()
  })

  it('Scenario: 点击“下载历史所有订单”应生成可下载内容', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:orders')
    Object.defineProperty(globalThis.URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
      writable: true,
    })

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          orderId: 'd1',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: isoDateTimeFromNow(-1),
          departAt: isoDateTimeFromNow(2),
          totalAmount: 100,
        },
      ]),
    )

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '下载历史所有订单' }))
    expect(createObjectURL).toHaveBeenCalled()
  })

  it('Scenario: 用户没有登录 (状态异常)', () => {
    renderWithAuth(<MainLayout />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: false },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/orders" element={<Orders />} />
          </Route>
          <Route path="/login" element={<Login />} />
        </>
      ),
    })

    expect(sessionStorage.getItem('postLoginRedirect')).toBe('/user-center/orders')
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('Scenario: 本地订单读取失败或解析异常 (系统异常)', async () => {
    const user = userEvent.setup()

    localStorage.setItem('evoflow_orders', '{bad json')

    renderWithAuth(<Orders />, {
      route: '/user-center/orders',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/orders" element={<Orders />} />
        </>
      ),
    })

    expect(screen.getByText('订单加载失败，请稍后重试')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '重试' }))
  })
})
