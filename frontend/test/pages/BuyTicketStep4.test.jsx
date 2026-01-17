import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('BuyTicketStep4 Scenarios', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('5.1 正常生成订单并展示完成页：进入页面后应后台创建订单并展示摘要', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        orderId: 'ORD-1',
        status: 'paid',
        createdAt: new Date().toISOString(),
        totalAmount: 528,
      }),
    })

    renderAtHash('#/booking/complete?bookingDraftId=DRAFT-1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/booking/drafts/DRAFT-1/complete'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(screen.getByText('成功出票')).toBeInTheDocument()
    expect(screen.getByText('ORD-1')).toBeInTheDocument()
  })

  it('5.1 状态异常（重复创建防抖）：副作用触发两次也只应调用一次创建接口', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        orderId: 'ORD-1',
        status: 'paid',
        createdAt: new Date().toISOString(),
        totalAmount: 528,
      }),
    })

    renderAtHash('#/booking/complete?bookingDraftId=DRAFT-1')
    renderAtHash('#/booking/complete?bookingDraftId=DRAFT-1')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('5.1 系统异常（订单创建失败）：提示订单创建失败且不影响完成 UI', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockRejectedValueOnce(new Error('network'))

    renderAtHash('#/booking/complete?bookingDraftId=DRAFT-1')

    expect(screen.getByText('订单创建失败，稍后查看订单中心')).toBeInTheDocument()
    expect(screen.getByText('成功出票')).toBeInTheDocument()
  })

  it('5.1 点击返回首页：跳转至首页', async () => {
    const user = userEvent.setup()
    renderAtHash('#/buy-ticket/step4')

    await user.click(screen.getByRole('link', { name: '返回首页' }))
    expect(window.location.hash).toBe('#/')
  })
})

