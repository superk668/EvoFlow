import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import styles from './RegisterSetPassword.module.css'

export default function RegisterSetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  function handleComplete() {
    void password
    void confirm
    navigate('/register/success')
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
          <div className={styles.phoneValue}>86-138****3769</div>
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
                type="password"
              />
              <div className={styles.eye} aria-hidden="true" />
            </div>
            <div className={styles.strength} aria-hidden="true">
              <div className={styles.pillWeak}>弱</div>
              <div className={styles.pill}>中</div>
              <div className={styles.pill}>强</div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>确认密码</div>
            <div className={styles.field}>
              <input
                className={styles.input}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="再次输入密码"
                type="password"
              />
              <div className={styles.eye} aria-hidden="true" />
            </div>
          </div>

          <button type="button" className={styles.complete} onClick={handleComplete}>
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
