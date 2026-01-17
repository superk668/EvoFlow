import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout/AuthLayout.jsx'
import BookingLayout from './layouts/BookingLayout/BookingLayout.jsx'
import MainLayout from './layouts/MainLayout/MainLayout.jsx'
import RegisterLayout from './layouts/RegisterLayout/RegisterLayout.jsx'
import PersonalCenterLayout from './layouts/PersonalCenterLayout/PersonalCenterLayout.jsx'
import Home from './pages/Home/Home.jsx'
import BuyTicketStep1 from './pages/BuyTicketStep1/BuyTicketStep1.jsx'
import BuyTicketStep2 from './pages/BuyTicketStep2/BuyTicketStep2.jsx'
import BuyTicketStep3 from './pages/BuyTicketStep3/BuyTicketStep3.jsx'
import BuyTicketStep4 from './pages/BuyTicketStep4/BuyTicketStep4.jsx'
import PersonalCenterOrders from './pages/PersonalCenterOrders/PersonalCenterOrders.jsx'
import PersonalCenterOrderDetail from './pages/PersonalCenterOrderDetail/PersonalCenterOrderDetail.jsx'
import PersonalCenterProfile from './pages/PersonalCenterProfile/PersonalCenterProfile.jsx'
import PersonalCenterCommonInfoIndex from './pages/PersonalCenterCommonInfoIndex/PersonalCenterCommonInfoIndex.jsx'
import PersonalCenterCommonTravellers from './pages/PersonalCenterCommonTravellers/PersonalCenterCommonTravellers.jsx'
import PersonalCenterTravellerForm from './pages/PersonalCenterTravellerForm/PersonalCenterTravellerForm.jsx'
import Login from './pages/Login/Login.jsx'
import RegisterStep1 from './pages/RegisterStep1/RegisterStep1.jsx'
import RegisterStep2 from './pages/RegisterStep2/RegisterStep2.jsx'
import FlightsList from './pages/FlightsList/FlightsList.jsx'
import FlightBooking from './pages/FlightBooking/FlightBooking.jsx'

export default function Router() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/flights/list" element={<FlightsList />} />
      </Route>

      <Route element={<BookingLayout />}>
        <Route path="/flights/booking" element={<FlightBooking />} />
        <Route path="/booking" element={<BuyTicketStep1 />} />
        <Route path="/booking/services" element={<BuyTicketStep2 />} />
        <Route path="/booking/payment" element={<BuyTicketStep3 />} />
        <Route path="/booking/payment/:orderId" element={<BuyTicketStep3 />} />
        <Route path="/booking/complete" element={<BuyTicketStep4 />} />
        <Route path="/buy-ticket/step1" element={<BuyTicketStep1 />} />
        <Route path="/buy-ticket/step2" element={<BuyTicketStep2 />} />
        <Route path="/buy-ticket/step3" element={<BuyTicketStep3 />} />
        <Route path="/buy-ticket/step4" element={<BuyTicketStep4 />} />
      </Route>

      <Route element={<PersonalCenterLayout />}>
        <Route path="/personal" element={<Navigate to="/personal/profile" replace />} />
        <Route path="/personal/profile" element={<PersonalCenterProfile />} />
        <Route path="/personal/orders" element={<PersonalCenterOrders />} />
        <Route path="/personal/orders/detail" element={<PersonalCenterOrderDetail />} />
        <Route path="/personal/common-info" element={<PersonalCenterCommonInfoIndex />} />
        <Route path="/personal/common-info/travellers" element={<PersonalCenterCommonTravellers />} />
        <Route path="/personal/common-info/travellers/new" element={<Navigate to="/personal/common-info/travellers/add" replace />} />
        <Route path="/personal/common-info/travellers/add" element={<PersonalCenterTravellerForm />} />
        <Route path="/personal/common-info/travellers/edit" element={<PersonalCenterTravellerForm />} />
        <Route path="/personal/common-info/travellers/view" element={<PersonalCenterTravellerForm />} />
        <Route path="/personal/common-info/*" element={<Navigate to="/personal/common-info" replace />} />

        <Route path="/user-center" element={<Navigate to="/user-center/my-info" replace />} />
        <Route path="/user-center/my-info" element={<PersonalCenterProfile />} />
        <Route path="/user-center/orders" element={<PersonalCenterOrders />} />
        <Route path="/user-center/orders/:orderId" element={<PersonalCenterOrderDetail />} />
        <Route path="/user-center/common-info" element={<PersonalCenterCommonInfoIndex />} />
        <Route path="/user-center/common-info/travelers" element={<PersonalCenterCommonTravellers />} />
        <Route path="/user-center/common-info/travelers/new" element={<Navigate to="/user-center/common-info/travelers/add" replace />} />
        <Route path="/user-center/common-info/travelers/add" element={<PersonalCenterTravellerForm />} />
        <Route path="/user-center/common-info/travelers/edit" element={<PersonalCenterTravellerForm />} />
        <Route path="/user-center/common-info/travelers/view" element={<PersonalCenterTravellerForm />} />
        <Route path="/user-center/common-info/*" element={<Navigate to="/user-center/common-info" replace />} />
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
