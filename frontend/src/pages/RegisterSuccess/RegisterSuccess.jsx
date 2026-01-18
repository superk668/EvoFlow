import styles from './RegisterSuccess.module.css'

export default function RegisterSuccess() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.stepper}>
          <div className={styles.stepDone}>
            <div className={styles.dotDone} />
            <div className={styles.stepLabelMuted}>验证手机</div>
          </div>
          <div className={styles.lineActive} />
          <div className={styles.stepDone}>
            <div className={styles.dotDone} />
            <div className={styles.stepLabelMuted}>设置密码</div>
          </div>
          <div className={styles.lineActive} />
          <div className={styles.stepActive}>
            <div className={styles.dotActive} />
            <div className={styles.stepLabel}>注册成功</div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.title}>注册成功</div>
          <div className={styles.sub}>本步骤占位</div>
        </div>
      </div>
    </div>
  )
}

