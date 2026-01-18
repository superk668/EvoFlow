import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Register.module.css'

function isValidPhoneNumber(phoneNumber) {
  return /^1\d{10}$/.test(String(phoneNumber).trim())
}

function safeSetSession(key, value) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    void 0
  }
}

export default function Register() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [agreed, setAgreed] = useState(false)

  const [phoneError, setPhoneError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [agreeError, setAgreeError] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const sendLockRef = useRef(false)

  const canSend = countdownSeconds <= 0 && !isLoading
  const isCountingDown = countdownSeconds > 0

  useEffect(() => {
    if (!isCountingDown) return
    const id = setInterval(() => {
      setCountdownSeconds((v) => (v <= 1 ? 0 : v - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [isCountingDown])

  function handleSendSms() {
    setError('')
    setPhoneError('')
    const p = String(phone).trim()
    if (!isValidPhoneNumber(p)) {
      setPhoneError('手机号格式不正确，请重新输入')
      return
    }
    if (!canSend) return
    if (sendLockRef.current) return
    sendLockRef.current = true

    setCountdownSeconds(60)
    fetch('/api/auth/register/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: p }),
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

  async function handleNext() {
    setError('')
    setPhoneError('')
    setCodeError('')
    setAgreeError('')

    const p = String(phone).trim()
    const code = String(smsCode).trim()

    if (!isValidPhoneNumber(p)) {
      setPhoneError('手机号格式不正确，请重新输入')
      return
    }

    if (!code) {
      setCodeError('验证码错误')
      return
    }

    if (!agreed) {
      setAgreeError('请阅读并同意服务协议')
      return
    }

    setIsLoading(true)
    try {
      const resp = await fetch('/api/auth/register/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: p, verificationCode: code }),
      })

      if (resp.status === 401) {
        setCodeError('验证码错误')
        return
      }

      if (resp.status === 409) {
        setError('该手机号已注册，请直接登录')
        return
      }

      if (!resp.ok) {
        setError('注册失败')
        return
      }

      const data = await resp.json()
      if (data?.phoneNumberMasked) safeSetSession('register_phone_masked', String(data.phoneNumberMasked))
      safeSetSession('register_phone', p)
      const token = String(data?.registerToken ?? '')
      navigate(`/register/set-password?registerToken=${encodeURIComponent(token)}`)
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
          <div className={styles.stepActive}>
            <div className={styles.dotActive} />
            <div className={styles.stepLabel}>验证手机</div>
          </div>
          <div className={styles.lineActive} />
          <div className={styles.step}>
            <div className={styles.dot} />
            <div className={styles.stepLabelMuted}>设置密码</div>
          </div>
          <div className={styles.line} />
          <div className={styles.step}>
            <div className={styles.dot} />
            <div className={styles.stepLabelMuted}>注册成功</div>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.row}>
            <div className={styles.label}>手机号</div>
            <div className={styles.controls}>
              <div className={styles.country}>
                <div className={styles.countryText}>中国大陆 +86</div>
                <div className={styles.countryCaret} aria-hidden="true">
                  ▾
                </div>
              </div>
              <input
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="有效手机号"
              />
            </div>
          </div>
          {phoneError ? <div className={styles.fieldError}>{phoneError}</div> : null}

          <div className={styles.row}>
            <div className={styles.label}>短信验证码</div>
            <div className={styles.controls}>
              <input
                className={styles.inputWide}
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="6位数字"
              />
              <button type="button" className={styles.send} onClick={handleSendSms} disabled={!canSend}>
                {countdownSeconds > 0 ? `发送验证码(${countdownSeconds}s)` : '发送验证码'}
              </button>
            </div>
          </div>
          {codeError ? <div className={styles.fieldError}>{codeError}</div> : null}

          <div className={styles.agreeRow}>
            <label className={styles.agreeLabel} htmlFor="registerAgree">
              <input
                id="registerAgree"
                type="checkbox"
                className={styles.checkbox}
                aria-label="阅读并同意携程的服务协议和个人信息保护政策"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className={agreed ? styles.checkOn : styles.check} aria-hidden="true" />
              <span className={styles.agreeText}>
                阅读并同意携程的<a className={styles.link} href="#/">服务协议</a>和<a className={styles.link} href="#/">个人信息保护政策</a>
              </span>
            </label>
          </div>
          {agreeError ? <div className={styles.agreeError}>{agreeError}</div> : null}

          {error ? <div className={styles.error}>{error}</div> : null}

          <button
            type="button"
            className={agreed ? styles.next : styles.nextDisabled}
            onClick={handleNext}
            disabled={isLoading}
          >
            下一步，设置密码
          </button>

          <Link className={styles.loginLink} to="/login">
            已有账号？直接登录
          </Link>

          <Link className={styles.company} to="/register">
            企业客户注册
          </Link>
        </div>
      </div>
    </div>
  )
}
