import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout/AuthLayout.jsx'
import MainLayout from './layouts/MainLayout/MainLayout.jsx'
import RegisterLayout from './layouts/RegisterLayout/RegisterLayout.jsx'
import Home from './pages/Home/Home.jsx'
import Login from './pages/Login/Login.jsx'
import RegisterStep1 from './pages/RegisterStep1/RegisterStep1.jsx'
import RegisterStep2 from './pages/RegisterStep2/RegisterStep2.jsx'

export default function Router() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<RegisterLayout />}>
        <Route path="/register" element={<Navigate to="/register/step1" replace />} />
        <Route path="/register/step1" element={<RegisterStep1 />} />
        <Route path="/register/step2" element={<RegisterStep2 />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
