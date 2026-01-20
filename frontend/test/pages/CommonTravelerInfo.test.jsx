import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CommonTravelerInfo from '../../src/pages/CommonTravelerInfo/CommonTravelerInfo.jsx'
import CommonTravelerInfoEdit from '../../src/pages/CommonTravelerInfoEdit/CommonTravelerInfoEdit.jsx'
import OrderManagement from '../../src/pages/OrderManagement/OrderManagement.jsx'
import PersonalCenter from '../../src/pages/PersonalCenter/PersonalCenter.jsx'
import { renderWithRouter } from '../testUtils.jsx'

function mockJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('个人中心 - 常用旅客信息列表页 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.setItem('auth_token', 'token')
  })

  it('Scenario 3.2.5: 页面打开后请求旅客列表；输入关键字后重新查询', async () => {
    fetch
      .mockResolvedValueOnce(mockJsonResponse(200, { items: [] }))
      .mockResolvedValueOnce(mockJsonResponse(200, { items: [] }))

    const user = userEvent.setup()
    renderWithRouter([{ path: '/common-info/travelers', element: <CommonTravelerInfo /> }], {
      initialEntries: ['/common-info/travelers'],
    })

    expect(fetch).toHaveBeenCalledWith('/api/user/travelers?keyword=', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    })

    await user.type(screen.getByPlaceholderText('中文名/英文名'), '张三')
    await user.click(screen.getByRole('button', { name: '查询' }))

    expect(fetch).toHaveBeenLastCalledWith('/api/user/travelers?keyword=%E5%BC%A0%E4%B8%89', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    })
  })

  it('Scenario 3.2.3: 点击“新增”跳转常用旅客信息编辑页', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/common-info/travelers', element: <CommonTravelerInfo /> },
        { path: '/common-info/travelers/edit', element: <CommonTravelerInfoEdit /> },
      ],
      { initialEntries: ['/common-info/travelers'] }
    )

    await user.click(screen.getByRole('link', { name: '新增' }))
    expect(router.state.location.pathname).toBe('/common-info/travelers/edit')
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
  })

  it('Scenario 3.2.4: 选择旅客后批量删除会二次确认并调用删除接口', async () => {
    const user = userEvent.setup()

    globalThis.confirm = vi.fn(() => true)
    fetch.mockResolvedValueOnce(
      mockJsonResponse(200, {
        items: [
          { travelerId: 't1', cnName: '张三', phone: '13800138000', idType: 'idcard', idNo: '110101200001011234' },
        ],
      })
    )

    renderWithRouter([{ path: '/common-info/travelers', element: <CommonTravelerInfo /> }], {
      initialEntries: ['/common-info/travelers'],
    })

    await user.click(screen.getByRole('checkbox', { name: '张三' }))
    await user.click(screen.getByRole('link', { name: '删除' }))

    expect(confirm).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith('/api/user/travelers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ ids: ['t1'] }),
    })
    expect(await screen.findByText('常用旅客信息已删除')).toBeInTheDocument()
  })

  it('导航: 常用旅客页左侧导航栏可跳转订单管理/个人信息', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce(mockJsonResponse(200, { items: [] }))
      .mockResolvedValueOnce(mockJsonResponse(200, { items: [] }))
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          userId: 'u1',
          phoneNumber: '13800138000',
          email: 'u1@example.com',
          nickname: '测试用户',
          fullName: '张三',
          gender: 'male',
          birthday: '2000-01-01',
        })
      )

    const { router } = renderWithRouter(
      [
        { path: '/common-info/travelers', element: <CommonTravelerInfo /> },
        { path: '/orders', element: <OrderManagement /> },
        { path: '/personal-center', element: <PersonalCenter /> },
      ],
      { initialEntries: ['/common-info/travelers'] }
    )

    await user.click(screen.getByRole('link', { name: '订单管理' }))
    expect(router.state.location.pathname).toBe('/orders')
    expect(await screen.findByRole('heading', { name: '我的订单' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '我的信息' }))
    expect(router.state.location.pathname).toBe('/personal-center')
    expect(await screen.findByText('个人信息设置')).toBeInTheDocument()
  })
})

