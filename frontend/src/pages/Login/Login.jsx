import styles from './Login.module.css'
import loginHero from '../../assets/placeholders/login_hero_1180x360.svg'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Login({ onLoginSuccess } = {}) {
  const [activeTab, setActiveTab] = useState('password')
  const navigate = useNavigate()

  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  const [isRequestingCode, setIsRequestingCode] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [lastSmsCode, setLastSmsCode] = useState('')

  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const canResend = !isRequestingCode && resendCountdown <= 0

  const isValidPhone = useMemo(() => {
    return /^1\d{10}$/.test(phoneNumber)
  }, [phoneNumber])

  useEffect(() => {
    if (resendCountdown <= 0) return

    const t = setTimeout(() => {
      setResendCountdown((v) => Math.max(0, v - 1))
    }, 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  async function postJson(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }

  async function handleSendCode() {
    setErrorMessage('')
    setFieldErrors({})
    setLastSmsCode('')

    if (!isValidPhone) {
      setErrorMessage('手机号格式不正确，请重新输入')
      return
    }

    if (!canResend) return

    setIsRequestingCode(true)
    setResendCountdown(60)

    const result = await postJson('/api/v1/auth/sms/send', {
      phoneNumber,
      type: 'login',
    })

    if (!result.ok) {
      setIsRequestingCode(false)
      if (result.status !== 429) {
        setResendCountdown(0)
        setErrorMessage(result.data?.message || '发送失败')
      }
      return
    }

    setResendCountdown(Number(result.data?.expiresIn || 60))
    if (result.data?.code) setLastSmsCode(String(result.data.code))
    setIsRequestingCode(false)
  }

  async function handleSubmit() {
    setErrorMessage('')
    setFieldErrors({})

    if (activeTab === 'password') {
      const nextFieldErrors = {}
      if (!account.trim()) nextFieldErrors.account = '请输入用户名'
      if (!password) nextFieldErrors.password = '请输入密码'
      if (Object.keys(nextFieldErrors).length) {
        setFieldErrors(nextFieldErrors)
        return
      }

      if (!agreeTerms) {
        setErrorMessage('请阅读并同意服务协议')
        return
      }

      setIsSubmitting(true)
      const result = await postJson('/api/v1/auth/login/password', {
        account,
        password,
        agreeTerms,
      })
      setIsSubmitting(false)

      if (!result.ok) {
        setErrorMessage(result.data?.message || '登录失败')
        return
      }

      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(result.data)
        return
      }
      navigate('/')
      return
    }

    if (!isValidPhone) {
      setErrorMessage('手机号格式不正确，请重新输入')
      return
    }

    if (!agreeTerms) {
      setErrorMessage('先请阅读并勾选服务协议')
      return
    }

    setIsSubmitting(true)
    const result = await postJson('/api/v1/auth/login/sms', {
      phoneNumber,
      code,
      agreeTerms,
    })
    setIsSubmitting(false)

    if (!result.ok) {
      setErrorMessage(result.data?.message || '登录失败')
      return
    }

    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(result.data)
      return
    }
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <div className={styles.notice}>
        <div className={styles.noticeInner}>
          <div className={styles.noticeIcon} />
          <div className={styles.noticeText}>
            您尚未登录，部分功能将无法正常使用。航班动态仅供参考，具体以航司实时数据为准。
          </div>
          <div className={styles.noticeClose}>×</div>
        </div>
      </div>

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroArt}>
            <img className={styles.heroImg} src={loginHero} alt="登录背景" />
          </div>

          <div className={styles.cardWrap}>
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <button
                  type="button"
                  className={styles.cardTitle}
                  onClick={() => setActiveTab('password')}
                >
                  账号密码登录
                </button>
                <button
                  type="button"
                  className={styles.cardAlt}
                  onClick={() => setActiveTab('sms')}
                >
                  手机验证码登录
                </button>
              </div>

              {activeTab === 'password' ? (
                <>
                  <div className={styles.field}>
                    <input
                      className={styles.inputEl}
                      placeholder="国内手机号/用户名/邮箱/卡号"
                      aria-label="账号"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                    />
                  </div>
                  {fieldErrors.account ? <div>{fieldErrors.account}</div> : null}

                  <div className={styles.fieldRow}>
                    <div className={styles.fieldSmall}>
                      <input
                        className={styles.inputEl}
                        placeholder="登录密码"
                        aria-label="登录密码"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <Link className={styles.forgot} to="/forgot-password">
                      忘记密码
                    </Link>
                  </div>
                  {fieldErrors.password ? <div>{fieldErrors.password}</div> : null}
                </>
              ) : (
                <>
                  <div className={styles.field}>
                    <input
                      className={styles.inputEl}
                      placeholder="手机号"
                      aria-label="手机号"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.fieldSmall}>
                      <input
                        className={styles.inputEl}
                        placeholder="6位数字"
                        aria-label="验证码"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                    </div>
                  <button
                    type="button"
                    className={styles.forgot}
                    onClick={handleSendCode}
                    disabled={!canResend}
                  >
                    {canResend ? '发送验证码' : '重新发送'}
                  </button>
                  </div>
                  {resendCountdown > 0 ? <div>{resendCountdown}</div> : null}
                  {lastSmsCode ? <div>{`验证码：${lastSmsCode}`}</div> : null}
                </>
              )}

              {errorMessage ? <div>{errorMessage}</div> : null}

              <button
                type="button"
                className={styles.loginBtn}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                登 录
              </button>

              <label className={styles.agreeRow}>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  aria-label="服务协议"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <div className={styles.agreeText}>阅读并同意携程的</div>
                <div className={styles.agreeLink}>服务协议</div>
                <div className={styles.agreeText}>和</div>
                <div className={styles.agreeLink}>个人信息保护政策</div>
              </label>

              <div className={styles.bottomLinks}>
                <button
                  type="button"
                  className={styles.bottomLink}
                  onClick={() => setActiveTab(activeTab === 'password' ? 'sms' : 'password')}
                >
                  {activeTab === 'password' ? '验证码登录' : '账号登录'}
                </button>
                <Link className={styles.bottomLink} to="/register">
                  免费注册
                </Link>
              </div>

              <div className={styles.thirdRow}>
                <div className={styles.thirdLabel}>境外手机</div>
                <div className={styles.thirdIcons}>
                  <Link
                    to="/oauth/wechat"
                    aria-label="微信登录"
                    className={`${styles.thirdIcon} ${styles.wx}`}
                  />
                  <Link to="/oauth/qq" aria-label="QQ登录" className={`${styles.thirdIcon} ${styles.qq}`} />
                  <Link
                    to="/oauth/alipay"
                    aria-label="支付宝登录"
                    className={`${styles.thirdIcon} ${styles.zfb}`}
                  />
                  <Link
                    to="/oauth/weibo"
                    aria-label="微博登录"
                    className={`${styles.thirdIcon} ${styles.wb}`}
                  />
                  <Link
                    to="/oauth/baidu"
                    aria-label="百度登录"
                    className={`${styles.thirdIcon} ${styles.apple}`}
                  />
                </div>
              </div>

              <div className={styles.sideTab}>
                <div className={styles.sideText}>扫码登录</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
