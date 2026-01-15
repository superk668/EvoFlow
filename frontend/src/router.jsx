import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import UserCenterLayout from './layouts/UserCenterLayout.jsx'
import Home from './pages/Home/Home.jsx'
import Login from './pages/Login/Login.jsx'
import CommonTraveler from './pages/CommonTraveler/CommonTraveler.jsx'
import OrderDetail from './pages/OrderDetail/OrderDetail.jsx'
import OrderManagement from './pages/OrderManagement/OrderManagement.jsx'
import PersonalCenter from './pages/PersonalCenter/PersonalCenter.jsx'
import SetInformation from './pages/SetInformation/SetInformation.jsx'
import RegisterStep1 from './pages/RegisterStep1/RegisterStep1.jsx'
import RegisterStep2 from './pages/RegisterStep2/RegisterStep2.jsx'

function ForgotPassword() {
  return <div>找回密码功能暂未开放</div>
}

function OAuthLogin() {
  return <div>第三方登录功能暂未开放</div>
}

function PaymentPage() {
  return <div>支付页面</div>
}

function FlightsListPage() {
  return <div>机票列表</div>
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
          <Route path="/booking/payment/:orderId" element={<PaymentPage />} />
          <Route path="/flights/list" element={<FlightsListPage />} />
        </Route>
        <Route element={<MainLayout headerVariant="authed" />}>
          <Route path="/logined" element={<Home />} />
        </Route>
        <Route element={<UserCenterLayout />}>
          <Route path="/user" element={<PersonalCenter />} />
          <Route path="/user/common-traveler" element={<CommonTraveler />} />
          <Route path="/user/set-information" element={<SetInformation />} />
          <Route path="/user/orders" element={<OrderManagement />} />
          <Route path="/user/orders/:orderId" element={<OrderDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
