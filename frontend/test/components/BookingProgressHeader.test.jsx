import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import BookingProgressHeader from '../../src/components/BookingProgressHeader/BookingProgressHeader.jsx'
import { renderWithRouter } from '../testUtils.jsx'

describe('机票预订 - 进度条组件 场景用例', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    try {
      sessionStorage.clear()
    } catch {
      null
    }
  })

  it('Scenario: 正常更新阶段状态（从会话/接口读取 stage 并高亮）', async () => {
    sessionStorage.setItem('bookingStage', '3')

    renderWithRouter([{ path: '/booking', element: <BookingProgressHeader /> }], { initialEntries: ['/booking'] })
    expect(fetch).toHaveBeenCalledWith('/api/booking/draft', { method: 'GET' })
    expect(screen.getByText('支付')).toHaveClass('itemActive')
  })

  it('Scenario: 状态异常（阶段信息缺失）默认回退为第 1 阶段展示', async () => {
    renderWithRouter([{ path: '/booking', element: <BookingProgressHeader /> }], { initialEntries: ['/booking'] })
    expect(screen.getByText('乘机信息')).toHaveClass('itemActive')
  })
})

