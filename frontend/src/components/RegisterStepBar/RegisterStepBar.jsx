import styles from './RegisterStepBar.module.css'

export default function RegisterStepBar({ activeStep }) {
  const isDone1 = activeStep > 1
  const isDone2 = activeStep > 2

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={[styles.dot, isDone1 ? styles.dotDone : styles.dotActive].join(' ')} />
        <div className={[styles.seg, activeStep >= 2 ? styles.segDone : styles.segTodo].join(' ')} />
        <div className={[styles.dot, activeStep === 2 ? styles.dotActive : isDone1 ? styles.dotDone : styles.dotTodo].join(' ')} />
        <div className={[styles.seg, activeStep >= 3 ? styles.segDone : styles.segTodo].join(' ')} />
        <div className={[styles.dot, activeStep === 3 ? styles.dotActive : isDone2 ? styles.dotDone : styles.dotTodo].join(' ')} />
      </div>
      <div className={styles.labels}>
        <div className={activeStep === 1 ? styles.labelActive : styles.label}>验证手机</div>
        <div className={activeStep === 2 ? styles.labelActive : styles.label}>设置密码</div>
        <div className={activeStep === 3 ? styles.labelActive : styles.label}>注册成功</div>
      </div>
    </div>
  )
}

