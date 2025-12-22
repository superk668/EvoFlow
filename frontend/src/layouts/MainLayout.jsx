import { Outlet } from 'react-router-dom'
import SideNav from '../components/SideNav/SideNav.jsx'
import TopHeader from '../components/TopHeader/TopHeader.jsx'
import BottomBar from '../components/BottomBar/BottomBar.jsx'
import styles from './layout.module.css'

export default function MainLayout() {
  return (
    <div className={styles.shell}>
      <SideNav />
      <div className={styles.mainCol}>
        <TopHeader />
        <main className={styles.main}>
          <Outlet />
        </main>
        <BottomBar />
      </div>
    </div>
  )
}
