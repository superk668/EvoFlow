import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'

import styles from './RegisterStep2.module.css'

export default function RegisterStep2() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const phoneNumber = sessionStorage.getItem('register_phone') || '13800138000'
  const verificationToken = sessionStorage.getItem('register_verificationToken') || 'temp_token_xyz'

  const passwordPolicy = useMemo(() => {
    const lengthOk = password.length >= 8 && password.length <= 20
    const hasLetter = /[A-Za-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[^A-Za-z\d]/.test(password)
    const categories = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length
    const isValid = lengthOk && hasLetter && hasNumber && hasSymbol
    return { lengthOk, hasLetter, hasNumber, hasSymbol, categories, isValid }
  }, [password])

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password
  const showPolicyError = password.length > 0 && !passwordPolicy.isValid

  const disableSubmit = isSubmitting || (password.length > 0 && !passwordPolicy.isValid) || mismatch

  async function handleSubmit() {
    if (!password) {
      setError('请设置登录密码')
      return
    }
    if (!passwordPolicy.isValid) {
      setError('密码需为8-20位字母、数字和符号的组合')
      return
    }
    if (!confirmPassword) {
      setError('请再次输入密码')
      return
    }
    if (confirmPassword !== password) {
      setError('两次输入密码不一致')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/v1/auth/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, verificationToken, password }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || '注册失败')
        return
      }
      navigate('/login')
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const strengthActive = {
    weak: passwordPolicy.isValid && passwordPolicy.categories >= 1,
    mid: passwordPolicy.isValid && passwordPolicy.categories >= 2,
    strong: passwordPolicy.isValid && passwordPolicy.categories >= 3,
  }

  return (
    <div className={styles.page}>
      <TopHeader variant="register" />

      <div className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.stepper}>
            <div className={styles.stepDone}>
              <div className={styles.dotDone} />
              <div className={styles.stepTextDone}>验证手机</div>
            </div>
            <div className={styles.lineDone} />
            <div className={styles.stepActive}>
              <div className={styles.dotActive} />
              <div className={styles.stepTextActive}>设置密码</div>
            </div>
            <div className={styles.line} />
            <div className={styles.step}>
              <div className={styles.dot} />
              <div className={styles.stepText}>注册成功</div>
            </div>
          </div>

          <div className={styles.form}>
            <div className={styles.phoneLine}>
              注册手机号<span className={styles.phoneNum}>86-{phoneNumber.slice(0, 3)}****{phoneNumber.slice(-4)}</span>
            </div>

            <div className={styles.row}>
              <div className={styles.label}>密码</div>
              <div className={styles.pwdGroup}>
                <input
                  className={styles.input}
                  placeholder="8-20位字母、数字和符号"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className={styles.eye} onClick={() => setIsPasswordVisible((v) => !v)}>
                  显示密码
                </button>
                <div className={styles.strength}>
                  <div
                    className={styles.levelWeak}
                    data-testid="password-strength-weak"
                    data-active={strengthActive.weak ? 'true' : 'false'}
                  >
                    弱
                  </div>
                  <div
                    className={styles.levelMid}
                    data-testid="password-strength-mid"
                    data-active={strengthActive.mid ? 'true' : 'false'}
                  >
                    中
                  </div>
                  <div
                    className={styles.levelStrong}
                    data-testid="password-strength-strong"
                    data-active={strengthActive.strong ? 'true' : 'false'}
                  >
                    强
                  </div>
                </div>
              </div>
            </div>

            {showPolicyError ? <div role="alert">密码需为8-20位字母、数字和符号的组合</div> : null}

            <div className={styles.row}>
              <div className={styles.label}>确认密码</div>
              <div className={styles.pwdGroup}>
                <input
                  className={styles.input}
                  placeholder="再次输入密码"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className={styles.eye} aria-hidden />
              </div>
            </div>

            {mismatch ? <div role="alert">两次输入密码不一致</div> : null}
            {error ? <div role="alert">{error}</div> : null}

            <button type="button" className={styles.finishBtn} onClick={handleSubmit} disabled={disableSubmit}>
              完成
            </button>

            <div className={styles.helpLink}>注册遇到问题?</div>

            <Link className={styles.back} to="/register/verify">
              &lt; 返回上一步
            </Link>
          </div>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
