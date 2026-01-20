import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import FlightSearchResults from '../../src/pages/FlightSearchResults/FlightSearchResults.jsx'
import BuyTicketStep1 from '../../src/pages/BuyTicketStep1/BuyTicketStep1.jsx'
import { renderWithRouter } from '../testUtils.jsx'

describe('机票预订 - 航班搜索结果页 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      null
    }
  })

  it('Scenario: 正常加载并展示航班列表（应调用 API-GET-Flights）', async () => {
    renderWithRouter([{ path: '/flights/results', element: <FlightSearchResults /> }], {
      initialEntries: ['/flights/results?from=%E5%8C%97%E4%BA%AC&to=%E4%B8%8A%E6%B5%B7&date=2026-02-01'],
    })

    expect(fetch).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/flights'), expect.anything())
  })

  it('Scenario: 输入异常（过去日期）提示“不可选择过去日期”并阻止加载', async () => {
    renderWithRouter([{ path: '/flights/results', element: <FlightSearchResults /> }], {
      initialEntries: ['/flights/results?from=%E5%8C%97%E4%BA%AC&to=%E4%B8%8A%E6%B5%B7&date=2000-01-01'],
    })

    expect(screen.queryByText('不可选择过去日期')).not.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('Scenario: 正常选择套餐并进入订票页（应创建 bookingDraft）', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(
      [
        { path: '/flights/results', element: <FlightSearchResults /> },
        { path: '/flights/book/step1', element: <BuyTicketStep1 /> },
      ],
      {
        initialEntries: ['/flights/results?from=%E5%8C%97%E4%BA%AC&to=%E4%B8%8A%E6%B5%B7&date=2026-02-01'],
      }
    )

    const bookButtons = screen.queryAllByRole('link', { name: '订票' })
    expect(bookButtons.length).toBeGreaterThan(0)
    if (bookButtons[0]) await user.click(bookButtons[0])

    const reserveButtons = screen.queryAllByRole('link', { name: '预订' })
    expect(reserveButtons.length).toBeGreaterThan(0)
    if (reserveButtons[0]) await user.click(reserveButtons[0])

    expect(fetch).toHaveBeenCalledWith('/api/booking/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
    expect(router.state.location.pathname).toBe('/booking')
  })
})
