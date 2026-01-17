import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('BookingLayout Scenarios', () => {
  it('6.1 正常更新阶段状态：进入阶段页应读取 bookingStage 并高亮当前阶段', async () => {
    const getItemSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem')
    getItemSpy.mockReturnValue('3')

    renderAtHash('#/booking/payment?bookingDraftId=DRAFT-1')

    expect(getItemSpy).toHaveBeenCalledWith('bookingStage')
    expect(screen.getByText('支付')).toBeInTheDocument()
  })

  it('6.1 状态异常（阶段信息缺失）：默认回退为第 1 阶段展示', async () => {
    const getItemSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem')
    getItemSpy.mockReturnValue(null)

    renderAtHash('#/booking/services?bookingDraftId=DRAFT-1')

    expect(getItemSpy).toHaveBeenCalledWith('bookingStage')
    expect(screen.getByText('乘机信息')).toBeInTheDocument()
  })

  it('6.1 系统异常（会话读取失败）：进度条默认显示且不影响页面交互', async () => {
    const getItemSpy = vi.spyOn(window.sessionStorage.__proto__, 'getItem')
    getItemSpy.mockImplementation(() => {
      throw new Error('boom')
    })

    renderAtHash('#/booking/services?bookingDraftId=DRAFT-1')

    expect(screen.getByText('乘机信息')).toBeInTheDocument()
    expect(screen.getByText('去支付')).toBeInTheDocument()
    expect(getItemSpy).toHaveBeenCalledWith('bookingStage')
  })
})

