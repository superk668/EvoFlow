import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import AppRouter from '../../src/router.jsx'
import RegisterStep1 from '../../src/pages/RegisterStep1/RegisterStep1.jsx'

describe('UI-RegisterStep1Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (globalThis.fetch?.mockReset) globalThis.fetch.mockReset()
    window.location.hash = '#/register/step1'
  })

  test('点击“发送验证码”时调用 API-POST-AuthSmsSend(type=register)，成功后开始 60 秒倒计时', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: '验证码已发送', expiresIn: 60 }),
    })

    render(<AppRouter />)

    await user.type(screen.getByLabelText('手机号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/auth/sms/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '13800138000', type: 'register' }),
      })
    )
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  test('手机号格式不正确时，显示“手机号格式不正确，请重新输入”，并保持在步骤1', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: '手机号格式不正确' }),
    })

    render(<AppRouter />)

    await user.type(screen.getByLabelText('手机号'), '123')
    await user.click(screen.getByRole('button', { name: '发送验证码' }))

    expect(screen.getByText('手机号格式不正确，请重新输入')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/register/step1')
  })

  test('验证码错误时，在验证码输入框下方显示“验证码错误”', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: '验证码错误' }),
    })

    render(<AppRouter />)

    await user.type(screen.getByLabelText('手机号'), '13900139000')
    await user.type(screen.getByLabelText('短信验证码'), '000000')
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(screen.getByText('验证码错误')).toBeInTheDocument()
  })

  test('当手机号已注册时，显示“该手机号已注册，请直接登录”', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ success: false, message: '该手机号已注册，请直接登录' }),
    })

    render(<AppRouter />)

    await user.type(screen.getByLabelText('手机号'), '13800138000')
    await user.type(screen.getByLabelText('短信验证码'), '123456')
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(screen.getByText('该手机号已注册，请直接登录')).toBeInTheDocument()
  })

  test('验证通过后调用 onVerified 并导航到步骤2（URL Hash 为 `#/register/step2`）', async () => {
    const user = userEvent.setup()
    const onVerified = vi.fn()
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: '验证成功', verificationToken: 't1' }),
    })

    window.location.hash = '#/register/step1'
    render(
      <HashRouter>
        <Routes>
          <Route path="/register/step1" element={<RegisterStep1 onVerified={onVerified} />} />
          <Route path="/register/step2" element={<div>STEP2</div>} />
        </Routes>
      </HashRouter>
    )

    await user.type(screen.getByLabelText('手机号'), '13900139000')
    await user.type(screen.getByLabelText('短信验证码'), '123456')
    await user.click(screen.getByLabelText('服务协议'))
    await user.click(screen.getByRole('button', { name: '下一步，设置密码' }))

    expect(onVerified).toHaveBeenCalledWith({ phoneNumber: '13900139000', verificationToken: 't1' })
    expect(window.location.hash).toBe('#/register/step2')
  })
})
