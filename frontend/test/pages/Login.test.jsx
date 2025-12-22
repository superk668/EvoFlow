import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import AppRouter from '../../src/router.jsx'
import Login from '../../src/pages/Login/Login.jsx'

describe('UI-LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
    window.location.hash = '#/login'
  })

  test('默认展示“账号密码登录”Tab', () => {
    render(<AppRouter />)

    expect(screen.getByLabelText('账号')).toBeInTheDocument()
    expect(screen.getByLabelText('登录密码')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '发送验证码' })).not.toBeInTheDocument()
  })

  test('点击“发送验证码”时调用 API-POST-AuthSmsSend(type=login)，成功后开始 60 秒倒计时', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: '验证码已发送', expiresIn: 60 }),
    })

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '手机验证码登录' }))
    await user.type(screen.getByLabelText('手机号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/auth/sms/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '13800138000', type: 'login' }),
      })
    )
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  test('账号密码登录成功后应触发 onLoginSuccess', async () => {
    const user = userEvent.setup()
    const onLoginSuccess = vi.fn()

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        token: 'jwt',
        user: { id: 'u1', nickname: 'n1', avatar: 'a1' },
      }),
    })

    render(
      <MemoryRouter>
        <Login onLoginSuccess={onLoginSuccess} />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('账号'), '13800138000')
    await user.type(screen.getByLabelText('登录密码'), 'Correct#12345')
    await user.click(screen.getByLabelText('服务协议'))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(onLoginSuccess).toHaveBeenCalledTimes(1)
  })

  test('账号或密码为空时，分别显示“请输入用户名”“请输入密码”', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '登 录' }))
    expect(screen.getByText('请输入用户名')).toBeInTheDocument()

    await user.type(screen.getByLabelText('账号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '登 录' }))
    expect(screen.getByText('请输入密码')).toBeInTheDocument()
  })

  test('未勾选服务协议时，显示“请阅读并同意服务协议”并阻止提交', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('账号'), '13800138000')
    await user.type(screen.getByLabelText('登录密码'), 'Correct#12345')
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(screen.getByText('请阅读并同意服务协议')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('账号密码不正确时显示“用户名或密码不正确”', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: '用户名或密码不正确' }),
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('账号'), '13800138000')
    await user.type(screen.getByLabelText('登录密码'), 'Wrong#12345')
    await user.click(screen.getByLabelText('服务协议'))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(screen.getByText('用户名或密码不正确')).toBeInTheDocument()
  })

  test('验证码错误时显示“验证码不正确”', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: '验证码不正确' }),
    })

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '手机验证码登录' }))
    await user.type(screen.getByLabelText('手机号'), '13800138000')
    await user.type(screen.getByLabelText('验证码'), '000000')
    await user.click(screen.getByLabelText('服务协议'))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(screen.getByText('验证码不正确')).toBeInTheDocument()
  })

  test('手机号未注册的验证码登录，显示“该手机号未注册，请先注册”', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ success: false, message: '该手机号未注册，请先注册' }),
    })

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '手机验证码登录' }))
    await user.type(screen.getByLabelText('手机号'), '13900139000')
    await user.type(screen.getByLabelText('验证码'), '123456')
    await user.click(screen.getByLabelText('服务协议'))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(screen.getByText('该手机号未注册，请先注册')).toBeInTheDocument()
  })

  test('点击“免费注册”应导航至注册流程页（URL Hash 为 `#/register/step1`）', async () => {
    const user = userEvent.setup()
    render(<AppRouter />)

    await user.click(screen.getByRole('link', { name: '免费注册' }))
    expect(window.location.hash).toBe('#/register/step1')
    expect(screen.getByText('验证手机')).toBeInTheDocument()
  })
})
