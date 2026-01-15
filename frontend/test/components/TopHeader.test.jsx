import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import AppRouter from '../../src/router.jsx'

describe('UI-TopHeaderAuthNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
    localStorage.clear()
  })

  test('顶部栏在任何页面都必须提供“首页”入口，点击导航至 `#/`', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/login'

    render(<AppRouter />)
    const header = screen.getByRole('banner')

    await user.click(within(header).getByLabelText('首页'))
    expect(window.location.hash).toBe('#/')
  })

  test('点击“登录”应导航至 `#/login`', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/'

    render(<AppRouter />)
    const header = screen.getByRole('banner')

    await user.click(within(header).getByRole('link', { name: '登录' }))
    expect(window.location.hash).toBe('#/login')
  })

  test('点击“注册”应导航至 `#/register/step1`', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/'

    render(<AppRouter />)
    const header = screen.getByRole('banner')

    await user.click(within(header).getByRole('link', { name: '注册' }))
    expect(window.location.hash).toBe('#/register/step1')
  })

  test('未登录点击“我的订单”应导航至 `#/login`', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/'

    render(<AppRouter />)
    const header = screen.getByRole('banner')

    await user.click(within(header).getByRole('link', { name: '我的订单' }))
    expect(window.location.hash).toBe('#/login')
  })
})

describe('UI-TopHeaderUserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
    localStorage.clear()
    localStorage.setItem('authUser', JSON.stringify({ id: 'u1', nickname: 'n1', avatar: 'a1' }))
  })

  test('点击下拉菜单“常用信息”应跳转到常用旅客页面', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/logined'

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '账号菜单' }))
    await user.click(screen.getByText('常用信息'))

    expect(window.location.hash).toBe('#/user/common-traveler')
  })

  test('点击下拉菜单“账户设置”应跳转到账户设置页面', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/logined'

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '账号菜单' }))
    await user.click(screen.getByText('账户设置'))

    expect(window.location.hash).toBe('#/user/set-information')
  })

  test('页面初始状态下拉菜单默认收起，不展示菜单选项', async () => {
    window.location.hash = '#/logined'

    render(<AppRouter />)

    expect(screen.queryByRole('menu', { name: '账号下拉菜单' })).not.toBeInTheDocument()
  })

  test('点击账号触发区应展开/收起下拉菜单', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/logined'

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '账号菜单' }))
    expect(await screen.findByRole('menu', { name: '账号下拉菜单' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '账号菜单' }))
    expect(screen.queryByRole('menu', { name: '账号下拉菜单' })).not.toBeInTheDocument()
  })

  test('下拉菜单至少包含“我的订单”“常用信息”“账户设置”入口', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/logined'

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '账号菜单' }))
    const menu = await screen.findByRole('menu', { name: '账号下拉菜单' })
    expect(within(menu).getByText('我的订单')).toBeInTheDocument()
    expect(within(menu).getByText('常用信息')).toBeInTheDocument()
    expect(within(menu).getByText('账户设置')).toBeInTheDocument()
  })

  test('点击头像或用户名应导航至“个人信息”页面', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/logined'

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '账号菜单' }))
    const menu = await screen.findByRole('menu', { name: '账号下拉菜单' })
    await user.click(within(menu).getByText('u1'))

    expect(window.location.hash).toBe('#/user')
  })

  test('顶部栏“用户名”必须展示为后端返回的 `user.id`', async () => {
    window.location.hash = '#/logined'

    render(<AppRouter />)
    const header = screen.getByRole('banner')

    expect(within(header).getByText('u1')).toBeInTheDocument()
  })

  test('在 token 未失效时刷新页面，顶部栏仍应展示同一 `user.id`', async () => {
    window.location.hash = '#/logined'

    const first = render(<AppRouter />)
    const header1 = screen.getByRole('banner')
    expect(within(header1).getByText('u1')).toBeInTheDocument()

    first.unmount()
    render(<AppRouter />)
    const header2 = screen.getByRole('banner')
    expect(within(header2).getByText('u1')).toBeInTheDocument()
  })

  test('已登录点击顶部栏“我的订单”应导航至 `#/user/orders`', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/logined'

    render(<AppRouter />)
    const header = screen.getByRole('banner')

    await user.click(within(header).getByRole('link', { name: '我的订单' }))
    expect(window.location.hash).toBe('#/user/orders')
  })

  test('顶部栏需展示搜索框占位文案“搜索目的地/酒店/景点/航班号”', async () => {
    window.location.hash = '#/logined'

    render(<AppRouter />)
    expect(screen.getByText('搜索目的地/酒店/景点/航班号')).toBeInTheDocument()
  })
})
