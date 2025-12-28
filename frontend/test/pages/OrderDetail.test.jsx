import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import AppRouter from '../../src/router.jsx'

describe('UI-OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
  })

  test('成功查看可取消订单的详情', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders/o_can_cancel'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_can_cancel',
          createdAt: '2025-12-27T10:00:00.000Z',
          status: 'pending_travel',
          productType: 'flight',
          title: '上海→北京',
          segments: [
            {
              departTime: '2025-12-29T10:00:00.000Z',
              arriveTime: '2025-12-29T12:00:00.000Z',
              durationText: '2h',
              departCity: '上海',
              departAirport: '浦东',
              arriveCity: '北京',
              arriveAirport: '首都',
              airlineText: '海南航空 HU7612',
              cabinText: '经济舱',
              aircraftText: '738',
              mealText: '有餐食',
            },
          ],
          passengers: [{ name: '张三', idType: '身份证', idNumberMasked: '4308**********12' }],
          contact: { phoneMasked: '158****0027', emailMasked: 't***@e***.com' },
          payment: {
            currency: 'CNY',
            totalAmount: 798,
            items: [
              { name: '成人', amount: 750, qtyText: '×1人' },
              { name: '机建', amount: 48, qtyText: '×1人' },
            ],
          },
        },
      }),
    })

    render(<AppRouter />)

    expect(screen.getByText('加载中')).toBeInTheDocument()
    expect(await screen.findByText('海南航空 HU7612')).toBeInTheDocument()
    const cancelBtn = screen.getByRole('button', { name: '取消订单' })
    expect(cancelBtn).toBeEnabled()

    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: '订单取消成功',
        order: { orderId: 'o_can_cancel', status: 'cancelled' },
      }),
    })
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: { orderId: 'o_can_cancel', status: 'cancelled' },
      }),
    })

    await user.click(cancelBtn)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/orders/o_can_cancel/cancel',
      expect.objectContaining({ method: 'POST' })
    )
    expect(await screen.findByText('订单取消成功')).toBeInTheDocument()
  })

  test('支付成功详情展示（正常流程）', async () => {
    window.location.hash = '#/user/orders/o_paid'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_paid',
          status: 'pending_travel',
          productType: 'flight',
          title: '上海→北京',
          segments: [{ airlineText: 'HU7612' }],
          passengers: [],
          contact: {},
          payment: { currency: 'CNY', totalAmount: 798, items: [{ name: '票价', amount: 798, qtyText: '×1' }] },
        },
      }),
    })

    render(<AppRouter />)

    expect(await screen.findByText(/支付成功|待出行/)).toBeInTheDocument()
    expect(screen.getByText(/798/)).toBeInTheDocument()
  })

  test('已取消详情展示与重新下单入口（状态异常）', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders/o_cancelled'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_cancelled',
          status: 'cancelled',
          productType: 'flight',
          title: '上海→北京',
          segments: [],
          passengers: [],
          contact: {},
          payment: { currency: 'CNY', totalAmount: 0, items: [] },
        },
      }),
    })

    render(<AppRouter />)

    expect(await screen.findByText('已取消')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '取消订单' })).not.toBeInTheDocument()

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, redirectUrl: '/flights/list?dcity=SHA&acity=BJS&date=2025-12-29' }),
    })
    const rebookBtn = screen.getByRole('button', { name: '重新下单' })
    await user.click(rebookBtn)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/orders/o_cancelled/rebook', expect.anything())
    expect(window.location.hash).toContain('#/flights/list')
  })

  test('价格明细计算校验失败（系统异常）', async () => {
    window.location.hash = '#/user/orders/o_price_mismatch'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_price_mismatch',
          status: 'pending_travel',
          productType: 'flight',
          title: '上海→北京',
          segments: [{ airlineText: 'HU7612' }],
          passengers: [{ name: '张三', idNumberMasked: '4308**********12' }],
          contact: { phoneMasked: '158****0027' },
          payment: {
            currency: 'CNY',
            totalAmount: 100,
            items: [
              { name: 'A', amount: 60, qtyText: '×1' },
              { name: 'B', amount: 60, qtyText: '×1' },
            ],
          },
        },
      }),
    })

    render(<AppRouter />)

    expect(await screen.findByText('价格明细暂不可用，请稍后重试')).toBeInTheDocument()
    expect(screen.getByText('HU7612')).toBeInTheDocument()
  })

  test('用户试图访问一个不属于自己的订单 (权限异常)', async () => {
    window.location.hash = '#/user/orders/o_not_owned'

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ success: false, message: '订单不存在或您没有权限查看' }),
    })

    render(<AppRouter />)

    expect(await screen.findByText('订单不存在或您没有权限查看')).toBeInTheDocument()
  })

  test('查看一个已过期的或不可操作的订单 (状态异常)', async () => {
    window.location.hash = '#/user/orders/o_done'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_done',
          status: 'completed',
          productType: 'flight',
          title: '上海→北京',
          segments: [],
          passengers: [],
          contact: {},
          payment: { currency: 'CNY', totalAmount: 0, items: [] },
        },
      }),
    })

    render(<AppRouter />)

    expect(await screen.findByText(/已完成|已取消/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '取消订单' })).not.toBeInTheDocument()
  })

  test('加载详情时API请求失败 (系统异常)', async () => {
    window.location.hash = '#/user/orders/o_fail'

    globalThis.fetch.mockRejectedValueOnce(new Error('network'))

    render(<AppRouter />)

    expect(await screen.findByText('订单详情加载失败，请稍后重试')).toBeInTheDocument()
  })

  test('用户点击“取消”放弃操作（输入异常）', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders/o_can_cancel'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_can_cancel',
          status: 'pending_travel',
          productType: 'flight',
          title: '上海→北京',
          segments: [],
          passengers: [],
          contact: {},
          payment: { currency: 'CNY', totalAmount: 0, items: [] },
        },
      }),
    })

    render(<AppRouter />)

    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    const cancelBtn = await screen.findByRole('button', { name: '取消订单' })
    await user.click(cancelBtn)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('订单因状态限制不可被取消 (状态异常)', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders/o_conflict'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_conflict',
          status: 'pending_travel',
          productType: 'flight',
          title: '上海→北京',
          segments: [],
          passengers: [],
          contact: {},
          payment: { currency: 'CNY', totalAmount: 0, items: [] },
        },
      }),
    })

    render(<AppRouter />)

    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ success: false, message: '订单当前状态不支持取消' }),
    })

    await user.click(await screen.findByRole('button', { name: '取消订单' }))
    expect(await screen.findByText('订单当前状态不支持取消')).toBeInTheDocument()
  })

  test('取消过程中系统出现未知错误 (系统异常)', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders/o_error'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_error',
          status: 'pending_payment',
          productType: 'flight',
          title: '上海→北京',
          segments: [],
          passengers: [],
          contact: {},
          payment: { currency: 'CNY', totalAmount: 0, items: [] },
        },
      }),
    })

    render(<AppRouter />)

    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
    globalThis.fetch.mockRejectedValueOnce(new Error('network'))

    await user.click(await screen.findByRole('button', { name: '取消订单' }))
    expect(await screen.findByText('取消失败')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消订单' })).toBeEnabled()
  })

  test('成功跳转并预填搜索（正常流程）', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders/o_rebook'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_rebook',
          status: 'cancelled',
          productType: 'flight',
          title: '上海→北京',
          segments: [],
          passengers: [],
          contact: {},
          payment: { currency: 'CNY', totalAmount: 0, items: [] },
        },
      }),
    })
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, redirectUrl: '/flights/list?dcity=SHA&acity=BJS&date=2025-12-29' }),
    })

    render(<AppRouter />)

    await user.click(await screen.findByRole('button', { name: '重新下单' }))
    expect(window.location.hash).toContain('#/flights/list?dcity=SHA')
  })

  test('跳转失败或服务不可用（系统异常）', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders/o_rebook_fail'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        order: {
          orderId: 'o_rebook_fail',
          status: 'cancelled',
          productType: 'flight',
          title: '上海→北京',
          segments: [],
          passengers: [],
          contact: {},
          payment: { currency: 'CNY', totalAmount: 0, items: [] },
        },
      }),
    })
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false, message: '跳转失败' }),
    })

    render(<AppRouter />)

    await user.click(await screen.findByRole('button', { name: '重新下单' }))
    expect(await screen.findByText('跳转失败')).toBeInTheDocument()
  })
})

