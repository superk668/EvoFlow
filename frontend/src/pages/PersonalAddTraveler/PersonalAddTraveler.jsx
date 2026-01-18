import { Link } from 'react-router-dom'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'
import styles from './PersonalAddTraveler.module.css'

export default function PersonalAddTraveler() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="common-travelers" />
        <div className={styles.main}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>新增常用旅客信息</div>
              <div className={styles.panelHint}>请填写以下旅客基本信息，为必填项。</div>
              <Link className={styles.panelLink} to="/personal/common-travelers">
                查看已有旅客信息
              </Link>
            </div>

            <div className={styles.formCard}>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>旅客信息</div>

                <div className={styles.noteRow}>
                  <span className={styles.noteStar} aria-hidden="true">
                    *
                  </span>
                  <div className={styles.noteText}>中文名与英文名至少填写一项</div>
                </div>

                <div className={styles.grid}>
                  <div className={styles.row}>
                    <div className={styles.label}>中文名</div>
                    <div className={styles.controls}>
                      <input className={styles.input} placeholder="请填写中文姓名" />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>英文名</div>
                    <div className={styles.controls}>
                      <div className={styles.split}>
                        <input className={styles.input} placeholder="LastName(姓)" />
                        <input className={styles.input} placeholder="FirstName(名)" />
                        <div className={styles.helpIcon} aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label} />
                    <div className={styles.controls}>
                      <div className={styles.checkLine}>
                        <div className={styles.checkbox} aria-hidden="true" />
                        <div className={styles.checkText}>设置为本人</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>国籍</div>
                    <div className={styles.controls}>
                      <input className={styles.input} placeholder="中文/英文" />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>性别</div>
                    <div className={styles.controls}>
                      <div className={styles.radioLine}>
                        <div className={styles.radioOn} aria-hidden="true" />
                        <div className={styles.radioText}>男</div>
                        <div className={styles.radio} aria-hidden="true" />
                        <div className={styles.radioText}>女</div>
                        <div className={styles.radio} aria-hidden="true" />
                        <div className={styles.radioText}>未知</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>生日</div>
                    <div className={styles.controls}>
                      <input className={styles.input} placeholder="yyyy-MM-dd" />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>出生地</div>
                    <div className={styles.controls}>
                      <input className={styles.input} />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>手机号码</div>
                    <div className={styles.controls}>
                      <div className={styles.phoneLine}>
                        <input className={styles.input} placeholder="大陆手机" />
                        <div className={styles.or}>或</div>
                        <div className={styles.select}>
                          <div className={styles.selectText}>中国香港 852</div>
                          <div className={styles.selectCaret} aria-hidden="true" />
                        </div>
                        <input className={styles.input} placeholder="非大陆手机" />
                      </div>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>传真号码</div>
                    <div className={styles.controls}>
                      <div className={styles.faxLine}>
                        <input className={styles.inputSm} placeholder="区号" />
                        <input className={styles.input} placeholder="电话" />
                        <input className={styles.inputSm} placeholder="分机" />
                      </div>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>Email</div>
                    <div className={styles.controls}>
                      <input className={styles.input} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>证件信息</div>
                <div className={styles.grid}>
                  <div className={styles.row}>
                    <div className={styles.label}>证件类型</div>
                    <div className={styles.controls}>
                      <div className={styles.selectWide}>
                        <div className={styles.selectText}>请选择</div>
                        <div className={styles.selectCaret} aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>证件号码</div>
                    <div className={styles.controls}>
                      <input className={styles.input} />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>有效期</div>
                    <div className={styles.controls}>
                      <div className={styles.expireLine}>
                        <input className={styles.input} placeholder="yyyy-MM-dd" />
                        <a className={styles.longLink} href="#/">
                          设为长期有效
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>常旅客卡</div>
                <a className={styles.addCard} href="#/">
                  添加常旅客卡
                </a>
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.save}>
                  保存
                </button>
                <Link className={styles.cancel} to="/personal/common-travelers">
                  取消
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

