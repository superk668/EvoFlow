import { Link } from 'react-router-dom'
import styles from './PersonalCenterTravellerForm.module.css'

export default function PersonalCenterTravellerForm() {
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topTitle}>新增常用旅客信息</div>
        <div className={styles.topSub}>请填写以下旅客信息，为必填项。</div>
        <Link className={styles.topLink} to="/personal/common-info/travellers">
          查看所有旅客信息
        </Link>
      </div>

      <div className={styles.formWrap}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>旅客信息</div>
          <div className={styles.sectionBody}>
            <div className={styles.helpLine}>
              <span className={styles.req} aria-hidden="true">
                *
              </span>
              中文名与英文名两者必填一项
            </div>

            <div className={styles.grid}>
              <div className={styles.row}>
                <div className={styles.label}>中文名</div>
                <div className={styles.fieldWide}>
                  <div className={styles.input}>请输入中文姓名</div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>英文名</div>
                <div className={styles.fieldSplit}>
                  <div className={styles.input}>LastName(姓)</div>
                  <div className={styles.input}>FirstName(名)</div>
                  <span className={styles.infoIcon} aria-hidden="true">
                    ?
                  </span>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label} />
                <div className={styles.fieldWide}>
                  <div className={styles.checkRow}>
                    <span className={styles.checkbox} aria-hidden="true" />
                    设置为本人
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>国籍</div>
                <div className={styles.fieldWide}>
                  <div className={styles.select}>中文/英文</div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>性别</div>
                <div className={styles.fieldWide}>
                  <div className={styles.radioRow}>
                    <span className={styles.radio} aria-hidden="true" />
                    男
                    <span className={styles.radio} aria-hidden="true" />
                    女
                    <span className={styles.radioOn} aria-hidden="true" />
                    未知
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>生日</div>
                <div className={styles.fieldWide}>
                  <div className={styles.input}>yyyy-MM-dd</div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>出生地</div>
                <div className={styles.fieldWide}>
                  <div className={styles.input} />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>手机号</div>
                <div className={styles.fieldPhone}>
                  <div className={styles.input}>大陆手机号</div>
                  <div className={styles.or}>或</div>
                  <div className={styles.select}>中国香港 852</div>
                  <div className={styles.input}>非大陆手机号</div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>传真号码</div>
                <div className={styles.fieldFax}>
                  <div className={styles.input}>区号</div>
                  <div className={styles.input}>电话</div>
                  <div className={styles.input}>分机</div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>Email</div>
                <div className={styles.fieldWide}>
                  <div className={styles.input} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>证件信息</div>
          <div className={styles.sectionBody}>
            <div className={styles.grid}>
              <div className={styles.row3}>
                <div className={styles.label}>证件类型</div>
                <div className={styles.select}>请选择</div>
                <div className={styles.label}>证件号码</div>
                <div className={styles.input} />
                <div className={styles.label}>有效期</div>
                <div className={styles.fieldExpire}>
                  <div className={styles.input}>yyyy-MM-dd</div>
                  <div className={styles.blueLink}>设为长期有效</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>常旅客卡</div>
          <div className={styles.sectionBody}>
            <div className={styles.blueLink}>添加常旅客卡</div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.saveBtn} type="button">
            保 存
          </button>
          <button className={styles.cancelBtn} type="button">
            取 消
          </button>
        </div>
      </div>
    </div>
  )
}
