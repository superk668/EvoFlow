import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import styles from './PersonalLeftBar.module.css'

const topItems = [
  { key: 'home', label: '我的携程首页', kind: 'title' },
  { key: 'orders', label: '订单', to: '/orders' },
  { key: 'messages', label: '我的消息' },
  { key: 'wallet', label: '钱包', caret: true },
  { key: 'gift-card', label: '礼品卡' },
  { key: 'coupon', label: '优惠券' },
  { key: 'points', label: '积分' },
  { key: 'favorites', label: '我的收藏' },
  { key: 'common', label: '常用信息', caret: true },
]

const commonChildren = [
  { key: 'common-travelers', label: '常用旅客信息', to: '/user-center/common-info/travelers' },
  { key: 'common-contacts', label: '常用联系人' },
  { key: 'common-invoice', label: '常用报销凭证' },
  { key: 'common-address', label: '常用地址' },
]

const personalChildren = [
  { key: 'my-info', label: '我的信息', to: '/personal/my-info' },
  { key: 'bind', label: '绑定和关联' },
  { key: 'security', label: '账户安全' },
  { key: 'community', label: '我的社区主页' },
]

export default function PersonalLeftBar({ activeKey = 'orders' }) {
  const defaultPersonalOpen = useMemo(() => activeKey === 'my-info' || activeKey === 'personal', [activeKey])
  const defaultCommonOpen = useMemo(
    () => activeKey === 'common' || commonChildren.some((c) => c.key === activeKey),
    [activeKey]
  )
  const [commonOpen, setCommonOpen] = useState(defaultCommonOpen)
  const [personalOpen, setPersonalOpen] = useState(defaultPersonalOpen)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.inner}>
        {topItems.map((it) => {
          if (it.kind === 'title') {
            return (
              <div key={it.key} className={styles.title}>
                {it.label}
              </div>
            )
          }

          if (it.key === 'common') {
            const isGroupActive = activeKey === 'common' || commonChildren.some((c) => c.key === activeKey)
            return (
              <div key={it.key}>
                <button
                  type="button"
                  className={isGroupActive ? styles.groupActive : styles.group}
                  onClick={() => setCommonOpen((v) => !v)}
                >
                  <div className={styles.itemLabel}>{it.label}</div>
                  <span className={commonOpen ? styles.caretUp : styles.caretDown} aria-hidden="true" />
                </button>

                {commonOpen ? (
                  <div className={styles.submenu}>
                    {commonChildren.map((c) => {
                      const isChildActive = c.key === activeKey

                      if (c.to) {
                        return (
                          <Link
                            key={c.key}
                            className={isChildActive ? styles.subItemActive : styles.subItem}
                            to={c.to}
                          >
                            {c.label}
                          </Link>
                        )
                      }

                      return (
                        <div key={c.key} className={styles.subItem}>
                          {c.label}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          }

          const isActive = it.key === activeKey

          if (it.to) {
            return (
              <Link key={it.key} className={isActive ? styles.itemActive : styles.item} to={it.to}>
                <div className={styles.itemLabel}>{it.label}</div>
                {it.caret ? <span className={styles.caret} aria-hidden="true" /> : null}
              </Link>
            )
          }

          return (
            <div key={it.key} className={isActive ? styles.itemActive : styles.item}>
              <div className={styles.itemLabel}>{it.label}</div>
              {it.caret ? <span className={styles.caret} aria-hidden="true" /> : null}
            </div>
          )
        })}

        <button
          type="button"
          className={activeKey === 'personal' || activeKey === 'my-info' ? styles.groupActive : styles.group}
          onClick={() => setPersonalOpen((v) => !v)}
        >
          <div className={styles.itemLabel}>个人中心</div>
          <span className={personalOpen ? styles.caretUp : styles.caretDown} aria-hidden="true" />
        </button>

        {personalOpen ? (
          <div className={styles.submenu}>
            {personalChildren.map((c) => {
              const isChildActive = c.key === activeKey

              if (c.to) {
                return (
                  <Link key={c.key} className={isChildActive ? styles.subItemActive : styles.subItem} to={c.to}>
                    {c.label}
                  </Link>
                )
              }

              return (
                <div key={c.key} className={styles.subItem}>
                  {c.label}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </aside>
  )
}
