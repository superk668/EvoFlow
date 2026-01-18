import styles from './PersonalMyInfo.module.css'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'

export default function PersonalMyInfo() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="my-info" />
        <div className={styles.main}>
          <div className={styles.card}>
            <div className={styles.head}>
              <div className={styles.title}>我的信息</div>
              <div className={styles.breadcrumb}>个人中心 &gt; 我的信息</div>
            </div>

            <div className={styles.profile}>
              <div className={styles.avatarCol}>
                <div className={styles.avatar} aria-hidden="true" />
                <div className={styles.avatarHint}>更换头像</div>
              </div>

              <div className={styles.profileMain}>
                <div className={styles.nameRow}>
                  <div className={styles.username}>恒色初心</div>
                  <div className={styles.tier}>白银贵宾</div>
                </div>
                <div className={styles.uidRow}>
                  <div className={styles.uidLabel}>会员号</div>
                  <div className={styles.uidValue}>C1234567890</div>
                </div>
                <div className={styles.tagRow}>
                  <div className={styles.tag}>已实名</div>
                  <div className={styles.tagMuted}>手机已绑定</div>
                  <div className={styles.tagMuted}>邮箱未绑定</div>
                </div>
                <div className={styles.actionRow}>
                  <button type="button" className={styles.primaryBtn}>
                    编辑资料
                  </button>
                  <button type="button" className={styles.ghostBtn}>
                    账户安全
                  </button>
                </div>
              </div>

              <div className={styles.profileSide}>
                <div className={styles.sideItem}>
                  <div className={styles.sideLabel}>积分</div>
                  <div className={styles.sideValue}>2114</div>
                </div>
                <div className={styles.sideDivider} aria-hidden="true" />
                <div className={styles.sideItem}>
                  <div className={styles.sideLabel}>优惠券</div>
                  <div className={styles.sideValue}>3</div>
                </div>
                <div className={styles.sideDivider} aria-hidden="true" />
                <div className={styles.sideItem}>
                  <div className={styles.sideLabel}>收藏</div>
                  <div className={styles.sideValue}>12</div>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>基本信息</div>
              <div className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.label}>昵称</div>
                  <div className={styles.value}>恒色初心</div>
                  <a className={styles.link} href="#/">
                    修改
                  </a>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>性别</div>
                  <div className={styles.value}>保密</div>
                  <a className={styles.link} href="#/">
                    修改
                  </a>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>生日</div>
                  <div className={styles.value}>2000-01-01</div>
                  <a className={styles.link} href="#/">
                    修改
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>联系方式</div>
              <div className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.label}>手机</div>
                  <div className={styles.value}>(+86)18879586080</div>
                  <a className={styles.link} href="#/">
                    修改
                  </a>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>邮箱</div>
                  <div className={styles.value}>未绑定</div>
                  <a className={styles.link} href="#/">
                    绑定
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>证件信息</div>
              <div className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.label}>证件类型</div>
                  <div className={styles.value}>身份证</div>
                  <a className={styles.link} href="#/">
                    查看
                  </a>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>证件号码</div>
                  <div className={styles.value}>360924 2005 0910 0812</div>
                  <a className={styles.link} href="#/">
                    查看
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
