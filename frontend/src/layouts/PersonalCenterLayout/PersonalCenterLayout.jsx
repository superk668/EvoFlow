import { Outlet, useLocation } from 'react-router-dom'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import PersonalCenterSideBar from '../../components/PersonalCenterSideBar/PersonalCenterSideBar.jsx'
import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import styles from './PersonalCenterLayout.module.css'

export default function PersonalCenterLayout() {
  const { pathname } = useLocation()
  const active = pathname.includes('/personal/orders')
    ? 'orders'
    : pathname.includes('/personal/common-info/travellers')
      ? 'commonTravellers'
      : pathname.includes('/personal/profile')
        ? 'profile'
        : 'profile'

  return (
    <div className={styles.page}>
      <TopHeader />
      <div className={styles.body}>
        <div className={styles.container}>
          <PersonalCenterSideBar active={active} />
          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
        <BottomBar />
      </div>
    </div>
  )
}
