import { Link } from 'react-router-dom'

import styles from './TopHeader.module.css'

import logoCtrip from '../../assets/placeholders/logo_ctrip.svg'
import avatarUser from '../../assets/placeholders/avatar_user.svg'

export default function TopHeader({ variant, showHomeInAuthed = false, showSearch = true }) {
  const isAuthed = variant === 'authed'
  const isAuth = variant === 'auth'
  const isRegister = variant === 'register'

  let nickname = ''
  if (isAuthed) {
    try {
      const raw = localStorage.getItem('auth_user')
      const parsed = raw ? JSON.parse(raw) : null
      nickname = typeof parsed?.nickname === 'string' ? parsed.nickname : ''
    } catch {
      nickname = ''
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <img className={styles.logo} src={logoCtrip} alt="logo" />
          {!isAuth && showSearch ? (
            <div className={styles.search}>
              <input className={styles.searchInput} placeholder="搜索任何旅游相关" />
              <div className={styles.searchBtn} aria-hidden>
                <span className={styles.searchIcon} />
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.right}>
          {isAuth ? (
            <div className={styles.authIcons}>
              <div className={styles.headerIcon} aria-hidden />
              <div className={styles.headerIcon} aria-hidden />
            </div>
          ) : isRegister ? (
            <div className={styles.registerRight}>
              <Link className={styles.home} to="/">
                <span className={styles.homeIcon} aria-hidden />
                首页
              </Link>
              <div className={styles.headerIcon} aria-hidden />
              <div className={styles.headerIcon} aria-hidden />
            </div>
          ) : isAuthed ? (
            <div className={styles.authedRight}>
              {showHomeInAuthed ? (
                <Link className={styles.home} to="/">
                  <span className={styles.homeIcon} aria-hidden />
                  首页
                </Link>
              ) : null}
              <Link className={styles.user} to="/personal-center">
                <img className={styles.avatar} src={avatarUser} alt="avatar" />
                <span className={styles.nickname}>{nickname ? `尊敬的${nickname}` : '尊敬的...'}</span>
                <span className={styles.caret} />
              </Link>
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link className={styles.authLink} to="/login">
                登录
              </Link>
              <span className={styles.authDivider} />
              <Link className={styles.authLink} to="/register">
                注册
              </Link>
            </div>
          )}

          {!isAuth && !isRegister ? (
            <div className={styles.nav}>
              <Link className={styles.navItem} to="/orders">
                <span className={styles.navLabel}>我的订单</span>
                {isAuthed ? <span className={styles.navCaret} aria-hidden /> : null}
              </Link>
              <span className={styles.navSplit} />
              <a className={styles.navItem} href="#">联系客服</a>
              <span className={styles.navSplit} />
              <a className={styles.navItem} href="#">通知</a>
              <span className={styles.navSplit} />
              <div className={styles.iconBtn} aria-hidden />
              <div className={styles.iconBtn} aria-hidden />
              <div className={styles.iconBtn} aria-hidden />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
