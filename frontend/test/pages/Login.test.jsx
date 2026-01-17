import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('Login Scenarios', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('1.3.1 登录页跳转至注册页：点击“免费注册”后 URL Hash 进入注册流程', async () => {
    const user = userEvent.setup()
    renderAtHash('#/login')

    const registerEntry = screen.getByText('免费注册')
    await user.click(registerEntry)

    expect(window.location.hash).toMatch(/^#\/register/)
  })

  it('1.1.5 未输入账号点击登录：提示“请输入用户名”', async () => {
    const user = userEvent.setup()
    renderAtHash('#/login')

    const loginButton = screen.getByRole('button', { name: /登\s*录/ })
    await user.click(loginButton)

    expect(screen.getByText('请输入用户名')).toBeInTheDocument()
  })

  it('1.1.6 未输入密码点击登录：提示“请输入密码”', async () => {
    const user = userEvent.setup()
    renderAtHash('#/login')

    const accountInput = screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号')
    await user.type(accountInput, '13800138000')

    const loginButton = screen.getByRole('button', { name: /登\s*录/ })
    await user.click(loginButton)

    expect(screen.getByText('请输入密码')).toBeInTheDocument()
  })

  it('1.1.7 未勾选服务协议点击登录：提示“请阅读并同意服务协议”并阻止提交', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    const accountInput = screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号')
    const passwordInput = screen.getByPlaceholderText('登录密码')
    await user.type(accountInput, '13800138000')
    await user.type(passwordInput, 'Correct#123')

    const loginButton = screen.getByRole('button', { name: /登\s*录/ })
    await user.click(loginButton)

    expect(screen.getByText('请阅读并同意服务协议')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('1.1.3 有效账号密码登录成功：应调用登录接口并跳转至首页', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ userId: 'u-1', token: 't-1' }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'Correct#123')

    await user.click(screen.getByRole('button', { name: /登\s*录/ }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login/password',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ account: '13800138000', password: 'Correct#123' }),
      })
    )
    expect(window.location.hash).toBe('#/')
  })

  it('1.1.4 账号或密码错误：显示“用户名或密码不正确”且停留在登录页', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: '用户名或密码不正确' }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138001')
    await user.type(screen.getByPlaceholderText('登录密码'), 'Wrong#123')
    await user.click(screen.getByRole('button', { name: /登\s*录/ }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login/password',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ account: '13800138001', password: 'Wrong#123' }),
      })
    )
    expect(screen.getByText('用户名或密码不正确')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/login')
  })

  it('账号密码登录网络异常：显示“网络异常，请稍后重试”且解除禁用态允许重试', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network'))
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    const loginButton = screen.getByRole('button', { name: /登\s*录/ })
    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'Correct#123')
    await user.click(loginButton)

    expect(screen.getByText('网络异常，请稍后重试')).toBeInTheDocument()
    expect(loginButton).toBeEnabled()
  })

  it('1.2.3 验证码登录成功：发送验证码后倒计时禁用，登录成功跳转首页', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sent: true, cooldownSeconds: 60 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ userId: 'u-1', token: 't-1' }),
      })
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    await user.click(screen.getByText('验证码登录'))
    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.click(screen.getByText('发送验证码'))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/sms/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ phoneNumber: '13800138000', purpose: 'login' }),
      })
    )
    expect(screen.getByText(/60/)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('6位数字'), '123456')
    await user.click(screen.getByRole('button', { name: /登\s*录/ }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login/code',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ phoneNumber: '13800138000', verificationCode: '123456' }),
      })
    )
    expect(window.location.hash).toBe('#/')
  })

  it('1.2.4 验证码登录输入不合法手机号：提示“手机号格式不正确，请重新输入”且不调用接口', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    await user.click(screen.getByText('验证码登录'))
    await user.type(screen.getByPlaceholderText('有效手机号'), '123')
    await user.click(screen.getByText('发送验证码'))

    expect(screen.getByText('手机号格式不正确，请重新输入')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('1.2.4 验证码登录输入错误验证码：提示“验证码不正确”且停留在登录页', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: '验证码不正确' }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    await user.click(screen.getByText('验证码登录'))
    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('6位数字'), '000000')
    await user.click(screen.getByRole('button', { name: /登\s*录/ }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login/code',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ phoneNumber: '13800138000', verificationCode: '000000' }),
      })
    )
    expect(screen.getByText('验证码不正确')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/login')
  })

  it('1.2.5 验证码登录未勾选服务协议：提示“先请阅读并勾选服务协议”且阻止提交', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    await user.click(screen.getByText('验证码登录'))
    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('6位数字'), '123456')
    await user.click(screen.getByRole('button', { name: /登\s*录/ }))

    expect(screen.getByText('先请阅读并勾选服务协议')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('1.2.6 60秒内重复获取验证码：按钮无响应且倒计时继续', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ sent: true, cooldownSeconds: 60 }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    await user.click(screen.getByText('验证码登录'))
    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    const sendEntry = screen.getByText('发送验证码')
    await user.click(sendEntry)
    await user.click(sendEntry)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(10_000)
    expect(screen.getByText(/50/)).toBeInTheDocument()
  })

  it('1.2.7 手机号未注册验证码登录：提示“该手机号未注册，请先注册”且停留在登录页', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: '该手机号未注册，请先注册' }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/login')

    await user.click(screen.getByText('验证码登录'))
    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138001')
    await user.type(screen.getByPlaceholderText('6位数字'), '123456')
    await user.click(screen.getByRole('button', { name: /登\s*录/ }))

    expect(screen.getByText('该手机号未注册，请先注册')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/login')
  })
})
