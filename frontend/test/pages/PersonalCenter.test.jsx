import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import AppRouter from '../../src/router.jsx'

describe('UI-PersonalInformationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
    localStorage.clear()
  })

  test('页面加载应拉取个人信息并展示“编辑”按钮', async () => {
    window.location.hash = '#/user'
    localStorage.setItem('authToken', 'jwt')

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        profile: {
          userId: 'u_13800138000',
          name: '张三',
          phoneNumber: '13800138000',
          email: 'z3@example.com',
          countryRegion: 'CN',
          documentType: '身份证',
          documentNumberMasked: '4308**********34',
        },
      }),
    })

    render(<AppRouter />)

    expect(screen.getByText('编辑')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/user/profile',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt' }),
      })
    )

    expect(await screen.findByText('张三')).toBeInTheDocument()
  })

  test('点击编辑后可保存并调用更新接口', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user'
    localStorage.setItem('authToken', 'jwt')

    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          profile: {
            userId: 'u_13800138000',
            name: '张三',
            phoneNumber: '13800138000',
            email: 'z3@example.com',
            countryRegion: 'CN',
            documentType: '身份证',
            documentNumberMasked: '4308**********34',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: '个人信息已更新' }),
      })

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '编辑' }))
    const nameInput = await screen.findByRole('textbox', { name: '姓名' })
    await user.clear(nameInput)
    await user.type(nameInput, '李四')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/user/profile',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'Content-Type': 'application/json', Authorization: 'Bearer jwt' }),
        body: expect.any(String),
      })
    )
    expect(await screen.findByText('个人信息已更新')).toBeInTheDocument()
  })
})

