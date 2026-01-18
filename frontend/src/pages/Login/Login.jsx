import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import hero from '../../assets/placeholders/login-hero.svg'
import styles from './Login.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')

  function handleCaptchaLogin() {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    console.log('验证码:', code)
  }

  function handleLogin() {
    login({ username: '恒色初心', tier: '白银贵宾', points: 2114 })
    void account
    void password
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <div className={styles.notice}>
        <div className={styles.noticeIcon} aria-hidden="true" />
        <div className={styles.noticeText}>公告（可滚动公告）：为提升账户安全，请勿向他人泄露账号信息。</div>
      </div>

      <div className={styles.hero}>
        <img className={styles.heroImg} src={hero} alt="占位-登录页背景" />

        <div className={styles.panel}>
          <div className={styles.qrTab}>扫码登录</div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardTitle}>账号密码登录</div>
              <a className={styles.cardAlt} href="#/">
                手机号查单&gt;
              </a>
            </div>

            <div className={styles.form}>
              <div className={styles.field}>
                <input
                  className={styles.input}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="国内手机号/用户名/邮箱/卡号"
                />
              </div>

              <div className={styles.field}>
                <input
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="登录密码"
                  type="password"
                />
                <a className={styles.forgot} href="#/">
                  忘记密码
                </a>
              </div>

              <button type="button" className={styles.submit} onClick={handleLogin}>
                登 录
              </button>

              <div className={styles.agreeRow}>
                <div className={styles.radio} aria-hidden="true" />
                <div className={styles.agreeText}>
                  阅读并同意携程的 <a className={styles.agreeLink} href="#/">服务协议</a> 和{' '}
                  <a className={styles.agreeLink} href="#/">个人信息保护政策</a>
                </div>
              </div>

              <div className={styles.bottomRow}>
                <button type="button" className={styles.textLink} onClick={handleCaptchaLogin}>
                  验证码登录
                </button>
                <Link className={styles.textLinkRight} to="/register">
                  免费注册
                </Link>
              </div>

              <div className={styles.thirdTitle}>境外手机·公司用户·微信登录</div>
              <div className={styles.thirdRow} aria-hidden="true">
                <div className={styles.thirdIcon} />
                <div className={styles.thirdIcon} />
                <div className={styles.thirdIcon} />
                <div className={styles.thirdIcon} />
                <div className={styles.thirdIcon} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
