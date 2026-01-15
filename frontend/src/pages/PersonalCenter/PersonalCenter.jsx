import styles from './PersonalCenter.module.css'

import { useEffect, useState } from 'react'

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export default function PersonalCenter() {
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [phoneDraft, setPhoneDraft] = useState('')
  const [emailDraft, setEmailDraft] = useState('')
  const [genderDraft, setGenderDraft] = useState('未知')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/v1/user/profile', { method: 'GET', headers: getAuthHeaders() })
        const data = await res.json().catch(() => null)
        if (!alive) return
        if (!res.ok) {
          setErrorMessage(String(data?.message || '个人信息加载失败'))
          return
        }
        setProfile(data?.profile || null)
        setNameDraft(String(data?.profile?.name || ''))
        setPhoneDraft(String(data?.profile?.phoneNumber || ''))
        setEmailDraft(String(data?.profile?.email || ''))
        setGenderDraft(String(data?.profile?.gender || '未知'))
      } catch {
        if (!alive) return
        setErrorMessage('个人信息加载失败')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  async function save() {
    setMessage('')
    setErrorMessage('')

    const nextName = String(nameDraft || '').trim()
    const nextPhone = String(phoneDraft || '').trim()
    const nextEmail = String(emailDraft || '').trim()
    const nextGender = String(genderDraft || '').trim()

    const phoneOk = /^1\d{10}$/.test(nextPhone)
    const emailOk = !nextEmail || /.+@.+\..+/.test(nextEmail)
    const genderOk = ['男', '女', '未知'].includes(nextGender)

    if (!nextName || !phoneOk || !emailOk || !genderOk) {
      setErrorMessage('请输入正确的个人信息')
      return
    }

    try {
      const res = await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: nextName,
          phoneNumber: nextPhone,
          email: nextEmail,
          gender: nextGender,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setErrorMessage(String(data?.message || '保存失败'))
        return
      }
      setMessage(String(data?.message || '个人信息已更新'))
      if (data?.profile) {
        setProfile({
          ...profile,
          ...data.profile,
        })
      } else {
        setProfile({
          ...profile,
          name: nextName,
          phoneNumber: nextPhone,
          email: nextEmail,
          gender: nextGender,
        })
      }
      setIsEditing(false)
    } catch {
      setErrorMessage('保存失败')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>个人信息设置</div>
          <div className={styles.collapse}>
            <div className={styles.collapseText}>收起</div>
            <div className={styles.collapseIcon} />
          </div>
        </div>

        <div className={styles.form}>
          {message ? <div>{message}</div> : null}
          {errorMessage ? <div>{errorMessage}</div> : null}
          <div className={styles.row}>
            <div className={styles.label}>手机</div>
            <div className={styles.valueCol}>
              {isEditing ? (
                <div className={styles.valueOnly}>
                  <label htmlFor="pc_phone" style={{ display: 'none' }}>
                    手机
                  </label>
                  <input
                    id="pc_phone"
                    aria-label="手机"
                    value={phoneDraft}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.value}>{String(profile?.phoneNumber || '')}</div>
                  <div className={styles.action}>修改</div>
                </>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>邮箱</div>
            <div className={styles.valueCol}>
              {isEditing ? (
                <div className={styles.valueOnly}>
                  <label htmlFor="pc_email" style={{ display: 'none' }}>
                    邮箱
                  </label>
                  <input
                    id="pc_email"
                    aria-label="邮箱"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.valueMuted}>{String(profile?.email || '') || '未填写'}</div>
                  <div className={styles.action}>验证</div>
                </>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>昵称</div>
            <div className={styles.valueOnly}>-</div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>姓名</div>
            {isEditing ? (
              <div className={styles.valueOnly}>
                <label htmlFor="pc_name" style={{ display: 'none' }}>
                  姓名
                </label>
                <input
                  id="pc_name"
                  aria-label="姓名"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                />
              </div>
            ) : (
              <div className={styles.valueOnly}>{String(profile?.name || '')}</div>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.label}>性别</div>
            {isEditing ? (
              <div className={styles.valueOnly}>
                <label>
                  <input
                    type="radio"
                    name="pc_gender"
                    value="男"
                    checked={genderDraft === '男'}
                    onChange={(e) => setGenderDraft(e.target.value)}
                  />
                  男
                </label>
                <label>
                  <input
                    type="radio"
                    name="pc_gender"
                    value="女"
                    checked={genderDraft === '女'}
                    onChange={(e) => setGenderDraft(e.target.value)}
                  />
                  女
                </label>
                <label>
                  <input
                    type="radio"
                    name="pc_gender"
                    value="未知"
                    checked={genderDraft === '未知'}
                    onChange={(e) => setGenderDraft(e.target.value)}
                  />
                  未知
                </label>
              </div>
            ) : (
              <div className={styles.valueOnly}>{String(profile?.gender || '未知')}</div>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.label}>生日</div>
            <div className={styles.valueOnlyMuted}>未设置</div>
          </div>

          <div className={styles.btnRow}>
            {isEditing ? (
              <button type="button" className={styles.editBtn} onClick={save}>
                保存
              </button>
            ) : (
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => {
                  setMessage('')
                  setErrorMessage('')
                  setNameDraft(String(profile?.name || ''))
                  setPhoneDraft(String(profile?.phoneNumber || ''))
                  setEmailDraft(String(profile?.email || ''))
                  setGenderDraft(String(profile?.gender || '未知'))
                  setIsEditing(true)
                }}
              >
                编辑
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.sectionRow}>
        <div className={styles.sectionTitle}>头像设置</div>
        <div className={styles.sectionRight}>
          <div className={styles.sectionAction}>修改</div>
          <div className={styles.sectionPlus} />
        </div>
      </div>
    </div>
  )
}
