import { Outlet, useLocation } from 'react-router-dom'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './BookingLayout.module.css'

const steps = [
  { no: 1, label: '乘机信息' },
  { no: 2, label: '增值服务' },
  { no: 3, label: '支付' },
  { no: 4, label: '完成' },
]

export default function BookingLayout() {
  const { pathname } = useLocation()
  const currentStep = pathname.includes('/buy-ticket/step2') || pathname.includes('/booking/services')
    ? 2
    : pathname.includes('/buy-ticket/step3') || pathname.includes('/booking/payment')
      ? 3
      : pathname.includes('/buy-ticket/step4') || pathname.includes('/booking/complete')
        ? 4
        : 1

  const isPayment = currentStep === 3

  return (
    <div className={styles.page}>
      {isPayment ? (
        <header className={styles.payHeader}>
          <div className={styles.payInner}>
            <div className={styles.payTitle}>安全支付</div>
            <div className={styles.payRight}>
              <PlaceholderImage name="无障碍" width={14} height={14} />
              无障碍
            </div>
          </div>
        </header>
      ) : (
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.brand}>
              <PlaceholderImage name="Logo" width={22} height={22} />
              <div className={styles.brandText}>携程旅行</div>
            </div>

            <div className={styles.steps}>
              {steps.map((s) => (
                <div
                  key={s.no}
                  className={[
                    styles.step,
                    s.no < currentStep ? styles.stepDone : '',
                    s.no === currentStep ? styles.stepActive : '',
                  ].join(' ')}
                >
                  <div className={styles.stepNo}>{s.no < currentStep ? '' : s.no}</div>
                  <div className={styles.stepLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className={styles.headerRight}>
              {currentStep === 4 ? (
                <div className={styles.navRight}>
                  <div className={styles.navItem}>首页</div>
                  <div className={styles.navSep} aria-hidden="true" />
                  <div className={styles.navUser}>
                    <span className={styles.userAvatar} aria-hidden="true">
                      <PlaceholderImage name="用户" width={16} height={16} />
                    </span>
                    dev
                  </div>
                  <div className={styles.navItem}>我的订单</div>
                  <div className={styles.navItem}>联系客服</div>
                </div>
              ) : (
                <>
                  <div className={styles.rightLink}>尊敬的会员</div>
                  <div className={styles.rightLink}>客服中心</div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
