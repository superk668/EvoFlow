import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import PersonalCenterNav from './LocalComponents/PersonalCenterNav.jsx'

import styles from './PersonalCenter.module.css'

export default function PersonalCenter() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [flashMessage, setFlashMessage] = useState('')

  useEffect(() => {
    const state = location.state
    if (state && typeof state === 'object') {
      if (state.profile) setProfile(state.profile)
      if (typeof state.flashMessage === 'string') setFlashMessage(state.flashMessage)
    }
  }, [location.state])

  useEffect(() => {
    let isActive = true
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        let token = ''
        try {
          token = localStorage.getItem('auth_token') || ''
        } catch {
          token = ''
        }
        const requestInit = { method: 'GET' }
        if (token) {
          requestInit.headers = { Authorization: `Bearer ${token}` }
        }
        const res = await fetch('/api/user/profile', requestInit)
        const data = await res.json().catch(() => null)
        if (!isActive) return
        if (!res.ok) {
          setProfile(null)
          setError(data?.error || '加载失败')
          return
        }
        setProfile(data)
        try {
          const raw = localStorage.getItem('auth_user')
          const parsed = raw ? JSON.parse(raw) : {}
          const next = { ...(parsed && typeof parsed === 'object' ? parsed : {}), nickname: data?.nickname || '' }
          localStorage.setItem('auth_user', JSON.stringify(next))
        } catch {
          null
        }
      } catch {
        if (!isActive) return
        setProfile(null)
        setError('网络异常，请稍后重试')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    load()
    return () => {
      isActive = false
    }
  }, [])

  const phoneText = profile?.phoneNumber ? `86-${profile.phoneNumber}` : '未设置'
  const emailText = profile?.email ? profile.email : '未填写'
  const nicknameText = profile?.nickname ? profile.nickname : '未设置'
  const fullNameText = profile?.fullName ? profile.fullName : '未设置'
  const genderText = profile?.gender ? profile.gender : '未设置'
  const birthdayText = profile?.birthday ? profile.birthday : '未设置'

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
                  {flashMessage ? <div className={styles.value}>{flashMessage}</div> : null}
                  {isLoading ? <div>加载中…</div> : null}
                  {error ? <div className={styles.valueMuted}>{String(error)}</div> : null}
                  <div className={styles.row}>
                    <div className={styles.label}>手机</div>
                    <div className={styles.value}>{phoneText}</div>
                    <div className={styles.action}>修改</div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.label}>邮箱</div>
                    <div className={emailText === '未填写' ? styles.valueMuted : styles.value}>{emailText}</div>
                    <div className={styles.action}>验证</div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.label}>昵称</div>
                    <div className={nicknameText === '未设置' ? styles.valueMuted : styles.value}>{nicknameText}</div>
                    <div className={styles.actionEmpty} />
                  </div>
                  <div className={styles.row}>
                    <div className={styles.label}>姓名</div>
                    <div className={fullNameText === '未设置' ? styles.valueMuted : styles.value}>{fullNameText}</div>
                    <div className={styles.actionEmpty} />
                  </div>
                  <div className={styles.row}>
                    <div className={styles.label}>性别</div>
                    <div className={genderText === '未设置' ? styles.valueMuted : styles.value}>{genderText}</div>
                    <div className={styles.actionEmpty} />
                  </div>
                  <div className={styles.row}>
                    <div className={styles.label}>生日</div>
                    <div className={birthdayText === '未设置' ? styles.valueMuted : styles.value}>{birthdayText}</div>
                    <div className={styles.actionEmpty} />
                  </div>

                  <div className={styles.buttonRow}>
                    <Link className={styles.editBtn} to="/personal-center/edit">
                      编辑
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
