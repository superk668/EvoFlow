import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import RegisterStepBar from '../../components/RegisterStepBar/RegisterStepBar.jsx'
import styles from './RegisterStep2.module.css'

export default function RegisterStep2() {
  return (
    <div className={styles.page}>
      <RegisterStepBar activeStep={2} />

      <div className={styles.formWrap}>
        <div className={styles.form}>
          <div className={styles.phoneRow}>
            <div className={styles.phoneLabel}>注册手机号</div>
            <div className={styles.phoneValue}>86-138*****3769</div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.label}>密码</div>
            <div className={styles.passwordGrid}>
              <div className={styles.inputWrap}>
                <input className={styles.input} placeholder="8-20位字母、数字和符号" />
                <div className={styles.eye} aria-hidden="true">
                  <PlaceholderImage name="显示密码" width={18} height={18} />
                </div>
              </div>
              <div className={styles.strength}>
                <div className={styles.strItem}>弱</div>
                <div className={[styles.strItem, styles.strActive].join(' ')}>中</div>
                <div className={styles.strItem}>强</div>
              </div>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.label}>确认密码</div>
            <div className={styles.inputWrap}>
              <input className={styles.input} placeholder="再次输入密码" />
              <div className={styles.eye} aria-hidden="true">
                <PlaceholderImage name="显示密码" width={18} height={18} />
              </div>
            </div>
          </div>

          <button className={styles.finishBtn} type="button">
            完成
          </button>

          <div className={styles.help}>注册遇到问题?</div>
        </div>

        <div className={styles.back}>&lt; 返回上一步</div>
      </div>
    </div>
  )
}

