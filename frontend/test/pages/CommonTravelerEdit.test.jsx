import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import CommonTravelerEdit from '../../src/pages/CommonTravelerEdit/CommonTravelerEdit.jsx'
import PersonalCommonTravelers from '../../src/pages/PersonalCommonTravelers/PersonalCommonTravelers.jsx'
import { renderWithAuth } from '../utils/render.jsx'

function maskId(idNumber) {
  const s = String(idNumber ?? '').replace(/\s+/g, '')
  if (s.length < 5) return s
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

describe('CommonTravelerEdit Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 1.4.1 编辑并保存成功', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: false,
          nameZh: '张三',
          birthday: '2026-01-18',
          idType: '身份证',
          idNumber: '110105199001011234',
          idNumberMasked: maskId('110105199001011234'),
          idExpiry: '2036-01-01',
        },
      ]),
    )

    renderWithAuth(<CommonTravelerEdit />, {
      route: '/user-center/common-info/travelers/edit?travelerId=TR_001',
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
          <Route path="/user-center/common-info/travelers/edit" element={<CommonTravelerEdit />} />
        </>
      ),
    })

    await user.clear(screen.getByPlaceholderText('请填写中文姓名'))
    await user.type(screen.getByPlaceholderText('请填写中文姓名'), '张三丰')
    await user.type(screen.getAllByPlaceholderText('yyyy-MM-dd')[0], '2026-01-19')
    await user.selectOptions(screen.getByRole('combobox'), '护照')
    await user.type(screen.getByPlaceholderText('请输入证件号码'), 'P12345678')

    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(globalThis.fetch).toHaveBeenCalled()
    expect(await screen.findByText('保存成功')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers')
  })

  it('Scenario 1.4.2 输入异常（日期格式错误）', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: false,
          nameZh: '张三',
          birthday: '2026-01-18',
        },
      ]),
    )

    renderWithAuth(<CommonTravelerEdit />, { route: '/user-center/common-info/travelers/edit?travelerId=TR_001' })

    await user.clear(screen.getAllByPlaceholderText('yyyy-MM-dd')[0])
    await user.type(screen.getAllByPlaceholderText('yyyy-MM-dd')[0], '2026/01/19')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(await screen.findByText('日期格式应为 yyyy-MM-dd')).toBeInTheDocument()
  })

  it('Scenario 1.4.3 状态异常（证件号重复）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: false,
          nameZh: '张三',
          idType: '身份证',
          idNumber: '110105199001011234',
          idNumberMasked: maskId('110105199001011234'),
        },
        {
          travelerId: 'TR_002',
          isSelf: false,
          nameZh: '李四',
          idType: '护照',
          idNumber: 'P12345678',
          idNumberMasked: maskId('P12345678'),
        },
      ]),
    )

    renderWithAuth(<CommonTravelerEdit />, { route: '/user-center/common-info/travelers/edit?travelerId=TR_001' })

    await user.selectOptions(screen.getByRole('combobox'), '护照')
    await user.clear(screen.getByPlaceholderText('请输入证件号码'))
    await user.type(screen.getByPlaceholderText('请输入证件号码'), 'P12345678')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('证件号已存在')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers/edit')
  })

  it('Scenario 1.4.4 系统异常（保存失败）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
        {
          travelerId: 'TR_001',
          isSelf: false,
          nameZh: '张三',
          birthday: '2026-01-18',
        },
      ]),
    )
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage down')
    })

    renderWithAuth(<CommonTravelerEdit />, { route: '/user-center/common-info/travelers/edit?travelerId=TR_001' })

    await user.type(screen.getByPlaceholderText('请填写中文姓名'), '丰')
    const saveBtn = screen.getByRole('button', { name: '保存' })
    await user.click(saveBtn)

    expect(await screen.findByText('系统繁忙，请稍后重试')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请填写中文姓名')).toHaveValue('张三丰')
    expect(saveBtn).toBeEnabled()
  })
})
