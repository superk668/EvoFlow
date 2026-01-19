import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import SearchResults from '../../src/pages/SearchResults/SearchResults.jsx'
import BuyTicketStep1 from '../../src/pages/BuyTicketStep1/BuyTicketStep1.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function isoTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

describe('SearchResults Booking Entry Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 1.1.6 正常选择套餐并进入订票页', async () => {
    const user = userEvent.setup()
    const departDate = isoTomorrow()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    renderWithAuth(<SearchResults />, {
      auth: { isLoggedIn: true },
      route: `/search-results?from=上海(SHA)&to=北京(BJS)&date=${departDate}`,
      routes: (
        <>
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/buy-ticket/step1" element={<BuyTicketStep1 />} />
          <Route path="/login" element={<Login />} />
        </>
      ),
    })

    await user.click(screen.getAllByRole('button', { name: '订票' })[0])
    await user.click(screen.getAllByRole('button', { name: '预订' })[0])

    const raw = sessionStorage.getItem('bookingDraft')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw)).toMatchObject({
      flightId: expect.any(String),
      packageId: expect.any(String),
      departDate,
      priceVersion: expect.any(String),
    })
    expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step1')
  })

  it('Scenario 1.2.2 输入异常（套餐标识缺失）', async () => {
    const user = userEvent.setup()

    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        flightId: 'MU5185',
        packageId: '',
        departDate: isoTomorrow(),
        priceVersion: 'v1',
      }),
    )

    renderWithAuth(<BuyTicketStep1 />, {
      route: '/buy-ticket/step1',
      routes: (
        <>
          <Route path="/buy-ticket/step1" element={<BuyTicketStep1 />} />
          <Route path="/search-results" element={<SearchResults />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(await screen.findByText('套餐信息异常，请重试')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step1')
  })

  it('Scenario 1.1.10 状态异常（未登录）', async () => {
    const user = userEvent.setup()
    const departDate = isoTomorrow()

    renderWithAuth(<SearchResults />, {
      auth: { isLoggedIn: false },
      route: `/search-results?from=上海(SHA)&to=北京(BJS)&date=${departDate}`,
      routes: (
        <>
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/login" element={<Login />} />
        </>
      ),
    })

    await user.click(screen.getAllByRole('button', { name: '订票' })[0])
    await user.click(screen.getAllByRole('button', { name: '预订' })[0])

    expect(screen.getByTestId('location')).toHaveTextContent('/login')
    expect(sessionStorage.getItem('postLoginRedirect')).toContain('/search-results')
  })
})

