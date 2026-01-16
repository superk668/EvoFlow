import RegisterStepBar from '../../components/RegisterStepBar/RegisterStepBar.jsx'
import styles from './RegisterStep1.module.css'

export default function RegisterStep1() {
  return (
    <div className={styles.page}>
      <RegisterStepBar activeStep={1} />

      <div className={styles.formWrap}>
        <div className={styles.form}>
          <div className={styles.fieldRow}>
            <div className={styles.label}>手机号</div>
            <div className={styles.combo}>
              <div className={styles.select}>
                中国大陆 +86 <span className={styles.caret} aria-hidden="true" />
              </div>
              <input className={styles.input} placeholder="有效手机号" />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.label}>短信验证码</div>
            <div className={styles.codeRow}>
              <input className={styles.input} placeholder="6位数字" />
              <div className={styles.send}>发送验证码</div>
            </div>
          </div>

          <div className={styles.agree}>
            同意 <span className={styles.link}>《服务协议》</span> 和{' '}
            <span className={styles.link}>《隐私政策》</span>
          </div>

          <button className={styles.nextBtn} type="button">
            下一步，设置密码
          </button>

          <div className={styles.company}>企业客户注册</div>
        </div>
      </div>
    </div>
  )
}
