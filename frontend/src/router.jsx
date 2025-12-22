import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import Home from './pages/Home/Home.jsx'
import Login from './pages/Login/Login.jsx'
import RegisterStep1 from './pages/RegisterStep1/RegisterStep1.jsx'
import RegisterStep2 from './pages/RegisterStep2/RegisterStep2.jsx'

function ForgotPassword() {
  return <div>找回密码功能暂未开放</div>
}

function OAuthLogin() {
  return <div>第三方登录功能暂未开放</div>
}

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Navigate to="/register/step1" replace />} />
          <Route path="/register/step1" element={<RegisterStep1 />} />
          <Route path="/register/step2" element={<RegisterStep2 />} />
          <Route path="/oauth/wechat" element={<OAuthLogin />} />
          <Route path="/oauth/qq" element={<OAuthLogin />} />
          <Route path="/oauth/alipay" element={<OAuthLogin />} />
          <Route path="/oauth/weibo" element={<OAuthLogin />} />
          <Route path="/oauth/baidu" element={<OAuthLogin />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
