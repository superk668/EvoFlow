import { Outlet } from 'react-router-dom'
import TopHeader from '../components/TopHeader/TopHeader.jsx'
import BottomBar from '../components/BottomBar/BottomBar.jsx'
import styles from './authLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.shell}>
      <TopHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomBar />
    </div>
  )
}

