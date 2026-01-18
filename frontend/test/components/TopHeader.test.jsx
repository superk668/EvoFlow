import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import { MemoryRouter } from 'react-router-dom'
import AuthProvider from '../../src/auth/AuthProvider.jsx'
import TopHeader from '../../src/components/TopHeader/TopHeader.jsx'
import { render } from '@testing-library/react'
import { renderWithAuth } from '../utils/render.jsx'

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


  it('Scenario 0.1.1 已登录时顶部栏展示用户名入口且不展示登录/注册', () => {
    renderWithAuth(<TopHeader />, {
      route: '/',
      auth: {
        isLoggedIn: true,
        userDisplayName: '测试用户',
        tier: '白银贵宾',
        points: 0,
      },
    })

    expect(screen.getByRole('button', { name: /尊敬的测试用户/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '登录' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '注册' })).not.toBeInTheDocument()
  })

  it('Scenario 0.1.2 未登录时顶部栏展示登录与注册按钮且不展示用户名入口', () => {
    renderWithAuth(<TopHeader />, {
      route: '/',
      auth: { isLoggedIn: false },
    })

    expect(screen.getByRole('link', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '注册' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /尊敬的/ })).not.toBeInTheDocument()
  })

  it('Scenario 0.1.3 触摸用户名位置展现下拉菜单', async () => {
    const user = userEvent.setup()

    renderWithAuth(<TopHeader />, {
      route: '/',
      auth: {
        isLoggedIn: true,
        userDisplayName: '测试用户',
        tier: '白银贵宾',
        points: 0,
      },
    })

    await user.hover(screen.getByRole('button', { name: /尊敬的测试用户/ }))

    expect(screen.getByRole('link', { name: '常用信息' })).toBeInTheDocument()
  })

  it('Scenario 0.1.4 点击下拉菜单中的用户名跳转到个人中心-我的信息', async () => {
    const user = userEvent.setup()

    renderWithAuth(<TopHeader />, {
      route: '/',
      auth: {
        isLoggedIn: true,
        userDisplayName: '测试用户',
        tier: '白银贵宾',
        points: 0,
      },
      routes: (
        <>
          <Route path="/" element={<TopHeader />} />
          <Route path="/user-center/my-info" element={<div>MY_INFO_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: /尊敬的测试用户/ }))
    await user.click(screen.getByRole('link', { name: /测试用户/ }))

    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/my-info')
    expect(screen.getByText('MY_INFO_PAGE')).toBeInTheDocument()
  })

  it('Scenario 0.1.5 点击下拉菜单中的常用信息跳转到个人中心-常用旅客信息', async () => {
    const user = userEvent.setup()

    renderWithAuth(<TopHeader />, {
      route: '/',
      auth: {
        isLoggedIn: true,
        userDisplayName: '测试用户',
        tier: '白银贵宾',
        points: 0,
      },
      routes: (
        <>
          <Route path="/" element={<TopHeader />} />
          <Route path="/user-center/common-info/travelers" element={<div>COMMON_TRAVELERS_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: /尊敬的测试用户/ }))
    await user.click(screen.getByRole('link', { name: '常用信息' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers')
    expect(screen.getByText('COMMON_TRAVELERS_PAGE')).toBeInTheDocument()
  })

  it('Scenario 0.2.1 点击我的订单跳转到个人订单中心', async () => {
    const user = userEvent.setup()

    renderWithAuth(<TopHeader />, {
      route: '/',
      auth: { isLoggedIn: true, userDisplayName: '测试用户' },
      routes: (
        <>
          <Route path="/" element={<TopHeader />} />
          <Route path="/user-center/orders" element={<div>ORDERS_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '我的订单' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/orders')
    expect(screen.getByText('ORDERS_PAGE')).toBeInTheDocument()
  })
})
