import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'
import styles from './CommonTravelerEdit.module.css'

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

export default function CommonTravelerEdit() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const travelerId = searchParams.get('travelerId') ?? ''

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

  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const reload = useCallback(() => {
    setLoadError('')
    setError('')
    try {
      const list = readCommonTravelers()
      const found = list.find((t) => String(t?.travelerId ?? '') === String(travelerId)) ?? null
      if (!found) return

      setNameZh(String(found?.nameZh ?? ''))
      setLastName(String(found?.lastName ?? ''))
      setFirstName(String(found?.firstName ?? ''))
      setIsSelf(Boolean(found?.isSelf))
      setNationality(String(found?.nationality ?? ''))
      setGender(String(found?.gender ?? '') || '未知')
      setBirthday(String(found?.birthday ?? ''))
      setBirthPlace(String(found?.birthPlace ?? ''))
      setPhoneNumber(String(found?.phoneNumber ?? ''))
      setFaxNumber(String(found?.faxNumber ?? ''))
      setEmail(String(found?.email ?? ''))
      setIdType(String(found?.idType ?? ''))
      setIdNumber(String(found?.idNumber ?? ''))
      setIdExpiry(String(found?.idExpiry ?? ''))
    } catch {
      setLoadError('加载失败')
    }
  }, [travelerId])

  useEffect(() => {
    if (!travelerId) return
    reload()
  }, [travelerId, reload])

  async function handleSave() {
    setError('')
    setToast('')

    const nameOk = Boolean(String(nameZh).trim() || String(lastName).trim() || String(firstName).trim())
    if (!nameOk) {
      setError('中文名与英文名两者至少填写一项')
      return
    }

    if (!isValidIsoDate(birthday) || !isValidIsoDate(idExpiry)) {
      setError('日期格式应为 yyyy-MM-dd')
      return
    }

    try {
      const list = readCommonTravelers()
      const exists = list.find((t) => String(t?.travelerId ?? '') === String(travelerId))
      if (!exists) {
        setError('记录已删除')
        return
      }

      if (idType && idNumber) {
        const dup = list.find(
          (t) =>
            String(t?.travelerId ?? '') !== String(travelerId) &&
            String(t?.idType ?? '') === String(idType) &&
            String(t?.idNumber ?? '') === String(idNumber),
        )
        if (dup) {
          setError('证件号已存在')
          return
        }
      }

      setIsSaving(true)

      const nowIso = new Date().toISOString()
      const nextList = list.map((t) => {
        if (String(t?.travelerId ?? '') !== String(travelerId)) {
          if (isSelf && t?.isSelf) return { ...t, isSelf: false, updatedAt: nowIso }
          return t
        }

        const next = {
          ...t,
          isSelf,
          nameZh: String(nameZh ?? ''),
          lastName: String(lastName ?? ''),
          firstName: String(firstName ?? ''),
          nationality: String(nationality ?? ''),
          gender: String(gender ?? '未知'),
          birthday: String(birthday ?? ''),
          birthPlace: String(birthPlace ?? ''),
          phoneNumber: String(phoneNumber ?? ''),
          faxNumber: String(faxNumber ?? ''),
          email: String(email ?? ''),
          idType: String(idType ?? ''),
          idNumber: String(idNumber ?? ''),
          idNumberMasked: idNumber ? maskId(idNumber) : '',
          idExpiry: String(idExpiry ?? ''),
          updatedAt: nowIso,
          createdAt: t?.createdAt ?? nowIso,
        }
        return next
      })

      writeCommonTravelers(nextList)

      try {
        await fetch('/api/user-center/common-info/travelers', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ travelerId: String(travelerId), updatedAt: nowIso }),
        })
      } catch {
        void 0
      }

      try {
        sessionStorage.setItem(TOAST_KEY, '保存成功')
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
            <div className={styles.title}>编辑常用旅客信息</div>

            {toast ? <div>{toast}</div> : null}
            {error ? <div>{error}</div> : null}
            {loadError ? (
              <div>
                <div>{loadError}</div>
                <button type="button" onClick={reload}>
                  重试
                </button>
              </div>
            ) : null}

            {travelerId ? (
              <div className={styles.formCard}>
                <div className={styles.sectionTitle}>旅客信息</div>
                <div className={styles.row}>
                  <div className={styles.label}>中文名</div>
                  <input
                    className={styles.input}
                    placeholder="请填写中文姓名"
                    value={nameZh}
                    onChange={(e) => setNameZh(e.target.value)}
                  />
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>英文姓</div>
                  <input
                    className={styles.input}
                    placeholder="LastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>英文名</div>
                  <input
                    className={styles.input}
                    placeholder="FirstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className={styles.row}>
                  <div className={styles.label} />
                  <label>
                    <input
                      type="checkbox"
                      aria-label="设置为本人"
                      checked={isSelf}
                      onChange={(e) => setIsSelf(e.target.checked)}
                    />
                    设置为本人
                  </label>
                </div>

                <div className={styles.row}>
                  <div className={styles.label}>国籍</div>
                  <input
                    className={styles.input}
                    placeholder="中文/英文"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.label}>性别</div>
                  <div>
                    <label>
                      <input
                        type="radio"
                        name="gender"
                        value="男"
                        checked={gender === '男'}
                        onChange={(e) => setGender(e.target.value)}
                      />
                      男
                    </label>
                    <span> </span>
                    <label>
                      <input
                        type="radio"
                        name="gender"
                        value="女"
                        checked={gender === '女'}
                        onChange={(e) => setGender(e.target.value)}
                      />
                      女
                    </label>
                    <span> </span>
                    <label>
                      <input
                        type="radio"
                        name="gender"
                        value="未知"
                        checked={gender === '未知'}
                        onChange={(e) => setGender(e.target.value)}
                      />
                      未知
                    </label>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.label}>生日</div>
                  <input
                    className={styles.input}
                    placeholder="yyyy-MM-dd"
                    value={birthday}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.label}>出生地</div>
                  <input className={styles.input} value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} />
                </div>

                <div className={styles.row}>
                  <div className={styles.label}>手机号码</div>
                  <input
                    className={styles.input}
                    placeholder="大陆手机"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.label}>传真号码</div>
                  <input className={styles.input} value={faxNumber} onChange={(e) => setFaxNumber(e.target.value)} />
                </div>

                <div className={styles.row}>
                  <div className={styles.label}>Email</div>
                  <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className={styles.sectionTitle}>证件信息</div>
                <div className={styles.row}>
                  <div className={styles.label}>证件类型</div>
                  <select className={styles.select} value={idType} onChange={(e) => setIdType(e.target.value)}>
                    <option value="">请选择</option>
                    <option value="身份证">身份证</option>
                    <option value="护照">护照</option>
                  </select>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>证件号码</div>
                  <input
                    className={styles.input}
                    placeholder="请输入证件号码"
                    value={idNumber}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setIdNumber(e.target.value)}
                  />
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>有效期</div>
                  <input
                    className={styles.input}
                    placeholder="yyyy-MM-dd"
                    value={idExpiry}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setIdExpiry(e.target.value)}
                  />
                </div>

                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault()
                    setIdExpiry('')
                  }}
                >
                  设为长期有效
                </a>

                <div className={styles.actions}>
                  <button type="button" className={styles.save} onClick={handleSave} disabled={isSaving}>
                    保存
                  </button>
                  <Link className={styles.cancel} to="/user-center/common-info/travelers">
                    取消
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.error}>记录不存在或链接无效</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
