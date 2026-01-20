import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Login from '../../src/pages/Login/Login.jsx'
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

describe('注册模块 - 步骤2 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  function passwordInput() {
    return screen.getAllByPlaceholderText('8-20位字母、数字和符号')[0]
  }

  function confirmPasswordInput() {
    return screen.getAllByPlaceholderText('再次输入密码')[0]
  }

  it('Scenario: 2.1.9 用户输入的两次密码不一致', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/register/password', element: <RegisterStep2 /> }], {
      initialEntries: ['/register/password'],
    })

    await user.type(passwordInput(), 'weak')

    expect(screen.getByText('密码需为8-20位字母、数字和符号的组合')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
  })

  it('Scenario: 2.1.10 用户在第一个密码输入栏中输入合法密码', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/register/password', element: <RegisterStep2 /> }], {
      initialEntries: ['/register/password'],
    })

    await user.type(passwordInput(), 'CorrectPassword123!')

    expect(screen.getByTestId('password-strength-weak')).toHaveAttribute('data-active', 'true')
  })

  it('Scenario: 2.1.11 用户在第二个密码输入栏中输入与第一个密码输入栏中输入的密码不一致的密码', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/register/password', element: <RegisterStep2 /> }], {
      initialEntries: ['/register/password'],
    })

    await user.type(passwordInput(), 'CorrectPassword123!')
    await user.type(confirmPasswordInput(), 'DifferentPassword123!')

    expect(screen.getByText('两次输入密码不一致')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
  })

  it('Scenario: 2.1.12 用户点击密码可视化切换按钮', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/register/password', element: <RegisterStep2 /> }], {
      initialEntries: ['/register/password'],
    })

    expect(passwordInput()).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: '显示密码' }))
    expect(passwordInput()).toHaveAttribute('type', 'text')
  })

  it('Scenario: 2.1.13 用户在未输入任何信息时点击注册', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/register/password', element: <RegisterStep2 /> }], {
      initialEntries: ['/register/password'],
    })

    await user.click(screen.getByRole('button', { name: '完成' }))
    expect(screen.getByText('请设置登录密码')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('Scenario: 2.1.14 用户在未输入确认密码时点击注册', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/register/password', element: <RegisterStep2 /> }], {
      initialEntries: ['/register/password'],
    })

    await user.type(passwordInput(), 'CorrectPassword123!')
    await user.click(screen.getByRole('button', { name: '完成' }))

    expect(screen.getByText('请再次输入密码')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('Scenario: 2.1.15 用户两次输入相同的合法密码', async () => {
    fetch.mockResolvedValueOnce(
      mockJsonResponse(201, {
        success: true,
        token: 'token',
        user: { id: 'u2', nickname: '新用户', avatar: '' },
      })
    )

    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/register/password', element: <RegisterStep2 /> },
        { path: '/login', element: <Login mode="password" /> },
      ],
      { initialEntries: ['/register/password'] }
    )

    await user.type(passwordInput(), 'CorrectPassword123!')
    await user.type(confirmPasswordInput(), 'CorrectPassword123!')

    expect(screen.getByRole('button', { name: '完成' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: '完成' }))

    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/register/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '13800138000',
        verificationToken: 'temp_token_xyz',
        password: 'CorrectPassword123!',
      }),
    })

    expect(router.state.location.pathname).toBe('/login')
  })

  it('导航: 步骤2点击“< 返回上一步”返回步骤1', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/register/verify', element: <RegisterStep1 showContract={false} /> },
        { path: '/register/password', element: <RegisterStep2 /> },
      ],
      { initialEntries: ['/register/password'] }
    )

    const backLink = screen
      .getAllByRole('link')
      .find((link) => link.tagName.toLowerCase() === 'a' && link.getAttribute('href') === '/register/verify')
    expect(backLink).toBeTruthy()
    await user.click(backLink)
    expect(router.state.location.pathname).toBe('/register/verify')
  })
})
