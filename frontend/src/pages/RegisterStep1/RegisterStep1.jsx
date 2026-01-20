import { Link, useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'

import styles from './RegisterStep1.module.css'

export default function RegisterStep1({ showContract }) {
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const intervalRef = useRef(null)

  const sendButtonLabel = cooldown > 0 ? `${cooldown}秒后重试` : '发送验证码'

  async function handleSendCode() {
    if (cooldown > 0) return
    if (!/^1\d{10}$/.test(phoneNumber)) {
      setError('手机号格式不正确，请重新输入')
      return
    }
    setError('')
    try {
      const res = await fetch('/api/v1/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, type: 'register' }),
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

  async function handleNext() {
    if (!agreeTerms) {
      setError('先请阅读并勾选服务协议')
      return
    }
    if (!/^1\d{10}$/.test(phoneNumber)) {
      setError('手机号格式不正确，请重新输入')
      return
    }
    if (!code) {
      setError('请输入验证码')
      return
    }

    setError('')
    try {
      const res = await fetch('/api/v1/auth/register/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code, agreeTerms }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || '验证失败')
        return
      }

      sessionStorage.setItem('register_phone', phoneNumber)
      sessionStorage.setItem('register_verificationToken', data.verificationToken)
      navigate('/register/password')
    } catch {
      setError('网络异常，请稍后重试')
    }
  }

  return (
    <div className={styles.page}>
      <TopHeader variant="register" />

      <div className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.stepper}>
            <div className={styles.stepActive}>
              <div className={styles.dotActive} />
              <div className={styles.stepTextActive}>验证手机</div>
            </div>
            <div className={styles.lineActive} />
            <div className={styles.step}>
              <div className={styles.dot} />
              <div className={styles.stepText}>设置密码</div>
            </div>
            <div className={styles.line} />
            <div className={styles.step}>
              <div className={styles.dot} />
              <div className={styles.stepText}>注册成功</div>
            </div>
          </div>

          <div className={styles.form}>
            <div className={styles.row}>
              <div className={styles.label}>手机号</div>
              <div className={styles.phoneGroup}>
                <div className={styles.select}>
                  中国大陆 86
                  <span className={styles.caret} aria-hidden />
                </div>
                <input
                  className={styles.input}
                  placeholder="有效手机号"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.label}>短信验证码</div>
              <div className={styles.codeGroup}>
                <input
                  className={styles.input}
                  placeholder="6位数字"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button type="button" className={styles.send} onClick={handleSendCode} disabled={cooldown > 0}>
                  {sendButtonLabel}
                </button>
              </div>
            </div>

            <div className={styles.agree}>
              <div className={styles.agreeText}>
                <label>
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                  服务协议
                </label>
              </div>
            </div>

            {error ? <div role="alert">{error}</div> : null}

            <button type="button" className={styles.nextBtn} onClick={handleNext}>
              下一步，设置密码
            </button>

            <div className={styles.enterprise}>企业客户注册</div>
          </div>
        </div>
      </div>

      <BottomBar />

      {showContract ? <ContractModal /> : null}
    </div>
  )
}

function ContractModal() {
  return (
    <div className={styles.modalMask}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>携程用户注册协议和隐私政策</div>
          <div className={styles.modalClose} aria-hidden>
            ×
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalGreeting}>
            亲爱的用户，在您注册为携程用户的过程中，您需要完成我们的注册流程并通过点击同意的形式在此签署以下协议，请您务必仔细阅读，充分理解协议中的条款内容再点击同意，尤其是加粗字体。
          </div>

          <div className={styles.modalLink}>服务协议</div>

          <div className={styles.modalGrid}>
            <div className={styles.modalCol}>
              <div className={styles.modalItem}>1. 总则</div>
              <div className={styles.modalItem}>3. 服务条款的修改</div>
              <div className={styles.modalItem}>5. 使用规则</div>
              <div className={styles.modalItem}>7. 用户隐私制度</div>
              <div className={styles.modalItem}>9. 拒绝提供担保</div>
              <div className={styles.modalItem}>11. 携程网络会员服务信息的存储及限制</div>
              <div className={styles.modalItem}>13. 用户的违约责任</div>
              <div className={styles.modalItem}>15. 结束服务</div>
              <div className={styles.modalItem}>17. 参与广告策划</div>
              <div className={styles.modalItem}>19. 法律</div>
            </div>
            <div className={styles.modalCol}>
              <div className={styles.modalItem}>2. 服务简介</div>
              <div className={styles.modalItem}>4. 服务变更、中断、终止</div>
              <div className={styles.modalItem}>6. 版权声明</div>
              <div className={styles.modalItem}>8. 用户帐号、密码和安全性</div>
              <div className={styles.modalItem}>10. 有限责任</div>
              <div className={styles.modalItem}>12. 用户管理</div>
              <div className={styles.modalItem}>14. 保障</div>
              <div className={styles.modalItem}>16. 通告</div>
              <div className={styles.modalItem}>18. 邮件内容的所有权</div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Link className={styles.btnGhost} to="/">
            不同意
          </Link>
          <Link className={styles.btnPrimary} to="/register/verify">
            同意并继续
          </Link>
        </div>
      </div>
    </div>
  )
}
