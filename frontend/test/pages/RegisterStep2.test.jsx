import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import RegisterStep2 from '../../src/pages/RegisterStep2/RegisterStep2.jsx'

describe('UI-RegisterStep2Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
    window.location.hash = '#/register/step2'
  })

  test('密码不符合规则时显示提示，并禁用“完成”', async () => {
    const user = userEvent.setup()
    render(
      <HashRouter>
        <Routes>
          <Route path="/register/step2" element={<RegisterStep2 />} />
        </Routes>
      </HashRouter>
    )

    await user.type(screen.getByLabelText('密码'), 'short')
    expect(screen.getByText('密码需为8-20位字母、数字和符号的组合')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
  })

  test('两次输入密码不一致时显示提示，并禁用“完成”', async () => {
    const user = userEvent.setup()
    render(
      <HashRouter>
        <Routes>
          <Route path="/register/step2" element={<RegisterStep2 />} />
        </Routes>
      </HashRouter>
    )

    await user.type(screen.getByLabelText('密码'), 'Valid#12345')
    await user.type(screen.getByLabelText('确认密码'), 'Different#12345')
    expect(screen.getByText('两次输入密码不一致')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
  })

  test('点击眼睛按钮可切换明文/密文显示', async () => {
    const user = userEvent.setup()
    render(
      <HashRouter>
        <Routes>
          <Route path="/register/step2" element={<RegisterStep2 />} />
        </Routes>
      </HashRouter>
    )

    const passwordInput = screen.getByLabelText('密码')
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: '显示密码' }))
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  test('点击“完成”调用 API-POST-AuthRegisterComplete，成功后触发回调并导航到登录页', async () => {
    const user = userEvent.setup()
    const onRegisterSuccess = vi.fn()
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        token: 'jwt',
        user: { id: 'u1', nickname: 'n1', avatar: 'a1' },
      }),
    })

    window.location.hash = '#/register/step2'
    render(
      <HashRouter>
        <Routes>
          <Route path="/register/step2" element={<RegisterStep2 onRegisterSuccess={onRegisterSuccess} />} />
          <Route path="/login" element={<div>LOGIN</div>} />
        </Routes>
      </HashRouter>
    )

    await user.type(screen.getByLabelText('密码'), 'Valid#12345')
    await user.type(screen.getByLabelText('确认密码'), 'Valid#12345')
    await user.click(screen.getByRole('button', { name: '完成' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/auth/register/complete',
      expect.objectContaining({ method: 'POST' })
    )
    expect(onRegisterSuccess).toHaveBeenCalledTimes(1)
    expect(window.location.hash).toBe('#/login')
  })

  test('当手机号已注册时，显示“该手机号已注册”并阻止注册', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ success: false, message: '该手机号已注册' }),
    })

    render(
      <HashRouter>
        <Routes>
          <Route path="/register/step2" element={<RegisterStep2 />} />
        </Routes>
      </HashRouter>
    )

    await user.type(screen.getByLabelText('密码'), 'Valid#12345')
    await user.type(screen.getByLabelText('确认密码'), 'Valid#12345')
    await user.click(screen.getByRole('button', { name: '完成' }))

    expect(screen.getByText('该手机号已注册')).toBeInTheDocument()
  })

  test('当网络异常时，显示提示并允许再次点击“完成”', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <HashRouter>
        <Routes>
          <Route path="/register/step2" element={<RegisterStep2 />} />
        </Routes>
      </HashRouter>
    )

    await user.type(screen.getByLabelText('密码'), 'Valid#12345')
    await user.type(screen.getByLabelText('确认密码'), 'Valid#12345')

    const submitBtn = screen.getByRole('button', { name: '完成' })
    expect(submitBtn).toBeEnabled()
    await user.click(submitBtn)

    expect(await screen.findByText('网络异常，请稍后重试')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeEnabled()
  })
})
