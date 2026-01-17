import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import RegisterStepBar from '../../components/RegisterStepBar/RegisterStepBar.jsx'
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator/PasswordStrengthIndicator.jsx'
import styles from './RegisterStep2.module.css'

export default function RegisterStep2() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState({ password: '', confirmPassword: '', global: '' })

  const [registerToken, setRegisterToken] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')

  useEffect(() => {
    const existingToken = sessionStorage.getItem('registerToken')
    if (existingToken) {
      setRegisterToken(existingToken)
    } else {
      const localToken = `rt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem('registerToken', localToken)
      setRegisterToken(localToken)
    }

    const phone = sessionStorage.getItem('registerPhoneNumber')
    if (phone && /^1\d{10}$/.test(phone)) {
      setMaskedPhone(`86-${phone.slice(0, 3)}*****${phone.slice(-4)}`)
    } else {
      setMaskedPhone('86-138*****3769')
    }
  }, [])

  function isValidPassword(value) {
    if (typeof value !== 'string') return false
    if (value.length < 8 || value.length > 20) return false
    const hasLetter = /[A-Za-z]/.test(value)
    const hasNumber = /\d/.test(value)
    const hasSymbol = /[^A-Za-z\d]/.test(value)
    return hasLetter && hasNumber && hasSymbol
  }

  const passwordStrength = useMemo(() => {
    if (!password) return 'weak'
    const hasLetter = /[A-Za-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[^A-Za-z\d]/.test(password)
    const kinds = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length
    if (password.length >= 12 && kinds === 3) return 'strong'
    if (kinds >= 2) return 'medium'
    return 'weak'
  }, [password])

  useEffect(() => {
    const next = { password: '', confirmPassword: '', global: '' }
    if (password && !isValidPassword(password)) {
      next.password = '密码需为8-20位字母、数字和符号的组合'
    }

    if (confirmPassword && password !== confirmPassword) {
      next.confirmPassword = '两次输入密码不一致'
    }

    setError((prev) => ({ ...prev, password: next.password, confirmPassword: next.confirmPassword }))
  }, [password, confirmPassword])

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false
    if (!password || !confirmPassword) return false
    if (!isValidPassword(password)) return false
    if (password !== confirmPassword) return false
    return true
  }, [confirmPassword, isSubmitting, password])

  async function safeJson(res) {
    try {
      return await res.json()
    } catch {
      return null
    }
  }

  async function handleFinish() {
    if (!canSubmit) return
    setIsSubmitting(true)
    setError((prev) => ({ ...prev, global: '' }))
    try {
      const res = await fetch('/api/auth/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registerToken, password }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        setError((prev) => ({ ...prev, global: data?.error || '注册失败' }))
        return
      }

      sessionStorage.removeItem('registerToken')
      sessionStorage.removeItem('registerPhoneNumber')
      navigate('/login', { replace: true })
    } catch {
      setError((prev) => ({ ...prev, global: '网络异常，请稍后重试' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <RegisterStepBar activeStep={2} />

      <div className={styles.formWrap}>
        <div className={styles.form}>
          <div className={styles.phoneRow}>
            <div className={styles.phoneLabel}>注册手机号</div>
            <div className={styles.phoneValue}>{maskedPhone}</div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.label}>密码</div>
            <div className={styles.passwordGrid}>
              <div className={styles.inputWrap}>
                <input
                  className={styles.input}
                  placeholder="8-20位字母、数字和符号"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button className={styles.eye} type="button" aria-label="显示密码" onClick={() => setShowPassword((v) => !v)}>
                  <PlaceholderImage name="显示密码" width={18} height={18} />
                </button>
              </div>
              <PasswordStrengthIndicator strength={passwordStrength} />
            </div>
          </div>
          {error.password ? <div>{error.password}</div> : null}

          <div className={styles.fieldRow}>
            <div className={styles.label}>确认密码</div>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                placeholder="再次输入密码"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                className={styles.eye}
                type="button"
                aria-label="显示密码"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                <PlaceholderImage name="显示密码" width={18} height={18} />
              </button>
            </div>
          </div>
          {error.confirmPassword ? <div>{error.confirmPassword}</div> : null}
          {error.global ? <div>{error.global}</div> : null}

          <button className={styles.finishBtn} type="button" disabled={!canSubmit} onClick={handleFinish}>
            完成
          </button>

          <div className={styles.help}>注册遇到问题?</div>
        </div>

        <div className={styles.back} role="button" tabIndex={0} onClick={() => navigate('/register/step1')}>\u003c 返回上一步</div>
      </div>
    </div>
  )
}
