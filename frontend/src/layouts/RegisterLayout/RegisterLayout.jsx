import { Outlet } from 'react-router-dom'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import RegisterHeader from '../../components/RegisterHeader/RegisterHeader.jsx'
import styles from './RegisterLayout.module.css'

export default function RegisterLayout() {
  return (
    <div className={styles.page}>
      <RegisterHeader />
      <div className={styles.body}>
        <main className={styles.content}>
          <Outlet />
        </main>
        <BottomBar />
      </div>
    </div>
  )
}

