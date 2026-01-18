import { Navigate } from 'react-router-dom'
import { createHashRouter } from 'react-router-dom'
import MainLayout from './layouts/MainLayout/MainLayout.jsx'
import AuthLayout from './layouts/AuthLayout/AuthLayout.jsx'
import Home from './pages/Home/Home.jsx'
import Orders from './pages/Orders/Orders.jsx'
import OrderDetail from './pages/OrderDetail/OrderDetail.jsx'
import SearchResults from './pages/SearchResults/SearchResults.jsx'
import PersonalMyInfo from './pages/PersonalMyInfo/PersonalMyInfo.jsx'
import PersonalCommonTravelers from './pages/PersonalCommonTravelers/PersonalCommonTravelers.jsx'
import PersonalAddTraveler from './pages/PersonalAddTraveler/PersonalAddTraveler.jsx'
import Login from './pages/Login/Login.jsx'
import Register from './pages/Register/Register.jsx'
import RegisterSetPassword from './pages/RegisterSetPassword/RegisterSetPassword.jsx'
import RegisterSuccess from './pages/RegisterSuccess/RegisterSuccess.jsx'
import BuyTicketStep1 from './pages/BuyTicketStep1/BuyTicketStep1.jsx'
import BuyTicketStep2 from './pages/BuyTicketStep2/BuyTicketStep2.jsx'
import BuyTicketStep3 from './pages/BuyTicketStep3/BuyTicketStep3.jsx'
import BuyTicketStep4 from './pages/BuyTicketStep4/BuyTicketStep4.jsx'

export const router = createHashRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'orders', element: <Orders /> },
      { path: 'orders/:orderId', element: <OrderDetail /> },
      { path: 'search-results', element: <SearchResults /> },
      { path: 'personal/my-info', element: <PersonalMyInfo /> },
      { path: 'personal/common-travelers', element: <PersonalCommonTravelers /> },
      { path: 'personal/common-travelers/add', element: <PersonalAddTraveler /> },
    ],
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <Login /> }],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Register /> },
      { path: 'set-password', element: <RegisterSetPassword /> },
      { path: 'success', element: <RegisterSuccess /> },
    ],
  },
  {
    path: '/buy-ticket',
    element: <AuthLayout />,
    children: [
      { path: 'step1', element: <BuyTicketStep1 /> },
      { path: 'step2', element: <BuyTicketStep2 /> },
      { path: 'step3', element: <BuyTicketStep3 /> },
      { path: 'step4', element: <BuyTicketStep4 /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
