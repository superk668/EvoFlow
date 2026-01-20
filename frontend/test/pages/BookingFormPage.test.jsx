import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import BookingFormPage from '../../src/pages/BookingFormPage/BookingFormPage.jsx'
import BookingServicesPage from '../../src/pages/BookingServicesPage/BookingServicesPage.jsx'
import { renderWithRouter } from '../testUtils.jsx'

describe('机票预订 - 订票页（乘机人与联系人）场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    try {
      sessionStorage.clear()
    } catch {
      null
    }
  })

  it('Scenario: 正常填写并校验通过进入下一步（保存乘机人与联系人到会话）', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/booking', element: <BookingFormPage /> },
        { path: '/booking/services', element: <BookingServicesPage /> },
      ],
      { initialEntries: ['/booking'] }
    )

    fetch.mockClear()
    await user.type(screen.getByPlaceholderText('姓名'), '张三')
    await user.type(screen.getByPlaceholderText('证件号'), '110101199003070011')
    await user.type(screen.getByPlaceholderText('联系人手机号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '下一步' }))

    expect(fetch).toHaveBeenCalledWith('/api/booking/travelers', expect.anything())
    expect(router.state.location.pathname).toBe('/booking/services')
  })

  it('Scenario: 输入异常（证件号格式错误）提示“证件号码格式不正确”并阻止进入下一步', async () => {
    const user = userEvent.setup()
    renderWithRouter([{ path: '/booking', element: <BookingFormPage /> }], { initialEntries: ['/booking'] })

    fetch.mockClear()
    await user.type(screen.getByPlaceholderText('姓名'), '张三')
    await user.type(screen.getByPlaceholderText('证件号'), '123')
    await user.type(screen.getByPlaceholderText('联系人手机号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '下一步' }))

    expect(screen.getByText('证件号码格式不正确')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalledWith('/api/booking/travelers', expect.anything())
  })
})
