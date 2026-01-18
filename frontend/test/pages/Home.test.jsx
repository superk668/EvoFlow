import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import Home from '../../src/pages/Home/Home.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function formatIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function tomorrowIso() {
  const now = new Date()
  const t = new Date(now)
  t.setDate(now.getDate() + 1)
  return formatIsoDate(t)
}

describe('Home BuyTicket Scenarios', () => {
  it('Scenario 0.3.1 已登录点击搜索跳转到搜索结果页并携带合法查询参数', async () => {
    const user = userEvent.setup()

    renderWithAuth(<Home />, {
      route: '/',
      auth: { isLoggedIn: true, userDisplayName: '测试用户' },
      routes: (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/flights/list" element={<div>FLIGHTS_LIST_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '搜索' }))

    const loc = screen.getByTestId('location').textContent
    expect(loc).toMatch(/^\/flights\/list\?/) 
    expect(loc).toMatch(/[?&]from=/)
    expect(loc).toMatch(/[?&]to=/)
    expect(loc).toMatch(/[?&]departDate=\d{4}-\d{2}-\d{2}/)
    expect(loc).toContain(`departDate=${tomorrowIso()}`)
    expect(screen.getByText('FLIGHTS_LIST_PAGE')).toBeInTheDocument()
  })

  it('Scenario 0.3.2 未登录点击搜索跳转登录且登录成功后回到结果页并保留原条件', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'token_123',
          userId: '00000000-0000-0000-0000-000000000001',
          userDisplayName: '测试用户',
          phoneNumber: '13800138000',
          loginAt: new Date().toISOString(),
        }),
        { status: 200 },
      ),
    )

    renderWithAuth(<Home />, {
      route: '/',
      auth: { isLoggedIn: false },
      routes: (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/flights/list" element={<div>FLIGHTS_LIST_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '搜索' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    const redirect = sessionStorage.getItem('postLoginRedirect')
    expect(redirect).toMatch(/^\/flights\/list\?/) 
    expect(redirect).toMatch(/departDate=\d{4}-\d{2}-\d{2}/)

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'ValidPassw0rd!')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))
    await user.click(screen.getByRole('button', { name: '登 录' }))

    expect(await screen.findByText('FLIGHTS_LIST_PAGE')).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toContain('/flights/list?')
  })
})
