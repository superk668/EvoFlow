import { Outlet, useLocation } from 'react-router-dom'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import { readBookingStage } from '../../booking/storage.js'
import styles from './AuthLayout.module.css'

function safeReadStage() {
  try {
    const n = readBookingStage()
    if (!n || !Number.isFinite(n) || n < 1 || n > 4) return 1
    return n
  } catch {
    return 1
  }
}

export default function AuthLayout() {
  const location = useLocation()
  const showBookingProgress = location.pathname.startsWith('/booking')

  const stage = showBookingProgress ? safeReadStage() : 1

  return (
    <div className={styles.shell}>
      <TopHeader />
      {showBookingProgress ? (
        <div className={styles.bookingProgress} role="navigation" aria-label="购票进度">
          <div className={styles.progressSteps}>
            {[1, 2, 3, 4].map((n) => {
              const label = n === 1 ? '乘机信息' : n === 2 ? '增值服务' : n === 3 ? '支付' : '完成'
              const isActive = stage === n
              const isDone = stage > n
              return (
                <div key={n} className={isActive ? styles.progressStepActive : styles.progressStep}>
                  <span
                    className={isDone ? styles.progressDotDone : isActive ? styles.progressDotActive : styles.progressDot}
                    aria-hidden="true"
                  >
                    {isDone ? '✓' : String(n)}
                  </span>
                  {label}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
      <div className={styles.main}>
        <Outlet />
      </div>
      <BottomBar />
    </div>
  )
}
