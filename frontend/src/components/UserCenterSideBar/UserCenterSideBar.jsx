import { useMemo, useState } from 'react'
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
  {
    label: '常用信息',
    hasChevron: true,
    children: [
      { label: '常用旅客', path: '/user/common-traveler' },
      { label: '常用联系人' },
      { label: '常用报销凭证' },
      { label: '常用地址' },
    ],
  },
  {
    label: '个人中心',
    hasChevron: true,
    expanded: true,
    children: [
      { label: '我的信息', path: '/user' },
      { label: '绑定和关联' },
      { label: '账户安全' },
      { label: '我的社区主页' },
    ],
  },
]

export default function UserCenterSideBar() {
  const location = useLocation()
  const [expandedGroups, setExpandedGroups] = useState(() => new Set())

  const isExpanded = useMemo(() => {
    return (label) => expandedGroups.has(label)
  }, [expandedGroups])

  const toggleExpanded = (label) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

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

          if (item.children) {
            const isGroupActive = item.label === '常用信息'
              ? location.pathname.startsWith('/user/common')
              : location.pathname === '/user'

            const expanded = isExpanded(item.label)
            return (
              <div key={item.label}>
                <div
                  className={`${styles.row} ${isGroupActive ? styles.active : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expanded}
                  onClick={() => toggleExpanded(item.label)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleExpanded(item.label)
                    }
                  }}
                >
                  <div className={styles.rowText}>{item.label}</div>
                  {item.hasChevron ? (
                    <div className={`${styles.chevron} ${expanded ? styles.chevronUp : ''}`} />
                  ) : null}
                </div>
                {expanded ? (
                  <div className={styles.subList}>
                    {item.children.map((child) => {
                      const isChildActive = child.path ? location.pathname === child.path : false
                      const childClassName = `${styles.subRow} ${isChildActive ? styles.subActive : ''}`

                      if (child.path) {
                        return (
                          <Link
                            key={child.label}
                            to={child.path}
                            className={childClassName}
                            aria-current={isChildActive ? 'page' : undefined}
                          >
                            {child.label}
                          </Link>
                        )
                      }

                      return (
                        <div key={child.label} className={childClassName}>
                          {child.label}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
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
