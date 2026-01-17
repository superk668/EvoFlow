import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('settings_requirement - 3.3 我的信息页', () => {
  it('查看个人信息（正常流程）', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        profile: {
          maskedPhone: '86-138*****3769',
          emailStatusText: '未填写',
          nickname: '未设置',
          realName: '未设置',
          gender: '未设置',
          birthday: '未设置',
          nicknameReviewStatus: 'none',
          version: 'v1',
        },
      }),
    })

    renderAtHash('#/user-center/my-info')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/profile'),
      expect.objectContaining({ method: 'GET' })
    )

    expect(await screen.findByText('个人信息设置')).toBeInTheDocument()
    expect(screen.getByText('86-138*****3769')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument()
    expect(screen.getByText('头像设置')).toBeInTheDocument()
  })

  it('进入编辑并保存成功（正常流程）', async () => {
    const user = userEvent.setup()

    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          profile: {
            maskedPhone: '86-138*****3769',
            emailStatusText: '未填写',
            nickname: '旧昵称',
            realName: '未设置',
            gender: '未设置',
            birthday: '未设置',
            nicknameReviewStatus: 'none',
            version: 'v1',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          profile: {
            maskedPhone: '86-138*****3769',
            emailStatusText: '未填写',
            nickname: '新昵称',
            realName: '张三',
            gender: '男',
            birthday: '1990-01-01',
            nicknameReviewStatus: 'pending',
            version: 'v2',
          },
        }),
      })

    renderAtHash('#/user-center/my-info')
    await user.click(await screen.findByRole('button', { name: '编辑' }))

    await user.clear(screen.getByLabelText('昵称'))
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.click(screen.getByLabelText('男'))
    await user.type(screen.getByLabelText('生日'), '1990-01-01')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/profile'),
      expect.objectContaining({ method: 'PUT' })
    )
    expect(screen.getByText('新昵称将在审核后生效')).toBeInTheDocument()
    expect(screen.getByText('新昵称')).toBeInTheDocument()
  })

  it('输入异常：昵称为空或超长', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/my-info?edit=true')

    await user.clear(screen.getByLabelText('昵称'))
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入昵称（不超过20字符）')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('昵称'), '123456789012345678901')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入昵称（不超过20字符）')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('输入异常：生日格式错误', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/my-info?edit=true')

    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.type(screen.getByLabelText('生日'), '1990/01/01')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByText('日期格式应为 yyyy-MM-dd')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('状态异常：昵称审核中不可再次编辑', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        profile: {
          maskedPhone: '86-138*****3769',
          emailStatusText: '未填写',
          nickname: '审核中昵称',
          realName: '张三',
          gender: '男',
          birthday: '1990-01-01',
          nicknameReviewStatus: 'pending',
          version: 'v1',
        },
      }),
    })

    renderAtHash('#/user-center/my-info')
    await user.click(await screen.findByRole('button', { name: '编辑' }))
    expect(screen.getByText('昵称审核中，暂不可修改')).toBeInTheDocument()
    expect(screen.getByLabelText('昵称')).toBeDisabled()
  })

  it('状态异常：未登录访问', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) })
    renderAtHash('#/user-center/my-info')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/profile'),
      expect.objectContaining({ method: 'GET' })
    )
    expect(window.location.hash).toBe('#/login')
  })

  it('系统异常：保存失败', async () => {
    const user = userEvent.setup()
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: { version: 'v1' } }) })
      .mockRejectedValueOnce(new Error('Network error'))

    renderAtHash('#/user-center/my-info?edit=true')

    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.type(screen.getByLabelText('姓名'), '张三')
    const saveBtn = screen.getByRole('button', { name: '保存' })
    await user.click(saveBtn)

    expect(await screen.findByText('保存失败，请稍后重试')).toBeInTheDocument()
    expect(saveBtn).toBeEnabled()
    expect(screen.getByDisplayValue('新昵称')).toBeInTheDocument()
  })

  it('头像编辑入口点击（正常流程）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/my-info')

    await user.click(screen.getByRole('button', { name: '编辑头像' }))
    expect(screen.getByText('头像编辑')).toBeInTheDocument()
  })
})

describe('settings_requirement - 3.5 我的信息编辑页', () => {
  it('编辑并保存成功（正常流程）', async () => {
    const user = userEvent.setup()
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: { version: 'v1' } }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: { nickname: '新昵称', version: 'v2' } }) })

    renderAtHash('#/user-center/my-info?edit=true')
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.type(screen.getByLabelText('生日'), '1990-01-01')
    await user.click(screen.getByLabelText('男'))
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/profile'),
      expect.objectContaining({ method: 'PUT' })
    )
    expect(screen.getByText('新昵称将在审核后生效')).toBeInTheDocument()
  })

  it('输入异常：昵称为空或超长', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/my-info?edit=true')

    await user.clear(screen.getByLabelText('昵称'))
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入昵称（不超过20字符）')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('昵称'), '123456789012345678901')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入昵称（不超过20字符）')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('输入异常：姓名为空或包含非法字符', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/my-info?edit=true')

    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.type(screen.getByLabelText('姓名'), '张三1')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('请输入合法姓名')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('输入异常：生日格式错误或为未来日期', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/my-info?edit=true')

    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.type(screen.getByLabelText('生日'), '1990/01/01')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('日期格式应为 yyyy-MM-dd，且不得为未来日期')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()

    const future = new Date()
    future.setDate(future.getDate() + 1)
    const yyyy = future.getFullYear()
    const mm = String(future.getMonth() + 1).padStart(2, '0')
    const dd = String(future.getDate()).padStart(2, '0')

    await user.clear(screen.getByLabelText('生日'))
    await user.type(screen.getByLabelText('生日'), `${yyyy}-${mm}-${dd}`)
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText('日期格式应为 yyyy-MM-dd，且不得为未来日期')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('状态异常：昵称审核中不可再次修改', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        profile: {
          maskedPhone: '86-138*****3769',
          emailStatusText: '未填写',
          nickname: '审核中昵称',
          realName: '张三',
          gender: '男',
          birthday: '1990-01-01',
          nicknameReviewStatus: 'pending',
          version: 'v1',
        },
      }),
    })

    renderAtHash('#/user-center/my-info?edit=true')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/profile'),
      expect.objectContaining({ method: 'GET' })
    )

    expect(screen.getByLabelText('昵称')).toBeDisabled()
    expect(screen.getByText('审核中')).toBeInTheDocument()
    expect(screen.getByLabelText('姓名')).toBeEnabled()
  })

  it('状态异常：未登录访问编辑态', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'Unauthorized' }) })
    renderAtHash('#/user-center/my-info?edit=true')
    expect(window.location.hash).toBe('#/login')
  })

  it('系统异常：保存接口失败', async () => {
    const user = userEvent.setup()
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: { version: 'v1' } }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Save failed.' }) })

    renderAtHash('#/user-center/my-info?edit=true')
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.type(screen.getByLabelText('姓名'), '张三')
    const saveBtn = screen.getByRole('button', { name: '保存' })
    await user.click(saveBtn)

    expect(await screen.findByText('保存失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByDisplayValue('新昵称')).toBeInTheDocument()
    expect(saveBtn).toBeEnabled()
  })

  it('系统异常：并发覆盖（乐观锁冲突）', async () => {
    const user = userEvent.setup()
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ profile: { version: 'v1' } }) })
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'Version conflict.' }) })

    renderAtHash('#/user-center/my-info?edit=true')
    await user.type(screen.getByLabelText('昵称'), '新昵称')
    await user.type(screen.getByLabelText('姓名'), '张三')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('信息已被更新，请刷新后重试')).toBeInTheDocument()
  })

  it('交互：点击“收起”返回只读态', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/my-info?edit=true')
    await user.click(screen.getByRole('button', { name: '收起' }))
    expect(screen.getByText('个人信息设置')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '保存' })).not.toBeInTheDocument()
  })
})
