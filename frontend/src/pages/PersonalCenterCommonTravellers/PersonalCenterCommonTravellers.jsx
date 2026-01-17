import { Link } from 'react-router-dom'
import styles from './PersonalCenterCommonTravellers.module.css'

export default function PersonalCenterCommonTravellers() {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.title}>常用旅客信息</div>
        <div className={styles.sub}>维护本人及常用同行人信息</div>
      </div>

      <div className={styles.card}>
        <div className={styles.tools}>
          <div className={styles.searchRow}>
            <div className={styles.input}>中文名/英文名</div>
            <button className={styles.searchBtn} type="button">
              查询
            </button>
            <Link className={styles.addLink} to="/personal/common-info/travellers/new">
              新增
            </Link>
          </div>
        </div>

        <div className={styles.table}>
          <div className={styles.thead}>
            <div className={styles.th}>选择</div>
            <div className={styles.th}>标识</div>
            <div className={styles.th}>姓名</div>
            <div className={styles.th}>手机/电话</div>
            <div className={styles.th}>证件类型</div>
            <div className={styles.th}>证件号码</div>
            <div className={styles.th}>国籍(国家/地区)</div>
            <div className={styles.th}>性别</div>
            <div className={styles.th}>常旅客卡</div>
            <div className={styles.th}>操作</div>
          </div>

          <div className={styles.tbody}>
            <div className={styles.empty}>暂无记录</div>
          </div>

          <div className={styles.bottomTools}>
            <div className={styles.bottomLeft}>
              <span className={styles.checkbox} aria-hidden="true" />
              全选
            </div>
            <div className={styles.delete}>
              <span className={styles.deleteIcon} aria-hidden="true" />
              删除
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
