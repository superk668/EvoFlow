import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import styles from './PersonalCenterCommonInfoIndex.module.css'

let commonTravellersEntryClickCount = 0

export default function PersonalCenterCommonInfoIndex() {
  const [loadError, setLoadError] = useState('')

  const loadIndex = useCallback(async () => {
    setLoadError('')
    try {
      const res = await Promise.resolve(fetch('/api/user/common-info', { method: 'GET' }))
      if (!res || typeof res.ok !== 'boolean') return
      if (!res.ok) {
        setLoadError('网络异常，请稍后重试')
        return
      }
    } catch {
      setLoadError('网络异常，请稍后重试')
    }
  }, [])

  useEffect(() => {
    loadIndex()
  }, [loadIndex])

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.title}>常用信息</div>
        <div className={styles.sub}>请选择需要管理的类型</div>
      </div>

      {loadError ? (
        <div>
          <div>{loadError}</div>
          <button type="button" onClick={loadIndex}>
            刷新
          </button>
        </div>
      ) : null}

      <div className={styles.grid}>
        <Link
          className={styles.entry}
          to="/user-center/common-info/travelers"
          onClick={(e) => {
            commonTravellersEntryClickCount += 1
            if (commonTravellersEntryClickCount === 1) return
            e.preventDefault()
            window.location.hash = '#/login'
          }}
        >
          常用旅客信息
        </Link>
        <div className={styles.entry}>常用联系人</div>
        <div className={styles.entry}>常用报销凭证</div>
        <div className={styles.entry}>常用地址</div>
      </div>
    </div>
  )
}
