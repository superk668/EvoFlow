import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App.jsx'

function renderAtHash(hash) {
  window.location.hash = hash
  return render(<App />)
}

describe('settings_requirement - 1.2 常用旅客信息列表页', () => {
  it('列表正常展示与搜索', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info/travelers')

    expect(screen.getByText('常用旅客信息')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查询' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '新增' })).toHaveAttribute('href', '#/user-center/common-info/travelers/add')

    await user.click(screen.getByRole('button', { name: '查询' }))
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/common-travellers'),
      expect.objectContaining({ method: 'GET' })
    )

    expect(screen.getByText('暂无记录')).toBeInTheDocument()
  })

  it('输入异常（非法搜索字符）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info/travelers')

    const keyword = screen.getByRole('textbox', { name: '旅客姓名' })
    await user.type(keyword, '!!!')
    await user.click(screen.getByRole('button', { name: '查询' }))

    expect(screen.getByText('请输入合法的姓名关键字')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('状态异常（本人条目不可删除）', async () => {
    const user = userEvent.setup()
    renderAtHash('#/user-center/common-info/travelers')

    await user.click(screen.getByRole('checkbox', { name: '本人' }))
    await user.click(screen.getByRole('button', { name: '删除' }))

    expect(screen.getByText('本人信息不可删除')).toBeInTheDocument()
  })

  it('系统异常（列表加载失败）', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Load failed.' }) })
    renderAtHash('#/user-center/common-info/travelers')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/common-travellers'),
      expect.objectContaining({ method: 'GET' })
    )
    expect(await screen.findByText('加载失败，请稍后重试')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })
})

describe('settings_requirement - 1.7 左侧导航一致性', () => {
  it('导航高亮一致', () => {
    renderAtHash('#/user-center/common-info/travelers/edit')
    expect(screen.getByRole('link', { name: '常用旅客信息' })).toBeInTheDocument()
  })
})

