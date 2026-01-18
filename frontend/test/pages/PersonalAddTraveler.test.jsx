import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route } from 'react-router-dom'
import PersonalAddTraveler from '../../src/pages/PersonalAddTraveler/PersonalAddTraveler.jsx'
import PersonalCommonTravelers from '../../src/pages/PersonalCommonTravelers/PersonalCommonTravelers.jsx'
import { renderWithAuth } from '../utils/render.jsx'

describe('常用旅客信息新增 Scenarios', () => {
  it('Scenario: 新增成功', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderWithAuth(<PersonalAddTraveler />, {
      route: '/user-center/common-info/travelers/add',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info/travelers/add" element={<PersonalAddTraveler />} />
          <Route path="/user-center/common-info/travelers" element={<PersonalCommonTravelers />} />
        </>
      ),
    })

    await user.type(screen.getByPlaceholderText('请填写中文姓名'), '张三')
    await user.type(screen.getByPlaceholderText('yyyy-MM-dd'), '2000-01-01')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetchSpy).toHaveBeenCalledWith('/api/user-center/common-travelers', expect.any(Object))
    expect(await screen.findByText('新增成功')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers')
  })

  it('Scenario: 输入异常（必填项缺失）', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderWithAuth(<PersonalAddTraveler />, {
      route: '/user-center/common-info/travelers/add',
      auth: { isLoggedIn: true },
    })

    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByText('中文名与英文名两者至少填写一项')).toBeInTheDocument()
  })

  it('Scenario: 状态异常（本人已存在）', async () => {
    const user = userEvent.setup()

    localStorage.setItem(
      'evoflow_common_travelers',
      JSON.stringify([{ travelerId: 'self', isSelf: true, nameZh: '本人' }]),
    )

    renderWithAuth(<PersonalAddTraveler />, {
      route: '/user-center/common-info/travelers/add',
      auth: { isLoggedIn: true },
    })

    await user.click(screen.getByRole('checkbox', { name: '设置为本人' }))
    expect(screen.getByText('已存在本人旅客，不能重复设置')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '设置为本人' })).not.toBeChecked()
  })

  it('Scenario: 系统异常（新增失败）', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network down'))

    renderWithAuth(<PersonalAddTraveler />, {
      route: '/user-center/common-info/travelers/add',
      auth: { isLoggedIn: true },
    })

    await user.type(screen.getByPlaceholderText('请填写中文姓名'), '张三')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(fetchSpy).toHaveBeenCalled()
    expect(await screen.findByText('系统繁忙，请稍后重试')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请填写中文姓名')).toHaveValue('张三')
  })
})

