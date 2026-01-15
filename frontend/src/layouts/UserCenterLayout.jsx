import { Outlet } from 'react-router-dom'
import BottomBar from '../components/BottomBar/BottomBar.jsx'
import TopHeader from '../components/TopHeader/TopHeader.jsx'
import UserCenterSideBar from '../components/UserCenterSideBar/UserCenterSideBar.jsx'
import styles from './userCenterLayout.module.css'

export default function UserCenterLayout() {
  return (
    <div className={styles.shell}>
      <TopHeader variant="authed" />
      <div className={styles.body}>
        <div className={styles.container}>
          <UserCenterSideBar />
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
      <BottomBar />
    </div>
  )
}
