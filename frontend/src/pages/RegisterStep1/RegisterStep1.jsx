import styles from './RegisterStep1.module.css'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { flushSync } from 'react-dom'

export default function RegisterStep1({ onVerified } = {}) {
  const navigate = useNavigate()

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
      setFieldErrors({ phoneNumber: '手机号格式不正确，请重新输入' })
      return
    }

    if (!canResend) return
    setIsRequestingCode(true)
    setResendCountdown(60)

    const result = await postJson('/api/v1/auth/sms/send', {
      phoneNumber,
      type: 'register',
    })

    if (!result.ok) {
      setIsRequestingCode(false)
      if (result.status !== 429) {
        setResendCountdown(0)
        const msg = result.data?.message || '发送失败'
        setErrorMessage(msg === '手机号格式不正确' ? '手机号格式不正确，请重新输入' : msg)
      }
      return
    }

    setResendCountdown(Number(result.data?.expiresIn || 60))
    if (result.data?.code) setLastSmsCode(String(result.data.code))
    setIsRequestingCode(false)
  }

  async function handleNext() {
    setErrorMessage('')
    setFieldErrors({})

    setIsSubmitting(true)
    const result = await postJson('/api/v1/auth/register/verify-phone', {
      phoneNumber,
      code,
      agreeTerms,
    })

    let shouldReturn = false
    flushSync(() => {
      setIsSubmitting(false)
      if (!result.ok) {
        const msg = result.data?.message || '验证失败'
        if (msg === '验证码错误') {
          setFieldErrors({ code: msg })
        } else {
          setErrorMessage(msg)
        }
        shouldReturn = true
      }
    })
    if (shouldReturn) return

    const verificationToken = result.data?.verificationToken
    sessionStorage.setItem('registerPhoneNumber', phoneNumber)
    sessionStorage.setItem('registerVerificationToken', verificationToken)

    if (typeof onVerified === 'function') {
      onVerified({ phoneNumber, verificationToken })
    }
    navigate('/register/step2')
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.progress}>
          <div className={styles.step}>
            <div className={`${styles.dot} ${styles.dotActive}`} />
            <div className={`${styles.stepLabel} ${styles.stepLabelActive}`}>验证手机</div>
          </div>
          <div className={`${styles.line} ${styles.lineActive}`} />
          <div className={styles.step}>
            <div className={styles.dot} />
            <div className={styles.stepLabel}>设置密码</div>
          </div>
          <div className={styles.line} />
          <div className={styles.step}>
            <div className={styles.dot} />
            <div className={styles.stepLabel}>注册成功</div>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.row}>
            <div className={styles.label}>手机号</div>
            <div className={styles.phoneGroup}>
              <div className={styles.country}>
                <div className={styles.countryText}>中国大陆 86</div>
                <div className={styles.chev} />
              </div>
              <div className={`${styles.input} ${fieldErrors.phoneNumber ? styles.inputError : ''}`}>
                <input
                  className={styles.placeholder}
                  placeholder="有效手机号"
                  aria-label="手机号"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>短信验证码</div>
            <div className={styles.smsGroup}>
              <div className={styles.input}>
                <input
                  className={styles.placeholder}
                  placeholder="6位数字"
                  aria-label="短信验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={styles.sendCode}
                onClick={handleSendCode}
                disabled={!canResend}
              >
                <span>{canResend ? '发送验证码' : '重新发送'}</span>
              </button>
            </div>
          </div>

          {resendCountdown > 0 ? <div>{resendCountdown}</div> : null}
          {lastSmsCode ? <div>{`验证码：${lastSmsCode}`}</div> : null}
          {fieldErrors.code ? <div>{fieldErrors.code}</div> : null}
          {errorMessage ? <div>{errorMessage}</div> : null}

          <div className={styles.agree}>
            <input
              type="checkbox"
              aria-label="服务协议"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <div className={styles.agreeText}>同意</div>
            <div className={styles.agreeLink}>《服务协议》</div>
            <div className={styles.agreeText}>和</div>
            <div className={styles.agreeLink}>《隐私政策》</div>
          </div>

          <button type="button" className={styles.nextBtn} onClick={handleNext} disabled={isSubmitting}>
            下一步，设置密码
          </button>
          <Link to="/login" className={styles.enterprise}>
            已有账号？直接登录
          </Link>
          <div className={styles.enterprise}>企业客户注册</div>
        </div>
      </div>
    </div>
  )
}
