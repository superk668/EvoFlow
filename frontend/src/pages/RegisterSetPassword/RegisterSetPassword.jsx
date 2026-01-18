import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import styles from './RegisterSetPassword.module.css'

function getRegisterToken(search) {
  const params = new URLSearchParams(search)
  const token = params.get('registerToken')
  return token ? String(token) : ''
}

function getPasswordStrength(password) {
  const v = String(password)
  const hasLetter = /[A-Za-z]/.test(v)
  const hasNumber = /\d/.test(v)
  const hasSymbol = /[^A-Za-z\d]/.test(v)
  return Number(hasLetter) + Number(hasNumber) + Number(hasSymbol)
}

function isPasswordValid(password) {
  const v = String(password)
  if (v.length < 8 || v.length > 20) return false
  return getPasswordStrength(v) >= 2
}

export default function RegisterSetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const registerToken = useMemo(() => getRegisterToken(location.search), [location.search])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const passwordValid = useMemo(() => (password ? isPasswordValid(password) : true), [password])
  const confirmMismatch = useMemo(() => (confirm ? confirm !== password : false), [confirm, password])

  const completeDisabled = useMemo(() => {
    if (!registerToken) return true
    if (isLoading) return true
    if (password && !passwordValid) return true
    if (confirm && confirmMismatch) return true
    return false
  }, [confirm, confirmMismatch, isLoading, password, passwordValid, registerToken])

  const phoneMasked = useMemo(() => {
    try {
      return sessionStorage.getItem('register_phone_masked') ?? '86-***'
    } catch {
      return '86-***'
    }
  }, [])

  async function handleComplete() {
    setError('')

    if (!registerToken) {
      setError('请先完成手机号验证')
      return
    }

    if (!password) {
      setError('请设置登录密码')
      return
    }

    if (!isPasswordValid(password)) {
      setError('密码需为8-20位字母、数字和符号的组合')
      return
    }

    if (!confirm) {
      setError('请再次输入密码')
      return
    }

    if (confirm !== password) {
      setError('两次输入密码不一致')
      return
    }

    setIsLoading(true)
    try {
      const resp = await fetch('/api/auth/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registerToken, password, confirmPassword: confirm }),
      })

      if (resp.status === 409) {
        setError('该手机号已注册，请直接登录')
        return
      }

      if (!resp.ok) {
        setError('注册失败')
        return
      }

      navigate('/login')
    } catch {
      setError('网络请求失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.stepper}>
          <div className={styles.stepDone}>
            <div className={styles.dotDone} />
            <div className={styles.stepLabelMuted}>验证手机</div>
          </div>
          <div className={styles.lineActive} />
          <div className={styles.stepActive}>
            <div className={styles.dotActive} />
            <div className={styles.stepLabel}>设置密码</div>
          </div>
          <div className={styles.line} />
          <div className={styles.step}>
            <div className={styles.dot} />
            <div className={styles.stepLabelMuted}>注册成功</div>
          </div>
        </div>

        <div className={styles.phoneRow}>
          <div className={styles.phoneLabel}>注册手机号</div>
          <div className={styles.phoneValue}>{phoneMasked}</div>
        </div>

        <div className={styles.form}>
          <div className={styles.row}>
            <div className={styles.label}>密码</div>
            <div className={styles.field}>
              <input
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8-20位字母、数字和符号"
                type={passwordVisible ? 'text' : 'password'}
              />
              <button
                type="button"
                className={styles.eye}
                aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                onClick={() => setPasswordVisible((v) => !v)}
              />
            </div>
            <div className={styles.strength} aria-hidden="true">
              <div className={password && passwordStrength >= 1 ? styles.pillWeak : styles.pillOff}>弱</div>
              <div className={password && passwordStrength >= 2 ? styles.pill : styles.pillOff}>中</div>
              <div className={password && passwordStrength >= 3 ? styles.pill : styles.pillOff}>强</div>
            </div>
          </div>
          {!passwordValid && password ? (
            <div className={styles.formError}>密码需为8-20位字母、数字和符号的组合</div>
          ) : null}

          <div className={styles.row}>
            <div className={styles.label}>确认密码</div>
            <div className={styles.field}>
              <input
                className={styles.input}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再次输入密码"
                type={confirmVisible ? 'text' : 'password'}
              />
              <button
                type="button"
                className={styles.eye}
                aria-label={confirmVisible ? '隐藏确认密码' : '显示确认密码'}
                onClick={() => setConfirmVisible((v) => !v)}
              />
            </div>
          </div>
          {confirmMismatch && confirm ? <div className={styles.formError}>两次输入密码不一致</div> : null}

          {error ? <div className={styles.formErrorTop}>{error}</div> : null}

          <button type="button" className={styles.complete} onClick={handleComplete} disabled={completeDisabled}>
            完成
          </button>

          <a className={styles.help} href="#/">
            注册遇到问题?
          </a>

          <Link className={styles.back} to="/register">
            &lt; 返回上一步
          </Link>
        </div>
      </div>
    </div>
  )
}
