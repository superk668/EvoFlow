import styles from './RegisterStep2.module.css'
import eyeIcon from '../../assets/placeholders/icon_eye_18x18.svg'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function RegisterStep2({ onRegisterSuccess } = {}) {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [submitTouched, setSubmitTouched] = useState(false)

  const phoneNumber = sessionStorage.getItem('registerPhoneNumber') || '13900139000'
  const verificationToken =
    sessionStorage.getItem('registerVerificationToken') || 'validTokenFromVerifyStep'

  const phoneNumberMasked = useMemo(() => {
    const pn = String(phoneNumber || '')
    if (/^1\d{10}$/.test(pn)) {
      return `86-${pn.slice(0, 3)}****${pn.slice(7)}`
    }
    return '86-***'
  }, [phoneNumber])

  const passwordFormatOk = useMemo(() => {
    if (!password) return false
    if (password.length < 8 || password.length > 20) return false
    const hasLetter = /[A-Za-z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSymbol = /[^A-Za-z0-9]/.test(password)
    return hasLetter && hasDigit && hasSymbol
  }, [password])

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return false
    return password === confirmPassword
  }, [password, confirmPassword])

  const shouldDisableSubmit = !passwordFormatOk || !passwordsMatch || isSubmitting

  const passwordStrength = useMemo(() => {
    if (!passwordFormatOk) return 'none'
    const classes = [/[A-Za-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)]
    const count = classes.filter(Boolean).length
    if (count === 3 && password.length >= 12) return 'strong'
    if (count >= 2) return 'mid'
    return 'weak'
  }, [password, passwordFormatOk])

  async function postJson(url, body) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      return { ok: res.ok, status: res.status, data }
    } catch {
      return {
        ok: false,
        status: 0,
        data: { success: false, message: '网络异常，请稍后重试' },
      }
    }
  }

  async function handleSubmit() {
    setSubmitTouched(true)
    setErrorMessage('')
    setFieldErrors({})

    if (!password) {
      setFieldErrors({ password: '请设置登录密码' })
      return
    }
    if (!passwordFormatOk) {
      setFieldErrors({ password: '密码需为8-20位字母、数字和符号的组合' })
      return
    }
    if (!confirmPassword) {
      setFieldErrors({ confirmPassword: '请再次输入密码' })
      return
    }
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: '两次输入密码不一致' })
      return
    }

    let result
    setIsSubmitting(true)
    try {
      result = await postJson('/api/v1/auth/register/complete', {
        phoneNumber,
        verificationToken,
        password,
      })
    } finally {
      setIsSubmitting(false)
    }

    if (!result.ok) {
      setErrorMessage(result?.data?.message || '注册失败')
      return
    }

    if (typeof onRegisterSuccess === 'function') {
      onRegisterSuccess(result.data)
    }
    navigate('/login')
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.progress}>
          <div className={styles.step}>
            <div className={`${styles.dot} ${styles.dotDone}`} />
            <div className={styles.stepLabelDone}>验证手机</div>
          </div>
          <div className={`${styles.line} ${styles.lineDone}`} />
          <div className={styles.step}>
            <div className={`${styles.dot} ${styles.dotActive}`} />
            <div className={`${styles.stepLabel} ${styles.stepLabelActive}`}>设置密码</div>
          </div>
          <div className={`${styles.line} ${styles.lineMuted}`} />
          <div className={styles.step}>
            <div className={`${styles.dot} ${styles.dotMuted}`} />
            <div className={styles.stepLabel}>注册成功</div>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.registeredLine}>
            <span className={styles.registeredLabel}>注册手机号</span>
            <span className={styles.registeredValue}>{phoneNumberMasked}</span>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>密码</div>
            <div className={styles.inputWithIcon}>
              <input
                className={styles.placeholder}
                placeholder="8-20位字母、数字和符号"
                aria-label="密码"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.eye}
                aria-label="显示密码"
                onClick={() => setShowPassword((v) => !v)}
              >
                <img src={eyeIcon} alt="显示密码" />
              </button>
            </div>
            {submitTouched && !password && fieldErrors.password ? <div>{fieldErrors.password}</div> : null}
            {!passwordFormatOk && password ? (
              <div>密码需为8-20位字母、数字和符号的组合</div>
            ) : null}
            <div className={styles.strength}>
              <div
                className={`${styles.strengthItem} ${styles.weak}`}
                style={{ opacity: passwordStrength === 'weak' || passwordStrength === 'mid' || passwordStrength === 'strong' ? 1 : 0.3 }}
              >
                弱
              </div>
              <div
                className={`${styles.strengthItem} ${styles.mid}`}
                style={{ opacity: passwordStrength === 'mid' || passwordStrength === 'strong' ? 1 : 0.3 }}
              >
                中
              </div>
              <div
                className={`${styles.strengthItem} ${styles.strong}`}
                style={{ opacity: passwordStrength === 'strong' ? 1 : 0.3 }}
              >
                强
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>确认密码</div>
            <div className={styles.inputWithIcon}>
              <input
                className={styles.placeholder}
                placeholder="再次输入密码"
                aria-label="确认密码"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.eye}
                aria-label="显示确认密码"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                <img src={eyeIcon} alt="显示密码" />
              </button>
            </div>
            {fieldErrors.confirmPassword ? <div>{fieldErrors.confirmPassword}</div> : null}
            {!fieldErrors.confirmPassword && confirmPassword && password && password !== confirmPassword ? (
              <div>两次输入密码不一致</div>
            ) : null}
            <div className={styles.strengthSpacer} />
          </div>

          {errorMessage ? <div>{errorMessage}</div> : null}

          <button
            type="button"
            className={styles.doneBtn}
            onClick={handleSubmit}
            disabled={shouldDisableSubmit}
          >
            完成
          </button>
          <div className={styles.help}>注册遇到问题?</div>
          <Link to="/register/step1" className={styles.back}>
            <span className={styles.backArrow}>{'<'}</span>
            <span>返回上一步</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
