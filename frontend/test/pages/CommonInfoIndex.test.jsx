import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navigate, Route } from 'react-router-dom'
import MainLayout from '../../src/layouts/MainLayout/MainLayout.jsx'
import CommonInfoIndex from '../../src/pages/CommonInfoIndex/CommonInfoIndex.jsx'
import Login from '../../src/pages/Login/Login.jsx'
import { renderWithAuth } from '../utils/render.jsx'

describe('CommonInfoIndex Scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Scenario 1.1.1 索引页正常导航到旅客信息', async () => {
    const user = userEvent.setup()

    renderWithAuth(<CommonInfoIndex />, {
      route: '/user-center/common-info',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/user-center/common-info" element={<CommonInfoIndex />} />
          <Route path="/user-center/common-info/travelers" element={<div>常用旅客信息列表页</div>} />
        </>
      ),
    })

    await user.click(screen.getByRole('link', { name: '常用旅客信息' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/user-center/common-info/travelers')
  })

  it('Scenario 1.1.2 输入异常（无效直达链接）', () => {
    renderWithAuth(<MainLayout />, {
      route: '/user-center/common-info/not-exist',
      auth: { isLoggedIn: true },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>首页</div>} />
            <Route path="user-center/common-info" element={<CommonInfoIndex />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ),
    })

    expect(screen.getByTestId('location')).not.toHaveTextContent('/user-center/common-info')
  })

  it('Scenario 1.1.3 状态异常（未登录）', () => {
    renderWithAuth(<MainLayout />, {
      route: '/user-center/common-info',
      auth: { isLoggedIn: false },
      routes: (
        <>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>首页</div>} />
            <Route path="user-center/common-info" element={<CommonInfoIndex />} />
          </Route>
          <Route path="/login" element={<Login />} />
        </>
      ),
    })

    expect(sessionStorage.getItem('postLoginRedirect')).toBe('/user-center/common-info')
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('Scenario 1.1.4 系统异常（索引资源加载失败）', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    renderWithAuth(<CommonInfoIndex />, {
      route: '/user-center/common-info',
      auth: { isLoggedIn: true },
    })

    expect(await screen.findByText('网络异常，请稍后重试')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刷新' })).toBeEnabled()
  })
})

