import styles from './TopHeader.module.css'

export default function TopHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.logo}>
            <div className={styles.logoMark} />
            <div className={styles.logoText}>携程旅行</div>
          </div>
          <div className={styles.search}>
            <div className={styles.searchPlaceholder}>搜索目的地/酒店/景点/航班号</div>
            <div className={styles.searchBtn}>
              <div className={styles.searchIcon} />
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.link}>登录</div>
          <div className={styles.sep} />
          <div className={styles.link}>注册</div>
          <div className={styles.sep} />
          <div className={styles.link}>我的订单</div>
          <div className={styles.sep} />
          <div className={styles.link}>客服中心</div>
        </div>
      </div>
    </header>
  )
}

