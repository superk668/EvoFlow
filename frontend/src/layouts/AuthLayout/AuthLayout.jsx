import { Outlet } from 'react-router-dom'
import AuthHeader from '../../components/AuthHeader/AuthHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.page}>
      <AuthHeader />
      <div className={styles.body}>
        <main className={styles.content}>
          <Outlet />
        </main>
        <BottomBar />
      </div>
    </div>
  )
}

