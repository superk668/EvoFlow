import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PersonalCommonTravelers from '../../src/pages/PersonalCommonTravelers/PersonalCommonTravelers.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function maskPhone(phone) {
  const p = String(phone ?? '').replace(/\s+/g, '')
  if (p.length < 7) return p
  return `${p.slice(0, 3)}****${p.slice(-4)}`
}

function maskId(idNumber) {
  const s = String(idNumber ?? '').replace(/\s+/g, '')
  if (s.length < 5) return s
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

describe('PersonalCommonTravelers Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 1.2.1 列表正常展示与搜索', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: true,
          nameZh: '张三',
          lastName: 'Zhang',
          firstName: 'San',
          phoneNumber: '13800138000',
          idType: '身份证',
          idNumber: '110105199001011234',
          idNumberMasked: maskId('110105199001011234'),
          nationality: '中国',
          gender: '男',
        },
        {
          travelerId: 'TR_002',
          isSelf: false,
          nameZh: '李四',
          lastName: 'Li',
          firstName: 'Si',
          phoneNumber: '13900139000',
          idType: '护照',
          idNumber: 'P12345678',
          idNumberMasked: maskId('P12345678'),
          nationality: '中国',
          gender: '女',
        },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })

    expect(screen.getByText('常用旅客信息')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText(maskPhone('13800138000'))).toBeInTheDocument()
    expect(screen.getByText(maskId('110105199001011234'))).toBeInTheDocument()
    expect(screen.getByText('李四')).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('中文名/英文名'))
    await user.type(screen.getByPlaceholderText('中文名/英文名'), '张')
    await user.click(screen.getByRole('button', { name: '查询' }))

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.queryByText('李四')).not.toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('中文名/英文名'))
    await user.type(screen.getByPlaceholderText('中文名/英文名'), '不存在')
    await user.click(screen.getByRole('button', { name: '查询' }))

    expect(screen.getByText('暂无记录')).toBeInTheDocument()
  })

  it('Scenario 1.2.2 输入异常（非法搜索字符）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: true,
          nameZh: '张三',
          phoneNumber: '13800138000',
          idType: '身份证',
          idNumberMasked: maskId('110105199001011234'),
        },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })

    await user.type(screen.getByPlaceholderText('中文名/英文名'), '!!!')
    await user.click(screen.getByRole('button', { name: '查询' }))

    expect(await screen.findByText('请输入合法的姓名关键字')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
  })

  it('Scenario 1.2.3 状态异常（本人条目不可删除）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: true,
          nameZh: '张三',
          phoneNumber: '13800138000',
          idType: '身份证',
          idNumberMasked: maskId('110105199001011234'),
        },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })

    await user.click(screen.getByRole('button', { name: '删除' }))

    expect(await screen.findByText('本人信息不可删除')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('evoflow_common_travelers'))).toHaveLength(1)
  })

  it('Scenario 1.2.4 系统异常（列表加载失败）', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'evoflow_common_travelers') throw new Error('storage down')
      return null
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })

    expect(await screen.findByText('加载失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试' })).toBeEnabled()
  })

  it('Scenario 1.6.1 批量删除正常流程', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: false,
          nameZh: '张三',
          phoneNumber: '13800138000',
          idType: '身份证',
          idNumberMasked: maskId('110105199001011234'),
        },
        {
          travelerId: 'TR_002',
          isSelf: false,
          nameZh: '李四',
          phoneNumber: '13900139000',
          idType: '护照',
          idNumberMasked: maskId('P12345678'),
        },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })

    await user.click(screen.getByRole('checkbox', { name: '全选' }))
    await user.click(screen.getByRole('link', { name: '删除' }))
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    expect(screen.queryByText('张三')).not.toBeInTheDocument()
    expect(screen.queryByText('李四')).not.toBeInTheDocument()
  })

  it('Scenario 1.6.2 输入异常（未选择记录）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: false,
          nameZh: '张三',
          phoneNumber: '13800138000',
          idType: '身份证',
          idNumberMasked: maskId('110105199001011234'),
        },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })

    await user.click(screen.getByRole('link', { name: '删除' }))

    expect(await screen.findByText('请先选择要删除的记录')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('evoflow_common_travelers'))).toHaveLength(1)
  })

  it('Scenario 1.6.3 状态异常（包含不可删除条目）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: true,
          nameZh: '张三',
          phoneNumber: '13800138000',
          idType: '身份证',
          idNumberMasked: maskId('110105199001011234'),
        },
        {
          travelerId: 'TR_002',
          isSelf: false,
          nameZh: '李四',
          phoneNumber: '13900139000',
          idType: '护照',
          idNumberMasked: maskId('P12345678'),
        },
      ]),
    )

    renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })

    await user.click(screen.getByRole('checkbox', { name: '全选' }))
    await user.click(screen.getByRole('link', { name: '删除' }))

    expect(await screen.findByText('包含不可删除的记录')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('evoflow_common_travelers'))).toHaveLength(2)
  })

  it('Scenario 1.6.4 系统异常（删除失败）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: false,
          nameZh: '张三',
          phoneNumber: '13800138000',
          idType: '身份证',
          idNumberMasked: maskId('110105199001011234'),
        },
      ]),
    )
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage down')
    })

    renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })

    await user.click(screen.getByRole('checkbox', { name: /TR_001|张三/ }))
    await user.click(screen.getByRole('link', { name: '删除' }))
    await user.click(screen.getByRole('button', { name: '确认删除' }))

    expect(await screen.findByText('删除失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /TR_001|张三/ })).toBeChecked()
  })

  it('Scenario 1.7.1 导航高亮一致', () => {
    renderWithAuth(<PersonalCommonTravelers />, { route: '/user-center/common-info/travelers' })

    const active = screen.getByRole('link', { name: '常用旅客信息' })
    expect(active.className).toMatch(/subItemActive/)
  })

})
