import styles from './TopHeader.module.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function getStoredUserId() {
  try {
    const raw = localStorage.getItem('authUser')
    if (!raw) return ''
    const user = JSON.parse(raw)
    const id = user?.id
    return id ? String(id) : ''
  } catch {
    return ''
  }
}

export default function TopHeader({ variant = 'guest' } = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const userId = variant === 'authed' ? getStoredUserId() : ''

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link className={styles.logo} to="/" aria-label="首页">
            <div className={styles.logoMark} />
            <div className={styles.logoText}>携程旅行</div>
          </Link>
          <div className={styles.search}>
            <div className={styles.searchPlaceholder}>搜索目的地/酒店/景点/航班号</div>
            <div className={styles.searchBtn}>
              <div className={styles.searchIcon} />
            </div>
          </div>
        </div>

        <div className={styles.right}>
          {variant === 'authed' ? (
            <>
              <Link className={styles.link} to="/">
                首页
              </Link>
              <div className={styles.sep} />
              <div className={styles.userMenu}>
                <div
                  className={styles.userTrigger}
                  tabIndex={0}
                  role="button"
                  aria-label="账号菜单"
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  onClick={() => setIsMenuOpen((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setIsMenuOpen((v) => !v)
                    }
                  }}
                >
                  <div className={styles.userName}>{userId}</div>
                  <div className={styles.userChevron} />
                </div>
                {isMenuOpen ? (
                  <div className={`${styles.dropdown} ${styles.dropdownOpen}`} role="menu" aria-label="账号下拉菜单">
                    <div className={styles.dropdownHeader}>
                      <Link className={styles.dropdownName} to="/user" role="menuitem">
                        {userId}
                      </Link>
                      <div className={styles.dropdownVip}>白银贵宾</div>
                    </div>
                    <div className={styles.dropdownList}>
                      <Link className={styles.dropdownItem} to="/user/orders" role="menuitem">
                        <div className={styles.dropdownText}>我的订单</div>
                      </Link>
                      <div className={styles.dropdownItem} role="menuitem">
                        <div className={styles.dropdownText}>我的行程</div>
                      </div>
                      <div className={styles.dropdownItem} role="menuitem">
                        <div className={styles.dropdownText}>我的积分</div>
                        <div className={styles.dropdownValue}>2114</div>
                      </div>
                      <div className={styles.dropdownItem} role="menuitem">
                        <div className={styles.dropdownText}>我的钱包</div>
                      </div>
                      <div className={styles.dropdownItem} role="menuitem">
                        <div className={styles.dropdownText}>我的收藏</div>
                      </div>
                      <Link className={styles.dropdownItem} to="/user/common-traveler" role="menuitem">
                        <div className={styles.dropdownText}>常用信息</div>
                      </Link>
                      <Link className={styles.dropdownItem} to="/user/set-information" role="menuitem">
                        <div className={styles.dropdownText}>账户设置</div>
                      </Link>
                      <div className={styles.dropdownItem} role="menuitem">
                        <div className={styles.dropdownText}>会员商城</div>
                      </div>
                      <div className={styles.dropdownItem} role="menuitem">
                        <div className={styles.dropdownText}>合作卡</div>
                      </div>
                      <div className={styles.dropdownDivider} />
                      <div className={styles.dropdownItem} role="menuitem">
                        <div className={styles.dropdownText}>退出登录</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className={styles.sep} />
              <Link className={styles.link} to="/user/orders">
                我的订单
              </Link>
              <div className={styles.sep} />
              <div className={styles.link}>联系客服</div>
              <div className={styles.sep} />
              <div className={styles.link}>通知</div>
            </>
          ) : (
            <>
              <Link className={styles.link} to="/">
                首页
              </Link>
              <div className={styles.sep} />
              <Link className={styles.link} to="/login">
                登录
              </Link>
              <div className={styles.sep} />
              <Link className={styles.link} to="/register/step1">
                注册
              </Link>
              <div className={styles.sep} />
              <Link className={styles.link} to="/login">
                我的订单
              </Link>
              <div className={styles.sep} />
              <div className={styles.link}>客服中心</div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
