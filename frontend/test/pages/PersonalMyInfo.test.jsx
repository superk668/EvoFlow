import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import MainLayout from '../../src/layouts/MainLayout/MainLayout.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import PersonalMyInfo from '../../src/pages/PersonalMyInfo/PersonalMyInfo.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function formatIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function addDays(d, days) {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

describe('我的信息 Scenarios', () => {
  it('Scenario: 查看个人信息（正常流程）', () => {
    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/my-info" element={<PersonalMyInfo />} />
        </>
      ),
    })

    expect(screen.getByText('个人信息设置')).toBeInTheDocument()
    expect(screen.getByText('头像设置')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument()
    expect(screen.getByText('手机')).toBeInTheDocument()
    expect(screen.getByText('邮箱')).toBeInTheDocument()
    expect(screen.getByText('昵称')).toBeInTheDocument()
    expect(screen.getByText('姓名')).toBeInTheDocument()
    expect(screen.getByText('性别')).toBeInTheDocument()
    expect(screen.getByText('生日')).toBeInTheDocument()
  })

  it('Scenario: 进入编辑并保存成功（正常流程）', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/my-info" element={<PersonalMyInfo />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.clear(screen.getByLabelText('姓名'))
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.click(screen.getByLabelText('性别-男'))
    await user.clear(screen.getByPlaceholderText('yyyy-MM-dd'))
    await user.type(screen.getByPlaceholderText('yyyy-MM-dd'), formatIsoDate(addDays(new Date(), -1)))

    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetchSpy).toHaveBeenCalled()
    expect(screen.getByText('新昵称将在审核后生效')).toBeInTheDocument()
    expect(screen.getByText('新昵称')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
  })

  it('Scenario: 输入异常：昵称为空或超长', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/my-info" element={<PersonalMyInfo />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('昵称'))
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByText('请输入昵称（不超过20字符）')).toBeInTheDocument()
  })

  it('Scenario: 输入异常：姓名为空或包含非法字符', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/my-info" element={<PersonalMyInfo />} />
        </>
      ),
    })

    await user.click(screen.getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '合法昵称')
    await user.clear(screen.getByLabelText('姓名'))
    await user.type(screen.getByLabelText('姓名'), '张三1')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByText('请输入合法姓名')).toBeInTheDocument()
  })

  it('Scenario: 输入异常：生日格式错误或为未来日期', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true },
    })

    await user.click(screen.getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '合法昵称')
    await user.clear(screen.getByLabelText('姓名'))
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.click(screen.getByLabelText('性别-男'))

    await user.clear(screen.getByPlaceholderText('yyyy-MM-dd'))
    await user.type(screen.getByPlaceholderText('yyyy-MM-dd'), formatIsoDate(addDays(new Date(), 1)))
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByText('日期格式应为 yyyy-MM-dd，且不得为未来日期')).toBeInTheDocument()
  })

  it('Scenario: 状态异常：昵称审核中不可再次修改', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_user_profile',
      JSON.stringify({
        nickname: '审核昵称',
        nicknameStatus: 'reviewing',
        name: '张三',
        gender: '男',
        birthday: '2000-01-01',
      }),
    )

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true },
    })

    await user.click(screen.getByRole('button', { name: '编辑' }))

    expect(screen.getByText('昵称审核中，暂不可修改')).toBeInTheDocument()
    expect(screen.getByLabelText('昵称')).toBeDisabled()
  })

  it('Scenario: 状态异常：未登录访问', async () => {
    renderWithAuth(<MainLayout />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: false },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route path="user-center/my-info" element={<PersonalMyInfo />} />
          </Route>
          <Route path="/login" element={<Login />} />
        </>
      ),
    })

    expect(sessionStorage.getItem('postLoginRedirect')).toBe('/user-center/my-info')
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('Network Failure 保存失败应提示并解除禁用态且保留输入', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true },
    })

    await user.click(screen.getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.clear(screen.getByLabelText('姓名'))
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.click(screen.getByLabelText('性别-男'))
    await user.clear(screen.getByPlaceholderText('yyyy-MM-dd'))
    await user.type(screen.getByPlaceholderText('yyyy-MM-dd'), formatIsoDate(addDays(new Date(), -1)))

    const save = screen.getByRole('button', { name: '保存' })
    await user.click(save)

    expect(save).not.toBeDisabled()
    expect(screen.getByText('保存失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByLabelText('昵称')).toHaveValue('新昵称')
  })

  it('Scenario: 头像编辑入口点击（正常流程）', async () => {
    const user = userEvent.setup()

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true },
    })

    await user.click(screen.getByRole('button', { name: '头像编辑' }))
    expect(screen.getByText('头像编辑入口')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '返回' }))
    expect(screen.getByText('个人信息设置')).toBeInTheDocument()
  })

  it('Scenario: 交互：点击“收起”返回只读态', async () => {
    const user = userEvent.setup()

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info?edit=true',
      auth: { isLoggedIn: true },
    })

    await user.click(screen.getByRole('link', { name: '收起' }))
    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument()
  })

  it('Scenario: 系统异常：并发覆盖（乐观锁冲突）', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: 'conflict' }), { status: 409 }))

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true },
    })

    await user.click(screen.getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.clear(screen.getByLabelText('姓名'))
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.click(screen.getByLabelText('性别-男'))
    await user.clear(screen.getByPlaceholderText('yyyy-MM-dd'))
    await user.type(screen.getByPlaceholderText('yyyy-MM-dd'), formatIsoDate(addDays(new Date(), -1)))

    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('信息已被更新，请刷新后重试')).toBeInTheDocument()
  })
})
