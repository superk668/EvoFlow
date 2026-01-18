import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import Login from '../../src/pages/Login/Login.jsx'
import { renderWithAuth } from '../utils/render.jsx'

describe('Login Scenarios', () => {
  it('Scenario 1.3.1 登录页跳转至注册页', async () => {
    const user = userEvent.setup()

    renderWithAuth(<Login />, {
      route: '/login',
      routes: (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<div>REGISTER_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '免费注册' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/register')
    expect(screen.getByText('REGISTER_PAGE')).toBeInTheDocument()
  })

  it('Scenario 1.1.7 未勾选服务协议点击登录应提示并阻止提交', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderWithAuth(<Login />, { route: '/login' })

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'ValidPassw0rd!')
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByText('请阅读并同意服务协议')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('Scenario 1.1.5 未输入账号点击登录应提示请输入用户名', async () => {
    const user = userEvent.setup()

    renderWithAuth(<Login />, { route: '/login' })

    await user.type(screen.getByPlaceholderText('登录密码'), 'ValidPassw0rd!')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(screen.getByText('请输入用户名')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('Scenario 1.1.6 未输入密码点击登录应提示请输入密码', async () => {
    const user = userEvent.setup()

    renderWithAuth(<Login />, { route: '/login' })

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(screen.getByText('请输入密码')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('Scenario 1.1.4 无效账号或密码应提示用户名或密码不正确', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid credentials.' }), { status: 401 }),
    )

    renderWithAuth(<Login />, { route: '/login' })

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'WrongPass1!')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(await screen.findByText('用户名或密码不正确')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('Scenario 1.1.3 有效账号密码登录应保存会话并回跳 postLoginRedirect', async () => {
    const user = userEvent.setup()
    sessionStorage.setItem('postLoginRedirect', '/orders')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'token_123',
          userId: '00000000-0000-0000-0000-000000000001',
          userDisplayName: '测试用户',
          phoneNumber: '13800138000',
          loginAt: new Date().toISOString(),
        }),
        { status: 200 },
      ),
    )

    renderWithAuth(<Login />, {
      route: '/login',
      routes: (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/orders" element={<div>ORDERS_PAGE</div>} />
          <Route path="/" element={<div>HOME_PAGE</div>} />
        </>
      ),
    })

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'ValidPassw0rd!')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    const raw = localStorage.getItem('evoflow_auth')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw)).toMatchObject({
      isLoggedIn: true,
      userDisplayName: '测试用户',
      phoneNumber: '13800138000',
      token: 'token_123',
    })
    expect(sessionStorage.getItem('postLoginRedirect')).toBeNull()

    expect(await screen.findByText('ORDERS_PAGE')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/orders')
  })

  it('Network Failure 登录请求失败应展示可读错误并解除 Loading/禁用态', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    renderWithAuth(<Login />, { route: '/login' })

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'ValidPassw0rd!')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))

    const submit = screen.getByRole('button', { name: '登 录' })
    await user.click(submit)

    expect(submit).not.toBeDisabled()
    expect(screen.getByText(/网络|请求|连接|失败|错误/)).toBeInTheDocument()
  })

  it('Scenario 1.2.6 60秒内频繁获取验证码按钮无响应且倒计时继续', () => {
    vi.useFakeTimers()

    try {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

      renderWithAuth(<Login />, { route: '/login' })

      fireEvent.click(screen.getByRole('tab', { name: '验证码登录' }))
      fireEvent.change(screen.getByRole('textbox', { name: '手机号' }), { target: { value: '13800138000' } })

      const sendBtn = screen.getByRole('button', { name: '发送验证码' })
      fireEvent.click(sendBtn)
      fireEvent.click(sendBtn)

      expect(globalThis.fetch).toHaveBeenCalledTimes(1)

      act(() => {
        vi.advanceTimersByTime(30_000)
      })
      expect(screen.getByText(/30/)).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
