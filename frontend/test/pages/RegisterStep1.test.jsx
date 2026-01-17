import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('Register Step1 Scenarios', () => {
  it('1.3.2 注册页跳转至登录页：点击“已有账号？直接登录”后 URL Hash 变为 #login', async () => {
    const user = userEvent.setup()
    renderAtHash('#/register/step1')

    const loginEntry = screen.queryByText(/已有账号.*直接登录/)
    expect(loginEntry).toBeInTheDocument()

    await user.click(loginEntry)
    expect(window.location.hash).toBe('#/login')
  })

  it('2.1.4 输入不合法手机号点击发送验证码：提示“手机号格式不正确，请重新输入”', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock

    renderAtHash('#/register/step1')

    await user.type(screen.getByPlaceholderText('有效手机号'), '123')
    await user.click(screen.getByText('发送验证码'))

    expect(screen.getByText('手机号格式不正确，请重新输入')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('2.1.5 输入合法手机号点击发送验证码：应调用发送验证码接口并进入60秒倒计时禁用状态', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ sent: true, cooldownSeconds: 60 }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/register/step1')

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.click(screen.getByText('发送验证码'))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/sms/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ phoneNumber: '13800138000', purpose: 'register' }),
      })
    )
    expect(screen.getByText(/60/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('2.1.5 60秒内重复获取验证码：按钮无响应且倒计时继续', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ sent: true, cooldownSeconds: 60 }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/register/step1')

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.click(screen.getByText('发送验证码'))
    await user.click(screen.getByText('发送验证码'))

    expect(fetchMock).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(10_000)
    expect(screen.getByText(/50/)).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('2.1.6 输入错误验证码点击下一步：在验证码输入框下方提示“验证码错误”', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: '验证码错误' }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/register/step1')

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('6位数字'), '123456')

    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/register/verify-code',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ phoneNumber: '13800138000', verificationCode: '123456' }),
      })
    )
    expect(screen.getByText('验证码错误')).toBeInTheDocument()
  })

  it('2.1.14 使用已注册手机号点击下一步：提示“该手机号已注册，请直接登录”且停留在步骤1', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: '该手机号已注册，请直接登录' }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/register/step1')

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('6位数字'), '654321')
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(screen.getByText('该手机号已注册，请直接登录')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/register/step1')
  })
})
