import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('settings_requirement - 1.3 常用旅客信息查看页（只读）', () => {
  it('只读展示成功', async () => {
    renderAtHash('#/user-center/common-info/travelers/view?travellerId=T-1')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/common-travellers/T-1'),
      expect.objectContaining({ method: 'GET' })
    )
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument()
  })

  it('输入异常（无效旅客ID）', async () => {
    renderAtHash('#/user-center/common-info/travelers/view')
    expect(screen.getByText('记录不存在或链接无效')).toBeInTheDocument()
  })

  it('状态异常（记录被删除）', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'Not found.' }) })
    renderAtHash('#/user-center/common-info/travelers/view?travellerId=T-404')

    expect(globalThis.fetch).toHaveBeenCalled()
    expect(await screen.findByText('记录已删除')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/user-center/common-info/travelers')
  })

  it('系统异常（查看数据加载失败）', async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))
    renderAtHash('#/user-center/common-info/travelers/view?travellerId=T-2')

    expect(globalThis.fetch).toHaveBeenCalled()
    expect(await screen.findByText('加载失败')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: '重试' }))
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })
})

describe('settings_requirement - 1.4 常用旅客信息编辑页', () => {
  it('编辑并保存成功', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info/travelers/edit?travellerId=T-1')

    await user.type(screen.getByLabelText('中文名'), '张三')
    await user.type(screen.getByLabelText('生日'), '1990-01-01')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/common-travellers/T-1'),
      expect.objectContaining({ method: 'PUT' })
    )
    expect(screen.getByText('保存成功')).toBeInTheDocument()
  })

  it('输入异常（日期格式错误）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info/travelers/edit?travellerId=T-1')

    await user.type(screen.getByLabelText('生日'), '1990/01/01')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByText('日期格式应为 yyyy-MM-dd')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('状态异常（证件号重复）', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'Document number exists.' }) })
    renderAtHash('#/user-center/common-info/travelers/edit?travellerId=T-1')

    await user.type(screen.getByLabelText('证件号码'), '11010519491231002X')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('证件号已存在')).toBeInTheDocument()
  })

  it('系统异常（保存失败）', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))
    renderAtHash('#/user-center/common-info/travelers/edit?travellerId=T-1')

    await user.type(screen.getByLabelText('中文名'), '张三')
    const saveBtn = screen.getByRole('button', { name: '保存' })
    await user.click(saveBtn)

    expect(await screen.findByText('系统繁忙，请稍后重试')).toBeInTheDocument()
    expect(saveBtn).toBeEnabled()
    expect(screen.getByDisplayValue('张三')).toBeInTheDocument()
  })
})

describe('settings_requirement - 1.5 常用旅客信息新增页', () => {
  it('新增成功', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info/travelers/add')

    await user.type(screen.getByLabelText('中文名'), '李四')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/common-travellers'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(window.location.hash).toBe('#/user-center/common-info/travelers')
  })

  it('输入异常（必填项缺失）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info/travelers/add')

    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByText('中文名与英文名两者至少填写一项')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('状态异常（本人已存在）', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'Conflict' }) })
    renderAtHash('#/user-center/common-info/travelers/add')

    await user.click(screen.getByRole('checkbox', { name: '设置为本人' }))
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('已存在本人旅客，不能重复设置')).toBeInTheDocument()
  })

  it('系统异常（新增失败）', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))
    renderAtHash('#/user-center/common-info/travelers/add')

    await user.type(screen.getByLabelText('中文名'), '李四')
    const saveBtn = screen.getByRole('button', { name: '保存' })
    await user.click(saveBtn)

    expect(await screen.findByText('系统繁忙，请稍后重试')).toBeInTheDocument()
    expect(saveBtn).toBeEnabled()
    expect(screen.getByDisplayValue('李四')).toBeInTheDocument()
  })
})

describe('settings_requirement - 1.6 列表底部批量操作（全选/删除）', () => {
  it('批量删除正常流程', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info/travelers')

    await user.click(screen.getByRole('checkbox', { name: '全选' }))
    await user.click(screen.getByRole('button', { name: '删除' }))
    await user.click(screen.getByRole('button', { name: '确认' }))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/common-travellers'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('输入异常（未选择记录）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info/travelers')

    await user.click(screen.getByRole('button', { name: '删除' }))
    expect(screen.getByText('请先选择要删除的记录')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('状态异常（包含不可删除条目）', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'Contains protected traveller.' }) })
    renderAtHash('#/user-center/common-info/travelers')

    await user.click(screen.getByRole('checkbox', { name: '本人' }))
    await user.click(screen.getByRole('button', { name: '删除' }))
    await user.click(screen.getByRole('button', { name: '确认' }))
    expect(await screen.findByText('包含不可删除的记录')).toBeInTheDocument()
  })

  it('系统异常（删除接口失败）', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))
    renderAtHash('#/user-center/common-info/travelers')

    await user.click(screen.getByRole('checkbox', { name: '全选' }))
    await user.click(screen.getByRole('button', { name: '删除' }))
    await user.click(screen.getByRole('button', { name: '确认' }))
    expect(await screen.findByText('删除失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '全选' })).toBeChecked()
  })
})
