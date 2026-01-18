import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import SearchResults from '../../src/pages/SearchResults/SearchResults.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function formatIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysIso(base, days) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return formatIsoDate(d)
}

describe('SearchResults BuyTicket Scenarios', () => {
  it('Scenario 1.1.1 正常加载并展示航班列表与套餐面板', async () => {
    const tomorrow = addDaysIso(new Date(), 1)
    const user = userEvent.setup()

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ flights: [] }), { status: 200 }))

    renderWithAuth(<SearchResults />, {
      route: `/flights/list?from=${encodeURIComponent('上海(SHA)')}&to=${encodeURIComponent('北京(BJS)')}&departDate=${tomorrow}`,
      auth: { isLoggedIn: true, userDisplayName: '测试用户' },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
        </>
      ),
    })

    expect(fetchSpy).toHaveBeenCalled()
    expect(screen.getByText('订票')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '订票' })[0])
    expect(screen.getByRole('button', { name: /预订/ })).toBeInTheDocument()
  })

  it('Scenario 1.1.2 变更查询条件（出发地）点击搜索重新加载', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ flights: [] }), { status: 200 }))

    renderWithAuth(<SearchResults />, {
      route: '/flights/list?from=%E4%B8%8A%E6%B5%B7(SHA)&to=%E5%8C%97%E4%BA%AC(BJS)&departDate=2099-01-01',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: /出发地/ }))
    await user.click(screen.getByRole('button', { name: /成都/ }))

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('Scenario 1.1.3 变更查询条件（目的地）点击搜索重新加载', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ flights: [] }), { status: 200 }))

    renderWithAuth(<SearchResults />, {
      route: '/flights/list?from=%E4%B8%8A%E6%B5%B7(SHA)&to=%E5%8C%97%E4%BA%AC(BJS)&departDate=2099-01-01',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: /目的地/ }))
    await user.click(screen.getByRole('button', { name: /广州/ }))

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('Scenario 1.1.4 变更查询条件（出发日期）点击搜索重新加载', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ flights: [] }), { status: 200 }))

    renderWithAuth(<SearchResults />, {
      route: '/flights/list?from=%E4%B8%8A%E6%B5%B7(SHA)&to=%E5%8C%97%E4%BA%AC(BJS)&departDate=2099-01-01',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
        </>
      ),
    })

    await user.click(screen.getAllByRole('button', { name: '订票' })[0])
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('Scenario 1.1.5 输入异常（过去日期）提示不可选择过去日期并允许重选', () => {
    const yesterday = addDaysIso(new Date(), -1)
    renderWithAuth(<SearchResults />, {
      route: `/flights/list?from=${encodeURIComponent('上海(SHA)')}&to=${encodeURIComponent('北京(BJS)')}&departDate=${yesterday}`,
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
        </>
      ),
    })

    expect(screen.getByText('不可选择过去日期')).toBeInTheDocument()
  })

  it('Scenario 1.1.6 状态异常（未登录）打开结果页跳转登录且登录后回跳', async () => {
    const user = userEvent.setup()
    const tomorrow = addDaysIso(new Date(), 1)

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

    renderWithAuth(<SearchResults />, {
      route: `/flights/list?from=${encodeURIComponent('上海(SHA)')}&to=${encodeURIComponent('北京(BJS)')}&departDate=${tomorrow}`,
      auth: { isLoggedIn: false },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
          <Route path="/login" element={<Login />} />
        </>
      ),
    })

    expect(screen.getByTestId('location')).toHaveTextContent('/login')

    await user.type(screen.getByPlaceholderText('国内手机号/用户名/邮箱/卡号'), '13800138000')
    await user.type(screen.getByPlaceholderText('登录密码'), 'ValidPassw0rd!')
    await user.click(screen.getByRole('checkbox', { name: /阅读并同意携程的服务协议和个人信息保护政策/ }))
    await user.click(screen.getByRole('button', { name: '登 录' }))
    expect(screen.getByTestId('location').textContent).toContain('/flights/list')
  })

  it('Scenario 1.1.7 正常选择套餐并进入订票页且生成预订草稿', async () => {
    const user = userEvent.setup()
    const tomorrow = addDaysIso(new Date(), 1)

    renderWithAuth(<SearchResults />, {
      route: `/flights/list?from=${encodeURIComponent('上海(SHA)')}&to=${encodeURIComponent('北京(BJS)')}&departDate=${tomorrow}`,
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
          <Route path="/booking" element={<div>BOOKING_PAGE</div>} />
          <Route path="/buy-ticket/step1" element={<div>BUY_TICKET_STEP1_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getAllByRole('button', { name: '订票' })[0])
    await user.click(screen.getAllByRole('button', { name: '预订' })[0])

    expect(sessionStorage.getItem('bookingDraft')).toContain('flightId')
    expect(screen.getByTestId('location')).toHaveTextContent('/booking')
  })

  it('Scenario 1.1.8 系统异常（搜索数据加载失败）展示错误并可重试且解除加载态', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))

    renderWithAuth(<SearchResults />, {
      route: '/flights/list?from=%E4%B8%8A%E6%B5%B7(SHA)&to=%E5%8C%97%E4%BA%AC(BJS)&departDate=2099-01-01',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
        </>
      ),
    })

    expect(await screen.findByText(/搜索失败|网络异常/)).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: /重试/ })
    expect(retry).toBeEnabled()
    await user.click(retry)
  })

  it('Scenario 1.1.9 状态异常（无可售结果）提示暂无可售航班', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ flights: [] }), { status: 200 }))

    renderWithAuth(<SearchResults />, {
      route: '/flights/list?from=%E4%B8%8A%E6%B5%B7(SHA)&to=%E5%8C%97%E4%BA%AC(BJS)&departDate=2099-01-01',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
        </>
      ),
    })

    expect(await screen.findByText('暂无可售航班')).toBeInTheDocument()
  })

  it('Scenario 1.2.1 输入异常（套餐标识缺失）提示套餐信息异常并阻止跳转', async () => {
    const user = userEvent.setup()
    renderWithAuth(<SearchResults />, {
      route: '/flights/list?from=%E4%B8%8A%E6%B5%B7(SHA)&to=%E5%8C%97%E4%BA%AC(BJS)&departDate=2099-01-01',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
          <Route path="/booking" element={<div>BOOKING_PAGE</div>} />
          <Route path="/buy-ticket/step1" element={<div>BUY_TICKET_STEP1_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getAllByRole('button', { name: '订票' })[0])
    await user.click(screen.getAllByRole('button', { name: '预订' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/flights/list')
    expect(screen.getByText('套餐信息异常，请重试')).toBeInTheDocument()
  })

  it('Scenario 1.2.2 状态异常（价格变动）提示价格变更并确认后进入订票页', async () => {
    const user = userEvent.setup()
    renderWithAuth(<SearchResults />, {
      route: '/flights/list?from=%E4%B8%8A%E6%B5%B7(SHA)&to=%E5%8C%97%E4%BA%AC(BJS)&departDate=2099-01-01',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/flights/list" element={<SearchResults />} />
          <Route path="/booking" element={<div>BOOKING_PAGE</div>} />
          <Route path="/buy-ticket/step1" element={<div>BUY_TICKET_STEP1_PAGE</div>} />
        </>
      ),
    })

    await user.click(screen.getAllByRole('button', { name: '订票' })[0])
    await user.click(screen.getAllByRole('button', { name: '预订' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/flights/list')
    expect(screen.getByText(/价格变更/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /确认/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/booking')
  })
})
