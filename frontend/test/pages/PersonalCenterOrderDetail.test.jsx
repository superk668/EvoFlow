import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

function formatYYYYMMDD(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

describe('settings_requirement - 4.2 订单详情页', () => {
  it('成功查看可取消订单的详情', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        order: {
          orderId: 'O-1',
          status: 'pending_travel',
          createdAt: '2099-01-01T00:00:00.000Z',
          totalAmount: 798,
          productType: 'flight',
          segments: [{ flightNo: 'HU7612' }],
          travellers: [{ name: '张三', idMasked: '430802**********12' }],
          contact: { phoneMasked: '+86 158****0027', emailMasked: 't***@example.com' },
          priceBreakdown: [
            { name: '票价', unitPrice: 660, quantity: 1 },
            { name: '机建', unitPrice: 50, quantity: 1 },
            { name: '燃油', unitPrice: 40, quantity: 1 },
            { name: '服务包', unitPrice: 48, quantity: 1 },
          ],
        },
      }),
    })

    renderAtHash('#/user-center/orders/O-1')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders/O-1'),
      expect.objectContaining({ method: 'GET' })
    )

    expect(await screen.findByText(/订单号/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消订单' })).toBeEnabled()
  })

  it('支付成功详情展示（正常流程）', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        order: {
          orderId: 'O-PAID',
          status: 'paid',
          createdAt: '2099-01-01T00:00:00.000Z',
          totalAmount: 100,
          priceBreakdown: [
            { name: '票价', unitPrice: 60, quantity: 1 },
            { name: '税费', unitPrice: 40, quantity: 1 },
          ],
        },
      }),
    })

    renderAtHash('#/user-center/orders/O-PAID')

    expect(await screen.findByText(/支付成功|待出行/)).toBeInTheDocument()
    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('已取消详情展示与重新下单入口（状态异常）', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        order: {
          orderId: 'O-CANCEL',
          status: 'canceled',
          productType: 'flight',
          from: 'BJS',
          to: 'SHA',
          departDate: formatYYYYMMDD(addDays(10)),
        },
      }),
    })

    renderAtHash('#/user-center/orders/O-CANCEL')

    expect(await screen.findByText('已取消')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '取消订单' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新下单' })).toBeInTheDocument()
  })

  it('价格明细计算校验失败（系统异常）', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        order: {
          orderId: 'O-BAD-PRICE',
          status: 'paid',
          totalAmount: 999,
          priceBreakdown: [{ name: '票价', unitPrice: 1, quantity: 1 }],
        },
      }),
    })

    renderAtHash('#/user-center/orders/O-BAD-PRICE')

    expect(await screen.findByText('价格明细暂不可用，请稍后重试')).toBeInTheDocument()
    expect(screen.getByText(/订单号/)).toBeInTheDocument()
  })

  it('用户试图访问一个不属于自己的订单 (状态异常/权限异常)', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'Forbidden' }) })

    renderAtHash('#/user-center/orders/O-OTHER')

    expect(await screen.findByText('订单不存在或您没有权限查看')).toBeInTheDocument()
  })

  it('查看一个已过期的或不可操作的订单 (状态异常)', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ order: { orderId: 'O-DONE', status: 'completed', totalAmount: 100, priceBreakdown: [] } }),
    })

    renderAtHash('#/user-center/orders/O-DONE')
    expect(await screen.findByText(/订单号/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '取消订单' })).not.toBeInTheDocument()
  })

  it('加载详情时API请求失败 (系统异常)', async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))

    renderAtHash('#/user-center/orders/O-ERR')

    expect(await screen.findByText('订单详情加载失败，请稍后重试')).toBeInTheDocument()
  })
})

describe('settings_requirement - 4.3 取消订单流程', () => {
  it('用户成功取消订单', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ order: { orderId: 'O-1', status: 'pending_travel' } }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ canceled: true, status: 'canceled' }) })

    renderAtHash('#/user-center/orders/O-1')

    await user.click(await screen.findByRole('button', { name: '取消订单' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders/O-1/cancel'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(window.alert).toHaveBeenCalledWith('订单取消成功')
  })

  it('用户点击“取消”放弃操作（输入异常）', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    globalThis.fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ order: { orderId: 'O-1', status: 'pending_travel' } }) })
    renderAtHash('#/user-center/orders/O-1')

    await user.click(await screen.findByRole('button', { name: '取消订单' }))
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('订单因状态限制不可被取消 (状态异常)', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ order: { orderId: 'O-1', status: 'pending_travel' } }) })
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'Order status not cancellable.' }) })

    renderAtHash('#/user-center/orders/O-1')

    await user.click(await screen.findByRole('button', { name: '取消订单' }))

    expect(await screen.findByText('取消失败')).toBeInTheDocument()
  })

  it('取消过程中系统出现未知错误 (系统异常)', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ order: { orderId: 'O-1', status: 'pending_travel' } }) })
      .mockRejectedValueOnce(new Error('Network error'))

    renderAtHash('#/user-center/orders/O-1')
    await user.click(await screen.findByRole('button', { name: '取消订单' }))

    expect(window.alert).toHaveBeenCalledWith('取消失败')
  })
})

describe('settings_requirement - 4.6 重新下单', () => {
  it('成功跳转并预填搜索（正常流程）', async () => {
    const user = userEvent.setup()
    const departDate = formatYYYYMMDD(addDays(10))

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        order: {
          orderId: 'O-REBOOK',
          status: 'canceled',
          productType: 'flight',
          from: 'BJS',
          to: 'SHA',
          departDate,
        },
      }),
    })

    renderAtHash('#/user-center/orders/O-REBOOK')
    await user.click(await screen.findByRole('button', { name: '重新下单' }))

    expect(window.location.hash).toContain('#/flights/list')
    const url = new URL(window.location.hash.replace(/^#/, ''), 'http://localhost')
    expect(url.searchParams.get('dcity')).toBeTruthy()
    expect(url.searchParams.get('acity')).toBeTruthy()
    expect(url.searchParams.get('date')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('跳转失败或服务不可用（系统异常）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/orders/O-REBOOK')

    await user.click(screen.getByRole('button', { name: '重新下单' }))
    expect(screen.getByText('跳转失败')).toBeInTheDocument()
  })
})
