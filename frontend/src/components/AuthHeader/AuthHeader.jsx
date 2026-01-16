import PlaceholderImage from '../PlaceholderImage/PlaceholderImage.jsx'
import styles from './AuthHeader.module.css'

export default function AuthHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <PlaceholderImage name="Logo" width={22} height={22} />
          <div className={styles.brandText}>携程旅行</div>
        </div>
        <div className={styles.right}>
          <PlaceholderImage name="首页" width={18} height={18} />
          <PlaceholderImage name="收藏" width={18} height={18} />
          <PlaceholderImage name="更多" width={18} height={18} />
        </div>
      </div>
    </header>
  )
}

