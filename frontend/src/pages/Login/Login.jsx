import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './Login.module.css'

const thirdParty = [
  { name: '微信', colorClass: styles.tpGreen },
  { name: 'QQ', colorClass: styles.tpBlue },
  { name: '微博', colorClass: styles.tpOrange },
  { name: '支付宝', colorClass: styles.tpCyan },
  { name: 'Apple', colorClass: styles.tpBlack },
]

export default function Login() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('password')

  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')

  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  const [agree, setAgree] = useState(false)

  const [cooldownLeft, setCooldownLeft] = useState(0)
  const cooldownTimerRef = useRef(null)
  const sendingGuardRef = useRef(false)
  const [isSending, setIsSending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fieldError, setFieldError] = useState({
    account: '',
    password: '',
    phoneNumber: '',
    verificationCode: '',
    agreement: '',
    global: '',
  })

  const canSendCode = useMemo(() => {
    if (isSending) return false
    if (cooldownLeft > 0) return false
    return true
  }, [cooldownLeft, isSending])

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current != null) {
        window.clearTimeout(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (cooldownLeft <= 0) {
      if (cooldownTimerRef.current != null) {
        window.clearTimeout(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }
      return
    }

    if (cooldownTimerRef.current != null) return

    cooldownTimerRef.current = window.setTimeout(() => {
      cooldownTimerRef.current = null
      setCooldownLeft((v) => (v <= 1 ? 0 : v - 1))
    }, 1000)
  }, [cooldownLeft])

  function isValidChinaPhoneNumber(value) {
    return typeof value === 'string' && /^1\d{10}$/.test(value)
  }

  async function safeJson(res) {
    try {
      return await res.json()
    } catch {
      return null
    }
  }

  async function handlePasswordLogin() {
    const nextError = {
      account: '',
      password: '',
      phoneNumber: '',
      verificationCode: '',
      agreement: '',
      global: '',
    }

    if (!account.trim()) nextError.account = '请输入用户名'
    if (!password) nextError.password = '请输入密码'
    if (!agree) nextError.agreement = '请阅读并同意服务协议'

    setFieldError(nextError)
    if (nextError.account || nextError.password || nextError.agreement) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/login/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: account.trim(), password }),
      })

      const data = await safeJson(res)
      if (!res.ok) {
        setFieldError((prev) => ({ ...prev, global: data?.error || '登录失败' }))
        return
      }

      navigate('/', { replace: true })
    } catch {
      setFieldError((prev) => ({ ...prev, global: '网络异常，请稍后重试' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSendCode() {
    const nextError = {
      account: '',
      password: '',
      phoneNumber: '',
      verificationCode: '',
      agreement: '',
      global: '',
    }

    const trimmedPhone = phoneNumber.trim()
    if (!isValidChinaPhoneNumber(trimmedPhone)) {
      nextError.phoneNumber = '手机号格式不正确，请重新输入'
      setFieldError(nextError)
      return
    }

    if (!canSendCode || sendingGuardRef.current) return

    sendingGuardRef.current = true
    setIsSending(true)
    setFieldError(nextError)
    setCooldownLeft(60)

    void (async () => {
      try {
        const res = await fetch('/api/auth/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: trimmedPhone, purpose: 'login' }),
        })
        const data = await safeJson(res)
        if (!res.ok) {
          setCooldownLeft(0)
          setFieldError((prev) => ({ ...prev, global: data?.error || '验证码发送失败' }))
          return
        }

        const seconds = Number(data?.cooldownSeconds || 60)
        setCooldownLeft(Number.isFinite(seconds) && seconds > 0 ? seconds : 60)
      } catch {
        setCooldownLeft(0)
        setFieldError((prev) => ({ ...prev, global: '网络异常，请稍后重试' }))
      } finally {
        setIsSending(false)
        sendingGuardRef.current = false
      }
    })()
  }

  async function handleCodeLogin() {
    const nextError = {
      account: '',
      password: '',
      phoneNumber: '',
      verificationCode: '',
      agreement: '',
      global: '',
    }

    if (!isValidChinaPhoneNumber(phoneNumber.trim())) nextError.phoneNumber = '手机号格式不正确，请重新输入'
    if (!verificationCode.trim()) nextError.verificationCode = '请输入验证码'
    if (!agree) nextError.agreement = '先请阅读并勾选服务协议'

    setFieldError(nextError)
    if (nextError.phoneNumber || nextError.verificationCode || nextError.agreement) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/login/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim(), verificationCode: verificationCode.trim() }),
      })

      const data = await safeJson(res)
      if (!res.ok) {
        setFieldError((prev) => ({ ...prev, global: data?.error || '登录失败' }))
        return
      }

      navigate('/', { replace: true })
    } catch {
      setFieldError((prev) => ({ ...prev, global: '网络异常，请稍后重试' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.art}>
            <PlaceholderImage name="登录页插画" width={520} height={210} className={styles.artImg} />
          </div>

          <div className={styles.panelWrap}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>{activeTab === 'password' ? '账号密码登录' : '手机验证码登录'}</div>
                <div className={styles.panelRight}>手机号查单&gt;</div>
              </div>

              <div className={styles.form}>
                {activeTab === 'password' ? (
                  <>
                    <input
                      className={styles.input}
                      placeholder="国内手机号/用户名/邮箱/卡号"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                    />
                    {fieldError.account ? <div>{fieldError.account}</div> : null}

                    <div className={styles.row2}>
                      <input
                        className={styles.input}
                        placeholder="登录密码"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <div className={styles.forgot}>忘记密码</div>
                    </div>
                    {fieldError.password ? <div>{fieldError.password}</div> : null}

                    <button
                      className={styles.loginBtn}
                      type="button"
                      disabled={isSubmitting}
                      onClick={handlePasswordLogin}
                    >
                      登 录
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      className={styles.input}
                      placeholder="有效手机号"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    {fieldError.phoneNumber ? <div>{fieldError.phoneNumber}</div> : null}

                    <div className={styles.row2}>
                      <input
                        className={styles.input}
                        placeholder="6位数字"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                      <button type="button" disabled={!canSendCode} onClick={handleSendCode}>
                        发送验证码
                      </button>
                      {cooldownLeft > 0 ? <div>{cooldownLeft}</div> : null}
                    </div>
                    {fieldError.verificationCode ? <div>{fieldError.verificationCode}</div> : null}

                    <button
                      className={styles.loginBtn}
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleCodeLogin}
                    >
                      登 录
                    </button>
                  </>
                )}

                {fieldError.global ? <div>{fieldError.global}</div> : null}

                {fieldError.agreement ? <div>{fieldError.agreement}</div> : null}
                <div className={styles.agreeRow}>
                  <label className={styles.agreeText}>
                    <input
                      aria-label="服务协议"
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                    />
                    阅读并同意携程的 <span className={styles.link}>服务协议</span> 和{' '}
                    <span className={styles.link}>个人信息保护政策</span>
                  </label>
                </div>

                <div className={styles.bottomLinks}>
                  <div
                    className={styles.smallLink}
                    onClick={() => {
                      setFieldError((prev) => ({ ...prev, global: '', agreement: '', phoneNumber: '', verificationCode: '' }))
                      setActiveTab((t) => (t === 'password' ? 'code' : 'password'))
                    }}
                  >
                    {activeTab === 'password' ? '验证码登录' : '账号登录'}
                  </div>
                  <button
                    className={styles.smallLink}
                    type="button"
                    onClick={() => navigate('/register', { replace: false })}
                  >
                    免费注册
                  </button>
                </div>

                <div className={styles.hr} aria-hidden="true" />
                <div className={styles.thirdLine}>
                  <div className={styles.thirdText}>境外手机</div>
                  <div className={styles.dot} aria-hidden="true" />
                  <div className={styles.thirdText}>公司客户</div>
                  <div className={styles.dot} aria-hidden="true" />
                  <div className={styles.thirdText}>网站导航</div>
                </div>

                <div className={styles.thirdIcons}>
                  {thirdParty.map((it) => (
                    <div key={it.name} className={[styles.tp, it.colorClass].join(' ')}>
                      <PlaceholderImage name={it.name} width={14} height={14} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.qrTab}>
              <div className={styles.qrText}>二维码登录</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
