import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import Register from '../../src/pages/Register/Register.jsx'
import { renderWithAuth } from '../utils/render.jsx'

describe('Register Step1 Scenarios', () => {
  it('Scenario 1.3.2 注册页跳转至登录页', async () => {
    const user = userEvent.setup()

    renderWithAuth(<Register />, {
      route: '/register',
      routes: (
        <>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '已有账号？直接登录' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument()
  })

  it('Scenario 2.1.4 不合法手机号发送验证码应提示手机号格式不正确', async () => {
    const user = userEvent.setup()

    renderWithAuth(<Register />, { route: '/register' })

    await user.type(screen.getByPlaceholderText('有效手机号'), '123')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))

    expect(await screen.findByText('手机号格式不正确，请重新输入')).toBeInTheDocument()
  })

  it('Scenario 2.1.5 合法手机号发送验证码应启动60秒倒计时且按钮不可点', () => {
    vi.useFakeTimers()

    try {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

      renderWithAuth(<Register />, { route: '/register' })

      fireEvent.change(screen.getByPlaceholderText('有效手机号'), { target: { value: '13800138000' } })
      const send = screen.getByRole('button', { name: '发送验证码' })
      fireEvent.click(send)

      expect(send).toBeDisabled()
      expect(send).toHaveTextContent(/60/)

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(send).toHaveTextContent(/59/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('Scenario 2.1.6 输入错误验证码点击下一步应提示验证码错误', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid verification code.' }), { status: 401 }),
    )

    renderWithAuth(<Register />, { route: '/register' })

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('6位数字'), '123456')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(await screen.findByText('验证码错误')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/register')
  })

  it('Scenario 2.1.6a 未勾选服务协议点击下一步应提示请阅读并同意服务协议', async () => {
    const user = userEvent.setup()

    renderWithAuth(<Register />, { route: '/register' })

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('6位数字'), '654321')
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(screen.getByText('请阅读并同意服务协议')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/register')
  })

  it('Scenario 2.1.3 验证手机号与验证码成功应进入步骤2并携带 registerToken', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ registerToken: 'rt_123', phoneNumberMasked: '138****8000' }),
        { status: 200 },
      ),
    )

    renderWithAuth(<Register />, {
      route: '/register',
      routes: (
        <>
          <Route path="/register" element={<Register />} />
          <Route path="/register/set-password" element={<div>SET_PASSWORD_PAGE</div>} />
        </>
      ),
    })

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('6位数字'), '123456')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(await screen.findByText('SET_PASSWORD_PAGE')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/register/set-password?registerToken=rt_123')
  })

  it('Data Conflict 注册完成时手机号已注册应返回409并提示该手机号已注册，请直接登录', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Phone number already registered.' }), { status: 409 }),
    )

    renderWithAuth(<Register />, { route: '/register' })

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('6位数字'), '123456')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(await screen.findByText('该手机号已注册，请直接登录')).toBeInTheDocument()
  })
})
