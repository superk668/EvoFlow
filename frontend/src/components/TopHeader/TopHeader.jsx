import styles from './TopHeader.module.css'
import { Link } from 'react-router-dom'

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
          <Link className={styles.link} to="/login">
            登录
          </Link>
          <div className={styles.sep} />
          <Link className={styles.link} to="/register/step1">
            注册
          </Link>
          <div className={styles.sep} />
          <Link className={styles.link} to="/user/orders">
            我的订单
          </Link>
          <div className={styles.sep} />
          <div className={styles.link}>客服中心</div>
        </div>
      </div>
    </header>
  )
}
