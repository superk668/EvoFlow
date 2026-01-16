import PlaceholderImage from '../PlaceholderImage/PlaceholderImage.jsx'
import styles from './TopHeader.module.css'

export default function TopHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.brand}>
            <PlaceholderImage name="Logo" width={22} height={22} />
            <div className={styles.brandText}>携程旅行</div>
          </div>
          <div className={styles.search}>
            <div className={styles.searchText}>机票/酒店/景点/攻略</div>
            <div className={styles.searchBtn} aria-hidden="true">
              <PlaceholderImage name="Search" width={18} height={18} />
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.link}>登录</div>
          <div className={styles.sep}>|</div>
          <div className={styles.link}>注册</div>
          <div className={styles.linkMuted}>我的订单</div>
          <div className={styles.iconRow}>
            <PlaceholderImage name="消息" width={18} height={18} />
            <PlaceholderImage name="客服" width={18} height={18} />
            <PlaceholderImage name="语言" width={18} height={18} />
          </div>
        </div>
      </div>
    </header>
  )
}

