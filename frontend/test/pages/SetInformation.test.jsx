import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import AppRouter from '../../src/router.jsx'

describe('UI-SetInformationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
    localStorage.clear()
  })

  test('点击保存应提交常用旅客信息至后端', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/set-information'
    localStorage.setItem('authToken', 'jwt')

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: '常用旅客信息已更新',
        traveler: { travelerId: 't1', name: '李四', phoneNumber: '13800138001', documentType: '身份证', documentNumberMasked: '1101**********34' },
      }),
    })

    render(<AppRouter />)

    await user.type(screen.getByPlaceholderText('请输入中文姓名'), '李四')
    await user.type(screen.getByPlaceholderText('大陆手机'), '13800138001')
    await user.selectOptions(screen.getByRole('combobox', { name: '证件类型' }), '身份证')
    await user.type(screen.getByLabelText('证件号码'), '110101199001011234')

    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/user/common-travelers',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json', Authorization: 'Bearer jwt' }),
        body: expect.any(String),
      })
    )
    expect(await screen.findByText('常用旅客信息已更新')).toBeInTheDocument()
  })

  test('必填项缺失时应提示且不提交', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/set-information'
    localStorage.setItem('authToken', 'jwt')

    render(<AppRouter />)

    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(await screen.findByText('请输入正确的常用旅客相关信息')).toBeInTheDocument()
  })
})

