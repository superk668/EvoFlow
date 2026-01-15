import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import AppRouter from '../../src/router.jsx'

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('UI-OrderManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
  })

  test('成功加载并显示全部订单列表', async () => {
    window.location.hash = '#/user/orders'

    const deferred = createDeferred()
    globalThis.fetch.mockReturnValueOnce(deferred.promise)

    render(<AppRouter />)

    expect(screen.getByText('全部订单')).toBeInTheDocument()
    expect(screen.getByText('加载中')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/orders'),
      expect.anything()
    )

    deferred.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        items: [
          {
            orderId: 'o2',
            createdAt: '2025-12-28T10:00:00.000Z',
            status: 'pending_payment',
            productType: 'flight',
            title: '上海—北京',
            departAt: '2025-12-29T10:00:00.000Z',
            passengers: ['张三'],
            totalAmount: 800,
          },
          {
            orderId: 'o1',
            createdAt: '2025-12-27T10:00:00.000Z',
            status: 'pending_travel',
            productType: 'train',
            title: '北京—上海',
            departAt: '2025-12-30T10:00:00.000Z',
            passengers: ['李四'],
            totalAmount: 500,
          },
        ],
      }),
    })

    expect(await screen.findByText('订单号：')).toBeInTheDocument()
    const orderNoEls = screen.getAllByText(/订单号：/)
    expect(orderNoEls.length).toBeGreaterThan(0)
  })

  test('用户切换订单分类标签', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders'

    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, page: 1, pageSize: 10, totalCount: 0, items: [] }),
    })

    render(<AppRouter />)

    await user.click(screen.getByText('未出行'))
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=pending_travel'),
      expect.anything()
    )
    expect(screen.getByText('加载中')).toBeInTheDocument()
  })

  test('查看“待点评”订单', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders'

    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, page: 1, pageSize: 10, totalCount: 0, items: [] }),
    })

    render(<AppRouter />)

    await user.click(screen.getByText('待点评'))
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=pending_review'),
      expect.anything()
    )
  })

  test('用户按订单类型筛选（正常流程）', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders'

    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, page: 1, pageSize: 10, totalCount: 0, items: [] }),
    })

    render(<AppRouter />)

    const productTypeSelect = screen.getByRole('combobox', { name: '订单类型' })
    await user.selectOptions(productTypeSelect, 'flight')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('productType=flight'),
      expect.anything()
    )
  })

  test('切换到“待支付”标签并操作支付', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders'

    localStorage.setItem('authToken', 'jwt')

    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [
            {
              orderId: 'o_pay_1',
              createdAt: '2025-12-28T10:00:00.000Z',
              status: 'pending_payment',
              productType: 'flight',
              title: '上海—北京',
              departAt: '2025-12-29T10:00:00.000Z',
              passengers: ['张三'],
              totalAmount: 800,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: '支付成功',
          order: { orderId: 'o_pay_1', status: 'pending_review', paidAt: '2026-01-14T00:00:00.000Z' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          page: 1,
          pageSize: 10,
          totalCount: 1,
          items: [
            {
              orderId: 'o_pay_1',
              createdAt: '2025-12-28T10:00:00.000Z',
              status: 'pending_review',
              productType: 'flight',
              title: '上海—北京',
              departAt: '2025-12-29T10:00:00.000Z',
              passengers: ['张三'],
              totalAmount: 800,
            },
          ],
        }),
      })

    render(<AppRouter />)

    await user.click(screen.getByText('待支付'))
    const payBtn = await screen.findByRole('button', { name: '支付' })
    await user.click(payBtn)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/orders/o_pay_1/pay',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ paymentMethod: 'default' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt',
        }),
      })
    )

    expect(await screen.findByText('支付成功')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=pending_review'),
      expect.anything()
    )
    expect(await screen.findByText('待点评', { selector: 'div' })).toBeInTheDocument()
  })

  test('用户没有任何订单 (状态异常)', async () => {
    window.location.hash = '#/user/orders'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, page: 1, pageSize: 10, totalCount: 0, items: [] }),
    })

    render(<AppRouter />)

    expect(await screen.findByText('您还没有相关订单哦')).toBeInTheDocument()
    expect(screen.queryByText(/订单号：/)).not.toBeInTheDocument()
  })

  test('用户没有登录时显示空状态且不显示订单卡片和分页控件 (状态异常)', async () => {
    window.location.hash = '#/user/orders'

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: '未登录' }),
    })

    render(<AppRouter />)

    expect(await screen.findByText('您还没有相关订单哦')).toBeInTheDocument()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(screen.queryByRole('navigation', { name: '分页' })).not.toBeInTheDocument()
  })

  test('API请求失败或网络中断 (系统异常)', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders'

    globalThis.fetch.mockRejectedValueOnce(new Error('network'))

    render(<AppRouter />)

    expect(
      await screen.findByText('订单加载失败，请检查您的网络并重试')
    ).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: '重试' })
    await user.click(retryBtn)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(retryBtn).toBeEnabled()
  })

  test('用户尝试访问一个不存在的分页 (输入异常)', async () => {
    window.location.hash = '#/user/orders?page=4'

    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        page: 3,
        pageSize: 10,
        totalCount: 21,
        items: [],
      }),
    })

    render(<AppRouter />)

    await screen.findByRole('navigation', { name: '分页' })
    await screen.findByRole('button', { name: '3' })
    expect(window.location.hash).toContain('page=3')
  })
})
