import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import PersonalCenterNav from '../PersonalCenter/LocalComponents/PersonalCenterNav.jsx'

import styles from './PersonalCenterEdit.module.css'

export default function PersonalCenterEdit() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [successNickname, setSuccessNickname] = useState('')

  const touchedRef = useRef(false)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [fullName, setFullName] = useState('')
  const [gender, setGender] = useState('')
  const [birthday, setBirthday] = useState('')

  const authHeader = useMemo(() => {
    let token = ''
    try {
      token = localStorage.getItem('auth_token') || ''
    } catch {
      token = ''
    }
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  useEffect(() => {
    let isActive = true
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const res = await fetch('/api/user/profile', { method: 'GET', headers: authHeader })
        const data = await res.json().catch(() => null)
        if (!isActive) return
        if (!res.ok) {
          setError(data?.error || '加载失败')
          return
        }
        setPhoneNumber(data?.phoneNumber || '')
        setEmail(data?.email || '')
        if (!touchedRef.current) {
          setNickname(data?.nickname || '')
          setFullName(data?.fullName || '')
          setGender(data?.gender || '')
          setBirthday(data?.birthday || '')
        }
      } catch {
        if (!isActive) return
        setError('网络异常，请稍后重试')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    load()
    return () => {
      isActive = false
    }
  }, [authHeader])

  function isValidBirthday(value) {
    if (!value) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const d = new Date(`${value}T00:00:00.000Z`)
    if (Number.isNaN(d.getTime())) return false
    return d.toISOString().slice(0, 10) === value
  }

  async function handleSave() {
    setError('')
    setFieldError('')
    setSuccessMessage('')
    setSuccessNickname('')
    const nextNickname = nickname.trim()
    const nextFullName = fullName.trim()
    if (!nextNickname || !nextFullName || !gender) {
      setFieldError('请完整填写必填项')
      return
    }
    if (!isValidBirthday(birthday.trim())) {
      setFieldError('生日格式不正确')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          nickname: nextNickname,
          fullName: nextFullName,
          gender,
          birthday: birthday.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || '保存失败')
        return
      }
      const updatedProfile = data?.profile || null
      setSuccessMessage(data?.message || '个人信息已更新')
      setSuccessNickname(updatedProfile?.nickname || nextNickname)
      if (updatedProfile) {
        try {
          const raw = localStorage.getItem('auth_user')
          const parsed = raw ? JSON.parse(raw) : {}
          const next = { ...(parsed && typeof parsed === 'object' ? parsed : {}), nickname: updatedProfile.nickname || '' }
          localStorage.setItem('auth_user', JSON.stringify(next))
        } catch {
          null
        }
        setPhoneNumber(updatedProfile.phoneNumber || '')
        setEmail(updatedProfile.email || '')
        setNickname(updatedProfile.nickname || '')
        setFullName(updatedProfile.fullName || '')
        setGender(updatedProfile.gender || '')
        setBirthday(updatedProfile.birthday || '')
      }
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showHomeInAuthed showSearch={false} />

      <div className={styles.body}>
        <div className={styles.container}>
          <PersonalCenterNav />

          <main className={styles.main}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>个人信息设置</div>
                <div className={styles.headerRight}>
                  <span className={styles.headerLink}>收起</span>
                  <span className={styles.headerBtn} aria-hidden>
                    <span className={styles.headerMinus} />
                  </span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.form}>
                  {isLoading ? <div>加载中…</div> : null}
                  {fieldError ? <div className={styles.valueMuted}>{fieldError}</div> : null}
                  {error ? <div className={styles.valueMuted}>{String(error)}</div> : null}
                  {successMessage ? <div className={styles.valueMuted}>{successMessage}</div> : null}
                  {successNickname ? <div className={styles.valueMuted}>{successNickname}</div> : null}
                  <div className={styles.row}>
                    <div className={styles.label}>手机</div>
                    <div className={styles.value}>{phoneNumber ? `86-${phoneNumber}` : '未设置'}</div>
                    <a className={styles.action} href="#">
                      修改
                    </a>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>邮箱</div>
                    <div className={email ? styles.value : styles.valueMuted}>{email || '未填写'}</div>
                    <a className={styles.action} href="#">
                      验证
                    </a>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>
                      昵称<span className={styles.required}>*</span>
                    </div>
                    <input
                      className={styles.input}
                      type="text"
                      value={nickname}
                      onFocus={() => {
                        touchedRef.current = true
                      }}
                      onChange={(e) => {
                        touchedRef.current = true
                        setNickname(e.target.value)
                      }}
                    />
                    <div />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>
                      姓名<span className={styles.required}>*</span>
                    </div>
                    <input
                      className={styles.input}
                      type="text"
                      value={fullName}
                      onFocus={() => {
                        touchedRef.current = true
                      }}
                      onChange={(e) => {
                        touchedRef.current = true
                        setFullName(e.target.value)
                      }}
                    />
                    <div />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>
                      性别<span className={styles.required}>*</span>
                    </div>

                    <div className={styles.gender}>
                      <label className={styles.genderItem}>
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={gender === 'male'}
                          onFocus={() => {
                            touchedRef.current = true
                          }}
                          onChange={() => {
                            touchedRef.current = true
                            setGender('male')
                          }}
                        />
                        男
                      </label>
                      <label className={styles.genderItem}>
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={gender === 'female'}
                          onFocus={() => {
                            touchedRef.current = true
                          }}
                          onChange={() => {
                            touchedRef.current = true
                            setGender('female')
                          }}
                        />
                        女
                      </label>
                    </div>
                    <div />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>生日</div>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="yyyy-mm-dd"
                      value={birthday}
                      onFocus={() => {
                        touchedRef.current = true
                      }}
                      onChange={(e) => {
                        touchedRef.current = true
                        setBirthday(e.target.value)
                      }}
                    />
                    <div />
                  </div>

                  <div className={styles.saveRow}>
                    <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                      保存
                    </button>
                    <div className={styles.tip}>
                      <span className={styles.tipIcon} aria-hidden>
                        i
                      </span>
                      <span className={styles.tipText}>新昵称将在审核后生效</span>
                    </div>
                  </div>

                  <div className={styles.backRow}>
                    <Link className={styles.back} to="/personal-center">
                      返回
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.cardCompact}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>头像设置</div>
                <div className={styles.headerRight}>
                  <span className={styles.headerLink}>编辑</span>
                  <span className={styles.headerBtn} aria-hidden>
                    <span className={styles.headerPlus} />
                  </span>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
