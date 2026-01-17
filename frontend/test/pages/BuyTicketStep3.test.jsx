import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('BuyTicketStep3 Scenarios', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('4.1 正常支付并进入完成页：点击支付应提交支付请求并跳转 booking/complete', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ paid: true }),
    })

    renderAtHash('#/booking/payment?bookingDraftId=DRAFT-1')
    await user.click(screen.getByText(/银行卡支付/))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/booking/drafts/DRAFT-1/pay'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(window.location.hash).toBe('#/booking/complete?bookingDraftId=DRAFT-1')
  })

  it('4.1 输入异常（新卡信息不完整）：支付按钮不可用或提示请填写完整且有效的卡信息', async () => {
    const user = userEvent.setup()
    renderAtHash('#/booking/payment?bookingDraftId=DRAFT-1')

    await user.click(screen.getByText('使用新卡支付'))
    await user.click(screen.getByText(/支付/))

    expect(screen.getByText('请填写完整且有效的卡信息')).toBeInTheDocument()
    expect(window.location.hash).toMatch(/^#\/booking\/payment/)
  })

  it('4.1 状态异常（倒计时到期）：提示超出时间并提供返回首页入口', async () => {
    renderAtHash('#/booking/payment?bookingDraftId=DRAFT-1')

    expect(screen.getByText('超出时间，请重新开始订单')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回首页' })).toBeInTheDocument()
  })

  it('4.1 系统异常（支付请求失败）：提示支付失败且允许重试（网络异常用例）', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockRejectedValueOnce(new Error('network'))

    renderAtHash('#/booking/payment?bookingDraftId=DRAFT-1')
    await user.click(screen.getByText(/银行卡支付/))

    expect(screen.getByText('支付失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByText(/银行卡支付/)).toBeEnabled()
  })
})

