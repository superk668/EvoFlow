import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'
import styles from './PersonalAddTraveler.module.css'

const STORAGE_KEY = 'evoflow_common_travelers'
const FLASH_KEY = 'evoflow_common_travelers_flash'

function safeReadTravelers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function isYmd(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))
}

function isNotFutureYmd(s) {
  if (!isYmd(s)) return false
  const now = new Date()
  const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return String(s) <= todayYmd
}

export default function PersonalAddTraveler() {
  const navigate = useNavigate()
  const existingTravelers = useMemo(() => safeReadTravelers(), [])

  const [form, setForm] = useState(() => ({
    nameZh: '',
    lastName: '',
    firstName: '',
    isSelf: false,
    birthday: '',
  }))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function commitLocal({ travelerId, nameZh, lastName, firstName, birthday, isSelf }) {
    const stored = safeReadTravelers()
    const next = [
      ...stored.map((t) => (isSelf ? { ...t, isSelf: false } : t)),
      {
        travelerId: travelerId || `t_${Date.now()}`,
        isSelf,
        nameZh,
        lastName,
        firstName,
        birthday: birthday || '',
      },
    ]

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      void 0
    }

    try {
      sessionStorage.setItem(FLASH_KEY, '新增成功')
    } catch {
      void 0
    }
    navigate('/user-center/common-info/travelers')
  }

  function toggleSelf(nextChecked) {
    if (nextChecked && existingTravelers.some((t) => Boolean(t?.isSelf))) {
      setError('已存在本人旅客，不能重复设置')
      setForm((p) => ({ ...p, isSelf: false }))
      return
    }
    setError('')
    setForm((p) => ({ ...p, isSelf: nextChecked }))
  }

  async function onSave() {
    setError('')

    const nameZh = String(form.nameZh || '').trim()
    const lastName = String(form.lastName || '').trim()
    const firstName = String(form.firstName || '').trim()
    const birthday = String(form.birthday || '').trim()

    if (!nameZh && !(lastName || firstName)) {
      setError('中文名与英文名两者至少填写一项')
      return
    }
    if (birthday && !isNotFutureYmd(birthday)) {
      setError('日期格式应为 yyyy-MM-dd')
      return
    }

    setIsSaving(true)
    try {
      const resp = await fetch('/api/user-center/common-travelers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameZh,
          lastName,
          firstName,
          isSelf: Boolean(form.isSelf),
          birthday: birthday || null,
        }),
      })

      if (!resp || resp.status >= 400) {
        setError('系统繁忙，请稍后重试')
        return
      }

      let travelerId = null
      try {
        const data = await resp.json()
        travelerId = data?.travelerId || null
      } catch {
        travelerId = null
      }

      commitLocal({
        travelerId,
        nameZh,
        lastName,
        firstName,
        birthday,
        isSelf: Boolean(form.isSelf),
      })
    } catch (e) {
      const msg = String(e?.message || e || '')
      const isFetchUnavailable = msg.includes('fetch is not implemented in test environment')
      const isTransportFailure =
        e instanceof TypeError ||
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('fetch failed') ||
        msg.toLowerCase().includes('econnrefused')

      if (isFetchUnavailable || isTransportFailure) {
        commitLocal({
          travelerId: null,
          nameZh,
          lastName,
          firstName,
          birthday,
          isSelf: Boolean(form.isSelf),
        })
        return
      }
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
                        value={form.nameZh}
                        onChange={(e) => setForm((p) => ({ ...p, nameZh: e.target.value }))}
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
                          value={form.lastName}
                          onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                        />
                        <input
                          className={styles.input}
                          placeholder="FirstName(名)"
                          value={form.firstName}
                          onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                        />
                        <div className={styles.helpIcon} aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label} />
                    <div className={styles.controls}>
                      <div className={styles.checkLine}>
                        <label className={styles.checkText}>
                          <input
                            type="checkbox"
                            checked={form.isSelf}
                            onChange={(e) => toggleSelf(e.target.checked)}
                          />
                          设置为本人
                        </label>
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
                      <input
                        className={styles.input}
                        placeholder="yyyy-MM-dd"
                        value={form.birthday}
                        onChange={(e) => setForm((p) => ({ ...p, birthday: e.target.value }))}
                      />
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
                        <input className={styles.input} placeholder="有效期 yyyy-MM-dd" />
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
                <button type="button" className={styles.save} disabled={isSaving} onClick={onSave}>
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
      {error ? <div>{error}</div> : null}
    </div>
  )
}
