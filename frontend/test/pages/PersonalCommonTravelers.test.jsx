import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import MainLayout from '../../src/layouts/MainLayout/MainLayout.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import PersonalCommonTravelers from '../../src/pages/PersonalCommonTravelers/PersonalCommonTravelers.jsx'
import { renderWithAuth } from '../utils/render.jsx'

describe('常用旅客信息 Scenarios', () => {
  it('Scenario: 列表正常展示与搜索', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 't1',
          isSelf: false,
          nameZh: '张三',
          phoneNumber: '13800138000',
          idType: '身份证',
          idNumber: '11010119900307611X',
          nationality: '中国',
          gender: '男',
          frequentFlyerCards: [],
        },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, {
      route: '/user-center/common-info/travelers',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
        </>
      ),
    })

    await user.type(screen.getByPlaceholderText('中文名/英文名'), '张')
    await user.click(screen.getByRole('button', { name: '查询' }))

    expect(screen.getByText('张三')).toBeInTheDocument()
  })

  it('Scenario: 输入异常（非法搜索字符）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 't1',
          isSelf: false,
          nameZh: '张三',
        },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, {
      route: '/user-center/common-info/travelers',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
        </>
      ),
    })

    await user.clear(screen.getByPlaceholderText('中文名/英文名'))
    await user.type(screen.getByPlaceholderText('中文名/英文名'), '!!!')
    await user.click(screen.getByRole('button', { name: '查询' }))

    expect(screen.getByText('请输入合法的姓名关键字')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
  })

  it('Scenario: 状态异常（本人条目不可删除）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'self',
          isSelf: true,
          nameZh: '本人',
          phoneNumber: '13800138000',
          idType: '身份证',
          idNumber: '11010119900307611X',
        },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, {
      route: '/user-center/common-info/travelers',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
        </>
      ),
    })

    await user.click(screen.getByLabelText('选择-self'))
    await user.click(screen.getByRole('link', { name: '删除' }))

    expect(screen.getByText('本人信息不可删除')).toBeInTheDocument()
  })

  it('Scenario: 系统异常（列表加载失败）', async () => {
    localStorage.setItem('evoflow_common_travelers', '{bad json')

    renderWithAuth(<PersonalCommonTravelers />, {
      route: '/user-center/common-info/travelers',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
        </>
      ),
    })

    expect(screen.getByText('加载失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument()
  })

  it('Scenario: 批量删除正常流程', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        { travelerId: 't1', isSelf: false, nameZh: '张三' },
        { travelerId: 't2', isSelf: false, nameZh: '李四' },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, {
      route: '/user-center/common-info/travelers',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
        </>
      ),
    })

    await user.click(screen.getByLabelText('选择-t1'))
    await user.click(screen.getByLabelText('选择-t2'))
    await user.click(screen.getByRole('link', { name: '删除' }))
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    expect(screen.queryByText('张三')).not.toBeInTheDocument()
    expect(screen.queryByText('李四')).not.toBeInTheDocument()
  })

  it('Scenario: 输入异常（未选择记录）', async () => {
    const user = userEvent.setup()

    localStorage.setItem('evoflow_common_travelers', JSON.stringify([{ travelerId: 't1', isSelf: false, nameZh: '张三' }]))

    renderWithAuth(<PersonalCommonTravelers />, {
      route: '/user-center/common-info/travelers',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '删除' }))
    expect(screen.getByText('请先选择要删除的记录')).toBeInTheDocument()
  })

  it('Scenario: 状态异常（包含不可删除条目）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        { travelerId: 'self', isSelf: true, nameZh: '本人' },
        { travelerId: 't2', isSelf: false, nameZh: '李四' },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, {
      route: '/user-center/common-info/travelers',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
        </>
      ),
    })

    await user.click(screen.getByLabelText('选择-self'))
    await user.click(screen.getByLabelText('选择-t2'))
    await user.click(screen.getByRole('link', { name: '删除' }))

    expect(screen.getByText('包含不可删除的记录')).toBeInTheDocument()
    expect(screen.getByText('本人')).toBeInTheDocument()
  })

  it('Scenario: 系统异常（删除失败）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([{ travelerId: 't1', isSelf: false, nameZh: '张三' }]),
    )

    vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage write failed')
    })

    renderWithAuth(<PersonalCommonTravelers />, {
      route: '/user-center/common-info/travelers',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
        </>
      ),
    })

    await user.click(screen.getByLabelText('选择-t1'))
    await user.click(screen.getByRole('link', { name: '删除' }))
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    expect(screen.getByText('删除失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByLabelText('选择-t1')).toBeChecked()
  })

  it('Scenario: 状态异常（未登录）', async () => {
    renderWithAuth(<MainLayout />, {
      route: '/user-center/common-info/travelers',
      auth: { isLoggedIn: false },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
          </Route>
          <Route path="/login" element={<Login />} />
        </>
      ),
    })

    expect(sessionStorage.getItem('postLoginRedirect')).toBe('/user-center/common-info/travelers')
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })
})

