import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PersonalCenterEdit from '../../src/pages/PersonalCenterEdit/PersonalCenterEdit.jsx'
import { renderWithRouter } from '../testUtils.jsx'

function mockJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('个人中心 - 个人信息编辑页 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.setItem('auth_token', 'token')
  })

  it('Scenario 3.1.4: 进入编辑页会拉取个人信息作为表单初始值', () => {
    fetch.mockResolvedValueOnce(
      mockJsonResponse(200, {
        userId: 'u1',
        phoneNumber: '13800138000',
        email: 'u1@example.com',
        nickname: '旧昵称',
        fullName: '旧姓名',
        gender: 'female',
        birthday: '1999-01-01',
      })
    )

    renderWithRouter([{ path: '/personal-center/edit', element: <PersonalCenterEdit /> }], {
      initialEntries: ['/personal-center/edit'],
    })

    expect(fetch).toHaveBeenCalledWith('/api/user/profile', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    })
  })

  it('Scenario 3.1.5: 必填项缺失时不允许保存并提示原因', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/personal-center/edit', element: <PersonalCenterEdit /> }], {
      initialEntries: ['/personal-center/edit'],
    })

    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByText('请完整填写必填项')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalledWith('/api/user/profile', expect.objectContaining({ method: 'PUT' }))
  })

  it('Scenario 3.1.5: 合法提交后调用保存接口并展示“个人信息已更新”，且返回页无需刷新展示最新信息', async () => {
    fetch
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          userId: 'u1',
          phoneNumber: '13800138000',
          email: 'u1@example.com',
          nickname: '旧昵称',
          fullName: '旧姓名',
          gender: 'female',
          birthday: '1999-01-01',
        })
      )
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          success: true,
          message: '个人信息已更新',
          profile: {
            userId: 'u1',
            phoneNumber: '13800138000',
            email: 'u1@example.com',
            nickname: '新昵称',
            fullName: '张三',
            gender: 'male',
            birthday: '2000-01-01',
          },
        })
      )

    const user = userEvent.setup()
    renderWithRouter([{ path: '/personal-center/edit', element: <PersonalCenterEdit /> }], {
      initialEntries: ['/personal-center/edit'],
    })

    const nicknameInput = screen.getAllByRole('textbox')[0]
    const fullNameInput = screen.getAllByRole('textbox')[1]
    const birthdayInput = screen.getByPlaceholderText('yyyy-mm-dd')

    await user.clear(nicknameInput)
    await user.type(nicknameInput, '新昵称')
    await user.clear(fullNameInput)
    await user.type(fullNameInput, '张三')
    await user.click(screen.getByLabelText('男'))
    await user.clear(birthdayInput)
    await user.type(birthdayInput, '2000-01-01')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetch).toHaveBeenNthCalledWith(2, '/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ nickname: '新昵称', fullName: '张三', gender: 'male', birthday: '2000-01-01' }),
    })
    expect(await screen.findByText('个人信息已更新')).toBeInTheDocument()
    expect(await screen.findByText('新昵称')).toBeInTheDocument()
  })
})
