import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('BuyTicketStep1 Scenarios', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('2.1 正常填写并校验通过进入下一步：保存到会话并跳转 booking/services', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ bookingStage: 2 }),
    })

    renderAtHash('#/booking?bookingDraftId=DRAFT-1&flight=FL-1')

    await user.type(screen.getByPlaceholderText('请与登机证件姓名保持一致'), '张三')
    await user.type(screen.getByPlaceholderText('登机证件号码'), '11010519491231002X')
    await user.type(screen.getByPlaceholderText('手机号，接收航变信息'), '13800138000')
    await user.click(screen.getByText('下一步'))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/booking/drafts/DRAFT-1/passengers-contact'),
      expect.objectContaining({ method: 'PUT' })
    )
    expect(window.location.hash).toBe('#/booking/services?bookingDraftId=DRAFT-1')
  })

  it('2.1 输入异常（证件号格式错误）：提示“证件号码格式不正确”并阻止下一步', async () => {
    const user = userEvent.setup()
    renderAtHash('#/booking?bookingDraftId=DRAFT-1&flight=FL-1')

    await user.type(screen.getByPlaceholderText('请与登机证件姓名保持一致'), '张三')
    await user.type(screen.getByPlaceholderText('登机证件号码'), '123')
    await user.click(screen.getByText('下一步'))

    expect(screen.getByText('证件号码格式不正确')).toBeInTheDocument()
    expect(window.location.hash).toMatch(/^#\/booking\b/)
  })

  it('2.1 输入异常（联系人手机号非法）：提示“联系人手机号格式不正确”并阻止下一步', async () => {
    const user = userEvent.setup()
    renderAtHash('#/booking?bookingDraftId=DRAFT-1&flight=FL-1')

    await user.type(screen.getByPlaceholderText('请与登机证件姓名保持一致'), '张三')
    await user.type(screen.getByPlaceholderText('登机证件号码'), '11010519491231002X')
    await user.type(screen.getByPlaceholderText('手机号，接收航变信息'), '123')
    await user.click(screen.getByText('下一步'))

    expect(screen.getByText('联系人手机号格式不正确')).toBeInTheDocument()
    expect(window.location.hash).toMatch(/^#\/booking\b/)
  })

  it('2.1 系统异常（会话持久化失败）：提示“网络异常，请稍后重试”且保留已填数据', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockRejectedValueOnce(new Error('network'))

    renderAtHash('#/booking?bookingDraftId=DRAFT-1&flight=FL-1')

    await user.type(screen.getByPlaceholderText('请与登机证件姓名保持一致'), '张三')
    await user.type(screen.getByPlaceholderText('登机证件号码'), '11010519491231002X')
    await user.type(screen.getByPlaceholderText('手机号，接收航变信息'), '13800138000')
    await user.click(screen.getByText('下一步'))

    expect(screen.getByText('网络异常，请稍后重试')).toBeInTheDocument()
    expect(screen.getByDisplayValue('张三')).toBeInTheDocument()
    expect(screen.getByDisplayValue('11010519491231002X')).toBeInTheDocument()
    expect(screen.getByDisplayValue('13800138000')).toBeInTheDocument()
  })
})

