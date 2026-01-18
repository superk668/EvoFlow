import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './PersonalMyInfo.module.css'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'

const PROFILE_KEY = 'evoflow_user_profile'

function parseQuery(search) {
  try {
    const params = new URLSearchParams(search)
    return Object.fromEntries(params.entries())
  } catch {
    return {}
  }
}

function readProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeProfile(nextProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
}

function isYmd(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))
}

function isNotFutureYmd(s) {
  if (!isYmd(s)) return false
  const d = new Date(`${s}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return String(s) <= todayYmd
}

function isValidName(s) {
  const v = String(s || '').trim()
  if (!v) return false
  if (v.length > 30) return false
  if (/\d/.test(v)) return false
  if (/[^a-zA-Z\u4e00-\u9fa5·\s]/.test(v)) return false
  return true
}

function isValidNickname(s) {
  const v = String(s || '').trim()
  return Boolean(v) && v.length <= 20
}

export default function PersonalMyInfo() {
  const location = useLocation()
  const query = useMemo(() => parseQuery(location.search), [location.search])
  const initialMode = query?.edit === 'true' ? 'edit' : 'view'

  const [mode, setMode] = useState(initialMode)
  const [profile, setProfile] = useState(() => {
    const stored = readProfile() || {}
    return {
      phoneMasked: stored.phoneMasked || '86-138*****3769',
      emailStatus: stored.emailStatus || '未填写',
      nickname: stored.nickname || '未设置',
      nicknameStatus: stored.nicknameStatus || 'normal',
      name: stored.name || '未设置',
      gender: stored.gender || '未设置',
      birthday: stored.birthday || '未设置',
    }
  })

  const [form, setForm] = useState(() => ({
    nickname: profile.nicknameStatus === 'reviewing' ? profile.nickname : profile.nickname === '未设置' ? '' : profile.nickname,
    name: profile.name === '未设置' ? '' : profile.name,
    gender: profile.gender === '未设置' ? '' : profile.gender,
    birthday: profile.birthday === '未设置' ? '' : profile.birthday,
  }))
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedTipVisible, setSavedTipVisible] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  useEffect(() => {
    if (mode !== 'edit') return
    setForm({
      nickname: profile.nicknameStatus === 'reviewing' ? profile.nickname : profile.nickname === '未设置' ? '' : profile.nickname,
      name: profile.name === '未设置' ? '' : profile.name,
      gender: profile.gender === '未设置' ? '' : profile.gender,
      birthday: profile.birthday === '未设置' ? '' : profile.birthday,
    })
    setFieldErrors({})
    setError('')
  }, [mode, profile])

  async function onSave() {
    setError('')
    setSavedTipVisible(false)
    const nextErrors = {}

    if (profile.nicknameStatus !== 'reviewing') {
      if (!isValidNickname(form.nickname)) nextErrors.nickname = '请输入昵称（不超过20字符）'
    }
    if (!isValidName(form.name)) nextErrors.name = '请输入合法姓名'
    if (!form.gender) nextErrors.gender = '请选择性别'
    if (form.birthday) {
      if (!isNotFutureYmd(form.birthday)) nextErrors.birthday = '日期格式应为 yyyy-MM-dd，且不得为未来日期'
    }

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    try {
      const resp = await fetch('/api/user-center/my-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: profile.nicknameStatus === 'reviewing' ? profile.nickname : form.nickname,
          name: form.name,
          gender: form.gender,
          birthday: form.birthday,
        }),
      })

      if (resp?.status === 409) {
        setError('信息已被更新，请刷新后重试')
        return
      }

      if (!resp || resp.status >= 400) {
        setError('保存失败，请稍后重试')
        return
      }

      const nextProfile = {
        ...profile,
        nickname: profile.nicknameStatus === 'reviewing' ? profile.nickname : form.nickname,
        name: form.name,
        gender: form.gender,
        birthday: form.birthday,
        updatedAt: new Date().toISOString(),
      }
      writeProfile(nextProfile)
      setProfile(nextProfile)
      setSavedTipVisible(true)
      setMode('view')
    } catch {
      setError('保存失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  function enterEdit() {
    setMode('edit')
  }

  function collapse() {
    setMode('view')
    setError('')
    setFieldErrors({})
  }

  if (avatarOpen) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <PersonalLeftBar activeKey="my-info" />
          <div className={styles.main}>
            <div>头像编辑入口</div>
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault()
                setAvatarOpen(false)
              }}
            >
              返回
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="my-info" />
        <div className={styles.main}>
          <div className={styles.card}>
            <div className={styles.head}>
              <div className={styles.title}>个人信息设置</div>
              {mode === 'edit' ? (
                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault()
                    collapse()
                  }}
                >
                  收起
                </a>
              ) : null}
            </div>

            {mode === 'view' ? (
              <>
                <div>
                  <div>手机</div>
                  <div>{profile.phoneMasked}</div>
                </div>
                <div>
                  <div>邮箱</div>
                  <div>{profile.emailStatus}</div>
                </div>
                <div>
                  <div>昵称</div>
                  <div>{profile.nickname}</div>
                </div>
                <div>
                  <div>姓名</div>
                  <div>{profile.name}</div>
                </div>
                <div>
                  <div>性别</div>
                  <div>{profile.gender}</div>
                </div>
                <div>
                  <div>生日</div>
                  <div>{profile.birthday}</div>
                </div>
                {savedTipVisible ? <div>新昵称将在审核后生效</div> : null}

                <button type="button" onClick={enterEdit}>
                  编辑
                </button>

                <div>头像设置</div>
                <button type="button" onClick={() => setAvatarOpen(true)}>
                  头像编辑
                </button>
              </>
            ) : (
              <>
                {profile.nicknameStatus === 'reviewing' ? <div>昵称审核中，暂不可修改</div> : null}
                {error ? <div>{error}</div> : null}

                <div>
                  <label htmlFor="myinfo-nickname">昵称</label>
                  <input
                    id="myinfo-nickname"
                    value={form.nickname}
                    disabled={profile.nicknameStatus === 'reviewing'}
                    onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
                  />
                  {fieldErrors.nickname ? <div>{fieldErrors.nickname}</div> : null}
                  <div>新昵称将在审核后生效</div>
                </div>

                <div>
                  <label htmlFor="myinfo-name">姓名</label>
                  <input
                    id="myinfo-name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  {fieldErrors.name ? <div>{fieldErrors.name}</div> : null}
                </div>

                <div>
                  <input
                    id="myinfo-gender-m"
                    type="radio"
                    name="myinfo-gender"
                    aria-label="性别-男"
                    checked={form.gender === '男'}
                    onChange={() => setForm((p) => ({ ...p, gender: '男' }))}
                  />
                  <label htmlFor="myinfo-gender-m">男</label>

                  <input
                    id="myinfo-gender-f"
                    type="radio"
                    name="myinfo-gender"
                    aria-label="性别-女"
                    checked={form.gender === '女'}
                    onChange={() => setForm((p) => ({ ...p, gender: '女' }))}
                  />
                  <label htmlFor="myinfo-gender-f">女</label>
                </div>

                <div>
                  <input
                    placeholder="yyyy-MM-dd"
                    value={form.birthday}
                    onChange={(e) => setForm((p) => ({ ...p, birthday: e.target.value }))}
                  />
                  {fieldErrors.birthday ? <div>{fieldErrors.birthday}</div> : null}
                </div>

                <button type="button" disabled={isSaving} onClick={onSave}>
                  保存
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
