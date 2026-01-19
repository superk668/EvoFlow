import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import PersonalAddTraveler from '../../src/pages/PersonalAddTraveler/PersonalAddTraveler.jsx'
import PersonalCommonTravelers from '../../src/pages/PersonalCommonTravelers/PersonalCommonTravelers.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function isoTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

describe('PersonalAddTraveler Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 1.5.1 新增成功', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    renderWithAuth(<PersonalAddTraveler />, {
      route: '/user-center/common-info/travelers/add',
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
          <Route path="/user-center/common-info/travelers/add" element={<PersonalAddTraveler />} />
        </>
      ),
    })

    await user.type(screen.getByPlaceholderText('请填写中文姓名'), '张三')
    await user.type(screen.getAllByPlaceholderText('yyyy-MM-dd')[0], isoTomorrow())
    await user.type(screen.getByPlaceholderText('大陆手机'), '13800138000')

    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(await screen.findByText('新增成功')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers')

    const raw = localStorage.getItem('evoflow_common_travelers')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          travelerId: expect.any(String),
          nameZh: '张三',
        }),
      ]),
    )
  })

  it('Scenario 1.5.2 输入异常（必填项缺失）', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderWithAuth(<PersonalAddTraveler />, { route: '/user-center/common-info/travelers/add' })

    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(await screen.findByText('中文名与英文名两者至少填写一项')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers/add')
  })

  it('Scenario 1.5.3 状态异常（本人已存在）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: true,
          nameZh: '张三',
        },
      ]),
    )

    renderWithAuth(<PersonalAddTraveler />, { route: '/user-center/common-info/travelers/add' })

    await user.click(screen.getByRole('checkbox', { name: '设置为本人' }))
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('已存在本人旅客，不能重复设置')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers/add')
  })

  it('Scenario 1.5.4 系统异常（新增失败）', async () => {
    const user = userEvent.setup()

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage down')
    })

    renderWithAuth(<PersonalAddTraveler />, { route: '/user-center/common-info/travelers/add' })

    await user.type(screen.getByPlaceholderText('请填写中文姓名'), '张三')
    await user.type(screen.getAllByPlaceholderText('yyyy-MM-dd')[0], isoTomorrow())

    const saveBtn = screen.getByRole('button', { name: '保存' })
    await user.click(saveBtn)

    expect(await screen.findByText('系统繁忙，请稍后重试')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请填写中文姓名')).toHaveValue('张三')
    expect(saveBtn).toBeEnabled()
  })

  it('Scenario 1.8.1 新增旅客后必须持久化并可回读（正常流程）', async () => {
    const user = userEvent.setup()

    renderWithAuth(<PersonalAddTraveler />, {
      route: '/user-center/common-info/travelers/add',
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
          <Route path="/user-center/common-info/travelers/add" element={<PersonalAddTraveler />} />
        </>
      ),
    })

    await user.type(screen.getByPlaceholderText('请填写中文姓名'), '张三')
    await user.type(screen.getAllByPlaceholderText('yyyy-MM-dd')[0], isoTomorrow())
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('新增成功')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers')
    expect(screen.getByText('张三')).toBeInTheDocument()

    const { rerender } = renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })
    rerender(<PersonalCommonTravelers />)

    expect(screen.getByText('张三')).toBeInTheDocument()
  })

  it('Scenario 1.8.2 设置为本人时自动保证唯一（状态一致性）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: true,
          nameZh: '张三',
        },
      ]),
    )

    renderWithAuth(<PersonalAddTraveler />, { route: '/user-center/common-info/travelers/add' })

    await user.type(screen.getByPlaceholderText('请填写中文姓名'), '李四')
    await user.click(screen.getByRole('checkbox', { name: '设置为本人' }))
    await user.click(screen.getByRole('button', { name: '保存' }))

    const raw = localStorage.getItem('evoflow_common_travelers')
    expect(raw).not.toBeNull()
    const travelers = JSON.parse(raw)

    expect(travelers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ travelerId: expect.any(String), isSelf: true, nameZh: '李四' }),
        expect.objectContaining({ travelerId: 'TR_001', isSelf: false, nameZh: '张三' }),
      ]),
    )
  })

  it('Scenario 1.8.3 本地写入失败时不允许提示成功（系统异常）', async () => {
    const user = userEvent.setup()

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage down')
    })

    renderWithAuth(<PersonalAddTraveler />, { route: '/user-center/common-info/travelers/add' })

    await user.type(screen.getByPlaceholderText('请填写中文姓名'), '张三')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('系统繁忙，请稍后重试')).toBeInTheDocument()
    expect(screen.queryByText('新增成功')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存' })).toBeEnabled()
  })
})

