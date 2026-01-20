import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CommonTravelerInfoEdit from '../../src/pages/CommonTravelerInfoEdit/CommonTravelerInfoEdit.jsx'
import CommonTravelerInfo from '../../src/pages/CommonTravelerInfo/CommonTravelerInfo.jsx'
import { renderWithRouter } from '../testUtils.jsx'

function mockJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('个人中心 - 常用旅客信息编辑页 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.setItem('auth_token', 'token')
  })

  it('Scenario 3.2.10: 点击证件类型选项框提供身份证/护照两种选择', () => {
    renderWithRouter([{ path: '/common-info/travelers/edit', element: <CommonTravelerInfoEdit /> }], {
      initialEntries: ['/common-info/travelers/edit'],
    })

    const select = screen.getByRole('combobox')
    expect(select).toHaveDisplayValue('身份证')
    expect(screen.getByRole('option', { name: '身份证' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '护照' })).toBeInTheDocument()
  })

  it('Scenario 3.2.8: 未输入姓名或手机号时保存提示“请输入姓名/手机号”', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/common-info/travelers/edit', element: <CommonTravelerInfoEdit /> }], {
      initialEntries: ['/common-info/travelers/edit'],
    })

    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入姓名/手机号')).toBeInTheDocument()
  })

  it('Scenario 3.2.9: 输入无效手机号保存提示“请输入正确格式的手机号码”', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/common-info/travelers/edit', element: <CommonTravelerInfoEdit /> }], {
      initialEntries: ['/common-info/travelers/edit'],
    })

    const inputs = screen.getAllByRole('textbox')
    const phoneInput = inputs[2]

    await user.type(phoneInput, '123')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入正确格式的手机号码')).toBeInTheDocument()
  })

  it('Scenario 3.2.11: 输入无效证件号保存提示“请输入正确格式的证件号”', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/common-info/travelers/edit', element: <CommonTravelerInfoEdit /> }], {
      initialEntries: ['/common-info/travelers/edit'],
    })

    const inputs = screen.getAllByRole('textbox')
    const cnNameInput = inputs[0]
    const idNoInput = inputs[3]

    await user.type(cnNameInput, '张三')
    await user.type(idNoInput, 'bad')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入正确格式的证件号')).toBeInTheDocument()
  })

  it('Scenario 3.2.6: 必填信息合法时调用新增接口并提示“常用旅客信息已更新”，随后返回列表页显示新增记录', async () => {
    fetch.mockResolvedValueOnce(mockJsonResponse(201, { travelerId: 't1' })).mockResolvedValueOnce(
      mockJsonResponse(200, {
        items: [{ travelerId: 't1', cnName: '张三', idType: 'id', idNo: '110101200001011234', phone: '' }],
      })
    )

    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/common-info/travelers/edit', element: <CommonTravelerInfoEdit /> },
        { path: '/common-info/travelers', element: <CommonTravelerInfo /> },
      ],
      { initialEntries: ['/common-info/travelers/edit'] }
    )

    const inputs = screen.getAllByRole('textbox')
    const cnNameInput = inputs[0]
    const phoneInput = inputs[2]
    const idNoInput = inputs[3]

    await user.type(cnNameInput, '张三')
    await user.type(phoneInput, '13800138000')
    await user.type(idNoInput, '110101200001011234')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetch).toHaveBeenCalledWith('/api/user/travelers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({
        cnName: '张三',
        enName: '',
        phone: '13800138000',
        idType: 'id',
        idNo: '110101200001011234',
        nationality: '',
        gender: '',
        birthday: '',
        frequentFlyerNo: '',
      }),
    })
    expect(await screen.findByText('常用旅客信息已更新')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/common-info/travelers')
    expect(await screen.findByText('张三')).toBeInTheDocument()
  })

  it('Scenario 3.2.7: 必填项缺失或不合法时不保存并展示错误提示', async () => {
    fetch.mockResolvedValueOnce(mockJsonResponse(400, { error: 'Invalid input.' }))

    const user = userEvent.setup()
    renderWithRouter([{ path: '/common-info/travelers/edit', element: <CommonTravelerInfoEdit /> }], {
      initialEntries: ['/common-info/travelers/edit'],
    })

    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText(/错误|Invalid input\./)).toBeInTheDocument()
  })
})

