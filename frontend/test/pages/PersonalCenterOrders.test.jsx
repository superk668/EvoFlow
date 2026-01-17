import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('settings_requirement - 4.1 订单管理列表页', () => {
  it('成功加载并显示全部订单列表', async () => {
    const departDate = formatYYYYMMDD(addDays(7))

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        orders: [
          {
            orderId: 'O-2',
            createdAt: '2099-01-02T00:00:00.000Z',
            status: 'pending_payment',
            totalAmount: 100,
            productType: 'flight',
            departTime: `${departDate}T12:00:00.000Z`,
            title: '上海 → 北京',
            travellersText: '张三',
          },
          {
            orderId: 'O-1',
            createdAt: '2099-01-01T00:00:00.000Z',
            status: 'pending_travel',
            totalAmount: 200,
            productType: 'flight',
            departTime: `${departDate}T12:00:00.000Z`,
            title: '北京 → 上海',
            travellersText: '李四',
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      }),
    })

    renderAtHash('#/user-center/orders')

    expect(screen.getByRole('tab', { name: '全部订单' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('orders-loading')).toBeInTheDocument()

    expect(globalThis.fetch).toHaveBeenCalled()
    const [url] = globalThis.fetch.mock.calls[0]
    expect(String(url)).toContain('/api/orders')

    expect(await screen.findByText('O-2')).toBeInTheDocument()
    expect(screen.getByText('O-1')).toBeInTheDocument()
  })

  it('用户切换订单分类标签', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/orders')

    await user.click(screen.getByRole('tab', { name: '未出行' }))

    expect(globalThis.fetch).toHaveBeenCalled()
    const [url] = globalThis.fetch.mock.calls.at(-1)
    const qs = new URL(String(url), 'http://localhost').searchParams
    expect(qs.get('tab')).toBe('pending_travel')
  })

  it('查看“待点评”订单', async () => {
    const user = userEvent.setup()
    const past = formatYYYYMMDD(addDays(-1))

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        orders: [
          {
            orderId: 'O-PAST',
            createdAt: '2099-01-01T00:00:00.000Z',
            status: 'pending_travel',
            totalAmount: 100,
            productType: 'flight',
            departTime: `${past}T12:00:00.000Z`,
            title: '上海 → 北京',
            travellersText: '张三',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      }),
    })

    renderAtHash('#/user-center/orders')

    await user.click(screen.getByRole('tab', { name: '待点评' }))
    expect(await screen.findByText('O-PAST')).toBeInTheDocument()
  })

  it('用户按订单类型筛选（正常流程）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/orders')

    await user.selectOptions(screen.getByRole('combobox', { name: '订单类型' }), ['flight'])

    expect(globalThis.fetch).toHaveBeenCalled()
    const [url] = globalThis.fetch.mock.calls.at(-1)
    const qs = new URL(String(url), 'http://localhost').searchParams
    expect(qs.get('productType')).toBe('flight')
  })

  it('切换到“待支付”标签并操作支付', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/orders')

    await user.click(screen.getByRole('tab', { name: '待支付' }))
    expect(globalThis.fetch).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: '去支付' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: '去支付' }))
    expect(window.location.hash).toMatch(/^#\/booking\/payment\//)
  })

  it('用户没有登录 (状态异常)', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) })
    renderAtHash('#/user-center/orders')

    expect(await screen.findByText('您还没有相关订单哦')).toBeInTheDocument()
    expect(screen.queryByTestId('order-card')).not.toBeInTheDocument()
    expect(screen.queryByTestId('orders-pagination')).not.toBeInTheDocument()
  })

  it('用户没有任何订单 (状态异常)', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ orders: [], total: 0, page: 1, pageSize: 10 }),
    })

    renderAtHash('#/user-center/orders')

    expect(await screen.findByText('您还没有相关订单哦')).toBeInTheDocument()
    expect(screen.queryByTestId('order-card')).not.toBeInTheDocument()
    expect(screen.queryByTestId('orders-pagination')).not.toBeInTheDocument()
  })

  it('API请求失败或网络中断 (系统异常)', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))

    renderAtHash('#/user-center/orders')

    expect(await screen.findByText('订单加载失败，请检查您的网络并重试')).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: '重试' })
    await user.click(retry)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('用户尝试访问一个不存在的分页 (输入异常)', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ orders: [], total: 21, page: 3, pageSize: 10 }),
    })

    renderAtHash('#/user-center/orders?page=4')

    expect(globalThis.fetch).toHaveBeenCalled()
    const [url] = globalThis.fetch.mock.calls[0]
    const qs = new URL(String(url), 'http://localhost').searchParams
    expect(['1', '3']).toContain(qs.get('page'))
  })
})

describe('settings_requirement - 4.4 订单下载', () => {
  it('成功生成并下载订单TXT（正常流程）', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ fileName: 'order.txt', contentType: 'text/plain', content: '订单号: O-1' }),
    })

    renderAtHash('#/user-center/orders')
    await user.click(screen.getByRole('button', { name: /下载订单/ }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders/O-1/download'),
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('订单状态不支持下载（状态异常）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/orders')

    await user.click(screen.getByRole('button', { name: /下载订单/ }))
    expect(screen.getByText('下载失败')).toBeInTheDocument()
  })

  it('文件生成失败（系统异常）', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Download failed.' }) })

    renderAtHash('#/user-center/orders')
    await user.click(screen.getByRole('button', { name: /下载订单/ }))

    expect(await screen.findByText('下载失败')).toBeInTheDocument()
  })
})

describe('settings_requirement - 4.5 去支付', () => {
  it('待支付订单进入支付页（正常流程）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/orders?tab=pending_payment')

    await user.click(screen.getByRole('button', { name: '去支付' }))
    expect(window.location.hash).toMatch(/^#\/booking\/payment\//)
  })
})
