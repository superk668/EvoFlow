import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import HomeGuest from '../../src/pages/HomeGuest/HomeGuest.jsx'
import RegisterStep1 from '../../src/pages/RegisterStep1/RegisterStep1.jsx'
import RegisterStep2 from '../../src/pages/RegisterStep2/RegisterStep2.jsx'
import { renderWithRouter } from '../testUtils.jsx'

function mockJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('注册模块 - 步骤1 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('Scenario: 2.1.3 用户点击“不同意”返回首页', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/', element: <HomeGuest /> },
        { path: '/register', element: <RegisterStep1 showContract /> },
      ],
      { initialEntries: ['/register'] }
    )

    await user.click(screen.getByRole('link', { name: '不同意' }))
    expect(router.state.location.pathname).toBe('/')
  })

  it('Scenario: 2.1.4 用户点击“同意并继续”继续注册', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/register', element: <RegisterStep1 showContract /> },
        { path: '/register/verify', element: <RegisterStep1 showContract={false} /> },
      ],
      { initialEntries: ['/register'] }
    )

    expect(screen.getByText('携程用户注册协议和隐私政策')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '同意并继续' }))

    expect(router.state.location.pathname).toBe('/register/verify')
    expect(screen.queryByText('携程用户注册协议和隐私政策')).not.toBeInTheDocument()
  })

  it('Scenario: 2.1.5 用户使用有效的手机号和验证码成功进入设置密码步骤2', async () => {
    fetch
      .mockResolvedValueOnce(mockJsonResponse(200, { success: true, message: '验证码已发送', expiresIn: 60 }))
      .mockResolvedValueOnce(
        mockJsonResponse(200, { success: true, verificationToken: 'temp_token_xyz', message: '验证成功' })
      )

    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/register/verify', element: <RegisterStep1 showContract={false} /> },
        { path: '/register/password', element: <RegisterStep2 /> },
      ],
      { initialEntries: ['/register/verify'] }
    )

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))
    await user.type(screen.getByPlaceholderText('6位数字'), '123456')
    await user.click(screen.getByRole('checkbox', { name: /服务协议/i }))
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(fetch).toHaveBeenNthCalledWith(1, '/api/v1/auth/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '13800138000', type: 'register' }),
    })
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/v1/auth/register/verify-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '13800138000', code: '123456', agreeTerms: true }),
    })
    expect(router.state.location.pathname).toBe('/register/password')
  })

  it('Scenario: 2.1.6 用户输入不合法的手机号', async () => {
    fetch.mockResolvedValueOnce(mockJsonResponse(400, { success: false, message: '手机号格式不正确，请重新输入' }))

    const user = userEvent.setup()
    renderWithRouter([{ path: '/register/verify', element: <RegisterStep1 showContract={false} /> }], {
      initialEntries: ['/register/verify'],
    })

    await user.type(screen.getByPlaceholderText('有效手机号'), '123')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))

    expect(screen.getByText('手机号格式不正确，请重新输入')).toBeInTheDocument()
  })

  it('Scenario: 2.1.7 用户输入合法的手机号', async () => {
    fetch.mockResolvedValueOnce(mockJsonResponse(200, { success: true, message: '验证码已发送', expiresIn: 60 }))

    const user = userEvent.setup()
    renderWithRouter([{ path: '/register/verify', element: <RegisterStep1 showContract={false} /> }], {
      initialEntries: ['/register/verify'],
    })

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))

    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '13800138000', type: 'register' }),
    })
    expect(screen.getByRole('button', { name: /\d+秒后重试/i })).toBeDisabled()
  })

  it('Scenario: 2.1.8 用户输入错误的验证码', async () => {
    fetch.mockResolvedValueOnce(mockJsonResponse(400, { success: false, message: '验证码错误' }))

    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/register/verify', element: <RegisterStep1 showContract={false} /> },
        { path: '/register/password', element: <RegisterStep2 /> },
      ],
      { initialEntries: ['/register/verify'] }
    )

    await user.type(screen.getByPlaceholderText('有效手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('6位数字'), '123456')
    await user.click(screen.getByRole('checkbox', { name: /服务协议/i }))
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(screen.getByText('验证码错误')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/register/verify')
  })
})
