import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import BuyTicketStep1 from '../../src/pages/BuyTicketStep1/BuyTicketStep1.jsx'
import BuyTicketStep3 from '../../src/pages/BuyTicketStep3/BuyTicketStep3.jsx'
import BuyTicketStep4 from '../../src/pages/BuyTicketStep4/BuyTicketStep4.jsx'
import Home from '../../src/pages/Home/Home.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function maskPhone(phone) {
  const p = String(phone).replace(/\s+/g, '')
  return `${p.slice(0, 3)}****${p.slice(-4)}`
}

function maskId(idNumber) {
  const s = String(idNumber).replace(/\s+/g, '')
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

describe('BuyTicketStep3 Scenarios', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('Scenario 4.1.1 正常支付并进入完成页', async () => {
    const user = userEvent.setup()

    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        flightId: 'MU5185',
        packageId: '0',
        departDate: '2026-01-17',
        priceVersion: 'v1',
        passenger: { name: '张三', idType: '身份证', idNumber: '110105199001011234' },
        contact: { phoneNumber: '13800138000' },
        services: [],
        stage: 'payment',
      }),
    )

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

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ paidAt: new Date().toISOString(), nextRoute: '/buy-ticket/step4' }), { status: 200 }),
    )

    renderWithAuth(<BuyTicketStep3 />, {
      route: '/buy-ticket/step3?orderId=ORDER_001&from=上海(SHA)&to=北京(BJS)&date=2026-01-17&depTime=21:05&total=518',
      routes: (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/buy-ticket/step1" element={<BuyTicketStep1 />} />
          <Route path="/buy-ticket/step3" element={<BuyTicketStep3 />} />
          <Route path="/buy-ticket/step4" element={<BuyTicketStep4 />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: /支付/ }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/orders/ORDER_001/pay',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step4'))
  })

  it('Scenario 4.1.2 信息一致性（乘机人与身份证信息）', () => {
    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        flightId: 'MU5185',
        packageId: '0',
        departDate: '2026-01-17',
        priceVersion: 'v1',
        passenger: { name: '张三', idType: '身份证', idNumber: '110105199001011234' },
        contact: { phoneNumber: '13800138000' },
        services: [],
        stage: 'payment',
      }),
    )

    renderWithAuth(<BuyTicketStep3 />, { route: '/buy-ticket/step3?orderId=ORDER_001' })

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText(maskId('110105199001011234'))).toBeInTheDocument()
  })

  it('Scenario 4.1.3 状态异常（乘机人信息缺失或不一致）', async () => {
    renderWithAuth(<BuyTicketStep3 />, {
      route: '/buy-ticket/step3?orderId=ORDER_001',
      routes: (
        <>
          <Route path="/buy-ticket/step1" element={<BuyTicketStep1 />} />
          <Route path="/buy-ticket/step3" element={<BuyTicketStep3 />} />
        </>
      ),
    })

    expect(await screen.findByText('乘机人信息异常，请返回重新填写')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /支付/ })).toBeDisabled()
    await userEvent.setup().click(screen.getByRole('link', { name: /返回订票页|返回重新填写|返回/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step1')
  })

  it('Scenario 4.1.4 输入异常（新卡信息不完整）', async () => {
    const user = userEvent.setup()

    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        flightId: 'MU5185',
        packageId: '0',
        departDate: '2026-01-17',
        priceVersion: 'v1',
        passenger: { name: '张三', idType: '身份证', idNumber: '110105199001011234' },
        contact: { phoneNumber: '13800138000' },
        services: [],
        stage: 'payment',
      }),
    )

    renderWithAuth(<BuyTicketStep3 />, { route: '/buy-ticket/step3?orderId=ORDER_001' })

    await user.click(screen.getByText('使用新卡支付'))

    await user.type(screen.getByPlaceholderText('卡号'), '6222020202020202')
    await user.type(screen.getByPlaceholderText('姓名'), '张三')

    const payBtn = screen.getByRole('button', { name: /支付/ })
    expect(payBtn).toBeDisabled()
    expect(screen.getByText('请填写完整且有效的卡信息')).toBeInTheDocument()
  })

  it('Scenario 4.1.5 状态异常（倒计时到期）', async () => {
    vi.useFakeTimers()

    const baseNow = new Date('2026-01-01T00:00:00.000Z')
    vi.setSystemTime(baseNow)


    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          id: 'ORDER_001',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(baseNow.getTime() + 1000).toISOString(),
          amount: 518,
          details: {
            passenger: { name: '张三', idType: '身份证', idNumberMasked: maskId('110105199001011234') },
            contact: { phoneNumberMasked: maskPhone('13800138000') },
          },
        },
      ]),
    )
    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        flightId: 'MU5185',
        packageId: '0',
        departDate: '2026-01-17',
        priceVersion: 'v1',
        passenger: { name: '张三', idType: '身份证', idNumber: '110105199001011234' },
        contact: { phoneNumber: '13800138000' },
        services: [],
        stage: 'payment',
      }),
    )

    renderWithAuth(<BuyTicketStep3 />, {
      route: '/buy-ticket/step3?orderId=ORDER_001',
      routes: (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/buy-ticket/step3" element={<BuyTicketStep3 />} />
        </>
      ),
    })

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(screen.getByText('超出时间，请重新开始订单')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: '返回首页' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  it('Scenario 4.1.6 系统异常（支付请求失败）', async () => {
    const user = userEvent.setup()

    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        flightId: 'MU5185',
        packageId: '0',
        departDate: '2026-01-17',
        priceVersion: 'v1',
        passenger: { name: '张三', idType: '身份证', idNumber: '110105199001011234' },
        contact: { phoneNumber: '13800138000' },
        services: [],
        stage: 'payment',
      }),
    )
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

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('payment down'))

    renderWithAuth(<BuyTicketStep3 />, { route: '/buy-ticket/step3?orderId=ORDER_001' })

    const payBtn = screen.getByRole('button', { name: /支付/ })
    await user.click(payBtn)

    expect(payBtn).not.toBeDisabled()
    expect(await screen.findByText('支付失败，请稍后重试')).toBeInTheDocument()
  })
})
