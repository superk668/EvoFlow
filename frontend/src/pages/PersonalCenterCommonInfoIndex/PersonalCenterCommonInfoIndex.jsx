import { Link } from 'react-router-dom'
import styles from './PersonalCenterCommonInfoIndex.module.css'

export default function PersonalCenterCommonInfoIndex() {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.title}>常用信息</div>
        <div className={styles.sub}>请选择需要管理的类型</div>
      </div>

      <div className={styles.grid}>
        <Link className={styles.entry} to="/user-center/common-info/travelers">
          常用旅客信息
        </Link>
        <div className={styles.entry}>常用联系人</div>
        <div className={styles.entry}>常用报销凭证</div>
        <div className={styles.entry}>常用地址</div>
      </div>
    </div>
  )
}

