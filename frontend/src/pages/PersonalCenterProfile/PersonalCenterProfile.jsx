import styles from './PersonalCenterProfile.module.css'

export default function PersonalCenterProfile() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div className={styles.cardTitle}>个人信息设置</div>
          <div className={styles.cardAction}>
            <span className={styles.actionText}>收起</span>
            <span className={styles.actionBox} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.row}>
            <div className={styles.label}>手机</div>
            <div className={styles.value}>188-1883-4683</div>
            <div className={styles.link}>修改</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>邮箱</div>
            <div className={styles.value}>未绑定</div>
            <div className={styles.link}>绑定</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>昵称</div>
            <div className={styles.value}>听世外</div>
            <div className={styles.link}>修改</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>姓名</div>
            <div className={styles.value}>Zhang Liu</div>
            <div className={styles.link}>修改</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>性别</div>
            <div className={styles.value}>男</div>
            <div className={styles.link}>修改</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>生日</div>
            <div className={styles.value}>未设置</div>
            <div className={styles.link}>修改</div>
          </div>
        </div>

        <div className={styles.btnRow}>
          <button className={styles.editBtn} type="button">
            编辑
          </button>
        </div>
      </div>

      <div className={styles.other}>
        <div className={styles.otherTitle}>其他设置</div>
        <div className={styles.otherRight}>
          <div className={styles.otherCount}>3项</div>
          <div className={styles.otherBox} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
