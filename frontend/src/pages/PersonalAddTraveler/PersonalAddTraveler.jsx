import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'
import styles from './PersonalAddTraveler.module.css'

const STORAGE_KEY = 'evoflow_common_travelers'
const TOAST_KEY = 'commonTravelersToast'

function maskId(idNumber) {
  const s = String(idNumber ?? '').replace(/\s+/g, '')
  if (!s) return ''
  if (s.length < 5) return s
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

function readCommonTravelers() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

function writeCommonTravelers(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function isValidIsoDate(value) {
  const s = String(value ?? '').trim()
  if (!s) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}` === s
}

function createTravelerId() {
  const rand = Math.random().toString(16).slice(2)
  return `TR_${Date.now().toString(16)}_${rand}`
}

export default function PersonalAddTraveler() {
  const navigate = useNavigate()

  const [nameZh, setNameZh] = useState('')
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [isSelf, setIsSelf] = useState(false)
  const [nationality, setNationality] = useState('')
  const [gender, setGender] = useState('未知')
  const [birthday, setBirthday] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [faxNumber, setFaxNumber] = useState('')
  const [email, setEmail] = useState('')
  const [idType, setIdType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [idExpiry, setIdExpiry] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setError('')

    let list
    try {
      list = readCommonTravelers()
    } catch {
      setError('系统繁忙，请稍后重试')
      return
    }

    const nameOk = Boolean(String(nameZh).trim() || String(lastName).trim() || String(firstName).trim())
    if (!nameOk) {
      if (isSelf && list.some((t) => Boolean(t?.isSelf))) {
        setError('已存在本人旅客，不能重复设置')
        return
      }
      setError('中文名与英文名两者至少填写一项')
      return
    }

    if (!isValidIsoDate(birthday) || !isValidIsoDate(idExpiry)) {
      setError('日期格式应为 yyyy-MM-dd')
      return
    }

    if (idType && idNumber) {
      const dup = list.find((t) => String(t?.idType ?? '') === String(idType) && String(t?.idNumber ?? '') === String(idNumber))
      if (dup) {
        setError('证件号已存在')
        return
      }
    }

    setIsSaving(true)
    try {
      const nowIso = new Date().toISOString()
      const travelerId = createTravelerId()
      const created = {
        travelerId,
        isSelf,
        nameZh: String(nameZh ?? ''),
        lastName: String(lastName ?? ''),
        firstName: String(firstName ?? ''),
        birthday: String(birthday ?? ''),
        nationality: String(nationality ?? ''),
        gender: String(gender ?? '未知'),
        birthPlace: String(birthPlace ?? ''),
        phoneNumber: String(phoneNumber ?? ''),
        faxNumber: String(faxNumber ?? ''),
        email: String(email ?? ''),
        idType: String(idType ?? ''),
        idNumber: String(idNumber ?? ''),
        idNumberMasked: idNumber ? maskId(idNumber) : '',
        idExpiry: String(idExpiry ?? ''),
        frequentFlyerCards: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      }

      let nextList = [...list, created]
      if (isSelf) {
        nextList = nextList.map((t) => {
          if (String(t?.travelerId ?? '') === travelerId) return t
          if (!t?.isSelf) return t
          return { ...t, isSelf: false, updatedAt: nowIso }
        })
      }

      writeCommonTravelers(nextList)
      try {
        sessionStorage.setItem(TOAST_KEY, '新增成功')
      } catch {
        void 0
      }
      navigate('/user-center/common-info/travelers')
    } catch {
      setError('系统繁忙，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="common-travelers" />
        <div className={styles.main}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>新增常用旅客信息</div>
              <div className={styles.panelHint}>请填写以下旅客基本信息，为必填项。</div>
              <Link className={styles.panelLink} to="/user-center/common-info/travelers">
                查看已有旅客信息
              </Link>
            </div>

            {error ? <div>{error}</div> : null}

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
                      <input
                        className={styles.input}
                        placeholder="请填写中文姓名"
                        value={nameZh}
                        onChange={(e) => setNameZh(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>英文名</div>
                    <div className={styles.controls}>
                      <div className={styles.split}>
                        <input
                          className={styles.input}
                          placeholder="LastName(姓)"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                        <input
                          className={styles.input}
                          placeholder="FirstName(名)"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                        <div className={styles.helpIcon} aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label} />
                    <div className={styles.controls}>
                      <label className={styles.checkLine}>
                        <input
                          type="checkbox"
                          aria-label="设置为本人"
                          checked={isSelf}
                          onChange={(e) => setIsSelf(e.target.checked)}
                        />
                        <div className={styles.checkText}>设置为本人</div>
                      </label>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>国籍</div>
                    <div className={styles.controls}>
                      <input
                        className={styles.input}
                        placeholder="中文/英文"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>性别</div>
                    <div className={styles.controls}>
                      <select className={styles.input} value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="男">男</option>
                        <option value="女">女</option>
                        <option value="未知">未知</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>生日</div>
                    <div className={styles.controls}>
                      <input
                        className={styles.input}
                        placeholder="yyyy-MM-dd"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>出生地</div>
                    <div className={styles.controls}>
                      <input className={styles.input} value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>手机号码</div>
                    <div className={styles.controls}>
                      <div className={styles.phoneLine}>
                        <input
                          className={styles.input}
                          placeholder="大陆手机"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
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
                        <input
                          className={styles.input}
                          placeholder="电话"
                          value={faxNumber}
                          onChange={(e) => setFaxNumber(e.target.value)}
                        />
                        <input className={styles.inputSm} placeholder="分机" />
                      </div>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>Email</div>
                    <div className={styles.controls}>
                      <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
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
                      <select className={styles.input} value={idType} onChange={(e) => setIdType(e.target.value)}>
                        <option value="">请选择</option>
                        <option value="身份证">身份证</option>
                        <option value="护照">护照</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>证件号码</div>
                    <div className={styles.controls}>
                      <input
                        className={styles.input}
                        placeholder="请输入证件号码"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>有效期</div>
                    <div className={styles.controls}>
                      <div className={styles.expireLine}>
                        <input
                          className={styles.input}
                          placeholder="yyyy-MM-dd"
                          value={idExpiry}
                          onChange={(e) => setIdExpiry(e.target.value)}
                        />
                        <a
                          className={styles.longLink}
                          href="#/"
                          onClick={(e) => {
                            e.preventDefault()
                            setIdExpiry('')
                          }}
                        >
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
                <button type="button" className={styles.save} onClick={handleSave} disabled={isSaving}>
                  保存
                </button>
                <Link className={styles.cancel} to="/user-center/common-info/travelers">
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
