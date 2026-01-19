import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render } from '@testing-library/react'
import PersonalMyInfo from '../../src/pages/PersonalMyInfo/PersonalMyInfo.jsx'
import MainLayout from '../../src/layouts/MainLayout/MainLayout.jsx'
import { AuthContext } from '../../src/auth/AuthContext.jsx'
import { renderWithAuth } from '../utils/render.jsx'

describe('PersonalMyInfo Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 3.3 查看个人信息（正常流程）', () => {
    localStorage.setItem(
      'evoflow_user_profile',
      JSON.stringify({
        nickname: '小明',
        name: '张三',
        gender: '男',
        birthday: '2000-01-01',
        emailStatus: '未填写',
      }),
    )

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true, userDisplayName: '测试用户', phoneNumber: '13812343769' },
    })

    expect(screen.getByText('个人信息设置')).toBeInTheDocument()
    expect(screen.getByText('86-138*****3769')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '编辑' })[0]).toBeInTheDocument()
    expect(screen.getByText('头像设置')).toBeInTheDocument()
  })

  it('Scenario 3.3 进入编辑并保存成功（正常流程）', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 204, json: async () => ({}) })

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true, userDisplayName: '测试用户', phoneNumber: '13812343769' },
    })

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/my-info?edit=true')

    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '新昵称')

    await user.clear(screen.getByLabelText('姓名'))
    await user.type(screen.getByLabelText('姓名'), '张三')

    await user.click(screen.getByRole('radio', { name: '男' }))
    await user.clear(screen.getByLabelText('生日'))
    await user.type(screen.getByLabelText('生日'), '2001-02-03')

    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(localStorage.getItem('evoflow_user_profile')).toContain('新昵称')
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/user-center/my-info',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: expect.any(String),
      }),
    )
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/my-info')
    expect(screen.getAllByText('新昵称将在审核后生效').length).toBeGreaterThan(0)
  })

  it('Scenario 3.3 输入异常：昵称为空或超长', async () => {
    const user = userEvent.setup()
    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
    })

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0])
    await user.clear(screen.getByLabelText('昵称'))
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入昵称（不超过20字符）')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), 'a'.repeat(21))
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入昵称（不超过20字符）')).toBeInTheDocument()
  })

  it('Scenario 3.3 输入异常：姓名为空或包含非法字符', async () => {
    const user = userEvent.setup()
    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info?edit=true',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
    })

    await user.clear(screen.getByLabelText('姓名'))
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入合法姓名')).toBeInTheDocument()

    await user.type(screen.getByLabelText('姓名'), '张三1')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入合法姓名')).toBeInTheDocument()
  })

  it('Scenario 3.3 输入异常：生日格式错误或为未来日期', async () => {
    const user = userEvent.setup()
    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info?edit=true',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
    })

    await user.clear(screen.getByLabelText('生日'))
    await user.type(screen.getByLabelText('生日'), '2026/01/01')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('日期格式应为 yyyy-MM-dd')).toBeInTheDocument()

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const yyyy = tomorrow.getFullYear()
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const dd = String(tomorrow.getDate()).padStart(2, '0')
    const future = `${yyyy}-${mm}-${dd}`

    await user.clear(screen.getByLabelText('生日'))
    await user.type(screen.getByLabelText('生日'), future)
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('日期格式应为 yyyy-MM-dd，且不得为未来日期')).toBeInTheDocument()
  })

  it('Scenario 3.3 状态异常：昵称审核中不可再次编辑', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'evoflow_user_profile',
      JSON.stringify({ nickname: '旧昵称', nicknameStatus: 'reviewing', name: '张三', gender: '男', birthday: '' }),
    )

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
    })

    await user.click(screen.getAllByRole('button', { name: '编辑' })[0])
    expect(screen.getByText('昵称审核中，暂不可修改')).toBeInTheDocument()
    expect(screen.getByLabelText('昵称')).toBeDisabled()
    expect(screen.getByText('审核中')).toBeInTheDocument()
  })

  it('Scenario 3.3 系统异常：保存失败（网络异常）', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info?edit=true',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
    })

    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.clear(screen.getByLabelText('姓名'))
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.click(screen.getByRole('radio', { name: '男' }))
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(fetchSpy).toHaveBeenCalled()
    expect(await screen.findByText('已保存，本次同步失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/my-info')
  })

  it('Scenario 3.3 系统异常：并发覆盖（乐观锁冲突）', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 409, json: async () => ({}) })

    localStorage.setItem(
      'evoflow_user_profile',
      JSON.stringify({ nickname: '旧昵称', name: '张三', gender: '男', birthday: '2000-01-01', profileVersion: 'v1' }),
    )

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info?edit=true',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
    })

    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByText('信息已被更新，请刷新后重试')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/my-info?edit=true')
  })

  it('Scenario 3.3 系统异常：接口失败但本地保存成功（兜底）', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('timeout'))

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info?edit=true',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
    })

    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.clear(screen.getByLabelText('姓名'))
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.click(screen.getByRole('radio', { name: '男' }))
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/my-info')
    expect(screen.getByText('已保存，本次同步失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByText('新昵称')).toBeInTheDocument()
  })

  it('Scenario 3.3 系统异常：本地持久化失败', async () => {
    const user = userEvent.setup()
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage')
    })

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info?edit=true',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
    })

    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.click(screen.getByRole('radio', { name: '男' }))
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(setItemSpy).toHaveBeenCalled()
    expect(screen.getByText('保存失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/my-info?edit=true')
  })

  it('Scenario 3.5 交互：点击“收起”返回只读态', async () => {
    const user = userEvent.setup()

    renderWithAuth(<PersonalMyInfo />, {
      route: '/user-center/my-info?edit=true',
      auth: { isLoggedIn: true, phoneNumber: '13812343769' },
    })

    await user.click(screen.getByRole('button', { name: '收起' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/my-info')
    expect(screen.queryByRole('button', { name: '保存' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('昵称')).not.toBeInTheDocument()
  })

  it('Scenario 3.3 状态异常：未登录访问', () => {
    const value = { auth: { isLoggedIn: false }, login: vi.fn(), logout: vi.fn(), setAuth: vi.fn() }

    render(
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={['/user-center/my-info']}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route path="user-center/my-info" element={<PersonalMyInfo />} />
            </Route>
            <Route path="/login" element={<div>登录页</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByText('登录页')).toBeInTheDocument()
  })
})
