import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import CommonTravelerView from '../../src/pages/CommonTravelerView/CommonTravelerView.jsx'
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

describe('CommonTravelerView Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 1.3.1 只读展示成功', async () => {
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
          nationality: '中国',
          gender: '男',
          birthday: '2026-01-18',
          birthPlace: '北京',
          phoneNumber: '13800138000',
          email: 'zs@example.com',
          idType: '身份证',
          idNumber: '110105199001011234',
          idNumberMasked: maskId('110105199001011234'),
          idExpiry: '2036-01-01',
          frequentFlyerCards: [],
        },
      ]),
    )

    renderWithAuth(<CommonTravelerView />, {
      route: '/user-center/common-info/travelers/view?travelerId=TR_001',
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
          <Route path="/user-center/common-info/travelers/view" element={<CommonTravelerView />} />
        </>
      ),
    })

    expect(screen.getByText('1 旅客信息')).toBeInTheDocument()
    expect(screen.getByText('2 证件信息')).toBeInTheDocument()
    expect(screen.getByText('3 常旅客卡')).toBeInTheDocument()

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText(maskPhone('13800138000'))).toBeInTheDocument()
    expect(screen.getByText(maskId('110105199001011234'))).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '返回' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers')
  })

  it('Scenario 1.3.2 输入异常（无效旅客ID）', () => {
    renderWithAuth(<CommonTravelerView />, { route: '/user-center/common-info/travelers/view' })

    expect(screen.getByText('记录不存在或链接无效')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回' })).toBeInTheDocument()
  })

  it('Scenario 1.3.3 状态异常（记录被删除）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([
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

    renderWithAuth(<CommonTravelerView />, {
      route: '/user-center/common-info/travelers/view?travelerId=TR_001',
      routes: (
        <>
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
          <Route path="/user-center/common-info/travelers/view" element={<CommonTravelerView />} />
        </>
      ),
    })

    expect(await screen.findByText('记录已删除')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /返回/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers')
  })

  it('Scenario 1.3.4 系统异常（查看数据加载失败）', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'evoflow_common_travelers') throw new Error('storage down')
      return null
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    renderWithAuth(<CommonTravelerView />, { route: '/user-center/common-info/travelers/view?travelerId=TR_001' })

    expect(await screen.findByText('加载失败')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试' })).toBeEnabled()
  })
})

