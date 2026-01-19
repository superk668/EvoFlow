import { Link, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import hero from '../../assets/placeholders/login-hero.svg'
import styles from './Login.module.css'

const AUTH_STORAGE_KEY = 'evoflow_auth'

function isValidPhoneNumber(phoneNumber) {
  return /^1\d{10}$/.test(String(phoneNumber).trim())
}

function safeWriteAuth(auth) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  } catch {
    void 0
  }
}

function safeReadPostLoginRedirect() {
  try {
    return sessionStorage.getItem('postLoginRedirect')
  } catch {
    return null
  }
}

function safeClearPostLoginRedirect() {
  try {
    sessionStorage.removeItem('postLoginRedirect')
  } catch {
    void 0
  }
}

export default function Login() {
  const { login } = useAuth()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('password')
  const [redirectTo, setRedirectTo] = useState('')

  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [agreed, setAgreed] = useState(false)

  const [fieldError, setFieldError] = useState({ account: '', password: '', phoneNumber: '', verificationCode: '' })
  const [agreeError, setAgreeError] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const sendLockRef = useRef(false)

  const canSendCode = countdownSeconds <= 0 && !isLoading
  const isCountingDown = countdownSeconds > 0

  useEffect(() => {
    if (!isCountingDown) return
    const id = setInterval(() => {
      setCountdownSeconds((v) => (v <= 1 ? 0 : v - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [isCountingDown])

  const submitText = useMemo(() => (isLoading ? '登 录…' : '登 录'), [isLoading])

  function handleSendSms() {
    setError('')
    setFieldError((prev) => ({ ...prev, phoneNumber: '' }))

    const phone = String(phoneNumber).trim()
    if (!isValidPhoneNumber(phone)) {
      setError('手机号格式不正确，请重新输入')
      setFieldError((prev) => ({ ...prev, phoneNumber: '手机号格式不正确，请重新输入' }))
      return
    }

    if (!canSendCode) return

    if (sendLockRef.current) return
    sendLockRef.current = true

    setCountdownSeconds(60)
    fetch('/api/auth/login/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone }),
    })
      .then((resp) => {
        if (!resp.ok && resp.status !== 204) {
          if (resp.status === 429) {
            setError('操作频繁，请稍后再试')
            return
          }
          setError('发送验证码失败')
        }
      })
      .catch(() => {
        setError('网络请求失败，请稍后重试')
      })
      .finally(() => {
        sendLockRef.current = false
      })
  }

  async function handlePasswordLogin() {
    setError('')
    setAgreeError('')
    setFieldError({ account: '', password: '', phoneNumber: '', verificationCode: '' })

    const nextFieldError = { account: '', password: '', phoneNumber: '', verificationCode: '' }
    const acc = String(account).trim()
    const pwd = String(password)

    if (!acc) nextFieldError.account = '请输入用户名'
    if (!pwd) nextFieldError.password = '请输入密码'
    if (!agreed) setAgreeError('请阅读并同意服务协议')

    setFieldError(nextFieldError)

    if (nextFieldError.account || nextFieldError.password || !agreed) return

    setIsLoading(true)
    try {
      const resp = await fetch('/api/auth/login/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: acc, password: pwd }),
      })
      if (resp.status === 401) {
        setError('用户名或密码不正确')
        return
      }
      if (!resp.ok) {
        setError('登录失败')
        return
      }

      const data = await resp.json()
      const nextAuth = {
        isLoggedIn: true,
        loginAt: data.loginAt ?? new Date().toISOString(),
        userDisplayName: data.userDisplayName ?? '用户',
        phoneNumber: data.phoneNumber ?? null,
        token: data.token ?? null,
      }
      safeWriteAuth(nextAuth)
      flushSync(() => {
        login(nextAuth)
      })

      const fromState =
        location?.state && typeof location.state === 'object' && typeof location.state.from === 'string'
          ? location.state.from
          : ''
      const redirect = fromState || safeReadPostLoginRedirect() || ''
      if (redirect) {
        safeClearPostLoginRedirect()
        setRedirectTo(redirect)
      } else {
        setRedirectTo('/')
      }
    } catch {
      setError('网络请求失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSmsLogin() {
    setError('')
    setAgreeError('')
    setFieldError({ account: '', password: '', phoneNumber: '', verificationCode: '' })

    const nextFieldError = { account: '', password: '', phoneNumber: '', verificationCode: '' }
    const phone = String(phoneNumber).trim()
    const code = String(verificationCode).trim()

    if (!isValidPhoneNumber(phone)) nextFieldError.phoneNumber = '手机号格式不正确，请重新输入'
    if (!code) nextFieldError.verificationCode = '请输入验证码'
    if (!agreed) setAgreeError('先请阅读并勾选服务协议')

    setFieldError(nextFieldError)
    if (nextFieldError.phoneNumber) {
      setError('手机号格式不正确，请重新输入')
      return
    }
    if (nextFieldError.verificationCode || !agreed) return

    setIsLoading(true)
    try {
      const resp = await fetch('/api/auth/login/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, verificationCode: code }),
      })
      if (resp.status === 401) {
        setError('验证码不正确')
        return
      }
      if (resp.status === 404) {
        setError('该手机号未注册，请先注册')
        return
      }
      if (!resp.ok) {
        setError('登录失败')
        return
      }

      const data = await resp.json()
      const nextAuth = {
        isLoggedIn: true,
        loginAt: data.loginAt ?? new Date().toISOString(),
        userDisplayName: data.userDisplayName ?? '用户',
        phoneNumber: data.phoneNumber ?? phone,
        token: data.token ?? null,
      }
      safeWriteAuth(nextAuth)
      flushSync(() => {
        login(nextAuth)
      })

      const fromState =
        location?.state && typeof location.state === 'object' && typeof location.state.from === 'string'
          ? location.state.from
          : ''
      const redirect = fromState || safeReadPostLoginRedirect() || ''
      if (redirect) {
        safeClearPostLoginRedirect()
        setRedirectTo(redirect)
      } else {
        setRedirectTo('/')
      }
    } catch {
      setError('网络请求失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (redirectTo) return <Navigate to={redirectTo} replace />

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
              <div role="tablist" className={styles.tabs}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'password'}
                  className={activeTab === 'password' ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab('password')}
                >
                  账号密码登录
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'sms'}
                  className={activeTab === 'sms' ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab('sms')}
                >
                  验证码登录
                </button>
              </div>
              <a className={styles.cardAlt} href="#/">
                手机号查单&gt;
              </a>
            </div>

            <div className={styles.form}>
              {activeTab === 'password' ? (
                <>
                  <div className={styles.field}>
                    <label className={styles.srOnly} htmlFor="loginAccount">
                      账号
                    </label>
                    <input
                      id="loginAccount"
                      className={styles.input}
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="国内手机号/用户名/邮箱/卡号"
                    />
                  </div>
                  {fieldError.account ? <div className={styles.fieldError}>{fieldError.account}</div> : null}

                  <div className={styles.field}>
                    <label className={styles.srOnly} htmlFor="loginPassword">
                      密码
                    </label>
                    <input
                      id="loginPassword"
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
                  {fieldError.password ? <div className={styles.fieldError}>{fieldError.password}</div> : null}

                  <button
                    type="button"
                    className={styles.submit}
                    onClick={handlePasswordLogin}
                    disabled={isLoading}
                  >
                    {submitText}
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.field}>
                    <label className={styles.srOnly} htmlFor="loginPhone">
                      手机号
                    </label>
                    <input
                      id="loginPhone"
                      className={styles.input}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="手机号"
                    />
                  </div>
                  {fieldError.phoneNumber ? <div className={styles.fieldError}>{fieldError.phoneNumber}</div> : null}

                  <div className={styles.field}>
                    <label className={styles.srOnly} htmlFor="loginCode">
                      验证码
                    </label>
                    <input
                      id="loginCode"
                      className={styles.input}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="6位数字验证码"
                    />
                    <button
                      type="button"
                      className={styles.sendSms}
                      onClick={handleSendSms}
                      disabled={!canSendCode}
                    >
                      {countdownSeconds > 0 ? `发送验证码(${countdownSeconds}s)` : '发送验证码'}
                    </button>
                  </div>
                  {fieldError.verificationCode ? (
                    <div className={styles.fieldError}>{fieldError.verificationCode}</div>
                  ) : null}

                  <button type="button" className={styles.submit} onClick={handleSmsLogin} disabled={isLoading}>
                    {submitText}
                  </button>
                </>
              )}

              {error ? <div className={styles.error}>{error}</div> : null}

              <div className={styles.agreeRow}>
                <label className={styles.srOnly} htmlFor="loginAgree">
                  已阅读并同意服务协议
                </label>
                <label className={styles.agreeLabel}>
                  <input
                    id="loginAgree"
                    type="checkbox"
                    className={styles.checkbox}
                    aria-label="阅读并同意携程的服务协议和个人信息保护政策"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span className={agreed ? styles.checkOn : styles.check} aria-hidden="true" />
                  <span className={styles.agreeText}>
                    {'阅读并同意携程的'}<a className={styles.agreeLink} href="#/">服务协议</a>{'和'}<a className={styles.agreeLink} href="#/">个人信息保护政策</a>
                  </span>
                </label>
              </div>
              {agreeError ? <div className={styles.agreeError}>{agreeError}</div> : null}

              <div className={styles.bottomRow}>
                <button
                  type="button"
                  className={styles.textLink}
                  onClick={() => setActiveTab((v) => (v === 'password' ? 'sms' : 'password'))}
                >
                  {activeTab === 'password' ? '验证码登录' : '账号登录'}
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
