import styles from './PasswordStrengthIndicator.module.css'

export default function PasswordStrengthIndicator({ strength }) {
  return (
    <div className={styles.strength} data-strength={strength}>
      <div className={styles.item}>弱</div>
      <div className={styles.item}>中</div>
      <div className={styles.item}>强</div>
    </div>
  )
}

