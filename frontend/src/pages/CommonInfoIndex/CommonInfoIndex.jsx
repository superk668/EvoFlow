import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'
import styles from './CommonInfoIndex.module.css'

export default function CommonInfoIndex() {
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function loadIndex() {
    setIsLoading(true)
    setLoadError('')
    try {
      const resp = await fetch('/api/user-center/common-info/index')
      if (!resp.ok) throw new Error('bad status')
    } catch {
      setLoadError('网络异常，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadIndex()
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="common" />
        <div className={styles.main}>
          <div className={styles.panel}>
            <div className={styles.title}>常用信息</div>
            <div className={styles.hint}>请选择需要管理的类型</div>

            {loadError ? (
              <div>
                <div>{loadError}</div>
                <button type="button" onClick={loadIndex} disabled={isLoading}>
                  刷新
                </button>
              </div>
            ) : null}

            <div className={styles.grid}>
              <Link className={styles.entry} to="/user-center/common-info/travelers">
                进入旅客信息
              </Link>
              <button type="button" className={styles.entry}>
                常用联系人
              </button>
              <button type="button" className={styles.entry}>
                常用报销凭证
              </button>
              <button type="button" className={styles.entry}>
                常用地址
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
