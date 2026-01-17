import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

function formatDateYYYYMMDD(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('FlightsList Scenarios', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('1.1 正常加载并展示航班列表：进入后应向后端提交搜索请求', async () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)
    const departDate = formatDateYYYYMMDD(future)
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ flights: [], total: 0 }),
    })

    renderAtHash(`#/flights/list?dcity=BJS&acity=SHA&date=${departDate}`)

    expect(fetchMock).toHaveBeenCalled()
  })

  it('1.1 输入异常（过去日期）：提示“不可选择过去日期”，并允许重选', async () => {
    renderAtHash('#/flights/list?dcity=BJS&acity=SHA&date=2000-01-01')

    expect(screen.getByText('不可选择过去日期')).toBeInTheDocument()
    expect(window.location.hash).toMatch(/^#\/flights\/list/)
  })

  it('1.1 状态异常（未登录）：访问结果页应跳转至登录页', async () => {
    renderAtHash('#/flights/list?dcity=BJS&acity=SHA&date=2099-12-31')

    expect(window.location.hash).toBe('#/login')
  })

  it('1.1 正常选择套餐并进入订票页：点击预订应创建草稿并跳转 booking', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({ bookingDraftId: 'draft-1', bookingStage: 1 }),
    })

    renderAtHash('#/flights/list?dcity=BJS&acity=SHA&date=2099-12-31')
    await user.click(screen.getAllByText('预订')[0])

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/booking/drafts'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(window.location.hash).toMatch(/^#\/booking/)
  })

  it('1.1 系统异常（搜索接口失败）：提示“搜索失败/网络异常，请稍后重试”且可重试', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockRejectedValueOnce(new Error('network'))

    renderAtHash('#/flights/list?dcity=BJS&acity=SHA&date=2099-12-31')

    expect(screen.getByText('搜索失败/网络异常，请稍后重试')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument()
  })

  it('1.1 状态异常（无可售结果）：提示“暂无可售航班”并建议更换筛选条件', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ flights: [], total: 0 }),
    })

    renderAtHash('#/flights/list?dcity=BJS&acity=SHA&date=2099-12-31')

    expect(screen.getByText('暂无可售航班')).toBeInTheDocument()
  })

  it('1.2 输入异常（套餐标识缺失）：阻止跳转并提示“套餐信息异常，请重试”', async () => {
    const user = userEvent.setup()
    renderAtHash('#/flights/list?dcity=BJS&acity=SHA&date=2099-12-31')

    await user.click(screen.getAllByText('预订')[0])
    expect(screen.getByText('套餐信息异常，请重试')).toBeInTheDocument()
    expect(window.location.hash).toMatch(/^#\/flights\/list/)
  })

  it('1.2 状态异常（价格变动）：提示价格变更并确认后继续进入订票页', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: vi.fn().mockResolvedValue({ error: 'Price changed.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ bookingDraftId: 'draft-1', bookingStage: 1 }),
      })

    renderAtHash('#/flights/list?dcity=BJS&acity=SHA&date=2099-12-31')
    await user.click(screen.getAllByText('预订')[0])

    expect(screen.getByText('价格变更')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '确认' }))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(window.location.hash).toMatch(/^#\/booking/)
  })
})
