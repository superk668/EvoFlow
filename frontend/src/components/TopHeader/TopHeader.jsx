import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import styles from './TopHeader.module.css'

export default function TopHeader() {
  const { auth, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = auth.userDisplayName ?? auth.username

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true" />
          <div className={styles.brandText}>携程旅行</div>
        </div>

        <nav className={styles.nav}>
          <Link className={styles.navItem} to="/">
            <span className={styles.navIconHome} aria-hidden="true" />
            首页
          </Link>

          <div className={styles.authSlot}>
            {auth.isLoggedIn ? (
              <div
                className={styles.userMenu}
                onMouseEnter={() => setMenuOpen(true)}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  type="button"
                  className={styles.userButton}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <span className={styles.navIconUser} aria-hidden="true" />
                  尊敬的{displayName}
                  <span className={styles.navCaret} aria-hidden="true">
                    ▾
                  </span>
                </button>

                <div className={menuOpen ? styles.menuPanelOpen : styles.menuPanel}>
                  <div className={styles.menuHeader}>
                    <Link className={styles.menuHeaderMain} to="/user-center/my-info">
                      <div className={styles.menuAvatar} aria-hidden="true" />
                      <div className={styles.menuHeaderText}>
                        <div className={styles.menuTitleRow}>
                          <div className={styles.menuTitle}>{displayName}</div>
                          <div className={styles.menuChevron} aria-hidden="true">
                            &gt;
                          </div>
                        </div>
                        <div className={styles.menuSubRow}>
                          <div className={styles.tierIcon} aria-hidden="true" />
                          <div className={styles.menuTier}>{auth.tier}</div>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className={styles.menuItems}>
                    <div className={styles.menuItem}>
                      <div className={styles.menuIcon} aria-hidden="true" />
                      <div className={styles.menuLabel}>我的积分</div>
                      <div className={styles.menuValue}>{auth.points}</div>
                    </div>
                    <div className={styles.menuItem}>
                      <div className={styles.menuIcon} aria-hidden="true" />
                      <div className={styles.menuLabel}>我的钱包</div>
                    </div>
                    <div className={styles.menuItem}>
                      <div className={styles.menuIcon} aria-hidden="true" />
                      <div className={styles.menuLabel}>我的收藏</div>
                    </div>
                    <Link className={styles.menuItemLink} to="/user-center/common-info/travelers">
                      <div className={styles.menuIcon} aria-hidden="true" />
                      <div className={styles.menuLabel}>常用信息</div>
                    </Link>
                    <div className={styles.menuItem}>
                      <div className={styles.menuIcon} aria-hidden="true" />
                      <div className={styles.menuLabel}>会员商城</div>
                    </div>
                    <div className={styles.menuItem}>
                      <div className={styles.menuIcon} aria-hidden="true" />
                      <div className={styles.menuLabel}>合作卡</div>
                    </div>
                    <div className={styles.menuDivider} />
                    <button type="button" className={styles.menuLogout} onClick={logout}>
                      <div className={styles.menuLogoutIcon} aria-hidden="true" />
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.loginRegister}>
                <Link className={styles.authLink} to="/login">
                  登录
                </Link>
                <span className={styles.authSep} aria-hidden="true">
                  /
                </span>
                <Link className={styles.authLink} to="/register">
                  注册
                </Link>
              </div>
            )}
          </div>

          <div className={styles.vSep} aria-hidden="true" />

          <Link className={styles.navItem} to="/user-center/orders">
            我的订单
            <span className={styles.navCaret} aria-hidden="true">
              ▾
            </span>
          </Link>

          <div className={styles.vSep} aria-hidden="true" />

          <Link className={styles.navItem} to="/">
            联系客服
          </Link>
          <Link className={styles.navItem} to="/">
            通知
          </Link>

          <div className={styles.iconRow} aria-hidden="true">
            <div className={styles.headerIconPhone} />
            <div className={styles.headerIconHeart} />
            <div className={styles.headerIconMessage} />
          </div>
        </nav>
      </div>
    </header>
  )
}
