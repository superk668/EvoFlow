import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'

import loginIllustration from '../../assets/placeholders/login_illustration.svg'

import styles from './Login.module.css'

export default function Login({ mode }) {
  const isSms = mode === 'sms'

  return (
    <div className={styles.page}>
      <TopHeader variant="auth" />

      <div className={styles.notice}>
        <span className={styles.noticeIcon} aria-hidden />
        <span className={styles.noticeText}>
          公告（仅安全提示）：为保障您的账户及交易安全，请勿使用虚拟号码注册账户或开票。
        </span>
      </div>

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <img className={styles.illustration} src={loginIllustration} alt="illustration" />

          <div className={styles.panelWrap}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>{isSms ? '验证码登录' : '账号密码登录'}</div>
                <div className={styles.panelRight}>手机号查单&gt;</div>
              </div>

              {isSms ? <SmsForm /> : <PasswordForm />}
            </div>

            <div className={styles.scanTab}>
              <div className={styles.scanTabText}>扫码登录</div>
            </div>
          </div>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}

function safeReturnUrl(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (!trimmed.startsWith('/')) return ''
  if (trimmed.startsWith('//')) return ''
  return trimmed
}

function PasswordForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const returnUrl = safeReturnUrl(params.get('returnUrl') || '')

  async function handleSubmit() {
    if (!account.trim()) {
      setError('请输入用户名')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }
    if (!agreeTerms) {
      setError('请阅读并同意服务协议')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/v1/auth/login/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password, agreeTerms }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || '登录失败')
        return
      }

      try {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_user', JSON.stringify(data.user || {}))
      } catch {
        setError('')
      }
      navigate(returnUrl || '/after-login')
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.panelBody}>
      <div className={styles.field}>
        <input
          className={styles.input}
          placeholder="国内手机号/用户名/邮箱/卡号"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <input
          className={styles.input}
          placeholder="登录密码"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className={styles.inlineLink}>忘记密码</div>
      </div>

      {error ? <div role="alert">{error}</div> : null}

      <button type="button" className={styles.loginBtn} onClick={handleSubmit} disabled={isSubmitting}>
        登录
      </button>

      <div className={styles.agreeRow}>
        <div className={styles.agreeText}>
          <label>
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
            服务协议
          </label>
        </div>
      </div>

      <div className={styles.actionRow}>
        <Link className={styles.actionLink} to={`/login/sms${location.search || ''}`}>
          验证码登录
        </Link>
        <Link className={styles.actionLink} to="/register">
          免费注册
        </Link>
      </div>

      <div className={styles.subRow}>
        <div className={styles.subText}>境外手机号</div>
        <div className={styles.subSep} aria-hidden />
        <div className={styles.subText}>公司客户</div>
        <div className={styles.subSep} aria-hidden />
        <div className={styles.subText}>携程商旅</div>
      </div>

      <div className={styles.socialRow}>
        <div className={styles.socialIcon} data-tone="g" aria-hidden />
        <div className={styles.socialIcon} data-tone="b" aria-hidden />
        <div className={styles.socialIcon} data-tone="c" aria-hidden />
        <div className={styles.socialIcon} data-tone="o" aria-hidden />
        <div className={styles.socialIcon} data-tone="p" aria-hidden />
      </div>
    </div>
  )
}

function SmsForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const intervalRef = useRef(null)
  const isSendingDisabled = cooldown > 0

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const returnUrl = safeReturnUrl(params.get('returnUrl') || '')

  const isValidPhone = useMemo(() => /^1\d{10}$/.test(phoneNumber), [phoneNumber])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  async function handleSendCode() {
    if (isSendingDisabled) return
    if (!isValidPhone) {
      setError('手机号格式不正确，请重新输入')
      return
    }

    setError('')
    try {
      const res = await fetch('/api/v1/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, type: 'login' }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || '发送失败')
        return
      }
      setCooldown(60)
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            intervalRef.current = null
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch {
      setError('网络异常，请稍后重试')
    }
  }

  async function handleLogin() {
    if (!agreeTerms) {
      setError('先请阅读并勾选服务协议')
      return
    }
    if (!isValidPhone) {
      setError('手机号格式不正确，请重新输入')
      return
    }
    if (!code) {
      setError('请输入验证码')
      return
    }

    setError('')
    try {
      const res = await fetch('/api/v1/auth/login/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code, agreeTerms }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || '登录失败')
        return
      }

      try {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_user', JSON.stringify(data.user || {}))
      } catch {
        setError('')
      }
      navigate(returnUrl || '/after-login')
    } catch {
      setError('网络异常，请稍后重试')
    }
  }

  return (
    <div className={styles.panelBody}>
      <div className={styles.field}>
        <div className={styles.select}>
          中国大陆 86
          <span className={styles.selectCaret} aria-hidden />
        </div>
      </div>

      <div className={styles.field}>
        <input
          className={styles.input}
          placeholder="请输入手机号"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <input
          className={styles.input}
          placeholder="请输入验证码"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="button" className={styles.sendCode} onClick={handleSendCode} disabled={isSendingDisabled}>
          发送验证码
        </button>
      </div>

      {error ? <div role="alert">{error}</div> : null}

      <button type="button" className={styles.loginBtn} onClick={handleLogin}>
        登录
      </button>

      <div className={styles.agreeRow}>
        <div className={styles.agreeText}>
          <label>
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
            服务协议
          </label>
        </div>
      </div>

      <div className={styles.actionRowSms}>
        <Link className={styles.actionLink} to={`/login${location.search || ''}`}>
          账号登录
        </Link>
      </div>
    </div>
  )
}
