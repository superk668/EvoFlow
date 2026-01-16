import { Outlet } from 'react-router-dom'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import SideNav from '../../components/SideNav/SideNav.jsx'
import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import styles from './MainLayout.module.css'

export default function MainLayout() {
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <SideNav />
      </aside>
      <div className={styles.main}>
        <TopHeader />
        <div className={styles.body}>
          <main className={styles.content}>
            <Outlet />
          </main>
          <BottomBar />
        </div>
      </div>
    </div>
  )
}
