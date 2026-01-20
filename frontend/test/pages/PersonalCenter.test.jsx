import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PersonalCenter from '../../src/pages/PersonalCenter/PersonalCenter.jsx'
import PersonalCenterEdit from '../../src/pages/PersonalCenterEdit/PersonalCenterEdit.jsx'
import CommonTravelerInfo from '../../src/pages/CommonTravelerInfo/CommonTravelerInfo.jsx'
import OrderManagement from '../../src/pages/OrderManagement/OrderManagement.jsx'
import { renderWithRouter } from '../testUtils.jsx'

function mockJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('个人中心 - 个人信息页 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.setItem('auth_token', 'token')
  })

  it('Scenario 3.1.3: 页面打开后请求个人信息并展示手机号/邮箱/昵称/姓名/性别/生日', async () => {
    fetch.mockResolvedValueOnce(
      mockJsonResponse(200, {
        userId: 'u1',
        phoneNumber: '13800138000',
        email: 'u1@example.com',
        nickname: '新昵称',
        fullName: '张三',
        gender: 'male',
        birthday: '2000-01-01',
      })
    )

    renderWithRouter([{ path: '/personal-center', element: <PersonalCenter /> }], {
      initialEntries: ['/personal-center'],
    })

    expect(fetch).toHaveBeenCalledWith('/api/user/profile', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    })
    expect(await screen.findByText('新昵称')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('male')).toBeInTheDocument()
    expect(screen.getByText('2000-01-01')).toBeInTheDocument()
  })

  it('导航: 点击“编辑”跳转到个人信息编辑页', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/personal-center', element: <PersonalCenter /> },
        { path: '/personal-center/edit', element: <PersonalCenterEdit /> },
      ],
      { initialEntries: ['/personal-center'] }
    )

    await user.click(screen.getByRole('link', { name: '编辑' }))
    expect(router.state.location.pathname).toBe('/personal-center/edit')
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
  })

  it('导航: 个人中心导航栏可跳转个人信息/常用旅客信息/订单管理', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          userId: 'u1',
          phoneNumber: '13800138000',
          email: 'u1@example.com',
          nickname: '新昵称',
          fullName: '张三',
          gender: 'male',
          birthday: '2000-01-01',
        })
      )
      .mockResolvedValueOnce(mockJsonResponse(200, { items: [] }))
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          userId: 'u1',
          phoneNumber: '13800138000',
          email: 'u1@example.com',
          nickname: '新昵称',
          fullName: '张三',
          gender: 'male',
          birthday: '2000-01-01',
        })
      )
      .mockResolvedValueOnce(mockJsonResponse(200, { items: [] }))

    const { router } = renderWithRouter(
      [
        { path: '/personal-center', element: <PersonalCenter /> },
        { path: '/common-info/travelers', element: <CommonTravelerInfo /> },
        { path: '/orders', element: <OrderManagement /> },
      ],
      { initialEntries: ['/personal-center'] }
    )

    await user.click(screen.getByRole('link', { name: '订单管理' }))
    expect(router.state.location.pathname).toBe('/orders')
    expect(await screen.findByText('您还没有相关订单哦')).toBeInTheDocument()

    await router.navigate('/personal-center')
    expect(router.state.location.pathname).toBe('/personal-center')
    expect(await screen.findByText('个人信息设置')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '常用旅客信息' }))
    expect(router.state.location.pathname).toBe('/common-info/travelers')
    expect(await screen.findByText('维护本人及常用同行人信息')).toBeInTheDocument()
  })
})

