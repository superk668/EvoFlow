import { Link } from 'react-router-dom'

import styles from './CommonInfoNav.module.css'

const topItems = [
  { label: '我的携程首页' },
  { label: '订单' },
  { label: '我的消息' },
  { label: '钱包', caret: 'down' },
  { label: '礼品卡' },
  { label: '优惠券' },
  { label: '积分' },
  { label: '我的收藏' },
]

const commonInfoItems = [
  { label: '常用旅客信息', to: '/common-info/travelers' },
  { label: '常用联系人', to: '#' },
  { label: '常用报销凭证', to: '#' },
  { label: '常用地址', to: '#' },
]

export default function CommonInfoNav() {
  return (
    <aside className={styles.aside}>
      <div className={styles.panel}>
        <div className={styles.list}>
          {topItems.map((it) => (
            <div key={it.label} className={styles.item}>
              <span className={styles.itemText}>{it.label}</span>
              {it.caret ? (
                <span
                  className={it.caret === 'down' ? styles.caretDown : styles.caretUp}
                  aria-hidden
                />
              ) : null}
            </div>
          ))}

          <div className={styles.sectionHeaderActive}>
            <span className={styles.itemText}>常用信息</span>
            <span className={styles.caretUp} aria-hidden />
          </div>

          <div className={styles.subList}>
            {commonInfoItems.map((t) => (
              <Link
                key={t.label}
                className={t.label === '常用旅客信息' ? styles.subItemActive : styles.subItem}
                to={t.to}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <div className={styles.sectionHeader}>
            <span className={styles.itemText}>个人中心</span>
            <span className={styles.caretDown} aria-hidden />
          </div>
        </div>
      </div>
    </aside>
  )
}

