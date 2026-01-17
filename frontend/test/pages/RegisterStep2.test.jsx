import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('Register Step2 Scenarios', () => {
  it('2.1.7 输入不合法密码：提示“密码需为8-20位字母、数字和符号的组合”且完成按钮不可点', async () => {
    const user = userEvent.setup()
    renderAtHash('#/register/step2')

    await user.type(screen.getByPlaceholderText('8-20位字母、数字和符号'), '1234567')

    expect(screen.getByText('密码需为8-20位字母、数字和符号的组合')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
  })

  it('2.1.9 两次输入密码不一致：提示“两次输入密码不一致”且完成按钮不可点', async () => {
    const user = userEvent.setup()
    renderAtHash('#/register/step2')

    await user.type(screen.getByPlaceholderText('8-20位字母、数字和符号'), 'Correct#123')
    await user.type(screen.getByPlaceholderText('再次输入密码'), 'Correct#124')

    expect(screen.getByText('两次输入密码不一致')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
  })

  it('2.1.10 点击密码可视化切换按钮：密码输入框显示状态在明文/密文间切换', async () => {
    const user = userEvent.setup()
    renderAtHash('#/register/step2')

    const passwordInput = screen.getByPlaceholderText('8-20位字母、数字和符号')
    const eyeButtons = screen.queryAllByLabelText('显示密码')

    expect(eyeButtons.length).toBeGreaterThan(0)

    expect(passwordInput).toHaveAttribute('type', 'password')
    await user.click(eyeButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('2.1.13 两次输入相同合法密码并点击完成：应调用完成注册接口并跳转至登录页', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ userId: 'u-1' }),
    })
    globalThis.fetch = fetchMock

    renderAtHash('#/register/step2')

    await user.type(screen.getByPlaceholderText('8-20位字母、数字和符号'), 'Correct#123')
    await user.type(screen.getByPlaceholderText('再次输入密码'), 'Correct#123')
    await user.click(screen.getByRole('button', { name: '完成' }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/register/complete',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ registerToken: expect.any(String), password: 'Correct#123' }),
      })
    )
    expect(window.location.hash).toBe('#/login')
  })

  it('2.1.15 注册完成时发生网络异常：显示“网络异常，请稍后重试”且解除禁用态允许重试', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network'))
    globalThis.fetch = fetchMock

    renderAtHash('#/register/step2')

    await user.type(screen.getByPlaceholderText('8-20位字母、数字和符号'), 'Correct#123')
    await user.type(screen.getByPlaceholderText('再次输入密码'), 'Correct#123')

    const finishButton = screen.getByRole('button', { name: '完成' })
    await user.click(finishButton)

    expect(screen.getByText('网络异常，请稍后重试')).toBeInTheDocument()
    expect(finishButton).toBeEnabled()
  })
})
