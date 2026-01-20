import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Login from '../../src/pages/Login/Login.jsx'
import HomeAuthed from '../../src/pages/HomeAuthed/HomeAuthed.jsx'
import RegisterStep1 from '../../src/pages/RegisterStep1/RegisterStep1.jsx'
import { HomeEntry } from '../../src/router.jsx'
import { renderWithRouter } from '../testUtils.jsx'

function mockJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('登录模块 - 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.clear()
  })

  it('Scenario: 1.1.3 用户使用有效的账号和密码成功登录', async () => {
    fetch.mockResolvedValueOnce(
      mockJsonResponse(200, {
        success: true,
        token: 'token',
        user: { id: 'u1', nickname: '携程用户', avatar: '' },
      })
    )

    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/login', element: <Login mode="password" /> },
        { path: '/after-login', element: <HomeAuthed /> },
      ],
      { initialEntries: ['/login'] }
    )

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'CorrectPassword123!')
    await user.click(screen.getByRole('checkbox', { name: '服务协议' }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: '13800138000', password: 'CorrectPassword123!', agreeTerms: true }),
    })
    expect(localStorage.getItem('auth_token')).toBe('token')
    expect(router.state.location.pathname).toBe('/after-login')
  })

  it('Scenario: 1.1.4 用户使用无效的账号或密码登录失败', async () => {
    fetch.mockResolvedValueOnce(
      mockJsonResponse(401, {
        success: false,
        message: '用户名或密码不正确',
      })
    )

    const user = userEvent.setup()
    const { router } = renderWithRouter([{ path: '/login', element: <Login mode="password" /> }], {
      initialEntries: ['/login'],
    })

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13900000000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'AnyPassword')
    await user.click(screen.getByRole('checkbox', { name: '服务协议' }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByText('用户名或密码不正确')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('Scenario: 1.1.5 用户未输入账号点击登录', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/login', element: <Login mode="password" /> }], { initialEntries: ['/login'] })

    await user.click(screen.getByRole('button', { name: '登录' }))
    expect(screen.getByText('请输入用户名')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('Scenario: 1.1.6 用户未输入密码点击登录', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/login', element: <Login mode="password" /> }], { initialEntries: ['/login'] })

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), 'someone@example.com')
    await user.click(screen.getByRole('button', { name: '登录' }))
    expect(screen.getByText('请输入密码')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('Scenario: 1.1.7 用户未勾选服务协议点击登录', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/login', element: <Login mode="password" /> }], { initialEntries: ['/login'] })

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'CorrectPassword123!')
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByText('请阅读并同意服务协议')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('Scenario: 1.2.3 用户使用有效的手机号和验证码成功登录', async () => {
    fetch
      .mockResolvedValueOnce(mockJsonResponse(200, { success: true, message: '验证码已发送', expiresIn: 60 }))
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          success: true,
          token: 'token',
          user: { id: 'u1', nickname: '携程用户', avatar: '' },
        })
      )

    const user = userEvent.setup({ delay: null })
    const { router } = renderWithRouter(
      [
        { path: '/login/sms', element: <Login mode="sms" /> },
        { path: '/after-login', element: <HomeAuthed /> },
      ],
      { initialEntries: ['/login/sms'] }
    )

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))
    await user.type(screen.getByPlaceholderText('请输入验证码'), '123456')
    await user.click(screen.getByRole('checkbox', { name: '服务协议' }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(fetch).toHaveBeenNthCalledWith(1, '/api/v1/auth/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '13800138000', type: 'login' }),
    })
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/v1/auth/login/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '13800138000', code: '123456', agreeTerms: true }),
    })
    expect(localStorage.getItem('auth_token')).toBe('token')
    expect(router.state.location.pathname).toBe('/after-login')
  })

  it('Scenario: 1.2.4 用户输入的手机号不合法', async () => {
    fetch.mockResolvedValueOnce(mockJsonResponse(400, { success: false, message: '手机号格式不正确，请重新输入' }))

    const user = userEvent.setup()
    renderWithRouter([{ path: '/login/sms', element: <Login mode="sms" /> }], { initialEntries: ['/login/sms'] })

    await user.type(screen.getByPlaceholderText('请输入手机号'), '123')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))

    expect(screen.getByText('手机号格式不正确，请重新输入')).toBeInTheDocument()
  })

  it('Scenario: 1.2.4 用户输入错误的验证码', async () => {
    fetch.mockResolvedValueOnce(mockJsonResponse(400, { success: false, message: '验证码不正确' }))

    const user = userEvent.setup()
    renderWithRouter([{ path: '/login/sms', element: <Login mode="sms" /> }], { initialEntries: ['/login/sms'] })

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('请输入验证码'), '000000')
    await user.click(screen.getByRole('checkbox', { name: '服务协议' }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByText('验证码不正确')).toBeInTheDocument()
  })

  it('Scenario: 1.2.5 用户未勾选服务协议点击登录', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/login/sms', element: <Login mode="sms" /> }], { initialEntries: ['/login/sms'] })

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('请输入验证码'), '123456')
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByText('先请阅读并勾选服务协议')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('Scenario: 1.2.6 用户频繁获取验证码', async () => {
    vi.useFakeTimers()
    fetch.mockResolvedValueOnce(mockJsonResponse(200, { success: true, message: '验证码已发送', expiresIn: 60 }))

    const user = userEvent.setup({ delay: null })
    renderWithRouter([{ path: '/login/sms', element: <Login mode="sms" /> }], { initialEntries: ['/login/sms'] })

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))
    await user.click(screen.getByRole('button', { name: '发送验证码' }))

    expect(fetch).toHaveBeenCalledTimes(1)
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('Scenario: 1.2.7 用户手机号未注册点击登录', async () => {
    fetch.mockResolvedValueOnce(mockJsonResponse(404, { success: false, message: '该手机号未注册，请先注册' }))

    const user = userEvent.setup()
    renderWithRouter([{ path: '/login/sms', element: <Login mode="sms" /> }], { initialEntries: ['/login/sms'] })

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13900000000')
    await user.type(screen.getByPlaceholderText('请输入验证码'), '123456')
    await user.click(screen.getByRole('checkbox', { name: '服务协议' }))
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByText('该手机号未注册，请先注册')).toBeInTheDocument()
  })

  it('导航: 点击“验证码登录”跳转到验证码登录页', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/login', element: <Login mode="password" /> },
        { path: '/login/sms', element: <Login mode="sms" /> },
      ],
      { initialEntries: ['/login'] }
    )

    await user.click(screen.getByRole('link', { name: '验证码登录' }))
    expect(router.state.location.pathname).toBe('/login/sms')
  })

  it('导航: 点击“账号登录”跳转到账号密码登录页', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/login', element: <Login mode="password" /> },
        { path: '/login/sms', element: <Login mode="sms" /> },
      ],
      { initialEntries: ['/login/sms'] }
    )

    await user.click(screen.getByRole('link', { name: '账号登录' }))
    expect(router.state.location.pathname).toBe('/login')
  })

  it('导航: 点击“免费注册”跳转到注册页', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/login', element: <Login mode="password" /> },
        { path: '/register', element: <RegisterStep1 showContract /> },
      ],
      { initialEntries: ['/login'] }
    )

    await user.click(screen.getByRole('link', { name: '免费注册' }))
    expect(router.state.location.pathname).toBe('/register')
  })

  it('主页: 未登录时显示未登录版式', () => {
    renderWithRouter([{ path: '/', element: <HomeEntry /> }], { initialEntries: ['/'] })
    expect(screen.getByRole('link', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '注册' })).toBeInTheDocument()
  })

  it('主页: 登录态存在且有效时显示已登录版式', async () => {
    localStorage.setItem('auth_token', 'token')
    fetch.mockResolvedValueOnce(mockJsonResponse(200, { userId: 'u1' }))
    renderWithRouter([{ path: '/', element: <HomeEntry /> }], { initialEntries: ['/'] })
    expect(await screen.findByText('尊敬的...')).toBeInTheDocument()
  })

  it('主页: 登录态存在但无效时应清理并显示未登录版式', async () => {
    localStorage.setItem('auth_token', 'stale_token')
    fetch.mockResolvedValueOnce(mockJsonResponse(401, { error: 'Unauthorized.' }))

    renderWithRouter([{ path: '/', element: <HomeEntry /> }], { initialEntries: ['/'] })

    expect(await screen.findByRole('link', { name: '登录' })).toBeInTheDocument()
    expect(localStorage.getItem('auth_token')).toBe(null)
  })
})
