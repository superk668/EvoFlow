import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('BuyTicketStep2 Scenarios', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('3.1 正常选择服务进入支付：点击下一步应跳转 booking/payment 并计入价格清单', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ bookingStage: 3, priceSummary: {} }),
    })

    renderAtHash('#/booking/services?bookingDraftId=DRAFT-1&flight=FL-1')

    await user.click(screen.getByText('去支付'))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/booking/drafts/DRAFT-1/services'),
      expect.objectContaining({ method: 'PUT' })
    )
    expect(window.location.hash).toBe('#/booking/payment?bookingDraftId=DRAFT-1')
    expect(screen.getByText('价格清单')).toBeInTheDocument()
  })

  it('3.1 状态异常（服务不可用）：提示“服务暂不可用”并自动取消勾选', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: '服务暂不可用' }),
    })

    renderAtHash('#/booking/services?bookingDraftId=DRAFT-1')

    await user.click(screen.getByLabelText('行李额升级'))
    expect(fetchMock).toHaveBeenCalled()
    expect(screen.getByText('服务暂不可用')).toBeInTheDocument()
    expect(screen.getByLabelText('行李额升级')).not.toBeChecked()
  })

  it('3.1 系统异常（服务列表加载失败）：显示占位并允许继续至支付', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockRejectedValueOnce(new Error('network'))

    renderAtHash('#/booking/services?bookingDraftId=DRAFT-1')

    expect(screen.getByText('加载失败')).toBeInTheDocument()
    await user.click(screen.getByText('去支付'))
    expect(window.location.hash).toMatch(/^#\/booking\/payment/)
  })
})

