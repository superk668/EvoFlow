import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import HomeGuest from '../../src/pages/HomeGuest/HomeGuest.jsx'
import OrderManagement from '../../src/pages/OrderManagement/OrderManagement.jsx'
import PersonalCenter from '../../src/pages/PersonalCenter/PersonalCenter.jsx'
import CommonTravelerInfo from '../../src/pages/CommonTravelerInfo/CommonTravelerInfo.jsx'
import { renderWithRouter } from '../testUtils.jsx'

function mockJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('订单管理 - 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      null
    }
  })

  it('Scenario: 成功加载并显示全部订单列表（按创建时间倒序）', async () => {
    fetch.mockResolvedValueOnce(
      mockJsonResponse(200, {
        items: [
          {
            orderId: 'o2',
            orderNo: 'NO0002',
            createdAt: '2026-01-20T10:00:00.000Z',
            type: 'flight',
            status: 'pending_payment',
            title: '上海-北京',
            departureAt: '2026-02-01T08:00:00.000Z',
            arrivalAt: '2026-02-01T10:30:00.000Z',
            totalAmount: 600,
            travelers: [{ name: '张三' }],
          },
          {
            orderId: 'o1',
            orderNo: 'NO0001',
            createdAt: '2026-01-19T10:00:00.000Z',
            type: 'flight',
            status: 'canceled',
            title: '北京-上海',
            departureAt: '2026-02-02T08:00:00.000Z',
            arrivalAt: '2026-02-02T10:30:00.000Z',
            totalAmount: 500,
            travelers: [{ name: '李四' }],
          },
        ],
        page: 1,
        pageSize: 10,
        total: 2,
      })
    )

    renderWithRouter([{ path: '/orders', element: <OrderManagement /> }], { initialEntries: ['/orders'] })

    expect(fetch).toHaveBeenCalledWith('/api/orders?status=all&type=all&page=1&pageSize=10', { method: 'GET' })
    expect(await screen.findByText('上海-北京')).toBeInTheDocument()
    expect(screen.getByText('北京-上海')).toBeInTheDocument()
  })

  it('UI-OrderManagementListPage: 无订单时显示空状态提示', () => {
    renderWithRouter([{ path: '/orders', element: <OrderManagement /> }], { initialEntries: ['/orders'] })
    expect(screen.getByText('您还没有相关订单哦')).toBeInTheDocument()
  })

  it('UI-OrderManagementListPage: 点击状态标签会刷新列表数据', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/orders', element: <OrderManagement /> }], { initialEntries: ['/orders'] })

    await user.click(screen.getByRole('button', { name: '已完成' }))

    expect(fetch).toHaveBeenCalledWith('/api/orders?status=completed&type=all&page=1&pageSize=10', {
      method: 'GET',
    })
  })

  it('UI-OrderManagementListPage: 订单类型筛选会刷新列表数据', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/orders', element: <OrderManagement /> }], { initialEntries: ['/orders'] })

    await user.selectOptions(screen.getByRole('combobox'), 'flight')

    expect(fetch).toHaveBeenCalledWith('/api/orders?status=all&type=flight&page=1&pageSize=10', {
      method: 'GET',
    })
  })

  it('Scenario: 切换到“待支付”并点击“去支付”跳转到支付页面', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce(mockJsonResponse(200, { items: [], page: 1, pageSize: 10, total: 0 }))
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          items: [
            {
              orderId: 'o1',
              orderNo: 'NO0001',
              createdAt: '2026-01-20T10:00:00.000Z',
              type: 'flight',
              status: 'pending_payment',
              title: '上海-北京',
              departureAt: '2026-02-01T08:00:00.000Z',
              arrivalAt: '2026-02-01T10:30:00.000Z',
              totalAmount: 500,
              travelers: [{ name: '张三' }],
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
        })
      )

    const { router } = renderWithRouter(
      [
        { path: '/orders', element: <OrderManagement /> },
        { path: '/booking/payment/:orderId', element: <div>订单支付页</div> },
      ],
      { initialEntries: ['/orders'] }
    )

    await user.click(screen.getByRole('button', { name: '待支付' }))
    await user.click(await screen.findByRole('button', { name: '去支付' }))

    expect(router.state.location.pathname).toBe('/booking/payment/o1')
    expect(await screen.findByText('订单支付页')).toBeInTheDocument()
  })

  it('Scenario: 点击订单卡片文字跳转到详情页', async () => {
    const user = userEvent.setup()

    fetch.mockResolvedValueOnce(
      mockJsonResponse(200, {
        items: [
          {
            orderId: 'o1',
            orderNo: 'NO0001',
            createdAt: '2026-01-20T10:00:00.000Z',
            type: 'flight',
            status: 'pending_payment',
            title: '上海-北京',
            departureAt: '2026-02-01T08:00:00.000Z',
            arrivalAt: '2026-02-01T10:30:00.000Z',
            totalAmount: 500,
            travelers: [{ name: '张三' }],
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
      })
    )

    const { router } = renderWithRouter(
      [
        { path: '/orders', element: <OrderManagement /> },
        { path: '/orders/:orderId', element: <div>订单详情页</div> },
      ],
      { initialEntries: ['/orders'] }
    )

    await user.click(await screen.findByText('上海-北京'))
    expect(router.state.location.pathname).toBe('/orders/o1')
    expect(await screen.findByText('订单详情页')).toBeInTheDocument()
  })

  it('导航: 点击“我的订单”跳转到订单管理页', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/', element: <HomeGuest /> },
        { path: '/orders', element: <OrderManagement /> },
      ],
      { initialEntries: ['/'] }
    )

    await user.click(screen.getByRole('link', { name: '我的订单' }))
    expect(router.state.location.pathname).toBe('/orders')
    expect(await screen.findByText('您还没有相关订单哦')).toBeInTheDocument()
  })

  it('导航: 已登录时点击用户昵称/头像跳转到个人信息管理页', async () => {
    const user = userEvent.setup()
    localStorage.setItem('auth_token', 'token')
    localStorage.setItem('auth_user', JSON.stringify({ id: 'u1', nickname: '测试用户' }))
    fetch.mockResolvedValueOnce(
      mockJsonResponse(200, {
        userId: 'u1',
        phoneNumber: '13800138000',
        email: 'u1@example.com',
        nickname: '测试用户',
        fullName: '张三',
        gender: 'male',
        birthday: '2000-01-01',
      })
    )

    const { router } = renderWithRouter(
      [
        { path: '/', element: <HomeGuest headerVariant="authed" /> },
        { path: '/personal-center', element: <PersonalCenter /> },
      ],
      { initialEntries: ['/'] }
    )

    await user.click(screen.getByRole('link', { name: /测试用户/ }))
    expect(router.state.location.pathname).toBe('/personal-center')
    expect(await screen.findByText('个人信息设置')).toBeInTheDocument()
  })

  it('导航: 订单页左侧导航栏可跳转个人信息/常用旅客信息', async () => {
    const user = userEvent.setup()
    localStorage.setItem('auth_token', 'token')

    fetch
      .mockResolvedValueOnce(mockJsonResponse(200, { items: [] }))
      .mockResolvedValueOnce(mockJsonResponse(200, { items: [] }))
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          userId: 'u1',
          phoneNumber: '13800138000',
          email: 'u1@example.com',
          nickname: '测试用户',
          fullName: '张三',
          gender: 'male',
          birthday: '2000-01-01',
        })
      )

    const { router } = renderWithRouter(
      [
        { path: '/orders', element: <OrderManagement /> },
        { path: '/common-info/travelers', element: <CommonTravelerInfo /> },
        { path: '/personal-center', element: <PersonalCenter /> },
      ],
      { initialEntries: ['/orders'] }
    )

    await user.click(screen.getByRole('link', { name: '常用旅客信息' }))
    expect(router.state.location.pathname).toBe('/common-info/travelers')
    expect(await screen.findByText('维护本人及常用同行人信息')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '我的信息' }))
    expect(router.state.location.pathname).toBe('/personal-center')
    expect(await screen.findByText('个人信息设置')).toBeInTheDocument()
  })
})
