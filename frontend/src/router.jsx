import { Navigate, createHashRouter, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import HomeGuest from './pages/HomeGuest/HomeGuest.jsx'
import HomeAuthed from './pages/HomeAuthed/HomeAuthed.jsx'
import Login from './pages/Login/Login.jsx'
import RegisterStep1 from './pages/RegisterStep1/RegisterStep1.jsx'
import RegisterStep2 from './pages/RegisterStep2/RegisterStep2.jsx'
import OrderManagement from './pages/OrderManagement/OrderManagement.jsx'
import OrderDetail from './pages/OrderDetail/OrderDetail.jsx'
import PersonalCenter from './pages/PersonalCenter/PersonalCenter.jsx'
import PersonalCenterEdit from './pages/PersonalCenterEdit/PersonalCenterEdit.jsx'
import CommonTravelerInfo from './pages/CommonTravelerInfo/CommonTravelerInfo.jsx'
import CommonTravelerInfoEdit from './pages/CommonTravelerInfoEdit/CommonTravelerInfoEdit.jsx'
import FlightSearchResults from './pages/FlightSearchResults/FlightSearchResults.jsx'
import BuyTicketStep1 from './pages/BuyTicketStep1/BuyTicketStep1.jsx'
import BuyTicketStep2 from './pages/BuyTicketStep2/BuyTicketStep2.jsx'
import BuyTicketStep3 from './pages/BuyTicketStep3/BuyTicketStep3.jsx'
import BuyTicketStep4 from './pages/BuyTicketStep4/BuyTicketStep4.jsx'
import BookingFormPage from './pages/BookingFormPage/BookingFormPage.jsx'
import BookingServicesPage from './pages/BookingServicesPage/BookingServicesPage.jsx'
import BookingPaymentPage from './pages/BookingPaymentPage/BookingPaymentPage.jsx'
import BookingCompletePage from './pages/BookingCompletePage/BookingCompletePage.jsx'

function hasAuthToken() {
  try {
    return Boolean(localStorage.getItem('auth_token'))
  } catch {
    return false
  }
}

function getAuthToken() {
  try {
    return localStorage.getItem('auth_token') || ''
  } catch {
    return ''
  }
}

function clearAuthStorage() {
  try {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  } catch {
    null
  }
}

export function HomeEntry() {
  const [mode, setMode] = useState(() => (hasAuthToken() ? 'checking' : 'guest'))

  useEffect(() => {
    let isActive = true
    if (mode !== 'checking') return () => null

    async function run() {
      const token = getAuthToken()
      if (!token) {
        if (isActive) setMode('guest')
        return
      }

      try {
        const res = await fetch('/api/user/profile', { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
        if (!isActive) return
        if (res.status === 401) {
          clearAuthStorage()
          setMode('guest')
          return
        }
        if (res.ok) {
          setMode('authed')
          return
        }
        setMode('authed')
      } catch {
        if (!isActive) return
        setMode('authed')
      }
    }

    run()
    return () => {
      isActive = false
    }
  }, [mode])

  return mode === 'authed' ? <HomeAuthed /> : <HomeGuest />
}

function safeReturnUrl(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (!trimmed.startsWith('/')) return ''
  if (trimmed.startsWith('//')) return ''
  return trimmed
}

export function AuthedOnly({ children, redirectTo = 'login' }) {
  const location = useLocation()
  if (!hasAuthToken()) {
    if (redirectTo === 'home') {
      return <Navigate to="/" replace />
    }
    const returnUrl = safeReturnUrl(`${location.pathname}${location.search || ''}`)
    const next = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'
    return <Navigate to={next} replace />
  }
  return children
}

export const router = createHashRouter([
  {
    path: '/',
    element: <HomeEntry />,
  },
  {
    path: '/after-login',
    element: (
      <AuthedOnly redirectTo="home">
        <HomeAuthed />
      </AuthedOnly>
    ),
  },
  {
    path: '/login',
    element: <Login mode="password" />,
  },
  {
    path: '/login/sms',
    element: <Login mode="sms" />,
  },
  {
    path: '/register',
    element: <RegisterStep1 showContract />,
  },
  {
    path: '/register/verify',
    element: <RegisterStep1 showContract={false} />,
  },
  {
    path: '/register/password',
    element: <RegisterStep2 />,
  },
  {
    path: '/orders',
    element: (
      <AuthedOnly>
        <OrderManagement />
      </AuthedOnly>
    ),
  },
  {
    path: '/orders/:orderId',
    element: (
      <AuthedOnly>
        <OrderDetail />
      </AuthedOnly>
    ),
  },
  {
    path: '/personal-center',
    element: (
      <AuthedOnly>
        <PersonalCenter />
      </AuthedOnly>
    ),
  },
  {
    path: '/personal-center/edit',
    element: (
      <AuthedOnly>
        <PersonalCenterEdit />
      </AuthedOnly>
    ),
  },
  {
    path: '/common-info/travelers',
    element: (
      <AuthedOnly>
        <CommonTravelerInfo />
      </AuthedOnly>
    ),
  },
  {
    path: '/common-info/travelers/edit',
    element: (
      <AuthedOnly>
        <CommonTravelerInfoEdit />
      </AuthedOnly>
    ),
  },
  {
    path: '/flights/results',
    element: (
      <AuthedOnly>
        <FlightSearchResults />
      </AuthedOnly>
    ),
  },
  {
    path: '/flights/list',
    element: (
      <AuthedOnly>
        <FlightSearchResults />
      </AuthedOnly>
    ),
  },
  {
    path: '/flights/book/step1',
    element: (
      <AuthedOnly>
        <BuyTicketStep1 />
      </AuthedOnly>
    ),
  },
  {
    path: '/flights/book/step2',
    element: (
      <AuthedOnly>
        <BuyTicketStep2 />
      </AuthedOnly>
    ),
  },
  {
    path: '/flights/book/step3',
    element: (
      <AuthedOnly>
        <BuyTicketStep3 />
      </AuthedOnly>
    ),
  },
  {
    path: '/flights/book/step4',
    element: (
      <AuthedOnly>
        <BuyTicketStep4 />
      </AuthedOnly>
    ),
  },
  {
    path: '/booking',
    element: (
      <AuthedOnly>
        <BookingFormPage />
      </AuthedOnly>
    ),
  },
  {
    path: '/booking/services',
    element: (
      <AuthedOnly>
        <BookingServicesPage />
      </AuthedOnly>
    ),
  },
  {
    path: '/booking/payment/:orderId',
    element: (
      <AuthedOnly>
        <BookingPaymentPage />
      </AuthedOnly>
    ),
  },
  {
    path: '/booking/complete',
    element: (
      <AuthedOnly>
        <BookingCompletePage />
      </AuthedOnly>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
