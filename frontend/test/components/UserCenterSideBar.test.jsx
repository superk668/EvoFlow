import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import AppRouter from '../../src/router.jsx'

describe('UI-UserCenterSideBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
    localStorage.clear()
  })

  test('初始状态下，“个人信息下拉栏”与“常用信息下拉栏”默认收起', async () => {
    window.location.hash = '#/user/orders'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, page: 1, pageSize: 10, totalCount: 0, items: [] }),
    })

    render(<AppRouter />)

    const sidebar = screen.getByRole('complementary', { name: '个人中心导航' })

    expect(within(sidebar).queryByText('我的信息')).not.toBeInTheDocument()
    expect(within(sidebar).queryByText('常用旅客')).not.toBeInTheDocument()
  })

  test('点击“个人信息”下拉触发区，应展开并可导航到个人信息页面', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, page: 1, pageSize: 10, totalCount: 0, items: [] }),
    })

    render(<AppRouter />)

    const sidebar = screen.getByRole('complementary', { name: '个人中心导航' })

    await user.click(within(sidebar).getByText('个人中心'))
    await user.click(within(sidebar).getByText('我的信息'))
    expect(window.location.hash).toBe('#/user')
  })

  test('点击“常用信息”下拉触发区，应展开并可导航到常用旅客页面', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/orders'

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, page: 1, pageSize: 10, totalCount: 0, items: [] }),
    })

    render(<AppRouter />)

    const sidebar = screen.getByRole('complementary', { name: '个人中心导航' })

    await user.click(within(sidebar).getByText('常用信息'))
    await user.click(within(sidebar).getByText('常用旅客'))
    expect(window.location.hash).toBe('#/user/common-traveler')
  })
})
