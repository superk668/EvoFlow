import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import BuyTicketStep1 from '../../src/pages/BuyTicketStep1/BuyTicketStep1.jsx'
import BuyTicketStep2 from '../../src/pages/BuyTicketStep2/BuyTicketStep2.jsx'
import { renderWithAuth } from '../utils/render.jsx'

describe('Booking PassengerContact Scenarios', () => {
  it('Scenario 2.1.1 正常填写并校验通过进入下一步', async () => {
    const user = userEvent.setup()

    renderWithAuth(<BuyTicketStep1 />, {
      route: '/booking',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/booking" element={<BuyTicketStep1 />} />
          <Route path="/booking/services" element={<BuyTicketStep2 />} />
        </>
      ),
    })

    await user.type(screen.getByRole('textbox', { name: '姓名' }), '张三')
    await user.selectOptions(screen.getByRole('combobox', { name: '证件类型' }), '身份证')
    await user.type(screen.getByRole('textbox', { name: '证件号' }), '11010119900307611X')
    await user.type(screen.getByRole('textbox', { name: '联系人手机号' }), '13800138000')
    await user.click(screen.getByRole('button', { name: '下一步' }))

    expect(sessionStorage.getItem('bookingDraft')).toContain('passenger')
    expect(screen.getByTestId('location')).toHaveTextContent('/booking/services')
  })

  it('Scenario 2.1.2 输入异常（证件号格式错误）提示证件号码格式不正确并阻止进入下一步', async () => {
    const user = userEvent.setup()

    renderWithAuth(<BuyTicketStep1 />, {
      route: '/booking',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/booking" element={<BuyTicketStep1 />} />
          <Route path="/booking/services" element={<BuyTicketStep2 />} />
        </>
      ),
    })

    await user.selectOptions(screen.getByRole('combobox', { name: '证件类型' }), '身份证')
    await user.type(screen.getByRole('textbox', { name: '证件号' }), 'bad')
    await user.click(screen.getByRole('button', { name: '下一步' }))

    expect(screen.getByText('证件号码格式不正确')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/booking')
  })

  it('Scenario 2.1.3 输入异常（联系人手机号非法）提示联系人手机号格式不正确并阻止进入下一步', async () => {
    const user = userEvent.setup()

    renderWithAuth(<BuyTicketStep1 />, {
      route: '/booking',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/booking" element={<BuyTicketStep1 />} />
          <Route path="/booking/services" element={<BuyTicketStep2 />} />
        </>
      ),
    })

    await user.type(screen.getByRole('textbox', { name: '联系人手机号' }), '123')
    await user.click(screen.getByRole('button', { name: '下一步' }))

    expect(screen.getByText('联系人手机号格式不正确')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/booking')
  })

  it('Scenario 2.1.4 系统异常（会话持久化失败）提示网络异常且保留输入数据', async () => {
    const user = userEvent.setup()

    const originalSetItem = window.sessionStorage.setItem
    vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('write failed')
    })

    renderWithAuth(<BuyTicketStep1 />, {
      route: '/booking',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/booking" element={<BuyTicketStep1 />} />
          <Route path="/booking/services" element={<BuyTicketStep2 />} />
        </>
      ),
    })

    await user.type(screen.getByRole('textbox', { name: '姓名' }), '张三')
    await user.click(screen.getByRole('button', { name: '下一步' }))

    expect(screen.getByText('网络异常，请稍后重试')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '姓名' })).toHaveValue('张三')

    window.sessionStorage.setItem = originalSetItem
  })
})
