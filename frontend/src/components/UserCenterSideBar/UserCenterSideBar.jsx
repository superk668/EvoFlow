import { Link, useLocation } from 'react-router-dom'

import styles from './UserCenterSideBar.module.css'

const MENU = [
  { label: '我的携程首页', type: 'title' },
  { label: '订单', path: '/user/orders' },
  { label: '我的消息' },
  { label: '钱包', hasChevron: true },
  { label: '礼品卡' },
  { label: '优惠券' },
  { label: '积分' },
  { label: '我的收藏' },
  { label: '常用信息', hasChevron: true },
  { label: '个人中心', hasChevron: true },
]

export default function UserCenterSideBar() {
  const location = useLocation()

  return (
    <aside className={styles.sidebar} aria-label="个人中心导航">
      <div className={styles.card}>
        {MENU.map((item) => {
          if (item.type === 'title') {
            return (
              <div key={item.label} className={styles.titleRow}>
                {item.label}
              </div>
            )
          }

          const isActive = item.path ? location.pathname.startsWith(item.path) : false
          const className = `${styles.row} ${isActive ? styles.active : ''}`

          if (item.path) {
            return (
              <Link key={item.label} to={item.path} className={className} aria-current={isActive ? 'page' : undefined}>
                <div className={styles.rowText}>{item.label}</div>
                {item.hasChevron ? <div className={styles.chevron} /> : null}
              </Link>
            )
          }

          return (
            <div key={item.label} className={className}>
              <div className={styles.rowText}>{item.label}</div>
              {item.hasChevron ? <div className={styles.chevron} /> : null}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
