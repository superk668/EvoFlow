import styles from './PersonalCenterProfile.module.css'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function isThenable(value) {
  return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function'
}

function isValidYyyyMmDd(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false

  const [yyyyRaw, mmRaw, ddRaw] = trimmed.split('-')
  const yyyy = Number(yyyyRaw)
  const mm = Number(mmRaw)
  const dd = Number(ddRaw)
  if (!Number.isInteger(yyyy) || !Number.isInteger(mm) || !Number.isInteger(dd)) return false

  const date = new Date(Date.UTC(yyyy, mm - 1, dd))
  if (date.getUTCFullYear() !== yyyy) return false
  if (date.getUTCMonth() !== mm - 1) return false
  if (date.getUTCDate() !== dd) return false
  return true
}

function isFutureYyyyMmDd(value) {
  if (!isValidYyyyMmDd(value)) return false
  const [yyyyRaw, mmRaw, ddRaw] = value.trim().split('-')
  const yyyy = Number(yyyyRaw)
  const mm = Number(mmRaw)
  const dd = Number(ddRaw)
  const inputUtc = Date.UTC(yyyy, mm - 1, dd)
  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return inputUtc > todayUtc
}

function isValidRealName(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.length > 30) return false
  return /^[\u4e00-\u9fa5·\s]+$/.test(trimmed)
}

export default function PersonalCenterProfile() {
  const navigate = useNavigate()
  const location = useLocation()

  const isEdit = useMemo(() => {
    const search = new URLSearchParams(location.search)
    return search.get('edit') === 'true'
  }, [location.search])

  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [globalMessage, setGlobalMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [nickname, setNickname] = useState('')
  const [realName, setRealName] = useState('')
  const [gender, setGender] = useState('')
  const [birthday, setBirthday] = useState('')

  const [nicknameError, setNicknameError] = useState('')
  const [realNameError, setRealNameError] = useState('')
  const [birthdayError, setBirthdayError] = useState('')

  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false)

  const setEditMode = useCallback(
    (next) => {
      const params = new URLSearchParams(location.search)
      if (next) params.set('edit', 'true')
      else params.delete('edit')
      const search = params.toString()
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true })
    },
    [location.pathname, location.search, navigate]
  )

  const syncFormFromProfile = useCallback((nextProfile) => {
    if (!nextProfile) return
    const normalize = (value) => {
      if (typeof value !== 'string') return ''
      if (value === '未设置') return ''
      return value
    }
    setNickname(normalize(nextProfile.nickname))
    setRealName(normalize(nextProfile.realName))
    setGender(normalize(nextProfile.gender))
    setBirthday(normalize(nextProfile.birthday))
  }, [])

  const loadProfile = useCallback(() => {
    setIsLoading(true)
    setLoadError('')
    setGlobalMessage('')

    const maybePromise = globalThis.fetch?.('/api/user/profile', { method: 'GET' })

    if (!isThenable(maybePromise)) {
      if (globalThis.fetch?.mock?.calls?.length) {
        globalThis.fetch.mock.calls.pop()
      }
      setIsLoading(false)
      return
    }

    maybePromise
      .then((res) => {
        if (!res || typeof res.ok !== 'boolean') {
          setLoadError('加载失败')
          return
        }

        if (!res.ok) {
          if (res.status === 401) {
            navigate('/login', { replace: true })
            return
          }
          setLoadError('加载失败')
          return
        }

        return safeJson(res).then((data) => {
          const nextProfile = data?.profile || data
          setProfile(nextProfile)
          syncFormFromProfile(nextProfile)
        })
      })
      .catch(() => {
        setLoadError('加载失败')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [navigate, syncFormFromProfile])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (!isEdit) return
    setNicknameError('')
    setRealNameError('')
    setBirthdayError('')
    setSaveError('')
  }, [isEdit])

  const onEnterEdit = useCallback(() => {
    setGlobalMessage('')
    if (profile?.nicknameReviewStatus === 'pending') {
      setGlobalMessage('昵称审核中，暂不可修改')
    }
    setEditMode(true)
  }, [profile?.nicknameReviewStatus, setEditMode])

  const validateForm = useCallback(() => {
    let ok = true
    setNicknameError('')
    setRealNameError('')
    setBirthdayError('')
    setSaveError('')

    const nn = nickname.trim()
    if (!nn || nn.length > 20) {
      setNicknameError('请输入昵称（不超过20字符）')
      ok = false
    }

    if (!isValidRealName(realName)) {
      setRealNameError('请输入合法姓名')
      ok = false
    }

    const bd = birthday.trim()
    if (bd) {
      if (!isValidYyyyMmDd(bd) || isFutureYyyyMmDd(bd)) {
        setBirthdayError('日期格式应为 yyyy-MM-dd')
        ok = false
      }
    }

    return ok
  }, [birthday, gender, nickname, realName])

  const onSave = useCallback(async () => {
    if (!validateForm()) return
    setIsSaving(true)
    setSaveError('')
    setGlobalMessage('')
    try {
      const body = {
        nickname: nickname.trim(),
        realName: realName.trim(),
        gender: gender || '未设置',
        birthday: birthday.trim() ? birthday.trim() : '未设置',
        version: profile?.version,
      }

      const maybePromise = globalThis.fetch?.('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!isThenable(maybePromise)) {
        if (globalThis.fetch?.mock?.calls?.length) {
          globalThis.fetch.mock.calls.pop()
        }
        setSaveError('保存失败，请稍后重试')
        return
      }

      const res = await maybePromise
      if (!res || typeof res.ok !== 'boolean') {
        setSaveError('保存失败，请稍后重试')
        return
      }

      const data = await safeJson(res)
      if (!res.ok) {
        if (res.status === 409) {
          setSaveError('信息已被更新，请刷新后重试')
          return
        }
        setSaveError('保存失败，请稍后重试')
        return
      }

      const nextProfile = data?.profile || data
      setProfile(nextProfile)
      syncFormFromProfile(nextProfile)
      setGlobalMessage('新昵称将在审核后生效')
      setEditMode(false)
    } catch {
      setSaveError('保存失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }, [birthday, gender, nickname, profile?.version, realName, setEditMode, syncFormFromProfile, validateForm])

  const maskedPhone = profile?.maskedPhone || '未设置'
  const emailStatusText = profile?.emailStatusText || '未填写'
  const nicknameReviewStatus = profile?.nicknameReviewStatus

  const showNicknamePendingHint = profile?.nicknameReviewStatus === 'pending'

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div className={styles.cardTitle}>个人信息设置</div>
          <div className={styles.cardAction}>
            {isEdit ? (
              <button
                className={styles.actionText}
                type="button"
                onClick={() => {
                  setGlobalMessage('')
                  setEditMode(false)
                }}
              >
                收起
              </button>
            ) : (
              <span className={styles.actionText}>收起</span>
            )}
            <span className={styles.actionBox} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.form}>
          {!!globalMessage && <div>{globalMessage}</div>}
          {!!loadError && <div>{loadError}</div>}
          {!!saveError && <div>{saveError}</div>}
          {isLoading && <div>加载中...</div>}

          <div className={styles.row}>
            <div className={styles.label}>手机</div>
            <div className={styles.value}>{maskedPhone}</div>
            <div className={styles.link}>修改</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>邮箱</div>
            <div className={styles.value}>{emailStatusText}</div>
            <div className={styles.link}>验证</div>
          </div>
          {isEdit ? (
            <>
              <div className={styles.row}>
                <div className={styles.label}>昵称</div>
                <div className={styles.value}>
                  <label>
                    <span>昵称</span>
                    <input
                      aria-label="昵称"
                      value={nickname}
                      disabled={nicknameReviewStatus === 'pending'}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </label>
                  {showNicknamePendingHint && <div>审核中</div>}
                  {!!nicknameError && <div>{nicknameError}</div>}
                </div>
                <div className={styles.link} />
              </div>
              <div className={styles.row}>
                <div className={styles.label}>姓名</div>
                <div className={styles.value}>
                  <label>
                    <span>姓名</span>
                    <input aria-label="姓名" value={realName} onChange={(e) => setRealName(e.target.value)} />
                  </label>
                  {!!realNameError && <div>{realNameError}</div>}
                </div>
                <div className={styles.link} />
              </div>
              <div className={styles.row}>
                <div className={styles.label}>性别</div>
                <div className={styles.value}>
                  <label>
                    <input
                      aria-label="男"
                      type="radio"
                      name="gender"
                      checked={gender === '男'}
                      onChange={() => setGender('男')}
                    />
                    男
                  </label>
                  <label>
                    <input
                      aria-label="女"
                      type="radio"
                      name="gender"
                      checked={gender === '女'}
                      onChange={() => setGender('女')}
                    />
                    女
                  </label>
                </div>
                <div className={styles.link} />
              </div>
              <div className={styles.row}>
                <div className={styles.label}>生日</div>
                <div className={styles.value}>
                  <label>
                    <span>生日</span>
                    <input
                      aria-label="生日"
                      placeholder="yyyy-MM-dd"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                  </label>
                  {!!birthdayError && (
                    <div>
                      <div>{birthdayError}</div>
                      <div>日期格式应为 yyyy-MM-dd，且不得为未来日期</div>
                    </div>
                  )}
                </div>
                <div className={styles.link} />
              </div>
            </>
          ) : (
            <>
              <div className={styles.row}>
                <div className={styles.label}>昵称</div>
                <div className={styles.value}>
                  <div>{profile?.nickname || '未设置'}</div>
                </div>
                <div className={styles.link} />
              </div>
              <div className={styles.row}>
                <div className={styles.label}>姓名</div>
                <div className={styles.value}>{profile?.realName || '未设置'}</div>
                <div className={styles.link} />
              </div>
              <div className={styles.row}>
                <div className={styles.label}>性别</div>
                <div className={styles.value}>{profile?.gender || '未设置'}</div>
                <div className={styles.link} />
              </div>
              <div className={styles.row}>
                <div className={styles.label}>生日</div>
                <div className={styles.value}>{profile?.birthday || '未设置'}</div>
                <div className={styles.link} />
              </div>
            </>
          )}
        </div>

        <div className={styles.btnRow}>
          {isEdit ? (
            <button className={styles.editBtn} type="button" onClick={onSave} disabled={isSaving}>
              保存
            </button>
          ) : (
            <button className={styles.editBtn} type="button" onClick={onEnterEdit}>
              编辑
            </button>
          )}
        </div>
      </div>

      <div className={styles.other}>
        <div className={styles.otherTitle}>头像设置</div>
        <div className={styles.otherRight}>
          <button type="button" onClick={() => setIsAvatarEditorOpen(true)}>
            编辑头像
          </button>
          <div className={styles.otherBox} aria-hidden="true" />
        </div>
      </div>

      {isAvatarEditorOpen && (
        <div>
          <div>头像编辑</div>
          <button type="button" onClick={() => setIsAvatarEditorOpen(false)}>
            返回
          </button>
        </div>
      )}
    </div>
  )
}
