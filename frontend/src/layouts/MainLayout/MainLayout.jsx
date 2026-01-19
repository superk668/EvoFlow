import { Navigate, Outlet, useLocation } from 'react-router-dom'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar.jsx'
import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  const { auth } = useAuth()
  const location = useLocation()
  const hideLeftSidebar =
    location.pathname.startsWith('/personal') || location.pathname.startsWith('/orders') || location.pathname.startsWith('/user-center')
  const requiresAuth =
    location.pathname.startsWith('/personal') || location.pathname.startsWith('/orders') || location.pathname.startsWith('/user-center')

  if (requiresAuth && !auth.isLoggedIn) {
    const redirectTo = location.pathname + location.search
    try {
      sessionStorage.setItem('postLoginRedirect', redirectTo)
    } catch {
      void 0
    }
    return <Navigate to="/login" replace state={{ from: redirectTo }} />
  }

  return (
    <div className={styles.shell}>
      <TopHeader />
      <div className={styles.body}>
        {hideLeftSidebar ? null : <LeftSidebar />}
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
      <BottomBar />
    </div>
  )
}
