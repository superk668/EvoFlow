import { Outlet } from 'react-router-dom'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.shell}>
      <TopHeader />
      <div className={styles.main}>
        <Outlet />
      </div>
      <BottomBar />
    </div>
  )
}

