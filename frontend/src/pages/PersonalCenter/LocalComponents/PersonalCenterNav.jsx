import { Link, useLocation } from 'react-router-dom'

import styles from './PersonalCenterNav.module.css'

const topItems = [
  { label: '我的携程首页', to: '/after-login' },
  { label: '订单', to: '/orders' },
  { label: '我的消息' },
  { label: '钱包', caret: 'down' },
  { label: '礼品卡' },
  { label: '优惠券' },
  { label: '积分' },
  { label: '我的收藏' },
  { label: '常用信息', caret: 'down', to: '/common-info/travelers' },
]

const personalCenterChildren = [
  { label: '我的信息', to: '/personal-center', activePrefix: '/personal-center' },
  { label: '常用旅客信息', to: '/common-info/travelers', activePrefix: '/common-info/travelers' },
  { label: '订单管理', to: '/orders', activePrefix: '/orders' },
  { label: '绑定和关联' },
  { label: '账户安全' },
  { label: '我的社区主页' },
]

export default function PersonalCenterNav({ showPersonalCenterSection = true }) {
  const location = useLocation()

  const topActivePrefix = typeof location?.pathname === 'string' ? location.pathname : ''

  return (
    <aside className={styles.aside}>
      <div className={styles.panel}>
        <div className={styles.list}>
          {topItems.map((it) => (
            <div
              key={it.label}
              className={it.to && topActivePrefix === it.to ? styles.itemActive : styles.item}
            >
              {it.to ? (
                <Link className={styles.itemText} to={it.to}>
                  {it.label}
                </Link>
              ) : (
                <span className={styles.itemText}>{it.label}</span>
              )}
              {it.caret ? (
                <span
                  className={it.caret === 'down' ? styles.caretDown : styles.caretUp}
                  aria-hidden
                />
              ) : null}
            </div>
          ))}

          {showPersonalCenterSection ? (
            <>
              <div className={styles.sectionHeader}>
                <span className={styles.itemText}>个人中心</span>
                <span className={styles.caretUp} aria-hidden />
              </div>

              <div className={styles.subList}>
                {personalCenterChildren.map((it) => {
                  const isActive =
                    it.activePrefix &&
                    typeof location?.pathname === 'string' &&
                    location.pathname.startsWith(it.activePrefix)

                  if (it.to) {
                    return (
                      <Link
                        key={it.label}
                        className={isActive ? styles.subItemActive : styles.subItem}
                        to={it.to}
                      >
                        {it.label}
                      </Link>
                    )
                  }

                  return (
                    <div key={it.label} className={styles.subItem}>
                      {it.label}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className={styles.item}>
              <span className={styles.itemText}>个人中心</span>
              <span className={styles.caretDown} aria-hidden />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
