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
import CommonInfoIndex from './pages/CommonInfoIndex/CommonInfoIndex.jsx'
import CommonTravelerView from './pages/CommonTravelerView/CommonTravelerView.jsx'
import CommonTravelerEdit from './pages/CommonTravelerEdit/CommonTravelerEdit.jsx'
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
      { path: 'user-center/orders', element: <Orders /> },
      { path: 'user-center/orders/:orderId', element: <OrderDetail /> },
      { path: 'orders', element: <Navigate to="/user-center/orders" replace /> },
      { path: 'orders/:orderId', element: <Navigate to="/user-center/orders" replace /> },
      { path: 'search-results', element: <SearchResults /> },
      { path: 'user-center/my-info', element: <PersonalMyInfo /> },
      { path: 'personal/my-info', element: <Navigate to="/user-center/my-info" replace /> },
      { path: 'personal/common-travelers', element: <PersonalCommonTravelers /> },
      { path: 'personal/common-travelers/add', element: <PersonalAddTraveler /> },
      { path: 'user-center/common-info', element: <CommonInfoIndex /> },
      { path: 'user-center/common-info/travelers', element: <PersonalCommonTravelers /> },
      { path: 'user-center/common-info/travelers/add', element: <PersonalAddTraveler /> },
      { path: 'user-center/common-info/travelers/view', element: <CommonTravelerView /> },
      { path: 'user-center/common-info/travelers/edit', element: <CommonTravelerEdit /> },
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
      { index: true, element: <Navigate to="step1" replace /> },
      { path: 'step1', element: <BuyTicketStep1 /> },
      { path: 'step2', element: <BuyTicketStep2 /> },
      { path: 'step3', element: <BuyTicketStep3 /> },
      { path: 'step4', element: <BuyTicketStep4 /> },
    ],
  },
  {
    path: '/booking',
    element: <AuthLayout />,
    children: [{ path: 'payment/:orderId', element: <BuyTicketStep3 /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
