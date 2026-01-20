import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import PersonalCenterNav from '../PersonalCenter/LocalComponents/PersonalCenterNav.jsx'

import styles from './CommonTravelerInfoEdit.module.css'

export default function CommonTravelerInfoEdit() {
  const navigate = useNavigate()
  const [cnName, setCnName] = useState('')
  const [enName, setEnName] = useState('')
  const [phone, setPhone] = useState('')
  const [idType, setIdType] = useState('id')
  const [idNo, setIdNo] = useState('')
  const [nationality, setNationality] = useState('')
  const [gender, setGender] = useState('')
  const [birthday, setBirthday] = useState('')
  const [frequentFlyerNo, setFrequentFlyerNo] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const authHeader = useMemo(() => {
    let token = ''
    try {
      token = localStorage.getItem('auth_token') || ''
    } catch {
      token = ''
    }
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  function isValidPhone(value) {
    return /^1\d{10}$/.test(value)
  }

  function isValidIdNo(value) {
    if (idType === 'passport') return /^[A-Za-z0-9]{5,17}$/.test(value)
    return /^(\d{15}|\d{17}[\dXx])$/.test(value)
  }

  async function handleSave() {
    setError('')
    const nextCnName = cnName.trim()
    const nextPhone = phone.trim()
    const nextIdNo = idNo.trim()

    if (!nextCnName && !nextPhone) {
      setError('请输入姓名/手机号')
      return
    }

    if (nextPhone && !isValidPhone(nextPhone)) {
      setError('请输入正确格式的手机号码')
      return
    }

    if (!nextCnName) {
      setError('请输入姓名/手机号')
      return
    }

    if (!nextIdNo || !isValidIdNo(nextIdNo)) {
      setError('请输入正确格式的证件号')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/user/travelers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          cnName: nextCnName,
          enName: enName.trim(),
          phone: nextPhone,
          idType,
          idNo: nextIdNo,
          nationality: nationality.trim(),
          gender,
          birthday: birthday.trim(),
          frequentFlyerNo: frequentFlyerNo.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || '保存失败')
        return
      }
      navigate('/common-info/travelers', { replace: true, state: { flashMessage: '常用旅客信息已更新' } })
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
            <div className={styles.card}>
              <div className={styles.titleRow}>
                <div className={styles.title}>常用旅客信息</div>
                <div className={styles.subtitle}>维护本人及常用同行人信息</div>
              </div>

              <div className={styles.formWrap}>
                <div className={styles.formTitle}>旅客信息</div>

                <div className={styles.form}>
                  {error ? (
                    <>
                      <div className={styles.hint}>错误</div>
                      <div className={styles.hint}>{String(error)}</div>
                    </>
                  ) : null}
                  <div className={styles.row}>
                    <div className={styles.label}>
                      中文名<span className={styles.required}>*</span>
                    </div>
                    <input className={styles.input} type="text" value={cnName} onChange={(e) => setCnName(e.target.value)} />
                    <div className={styles.hint} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>英文名</div>
                    <input className={styles.input} type="text" value={enName} onChange={(e) => setEnName(e.target.value)} />
                    <div className={styles.hint} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>手机/电话</div>
                    <input className={styles.input} type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    <div className={styles.hint} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>
                      证件类型<span className={styles.required}>*</span>
                    </div>
                    <select className={styles.select} value={idType} onChange={(e) => setIdType(e.target.value)}>
                      <option value="id">身份证</option>
                      <option value="passport">护照</option>
                    </select>
                    <div className={styles.hint} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>
                      证件号<span className={styles.required}>*</span>
                    </div>
                    <input className={styles.input} type="text" value={idNo} onChange={(e) => setIdNo(e.target.value)} />
                    <div className={styles.hint} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>国籍(国家/地区)</div>
                    <input
                      className={styles.input}
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                    />
                    <div className={styles.hint} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>性别</div>
                    <div className={styles.gender}>
                      <label className={styles.genderItem}>
                        <input
                          type="radio"
                          name="traveler_gender"
                          value="male"
                          checked={gender === 'male'}
                          onChange={() => setGender('male')}
                        />
                        男
                      </label>
                      <label className={styles.genderItem}>
                        <input
                          type="radio"
                          name="traveler_gender"
                          value="female"
                          checked={gender === 'female'}
                          onChange={() => setGender('female')}
                        />
                        女
                      </label>
                    </div>
                    <div className={styles.hint} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>生日</div>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="yyyy-mm-dd"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                    <div className={styles.hint} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.label}>常旅客卡</div>
                    <input
                      className={styles.input}
                      type="text"
                      value={frequentFlyerNo}
                      onChange={(e) => setFrequentFlyerNo(e.target.value)}
                    />
                    <div className={styles.hint} />
                  </div>

                  <div className={styles.actions}>
                    <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                      保存
                    </button>
                    <Link className={styles.cancelLink} to="/common-info/travelers">
                      取消
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
