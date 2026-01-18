import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import RegisterSetPassword from '../../src/pages/RegisterSetPassword/RegisterSetPassword.jsx'
import { renderWithAuth } from '../utils/render.jsx'

describe('Register Step2 Scenarios', () => {
  it('Scenario 2.1.11 未输入任何信息点击注册应提示请设置登录密码', async () => {
    const user = userEvent.setup()

    renderWithAuth(<RegisterSetPassword />, { route: '/register/set-password?registerToken=rt_123' })

    await user.click(screen.getByRole('button', { name: '完成' }))
    expect(await screen.findByText('请设置登录密码')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/register/set-password')
  })

  it('Scenario 2.1.7 密码不合法应提示密码需为8-20位字母、数字和符号的组合且完成按钮不可点', async () => {
    const user = userEvent.setup()

    renderWithAuth(<RegisterSetPassword />, { route: '/register/set-password?registerToken=rt_123' })

    await user.type(screen.getByPlaceholderText('8-20位字母、数字和符号'), '123')
    expect(await screen.findByText('密码需为8-20位字母、数字和符号的组合')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
  })

  it('Scenario 2.1.9 两次输入密码不一致应提示并阻止完成', async () => {
    const user = userEvent.setup()

    renderWithAuth(<RegisterSetPassword />, { route: '/register/set-password?registerToken=rt_123' })

    await user.type(screen.getByPlaceholderText('8-20位字母、数字和符号'), 'ValidPassw0rd!')
    await user.type(screen.getByPlaceholderText('再次输入密码'), 'ValidPassw0rd?')

    expect(await screen.findByText('两次输入密码不一致')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
  })

  it('Scenario 2.1.10 点击密码可视化切换按钮应切换明文/密文', async () => {
    const user = userEvent.setup()

    renderWithAuth(<RegisterSetPassword />, { route: '/register/set-password?registerToken=rt_123' })

    const passwordInput = screen.getByPlaceholderText('8-20位字母、数字和符号')
    await user.type(passwordInput, 'ValidPassw0rd!')

    await user.click(screen.getByRole('button', { name: '显示密码' }))
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: '隐藏密码' }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('Scenario 2.1.12 未输入确认密码点击注册应提示请再次输入密码', async () => {
    const user = userEvent.setup()

    renderWithAuth(<RegisterSetPassword />, { route: '/register/set-password?registerToken=rt_123' })

    await user.type(screen.getByPlaceholderText('8-20位字母、数字和符号'), 'ValidPassw0rd!')
    await user.click(screen.getByRole('button', { name: '完成' }))

    expect(await screen.findByText('请再次输入密码')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/register/set-password')
  })

  it('Scenario 2.1.13 两次输入相同合法密码点击完成应调用注册完成接口并跳转登录页', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ userId: '00000000-0000-0000-0000-000000000001', phoneNumber: '13800138000' }), {
        status: 201,
      }),
    )

    renderWithAuth(<RegisterSetPassword />, {
      route: '/register/set-password?registerToken=rt_123',
      routes: (
        <>
          <Route path="/register/set-password" element={<RegisterSetPassword />} />
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        </>
      ),
    })

    await user.type(screen.getByPlaceholderText('8-20位字母、数字和符号'), 'ValidPassw0rd!')
    await user.type(screen.getByPlaceholderText('再次输入密码'), 'ValidPassw0rd!')
    await user.click(screen.getByRole('button', { name: '完成' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/auth/register/complete',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(await screen.findByText('LOGIN_PAGE')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('Scenario 2.1.14 注册完成时手机号已注册应提示并阻止跳转', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Phone number already registered.' }), { status: 409 }),
    )

    renderWithAuth(<RegisterSetPassword />, { route: '/register/set-password?registerToken=rt_123' })

    await user.type(screen.getByPlaceholderText('8-20位字母、数字和符号'), 'ValidPassw0rd!')
    await user.type(screen.getByPlaceholderText('再次输入密码'), 'ValidPassw0rd!')
    await user.click(screen.getByRole('button', { name: '完成' }))

    expect(await screen.findByText('该手机号已注册，请直接登录')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/register/set-password')
  })
})

