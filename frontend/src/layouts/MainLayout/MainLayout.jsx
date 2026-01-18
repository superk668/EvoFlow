import { Outlet, useLocation } from 'react-router-dom'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar.jsx'
import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  const location = useLocation()
  const hideLeftSidebar = location.pathname.startsWith('/personal') || location.pathname === '/orders'

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
