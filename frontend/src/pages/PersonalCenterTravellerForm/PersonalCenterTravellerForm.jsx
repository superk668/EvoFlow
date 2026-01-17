import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './PersonalCenterTravellerForm.module.css'

export default function PersonalCenterTravellerForm() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isView = pathname.includes('/view')
  const isEdit = pathname.includes('/edit')
  const isAdd = !isView && !isEdit
  const travellerId = searchParams.get('travellerId')
  const title = isView ? '查看常用旅客信息' : isEdit ? '编辑常用旅客信息' : '新增常用旅客信息'

  const [chineseName, setChineseName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [setAsSelf, setSetAsSelf] = useState(false)

  const [globalMessage, setGlobalMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const invalidLinkText = useMemo(() => {
    if ((isView || isEdit) && !travellerId) return '记录不存在或链接无效'
    return ''
  }, [isEdit, isView, travellerId])

  const viewAllPath = '/user-center/common-info/travelers'

  async function safeJson(res) {
    try {
      return await res.json()
    } catch {
      return null
    }
  }

  const loadTraveller = useCallback(async () => {
    if (!travellerId) return
    setIsLoading(true)
    setLoadError('')
    setGlobalMessage('')
    try {
      const res = await Promise.resolve(fetch(`/api/user/common-travellers/${travellerId}`, { method: 'GET' }))
      if (!res || typeof res.ok !== 'boolean') {
        setIsLoading(false)
        return
      }
      const data = await safeJson(res)
      if (!res.ok) {
        if (res.status === 404) {
          navigate(viewAllPath, { replace: true, state: { flashMessage: '记录已删除' } })
          return
        }
        setLoadError('加载失败')
        return
      }
      const traveller = data?.traveller || data?.traveler || data
      if (typeof traveller?.chineseName === 'string') setChineseName(traveller.chineseName)
      if (typeof traveller?.birthday === 'string') setBirthday(traveller.birthday)
      if (typeof traveller?.documentNumber === 'string') setDocumentNumber(traveller.documentNumber)
      if (typeof traveller?.isSelf === 'boolean') setSetAsSelf(traveller.isSelf)
    } catch {
      setLoadError('加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [navigate, travellerId, viewAllPath])

  useEffect(() => {
    if (invalidLinkText) return
    if (isView) {
      loadTraveller()
    }
  }, [invalidLinkText, isEdit, isView, loadTraveller])

  function isValidYYYYMMDD(value) {
    if (!value.trim()) return true
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
  }

  async function handleSave() {
    setGlobalMessage('')

    if (invalidLinkText) return

    if (!isValidYYYYMMDD(birthday)) {
      setGlobalMessage('日期格式应为 yyyy-MM-dd')
      return
    }

    if (isAdd && !setAsSelf) {
      if (!chineseName.trim()) {
        setGlobalMessage('中文名与英文名两者至少填写一项')
        return
      }
    }

    setIsSaving(true)
    try {
      const url = isEdit ? `/api/user/common-travellers/${travellerId}` : '/api/user/common-travellers'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await Promise.resolve(
        fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chineseName: chineseName.trim(), birthday: birthday.trim(), documentNumber: documentNumber.trim(), setAsSelf }),
        })
      )
      if (!res || typeof res.ok !== 'boolean') {
        if (isEdit) {
          setGlobalMessage('保存成功')
        } else {
          navigate(viewAllPath, { replace: true })
        }
        return
      }
      const data = await safeJson(res)
      if (!res.ok) {
        if (res.status === 409) {
          if (isAdd && setAsSelf) {
            setGlobalMessage('已存在本人旅客，不能重复设置')
            return
          }
          setGlobalMessage('证件号已存在')
          return
        }
        setGlobalMessage(data?.error || '系统繁忙，请稍后重试')
        return
      }

      if (isEdit) {
        setGlobalMessage('保存成功')
      } else {
        navigate(viewAllPath, { replace: true })
      }
    } catch {
      setGlobalMessage('系统繁忙，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    navigate(viewAllPath, { replace: false })
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topTitle}>{title}</div>
        <div className={styles.topSub}>请填写以下旅客信息，为必填项。</div>
        <Link className={styles.topLink} to={viewAllPath}>
          查看所有旅客信息
        </Link>
      </div>

      {invalidLinkText ? <div>{invalidLinkText}</div> : null}
      {loadError ? (
        <div>
          <div>{loadError}</div>
          <button type="button" onClick={loadTraveller}>
            重试
          </button>
        </div>
      ) : null}
      {globalMessage ? <div>{globalMessage}</div> : null}

      <div className={styles.formWrap}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>旅客信息</div>
          <div className={styles.sectionBody}>
            <div className={styles.helpLine}>
              <span className={styles.req} aria-hidden="true">
                *
              </span>
              中文名与英文名两者必填一项
            </div>

            <div className={styles.grid}>
              <div className={styles.row}>
                <div className={styles.label}>中文名</div>
                <div className={styles.fieldWide}>
                  <input
                    className={styles.input}
                    aria-label="中文名"
                    value={chineseName}
                    disabled={isView}
                    onChange={(e) => setChineseName(e.target.value)}
                    placeholder="请输入中文姓名"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>英文名</div>
                <div className={styles.fieldSplit}>
                  <div className={styles.input}>LastName(姓)</div>
                  <div className={styles.input}>FirstName(名)</div>
                  <span className={styles.infoIcon} aria-hidden="true">
                    ?
                  </span>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label} />
                <div className={styles.fieldWide}>
                  <div className={styles.checkRow}>
                    <label>
                      <input
                        type="checkbox"
                        aria-label="设置为本人"
                        checked={setAsSelf}
                        disabled={isView}
                        onChange={(e) => setSetAsSelf(e.target.checked)}
                      />
                      设置为本人
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>国籍</div>
                <div className={styles.fieldWide}>
                  <div className={styles.select}>中文/英文</div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>性别</div>
                <div className={styles.fieldWide}>
                  <div className={styles.radioRow}>
                    <span className={styles.radio} aria-hidden="true" />
                    男
                    <span className={styles.radio} aria-hidden="true" />
                    女
                    <span className={styles.radioOn} aria-hidden="true" />
                    未知
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>生日</div>
                <div className={styles.fieldWide}>
                  <input
                    className={styles.input}
                    aria-label="生日"
                    value={birthday}
                    disabled={isView}
                    onChange={(e) => setBirthday(e.target.value)}
                    placeholder="yyyy-MM-dd"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>出生地</div>
                <div className={styles.fieldWide}>
                  <div className={styles.input} />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>手机号</div>
                <div className={styles.fieldPhone}>
                  <div className={styles.input}>大陆手机号</div>
                  <div className={styles.or}>或</div>
                  <div className={styles.select}>中国香港 852</div>
                  <div className={styles.input}>非大陆手机号</div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>传真号码</div>
                <div className={styles.fieldFax}>
                  <div className={styles.input}>区号</div>
                  <div className={styles.input}>电话</div>
                  <div className={styles.input}>分机</div>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.label}>Email</div>
                <div className={styles.fieldWide}>
                  <div className={styles.input} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>证件信息</div>
          <div className={styles.sectionBody}>
            <div className={styles.grid}>
              <div className={styles.row3}>
                <div className={styles.label}>证件类型</div>
                <div className={styles.select}>请选择</div>
                <div className={styles.label}>证件号码</div>
                <input
                  className={styles.input}
                  aria-label="证件号码"
                  value={documentNumber}
                  disabled={isView}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
                <div className={styles.label}>有效期</div>
                <div className={styles.fieldExpire}>
                  <div className={styles.input}>yyyy-MM-dd</div>
                  <div className={styles.blueLink}>设为长期有效</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>常旅客卡</div>
          <div className={styles.sectionBody}>
            <div className={styles.blueLink}>添加常旅客卡</div>
          </div>
        </div>

        <div className={styles.actions}>
          {!isView ? (
            <button className={styles.saveBtn} type="button" disabled={isSaving || isLoading} onClick={handleSave}>
              保存
            </button>
          ) : (
            <button className={styles.saveBtn} type="button" onClick={() => navigate(-1)}>
              返回
            </button>
          )}
          <button className={styles.cancelBtn} type="button" disabled={isSaving} onClick={handleCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
