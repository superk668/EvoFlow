import PlaceholderImage from '../PlaceholderImage/PlaceholderImage.jsx'
import styles from './RegisterHeader.module.css'

export default function RegisterHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <PlaceholderImage name="Logo" width={22} height={22} />
          <div className={styles.brandText}>携程旅行</div>
        </div>

        <div className={styles.search}>
          <input className={styles.searchInput} placeholder="搜索任何旅游相关" />
          <div className={styles.searchBtn} aria-hidden="true">
            <PlaceholderImage name="Search" width={18} height={18} />
          </div>
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

