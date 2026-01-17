import { Navigate, useLocation } from 'react-router-dom'

export default function FlightBooking() {
  const location = useLocation()

  return <Navigate to={`/buy-ticket/step1${location.search}`} replace />
}
