import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import styles from './PersonalMyInfo.module.css'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'

const STORAGE_KEY = 'evoflow_user_profile'

function readStoredProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredProfile(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function maskPhone(phoneNumber) {
  const digits = String(phoneNumber ?? '').replace(/\D+/g, '')
  if (digits.length !== 11) return String(phoneNumber ?? '')
  return `${digits.slice(0, 3)}*****${digits.slice(7)}`
}

function displayValue(value) {
  const s = String(value ?? '').trim()
  return s ? s : '未设置'
}

function isValidIsoDate(value) {
  const s = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}` === s
}

function isFutureIsoDate(value) {
  const s = String(value ?? '').trim()
  if (!isValidIsoDate(s)) return false
  const d = new Date(`${s}T00:00:00`)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return d.getTime() > todayStart.getTime()
}

function isValidName(value) {
  const s = String(value ?? '').trim()
  if (!s) return false
  if (s.length > 30) return false
  return /^[\u4e00-\u9fa5A-Za-z\s·]+$/.test(s)
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal })
    return resp
  } finally {
    clearTimeout(t)
  }
}

export default function PersonalMyInfo() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(() => readStoredProfile())

  const isEditRoute = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('edit') === 'true'
  }, [location.search])

  const [isEditing, setIsEditing] = useState(isEditRoute)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState({ nickname: '', name: '', gender: '', birthday: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [showNicknameHint, setShowNicknameHint] = useState(false)
  const submitLockRef = useRef(false)
  const [form, setForm] = useState({
    nickname: profile?.nickname ?? '',
    name: profile?.name ?? '',
    gender: profile?.gender ?? '',
    birthday: profile?.birthday ?? '',
  })

  useEffect(() => {
    setIsEditing(isEditRoute)
  }, [isEditRoute])

  useEffect(() => {
    setForm({
      nickname: profile?.nickname ?? '',
      name: profile?.name ?? '',
      gender: profile?.gender ?? '',
      birthday: profile?.birthday ?? '',
    })
  }, [profile])

  const phoneMasked = useMemo(() => {
    const p = auth?.phoneNumber ?? ''
    return `86-${maskPhone(p)}`
  }, [auth?.phoneNumber])

  const nicknameStatus = profile?.nicknameStatus ?? ''
  const nicknameDisabled = nicknameStatus === 'reviewing'

  function enterEdit() {
    if (nicknameDisabled) {
      setNotice('昵称审核中，暂不可修改')
    } else {
      setNotice('')
    }
    setError('')
    setFieldError({ nickname: '', name: '', gender: '', birthday: '' })
    setIsEditing(true)
    navigate('/user-center/my-info?edit=true', { replace: true })
  }

  function exitEdit() {
    setError('')
    setFieldError({ nickname: '', name: '', gender: '', birthday: '' })
    setIsEditing(false)
    navigate('/user-center/my-info', { replace: true })
  }

  async function handleSave() {
    if (submitLockRef.current) return
    submitLockRef.current = true
    setIsSaving(true)
    setError('')
    setNotice('')
    setFieldError({ nickname: '', name: '', gender: '', birthday: '' })

    const nickname = String(form.nickname ?? '').trim()
    const name = String(form.name ?? '').trim()
    const gender = String(form.gender ?? '').trim()
    const birthday = String(form.birthday ?? '').trim()

    const nextFieldError = { nickname: '', name: '', gender: '', birthday: '' }

    if (!nickname || nickname.length > 20) {
      nextFieldError.nickname = '请输入昵称（不超过20字符）'
    }
    if (!isValidName(name)) {
      nextFieldError.name = '请输入合法姓名'
    }
    if (gender !== '男' && gender !== '女') {
      nextFieldError.gender = '请选择性别'
    }
    if (birthday) {
      if (!isValidIsoDate(birthday)) {
        nextFieldError.birthday = '日期格式应为 yyyy-MM-dd'
      } else if (isFutureIsoDate(birthday)) {
        nextFieldError.birthday = '日期格式应为 yyyy-MM-dd，且不得为未来日期'
      }
    }

    if (Object.values(nextFieldError).some(Boolean)) {
      setFieldError(nextFieldError)
      setIsSaving(false)
      submitLockRef.current = false
      return
    }

    const nowIso = new Date().toISOString()
    const prevProfileVersion = profile?.profileVersion ?? ''
    const nextProfile = {
      ...(profile ?? {}),
      nickname,
      name,
      gender,
      birthday,
      updatedAt: nowIso,
    }

    try {
      writeStoredProfile(nextProfile)
      setProfile(nextProfile)
    } catch {
      setError('保存失败，请稍后重试')
      setIsSaving(false)
      submitLockRef.current = false
      return
    }

    const headers = { 'Content-Type': 'application/json' }
    if (auth?.token) headers.Authorization = `Bearer ${auth.token}`

    try {
      const resp = await fetchWithTimeout(
        '/api/user-center/my-info',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ nickname, name, gender, birthday, profileVersion: prevProfileVersion }),
        },
        8000,
      )

      if (resp.status === 409) {
        setError('信息已被更新，请刷新后重试')
        setIsSaving(false)
        submitLockRef.current = false
        return
      }

      if (!resp.ok) {
        setNotice('已保存，本次同步失败，请稍后重试')
        setShowNicknameHint(true)
        exitEdit()
        setIsSaving(false)
        submitLockRef.current = false
        return
      }

      const nextVersion = resp.headers?.get?.('x-profile-version')
      if (nextVersion) {
        try {
          const updated = { ...nextProfile, profileVersion: String(nextVersion) }
          writeStoredProfile(updated)
          setProfile(updated)
        } catch {
          void 0
        }
      }

      setShowNicknameHint(true)
      exitEdit()
      setIsSaving(false)
      submitLockRef.current = false
      return
    } catch {
      setNotice('已保存，本次同步失败，请稍后重试')
      setShowNicknameHint(true)
      exitEdit()
      setIsSaving(false)
      submitLockRef.current = false
      return
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="my-info" />
        <div className={styles.main}>
          <div className={styles.card}>
            <div className={styles.head}>
              <div className={styles.title}>个人信息设置</div>
              <button type="button" className={styles.collapse} onClick={exitEdit}>
                收起
              </button>
            </div>

            {notice ? <div className={styles.notice}>{notice}</div> : null}
            {error ? (
              <div className={styles.error} role="alert">
                {error}
              </div>
            ) : null}

            {!isEditing ? (
              <div className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.label}>手机</div>
                  <div className={styles.value}>{phoneMasked}</div>
                  <button type="button" className={styles.linkBtn}>
                    修改
                  </button>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>邮箱</div>
                  <div className={styles.value}>{displayValue(profile?.emailStatus ?? '未填写')}</div>
                  <button type="button" className={styles.linkBtn}>
                    验证
                  </button>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>昵称</div>
                  <div className={styles.value}>{displayValue(profile?.nickname)}</div>
                </div>
                {showNicknameHint ? <div className={styles.hintRow}>新昵称将在审核后生效</div> : null}
                <div className={styles.row}>
                  <div className={styles.label}>姓名</div>
                  <div className={styles.value}>{displayValue(profile?.name)}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>性别</div>
                  <div className={styles.value}>{displayValue(profile?.gender)}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>生日</div>
                  <div className={styles.value}>{displayValue(profile?.birthday)}</div>
                </div>

                <div className={styles.footerRow}>
                  <button type="button" className={styles.primaryBtn} onClick={enterEdit}>
                    编辑
                  </button>
                </div>
              </div>
            ) : (
              <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.row}>
                  <label className={styles.label} htmlFor="nickname">
                    昵称
                  </label>
                  <div className={styles.controlCol}>
                    <input
                      id="nickname"
                      value={form.nickname}
                      onChange={(e) => setForm((v) => ({ ...v, nickname: e.target.value }))}
                      required
                      disabled={nicknameDisabled}
                      className={styles.input}
                    />
                    <div className={styles.hint}>新昵称将在审核后生效</div>
                    {nicknameDisabled ? <div className={styles.muted}>审核中</div> : null}
                    {fieldError.nickname ? <div className={styles.fieldError}>{fieldError.nickname}</div> : null}
                  </div>
                </div>

                <div className={styles.row}>
                  <label className={styles.label} htmlFor="name">
                    姓名
                  </label>
                  <div className={styles.controlCol}>
                    <input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
                      required
                      className={styles.input}
                    />
                    {fieldError.name ? <div className={styles.fieldError}>{fieldError.name}</div> : null}
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.label}>性别</div>
                  <div className={styles.controlCol}>
                    <div className={styles.radioRow}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="gender"
                          value="男"
                          checked={form.gender === '男'}
                          onChange={(e) => setForm((v) => ({ ...v, gender: e.target.value }))}
                        />
                        男
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="gender"
                          value="女"
                          checked={form.gender === '女'}
                          onChange={(e) => setForm((v) => ({ ...v, gender: e.target.value }))}
                        />
                        女
                      </label>
                    </div>
                    {fieldError.gender ? <div className={styles.fieldError}>{fieldError.gender}</div> : null}
                  </div>
                </div>

                <div className={styles.row}>
                  <label className={styles.label} htmlFor="birthday">
                    生日
                  </label>
                  <div className={styles.controlCol}>
                    <input
                      id="birthday"
                      value={form.birthday}
                      onChange={(e) => setForm((v) => ({ ...v, birthday: e.target.value }))}
                      placeholder="yyyy-MM-dd"
                      className={styles.input}
                    />
                    {fieldError.birthday ? <div className={styles.fieldError}>{fieldError.birthday}</div> : null}
                  </div>
                </div>

                <div className={styles.footerRow}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    保存
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionTitle}>头像设置</div>
              <button type="button" className={styles.linkBtn} onClick={() => setNotice('头像编辑暂未开放')}>
                编辑
              </button>
            </div>
            <div className={styles.avatarSection}>
              <div className={styles.avatar} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
