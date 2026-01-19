import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import BuyTicketStep1 from '../../src/pages/BuyTicketStep1/BuyTicketStep1.jsx'
import BuyTicketStep2 from '../../src/pages/BuyTicketStep2/BuyTicketStep2.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function isoTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

describe('BuyTicketStep1 Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 2.1.1 正常填写并校验通过进入下一步', async () => {
    const user = userEvent.setup()
    const departDate = isoTomorrow()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    renderWithAuth(<BuyTicketStep1 />, {
      route: `/buy-ticket/step1?from=上海(SHA)&to=北京(BJS)&date=${departDate}&flight=MU5185&fare=0&total=518`,
      routes: (
        <>
          <Route path="/buy-ticket/step1" element={<BuyTicketStep1 />} />
          <Route path="/buy-ticket/step2" element={<BuyTicketStep2 />} />
        </>
      ),
    })

    await user.type(screen.getByPlaceholderText('请与登机证件姓名保持一致'), '张三')
    await user.type(screen.getByPlaceholderText('登机证件号码'), '110105199001011234')
    await user.type(screen.getByPlaceholderText('联系人手机号'), '13800138000')

    await user.click(screen.getByRole('button', { name: '下一步' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/booking/draft',
      expect.objectContaining({
        method: 'PUT',
      }),
    )

    const raw = sessionStorage.getItem('bookingDraft')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw)).toMatchObject({
      passenger: {
        name: '张三',
        idType: '身份证',
        idNumber: '110105199001011234',
      },
      contact: {
        phoneNumber: '13800138000',
      },
    })
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step2'))
  })

  it('Scenario 2.1.2 输入异常（证件号格式错误）', async () => {
    const user = userEvent.setup()

    renderWithAuth(<BuyTicketStep1 />, { route: '/buy-ticket/step1' })

    await user.type(screen.getByPlaceholderText('请与登机证件姓名保持一致'), '张三')
    await user.type(screen.getByPlaceholderText('登机证件号码'), '123')
    await user.type(screen.getByPlaceholderText('联系人手机号'), '13800138000')
    await user.click(screen.getByRole('button', { name: '下一步' }))

    expect(screen.getByText('证件号码格式不正确')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step1')
  })

  it('Scenario 2.1.3 输入异常（联系人手机号非法）', async () => {
    const user = userEvent.setup()

    renderWithAuth(<BuyTicketStep1 />, { route: '/buy-ticket/step1' })

    await user.type(screen.getByPlaceholderText('请与登机证件姓名保持一致'), '张三')
    await user.type(screen.getByPlaceholderText('登机证件号码'), '110105199001011234')
    await user.type(screen.getByPlaceholderText('联系人手机号'), '123')
    await user.click(screen.getByRole('button', { name: '下一步' }))

    expect(screen.getByText('联系人手机号格式不正确')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/buy-ticket/step1')
  })

  it('Scenario 2.1.4 系统异常（会话持久化失败）', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    renderWithAuth(<BuyTicketStep1 />, { route: '/buy-ticket/step1' })

    const nameInput = screen.getByPlaceholderText('请与登机证件姓名保持一致')
    const idInput = screen.getByPlaceholderText('登机证件号码')
    const contactInput = screen.getByPlaceholderText('联系人手机号')
    await user.type(nameInput, '张三')
    await user.type(idInput, '110105199001011234')
    await user.type(contactInput, '13800138000')

    const nextBtn = screen.getByRole('button', { name: '下一步' })
    await user.click(nextBtn)

    expect(nextBtn).not.toBeDisabled()
    expect(screen.getByText('网络异常，请稍后重试')).toBeInTheDocument()
    expect(nameInput).toHaveValue('张三')
    expect(idInput).toHaveValue('110105199001011234')
    expect(contactInput).toHaveValue('13800138000')
  })
})
