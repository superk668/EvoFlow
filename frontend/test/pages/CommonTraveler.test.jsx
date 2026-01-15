import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import AppRouter from '../../src/router.jsx'

describe('UI-CommonTravelerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
    localStorage.clear()
  })

  test('页面加载应拉取常用旅客列表', async () => {
    window.location.hash = '#/user/common-traveler'
    localStorage.setItem('authToken', 'jwt')

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, items: [] }),
    })

    render(<AppRouter />)

    expect(screen.getByText('常用旅客信息')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/user/common-travelers'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt' }),
      })
    )
  })

  test('输入关键词并查询应携带keyword参数请求', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/user/common-traveler'
    localStorage.setItem('authToken', 'jwt')

    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, items: [] }),
    })

    render(<AppRouter />)

    const keywordInput = await screen.findByRole('textbox', { name: '查询关键词' })
    await user.type(keywordInput, '张')
    await user.click(screen.getByRole('button', { name: '查询' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('keyword=%E5%BC%A0'),
      expect.anything()
    )
  })
})

