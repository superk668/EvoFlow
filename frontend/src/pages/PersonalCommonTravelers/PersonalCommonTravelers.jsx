import { Link } from 'react-router-dom'
import styles from './PersonalCommonTravelers.module.css'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'

export default function PersonalCommonTravelers() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="common-travelers" />
        <div className={styles.main}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>常用旅客信息</div>
              <div className={styles.panelSub}>维护本人及常用同行人信息</div>
            </div>

            <div className={styles.searchRow}>
              <input className={styles.searchInput} placeholder="中文名/英文名" />
              <button type="button" className={styles.searchBtn}>
                查询
              </button>
              <Link className={styles.addLink} to="/personal/common-travelers/add">
                新增
              </Link>
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
            </div>

            <div className={styles.footerRow}>
              <div className={styles.checkWrap}>
                <div className={styles.checkbox} aria-hidden="true" />
                <div className={styles.footerText}>全选</div>
              </div>
              <a className={styles.deleteLink} href="#/">
                删除
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
