import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

function formatDateYYYYMMDD(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseYYYYMMDD(dateString) {
  const [y, m, d] = dateString.split('-').map((v) => Number(v))
  return new Date(y, m - 1, d)
}

describe('Home Scenarios', () => {
  it('0.1 用户菜单：触摸用户名位置展现下拉菜单', async () => {
    renderAtHash('#/')

    const userMenu = screen.getByText(/尊敬的/)
    fireEvent.touchStart(userMenu)

    expect(screen.getByText('用户名')).toBeInTheDocument()
    expect(screen.getByText('常用信息')).toBeInTheDocument()
  })

  it('0.1 用户菜单：点击下拉菜单中的用户名跳转到个人中心-我的信息', async () => {
    const user = userEvent.setup()
    renderAtHash('#/')

    fireEvent.touchStart(screen.getByText(/尊敬的/))
    await user.click(screen.getByText('用户名'))

    expect(window.location.hash).toBe('#/user-center/my-info')
  })

  it('0.1 用户菜单：点击下拉菜单中的常用信息跳转到个人中心-常用旅客信息', async () => {
    const user = userEvent.setup()
    renderAtHash('#/')

    fireEvent.touchStart(screen.getByText(/尊敬的/))
    await user.click(screen.getByText('常用信息'))

    expect(window.location.hash).toBe('#/user-center/common-info/travelers')
  })

  it('0.2 订单入口：点击我的订单跳转到个人订单中心', async () => {
    const user = userEvent.setup()
    renderAtHash('#/')

    await user.click(screen.getByText('我的订单'))
    expect(window.location.hash).toBe('#/user-center/orders')
  })

  it('0.1.3 未登录首页点击“登录”按钮：跳转至登录界面', async () => {
    const user = userEvent.setup()
    renderAtHash('#/')

    await user.click(screen.getByText('登录'))
    expect(window.location.hash).toBe('#/login')
  })

  it('0.1.3 未登录首页点击“注册”按钮：跳转至注册界面', async () => {
    const user = userEvent.setup()
    renderAtHash('#/')

    await user.click(screen.getByText('注册'))
    expect(window.location.hash).toMatch(/^#\/register/)
  })

  it('0.1.4 未登录点击“我的订单”：跳转至登录页且默认展示账号密码登录', async () => {
    const user = userEvent.setup()
    renderAtHash('#/')

    await user.click(screen.getByText('我的订单'))
    expect(window.location.hash).toBe('#/login')
    expect(screen.getByText('账号密码登录')).toBeInTheDocument()
  })

  it('首页点击“搜索”：跳转结果页且 URL 包含合法 date 参数', async () => {
    const user = userEvent.setup()
    renderAtHash('#/')

    await user.click(screen.getByRole('link', { name: '搜索' }))

    const url = new URL(`http://localhost${window.location.hash.slice(1)}`)
    expect(url.pathname).toBe('/flights/list')
    expect(url.searchParams.get('dcity')).toBeTruthy()
    expect(url.searchParams.get('acity')).toBeTruthy()
    const departDate = url.searchParams.get('date')
    expect(departDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const parsedDepartDate = parseYYYYMMDD(departDate)
    expect(formatDateYYYYMMDD(parsedDepartDate)).toBe(departDate)
    expect(parsedDepartDate.getTime()).toBeGreaterThanOrEqual(today.getTime())

    expect(screen.getByText('出发日期')).toBeInTheDocument()
  })

  it('任意页面点击“首页”按钮：跳转回首页', async () => {
    const user = userEvent.setup()
    renderAtHash('#/flights/list')

    await user.click(screen.getByText('首页'))
    expect(window.location.hash).toBe('#/')
    expect(screen.getByText('低价速报')).toBeInTheDocument()
  })
})
