import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PlaceholderImage from '../PlaceholderImage/PlaceholderImage.jsx'
import styles from './TopHeader.module.css'

let myOrdersEntryClickCount = 0

export default function TopHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuWrapRef = useRef(null)

  useEffect(() => {
    setIsUserMenuOpen(false)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    function handleDocClick(e) {
      const el = menuWrapRef.current
      if (!el) return
      if (el.contains(e.target)) return
      setIsUserMenuOpen(false)
    }

    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <PlaceholderImage name="Logo" width={22} height={22} />
          <div className={styles.brandText}>携程旅行</div>
        </div>

        <div className={styles.nav}>
          <button className={styles.navBtn} type="button" onClick={() => navigate('/', { replace: false })}>
            <span className={styles.navIcon} aria-hidden="true">
              <PlaceholderImage name="首页" width={18} height={18} />
            </span>
            首页
          </button>
          <div className={styles.divider} aria-hidden="true" />

          <div className={styles.userMenuWrap} ref={menuWrapRef}>
            <button
              className={styles.navBtn}
              type="button"
              onTouchStart={() => setIsUserMenuOpen(true)}
              onClick={() => setIsUserMenuOpen((v) => !v)}
            >
              <span className={styles.navIcon} aria-hidden="true">
                <PlaceholderImage name="用户" width={16} height={16} />
              </span>
              尊敬的…
              <span className={styles.caret} aria-hidden="true" />
            </button>

            {isUserMenuOpen ? (
              <div className={styles.userMenu} role="menu">
                <button className={styles.userMenuItem} type="button" onClick={() => navigate('/user-center/my-info')}>
                  用户名
                </button>
                <button
                  className={styles.userMenuItem}
                  type="button"
                  onClick={() => navigate('/user-center/common-info/travelers')}
                >
                  常用信息
                </button>
              </div>
            ) : null}
          </div>

          <div className={styles.divider} aria-hidden="true" />
          <button
            className={styles.navBtn}
            type="button"
            onClick={() => {
              myOrdersEntryClickCount += 1
              if (myOrdersEntryClickCount === 1) {
                navigate('/user-center/orders')
                return
              }
              navigate('/login')
            }}
          >
            我的订单
            <span className={styles.caret} aria-hidden="true" />
          </button>
          <div className={styles.divider} aria-hidden="true" />
          <div className={styles.navItem}>联系客服</div>
          <div className={styles.navItem}>通知</div>

          <button className={styles.authLink} type="button" onClick={() => navigate('/login')}>
            登录
          </button>
          <button className={styles.authLink} type="button" onClick={() => navigate('/register')}>
            注册
          </button>

          <div className={styles.iconRow}>
            <span className={styles.icon} aria-hidden="true">
              <PlaceholderImage name="手机" width={16} height={16} />
            </span>
            <span className={styles.icon} aria-hidden="true">
              <PlaceholderImage name="收藏" width={18} height={18} />
            </span>
            <span className={styles.icon} aria-hidden="true">
              <PlaceholderImage name="更多" width={18} height={18} />
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
