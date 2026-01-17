import PlaceholderImage from '../PlaceholderImage/PlaceholderImage.jsx'
import styles from './TopHeader.module.css'

export default function TopHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <PlaceholderImage name="Logo" width={22} height={22} />
          <div className={styles.brandText}>携程旅行</div>
        </div>

        <div className={styles.nav}>
          <div className={styles.navItem}>
            <span className={styles.navIcon} aria-hidden="true">
              <PlaceholderImage name="首页" width={18} height={18} />
            </span>
            首页
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.navItem}>
            <span className={styles.navIcon} aria-hidden="true">
              <PlaceholderImage name="用户" width={16} height={16} />
            </span>
            尊敬的…
            <span className={styles.caret} aria-hidden="true" />
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.navItem}>
            我的订单
            <span className={styles.caret} aria-hidden="true" />
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.navItem}>联系客服</div>
          <div className={styles.navItem}>通知</div>
          <div className={styles.iconRow}>
            <span className={styles.icon} aria-hidden="true">
              <PlaceholderImage name="手机" width={16} height={16} />
            </span>
            <span className={styles.icon} aria-hidden="true">
              <PlaceholderImage name="收藏" width={18} height={18} />
            </span>
            <span className={styles.icon} aria-hidden="true">
              <PlaceholderImage name="更多" width={18} height={18} />
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
