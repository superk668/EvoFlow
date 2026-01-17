import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegisterStepBar from '../../components/RegisterStepBar/RegisterStepBar.jsx'
import styles from './RegisterStep1.module.css'

export default function RegisterStep1() {
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  const [cooldownLeft, setCooldownLeft] = useState(0)
  const cooldownTimerRef = useRef(null)
  const sendingGuardRef = useRef(false)
  const [isSending, setIsSending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [error, setError] = useState({ phoneNumber: '', verificationCode: '', global: '' })

  const canSend = useMemo(() => {
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

  function handleSendCode() {
    const nextError = { phoneNumber: '', verificationCode: '', global: '' }
    const trimmedPhone = phoneNumber.trim()
    if (!isValidChinaPhoneNumber(trimmedPhone)) {
      nextError.phoneNumber = '手机号格式不正确，请重新输入'
      setError(nextError)
      return
    }
    if (!canSend || sendingGuardRef.current) return

    sendingGuardRef.current = true
    setIsSending(true)
    setError(nextError)
    setCooldownLeft(60)

    void (async () => {
      try {
        const res = await fetch('/api/auth/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: trimmedPhone, purpose: 'register' }),
        })
        const data = await safeJson(res)
        if (!res.ok) {
          setCooldownLeft(0)
          setError((prev) => ({ ...prev, global: data?.error || '验证码发送失败' }))
          return
        }

        const seconds = Number(data?.cooldownSeconds || 60)
        setCooldownLeft(Number.isFinite(seconds) && seconds > 0 ? seconds : 60)
      } catch {
        setCooldownLeft(0)
        setError((prev) => ({ ...prev, global: '网络异常，请稍后重试' }))
      } finally {
        setIsSending(false)
        sendingGuardRef.current = false
      }
    })()
  }

  async function handleNext() {
    const nextError = { phoneNumber: '', verificationCode: '', global: '' }
    if (!isValidChinaPhoneNumber(phoneNumber.trim())) nextError.phoneNumber = '手机号格式不正确，请重新输入'
    if (!verificationCode.trim()) nextError.verificationCode = '请输入验证码'
    setError(nextError)
    if (nextError.phoneNumber || nextError.verificationCode) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/register/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim(), verificationCode: verificationCode.trim() }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        setError((prev) => ({ ...prev, global: data?.error || '验证失败' }))
        return
      }

      if (typeof data?.registerToken === 'string' && data.registerToken) {
        sessionStorage.setItem('registerToken', data.registerToken)
      }
      if (typeof phoneNumber === 'string' && phoneNumber.trim()) {
        sessionStorage.setItem('registerPhoneNumber', phoneNumber.trim())
      }
      navigate('/register/step2', { replace: true })
    } catch {
      setError((prev) => ({ ...prev, global: '网络异常，请稍后重试' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <RegisterStepBar activeStep={1} />

      <div className={styles.formWrap}>
        <div className={styles.form}>
          <div className={styles.fieldRow}>
            <div className={styles.label}>手机号</div>
            <div className={styles.combo}>
              <div className={styles.select}>
                中国大陆 +86 <span className={styles.caret} aria-hidden="true" />
              </div>
              <input
                className={styles.input}
                placeholder="有效手机号"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          {error.phoneNumber ? <div>{error.phoneNumber}</div> : null}

          <div className={styles.fieldRow}>
            <div className={styles.label}>短信验证码</div>
            <div className={styles.codeRow}>
              <input
                className={styles.input}
                placeholder="6位数字"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <button className={styles.send} type="button" disabled={!canSend} onClick={handleSendCode}>
                发送验证码
              </button>
              {cooldownLeft > 0 ? <div>{cooldownLeft}</div> : null}
            </div>
          </div>
          {error.verificationCode ? <div>{error.verificationCode}</div> : null}
          {error.global ? <div>{error.global}</div> : null}

          <div className={styles.agree}>
            同意 <span className={styles.link}>《服务协议》</span> 和{' '}
            <span className={styles.link}>《隐私政策》</span>
          </div>

          <button className={styles.nextBtn} type="button" disabled={isSubmitting} onClick={handleNext}>
            下一步，设置密码
          </button>

          <div className={styles.company}>企业客户注册</div>
          <div role="button" tabIndex={0} onClick={() => navigate('/login')} onKeyDown={(e) => e.key === 'Enter' && navigate('/login')}>
            已有账号？直接登录
          </div>
        </div>
      </div>
    </div>
  )
}
