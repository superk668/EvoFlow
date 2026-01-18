import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AuthProvider from '../../src/auth/AuthProvider.jsx'
import TopHeader from '../../src/components/TopHeader/TopHeader.jsx'
import { render } from '@testing-library/react'

describe('TopHeader Auth Scenarios', () => {
  it('Scenario 1.4.1 登录后刷新页面仍为登录态且不展示登录/注册按钮', () => {
    localStorage.setItem(
      'evoflow_auth',
      JSON.stringify({
        isLoggedIn: true,
        loginAt: new Date().toISOString(),
        userDisplayName: '测试用户',
        phoneNumber: '138****8000',
        token: 'token_123',
      }),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <TopHeader />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: '登录' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '注册' })).not.toBeInTheDocument()
    expect(screen.getByText(/尊敬的测试用户/)).toBeInTheDocument()
  })

  it('Scenario 1.4.3 退出登录后清理会话状态并展示登录/注册入口', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_auth',
      JSON.stringify({
        isLoggedIn: true,
        loginAt: new Date().toISOString(),
        userDisplayName: '测试用户',
        phoneNumber: '138****8000',
        token: 'token_123',
      }),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <TopHeader />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /尊敬的/ }))
    await user.click(screen.getByRole('button', { name: '退出登录' }))

    expect(localStorage.getItem('evoflow_auth')).toBeNull()
    expect(await screen.findByRole('link', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '注册' })).toBeInTheDocument()
  })
})

