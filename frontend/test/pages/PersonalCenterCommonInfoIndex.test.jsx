import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('settings_requirement - 1.1 常用信息索引页', () => {
  it('索引页正常导航到旅客信息', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info')

    await user.click(screen.getByRole('link', { name: '常用旅客信息' }))

    expect(window.location.hash).toBe('#/user-center/common-info/travelers')
    expect(screen.getByText('常用旅客信息')).toBeInTheDocument()
  })

  it('输入异常（无效直达链接）', async () => {
    renderAtHash('#/user-center/common-info/not-exists')
    expect(window.location.hash).toBe('#/user-center/common-info')
    expect(screen.getByText('常用信息')).toBeInTheDocument()
  })

  it('状态异常（未登录）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info')

    await user.click(screen.getByRole('link', { name: '常用旅客信息' }))
    expect(window.location.hash).toBe('#/login')
  })

  it('系统异常（索引资源加载失败）', async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))
    renderAtHash('#/user-center/common-info')

    expect(globalThis.fetch).toHaveBeenCalled()
    expect(await screen.findByText('网络异常，请稍后重试')).toBeInTheDocument()

    const refreshBtn = screen.getByRole('button', { name: '刷新' })
    fireEvent.click(refreshBtn)
  })
})
