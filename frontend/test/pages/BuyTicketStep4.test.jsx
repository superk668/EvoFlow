import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import BuyTicketStep4 from '../../src/pages/BuyTicketStep4/BuyTicketStep4.jsx'
import Orders from '../../src/pages/Orders/Orders.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function maskPhone(phone) {
  const p = String(phone).replace(/\s+/g, '')
  return `${p.slice(0, 3)}****${p.slice(-4)}`
}

function maskId(idNumber) {
  const s = String(idNumber).replace(/\s+/g, '')
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

describe('BuyTicketStep4 Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 5.1.1 正常展示完成页并更新订单状态', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          id: 'ORDER_001',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          amount: 518,
          details: {
            passenger: { name: '张三', idType: '身份证', idNumberMasked: maskId('110105199001011234') },
            contact: { phoneNumberMasked: maskPhone('13800138000') },
          },
        },
      ]),
    )

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    renderWithAuth(<BuyTicketStep4 />, {
      route: '/buy-ticket/step4?orderId=ORDER_001&from=上海(SHA)&to=北京(BJS)&depTime=21:05&arrTime=23:20&total=518',
      routes: (
        <>
          <Route path="/orders" element={<Orders />} />
          <Route path="/buy-ticket/step4" element={<BuyTicketStep4 />} />
        </>
      ),
    })

    expect(screen.getByText('成功出票')).toBeInTheDocument()

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/orders/ORDER_001/status',
      expect.objectContaining({
        method: 'PATCH',
      }),
    )

    const raw = localStorage.getItem('evoflow_orders')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'ORDER_001',
          status: 'pending_travel',
        }),
      ]),
    )

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText(maskId('110105199001011234'))).toBeInTheDocument()
    expect(screen.getByText(maskPhone('13800138000'))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '返回首页' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  it('Scenario 5.1.2 状态异常（重复创建防抖）', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    sessionStorage.setItem('createdOrderId', 'ORDER_001')
    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          id: 'ORDER_001',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          amount: 518,
          details: {
            passenger: { name: '张三', idType: '身份证', idNumberMasked: maskId('110105199001011234') },
            contact: { phoneNumberMasked: maskPhone('13800138000') },
          },
        },
      ]),
    )

    const { rerender } = renderWithAuth(<BuyTicketStep4 />, { route: '/buy-ticket/step4?orderId=ORDER_001' })
    rerender(<BuyTicketStep4 />)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(screen.getByText('成功出票')).toBeInTheDocument()
  })

  it('Scenario 5.1.3 系统异常（订单更新失败）', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('storage down'))
    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          id: 'ORDER_001',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          amount: 518,
          details: {
            passenger: { name: '张三', idType: '身份证', idNumberMasked: maskId('110105199001011234') },
            contact: { phoneNumberMasked: maskPhone('13800138000') },
          },
        },
      ]),
    )

    renderWithAuth(<BuyTicketStep4 />, { route: '/buy-ticket/step4?orderId=ORDER_001' })

    expect(screen.getByText('成功出票')).toBeInTheDocument()
    expect(await screen.findByText('订单更新失败，稍后查看订单中心')).toBeInTheDocument()
  })

  it('Scenario 5.1.4 信息一致性（完成页乘机人摘要）', () => {
    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        passenger: { name: '张三', idType: '身份证', idNumber: '110105199001011234' },
        contact: { phoneNumber: '13800138000' },
      }),
    )

    renderWithAuth(<BuyTicketStep4 />, { route: '/buy-ticket/step4?orderId=ORDER_001' })

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText(maskId('110105199001011234'))).toBeInTheDocument()
  })
})

