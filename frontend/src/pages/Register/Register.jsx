import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Register.module.css'

export default function Register() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [agreed, setAgreed] = useState(false)

  function handleSendSms() {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    console.log('短信验证码:', code)
  }

  function handleNext() {
    void phone
    void smsCode
    navigate('/register/set-password')
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

          <div className={styles.row}>
            <div className={styles.label}>短信验证码</div>
            <div className={styles.controls}>
              <input
                className={styles.inputWide}
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="6位数字"
              />
              <button type="button" className={styles.send} onClick={handleSendSms}>
                发送验证码
              </button>
            </div>
          </div>

          <div className={styles.agreeRow}>
            <button
              type="button"
              className={agreed ? styles.checkOn : styles.check}
              onClick={() => setAgreed((v) => !v)}
              aria-pressed={agreed}
            />
            <div className={styles.agreeText}>
              同意 <a className={styles.link} href="#/">《服务协议》</a> 和{' '}
              <a className={styles.link} href="#/">《隐私政策》</a>
            </div>
          </div>

          <button
            type="button"
            className={agreed ? styles.next : styles.nextDisabled}
            onClick={handleNext}
            disabled={!agreed}
          >
            下一步，设置密码
          </button>

          <Link className={styles.company} to="/register">
            企业客户注册
          </Link>
        </div>
      </div>
    </div>
  )
}
