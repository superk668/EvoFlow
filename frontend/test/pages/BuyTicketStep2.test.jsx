import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import BuyTicketStep1 from '../../src/pages/BuyTicketStep1/BuyTicketStep1.jsx'
import BuyTicketStep2 from '../../src/pages/BuyTicketStep2/BuyTicketStep2.jsx'
import BuyTicketStep3 from '../../src/pages/BuyTicketStep3/BuyTicketStep3.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function maskPhone(phone) {
  const p = String(phone).replace(/\s+/g, '')
  return `${p.slice(0, 3)}****${p.slice(-4)}`
}

function maskId(idNumber) {
  const s = String(idNumber).replace(/\s+/g, '')
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

describe('BuyTicketStep2 Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 3.1.1 正常选择服务进入支付', async () => {
    const user = userEvent.setup()

    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        flightId: 'MU5185',
        packageId: '0',
        departDate: new Date().toISOString().slice(0, 10),
        priceVersion: 'v1',
        passenger: { name: '张三', idType: '身份证', idNumber: '110105199001011234', phoneNumber: '' },
        contact: { phoneNumber: '13800138000' },
        services: [],
        stage: 'services',
      }),
    )

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          orderId: 'ORDER_001',
          status: 'pending_payment',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }),
        { status: 201 },
      ),
    )

    renderWithAuth(<BuyTicketStep2 />, {
      route: '/buy-ticket/step2?from=上海(SHA)&to=北京(BJS)&date=2026-01-17&flight=MU5185&fare=0&total=518',
      routes: (
        <>
          <Route path="/buy-ticket/step1" element={<BuyTicketStep1 />} />
          <Route path="/buy-ticket/step2" element={<BuyTicketStep2 />} />
          <Route path="/buy-ticket/step3" element={<BuyTicketStep3 />} />
        </>
      ),
    })

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText(maskId('110105199001011234'))).toBeInTheDocument()
    expect(screen.getByText(maskPhone('13800138000'))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '去支付' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/orders/flight',
      expect.objectContaining({
        method: 'POST',
      }),
    )

    const ordersRaw = localStorage.getItem('evoflow_orders')
    expect(ordersRaw).not.toBeNull()
    expect(JSON.parse(ordersRaw)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'ORDER_001',
          productType: 'flight',
          status: 'pending_payment',
          details: expect.objectContaining({
            passenger: expect.objectContaining({
              name: '张三',
              idNumberMasked: maskId('110105199001011234'),
            }),
            contact: expect.objectContaining({
              phoneNumberMasked: maskPhone('13800138000'),
            }),
          }),
        }),
      ]),
    )
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step3'))
    expect(screen.getByTestId('location')).toHaveTextContent('orderId=ORDER_001')
  })

  it('Scenario 3.1.x 重复创建订单应直接进入支付', async () => {
    const user = userEvent.setup()

    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        flightId: 'MU5185',
        packageId: '0',
        departDate: new Date().toISOString().slice(0, 10),
        priceVersion: 'v1',
        passenger: { name: '张三', idType: '身份证', idNumber: '110105199001011234', phoneNumber: '' },
        contact: { phoneNumber: '13800138000' },
        services: [],
        stage: 'services',
      }),
    )

    localStorage.setItem(
      'evoflow_orders',
      JSON.stringify([
        {
          id: 'ORDER_DUP',
          orderId: 'ORDER_DUP',
          productType: 'flight',
          status: 'pending_payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          amount: 518,
          totalAmount: 518,
          details: {
            passenger: { name: '张三', idType: '身份证', idNumberMasked: maskId('110105199001011234') },
            contact: { phoneNumberMasked: maskPhone('13800138000') },
            priceItems: [{ name: '机票', unitPrice: 518, quantity: 1 }],
          },
        },
      ]),
    )

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Not found.' }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Duplicate order create.' }), { status: 409 }))

    renderWithAuth(<BuyTicketStep2 />, {
      route: '/buy-ticket/step2?from=上海(SHA)&to=北京(BJS)&date=2026-01-17&flight=MU5185&fare=0&total=518',
      routes: (
        <>
          <Route path="/buy-ticket/step1" element={<BuyTicketStep1 />} />
          <Route path="/buy-ticket/step2" element={<BuyTicketStep2 />} />
          <Route path="/buy-ticket/step3" element={<BuyTicketStep3 />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: '去支付' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step3'))
    expect(screen.getByTestId('location')).toHaveTextContent('orderId=ORDER_DUP')
    expect(screen.queryByText('订单已创建，请前往支付')).not.toBeInTheDocument()
  })

  it('Scenario 3.1.2 状态异常（服务不可用）', async () => {
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
        stage: 'services',
      }),
    )

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: 'Service unavailable.' }), { status: 503 }))

    renderWithAuth(<BuyTicketStep2 />, { route: '/buy-ticket/step2' })

    await user.click(screen.getAllByRole('button', { name: '添加保障' })[0])

    expect(await screen.findByText('服务暂不可用')).toBeInTheDocument()
  })

  it('Scenario 3.1.3 系统异常（服务列表加载失败）', async () => {
    sessionStorage.setItem(
      'bookingDraft',
      JSON.stringify({
        flightId: 'MU5185',
        packageId: '0',
        departDate: new Date().toISOString().slice(0, 10),
        priceVersion: 'v1',
        passenger: { name: '张三', idType: '身份证', idNumber: '110105199001011234' },
        contact: { phoneNumber: '13800138000' },
        services: [],
        stage: 'services',
      }),
    )

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    renderWithAuth(<BuyTicketStep2 />, { route: '/buy-ticket/step2' })

    expect(await screen.findByText(/加载失败/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '去支付' })).toBeEnabled()
  })

  it('Scenario 3.1.4 信息一致性（服务页乘机人摘要）', () => {
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
        stage: 'services',
      }),
    )

    renderWithAuth(<BuyTicketStep2 />, { route: '/buy-ticket/step2' })

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText(maskId('110105199001011234'))).toBeInTheDocument()
  })

  it('Scenario 3.1.5 状态异常（草稿缺失）', async () => {
    const user = userEvent.setup()

    renderWithAuth(<BuyTicketStep2 />, {
      route: '/buy-ticket/step2',
      routes: (
        <>
          <Route path="/buy-ticket/step1" element={<BuyTicketStep1 />} />
          <Route path="/buy-ticket/step2" element={<BuyTicketStep2 />} />
        </>
      ),
    })

    expect(await screen.findByText('订单信息异常，请返回重新填写')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '去支付' })).toBeDisabled()

    await user.click(screen.getByRole('link', { name: /返回订票页|返回修改/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step1')
  })
})
