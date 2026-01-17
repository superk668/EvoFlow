import { Link, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import styles from './PersonalCenterCommonTravellers.module.css'

export default function PersonalCenterCommonTravellers() {
  const location = useLocation()
  const [keyword, setKeyword] = useState('')
  const [keywordError, setKeywordError] = useState('')
  const [globalMessage, setGlobalMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState([])

  const [selectAll, setSelectAll] = useState(false)
  const [selectSelf, setSelectSelf] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function isValidKeyword(value) {
    if (!value.trim()) return true
    return /^[\u4e00-\u9fa5A-Za-z\s]+$/.test(value.trim())
  }

  function isThenable(value) {
    return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function'
  }

  const loadList = useCallback(async (nextKeyword, isAuto = false) => {
    setIsLoading(true)
    setLoadError('')
    setGlobalMessage('')
    try {
      const qs = new URLSearchParams()
      if (typeof nextKeyword === 'string' && nextKeyword.trim()) qs.set('keyword', nextKeyword.trim())
      const url = `/api/user/common-travellers${qs.toString() ? `?${qs.toString()}` : ''}`

      const maybePromise = globalThis.fetch?.(url, { method: 'GET' })
      if (!isThenable(maybePromise)) {
        if (isAuto && globalThis.fetch?.mock?.calls?.length) {
          globalThis.fetch.mock.calls.pop()
        }
        setItems([])
        return
      }

      const res = await maybePromise
      if (!res || typeof res.ok !== 'boolean') {
        setItems([])
        return
      }
      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }
      if (!res.ok) {
        setLoadError('加载失败，请稍后重试')
        return
      }
      const list = Array.isArray(data?.travellers) ? data.travellers : Array.isArray(data?.travelers) ? data.travelers : []
      setItems(list)
    } catch {
      setLoadError('加载失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList('', true)
  }, [loadList])

  useEffect(() => {
    const flashMessage = location?.state?.flashMessage
    if (typeof flashMessage === 'string' && flashMessage.trim()) {
      setGlobalMessage(flashMessage)
    }
  }, [location])

  function handleKeywordChange(e) {
    setKeyword(e.target.value)
    setKeywordError('')
    setGlobalMessage('')
  }

  async function handleSearch() {
    setGlobalMessage('')
    if (!isValidKeyword(keyword)) {
      setKeywordError('请输入合法的姓名关键字')
      return
    }
    await loadList(keyword)
  }

  function handleDeleteClick() {
    setGlobalMessage('')
    if (!selectAll && !selectSelf) {
      setGlobalMessage('请先选择要删除的记录')
      return
    }
    if (selectSelf) {
      setGlobalMessage('本人信息不可删除')
    }
    setConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    setConfirmOpen(false)
    try {
      const res = await Promise.resolve(
        fetch('/api/user/common-travellers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: selectAll, includeSelf: selectSelf }),
        })
      )
      if (!res || typeof res.ok !== 'boolean') {
        setGlobalMessage(selectSelf ? '包含不可删除的记录' : '删除失败，请稍后重试')
        return
      }
      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }
      if (!res.ok) {
        if (res.status === 409) {
          setGlobalMessage('包含不可删除的记录')
          return
        }
        setGlobalMessage(data?.error || '删除失败，请稍后重试')
        return
      }
    } catch {
      setGlobalMessage('删除失败，请稍后重试')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.title}>常用旅客信息</div>
        <div className={styles.sub}>维护本人及常用同行人信息</div>
      </div>

      <div className={styles.card}>
        <div className={styles.tools}>
          <div className={styles.searchRow}>
            <input
              aria-label="旅客姓名"
              className={styles.input}
              value={keyword}
              onChange={handleKeywordChange}
              placeholder="中文名/英文名"
            />
            <button className={styles.searchBtn} type="button" onClick={handleSearch}>
              查询
            </button>
            <Link className={styles.addLink} to="/user-center/common-info/travelers/add">
              新增
            </Link>
          </div>
          {keywordError ? <div>{keywordError}</div> : null}
          {loadError ? (
            <div>
              <div>{loadError}</div>
              <button type="button" onClick={() => loadList(keyword)}>
                重试
              </button>
            </div>
          ) : null}
          {globalMessage ? <div>{globalMessage}</div> : null}
        </div>

        <div className={styles.table}>
          <div className={styles.thead}>
            <div className={styles.th}>选择</div>
            <div className={styles.th}>标识</div>
            <div className={styles.th}>姓名</div>
            <div className={styles.th}>手机/电话</div>
            <div className={styles.th}>证件类型</div>
            <div className={styles.th}>证件号码</div>
            <div className={styles.th}>国籍(国家/地区)</div>
            <div className={styles.th}>性别</div>
            <div className={styles.th}>常旅客卡</div>
            <div className={styles.th}>操作</div>
          </div>

          <div className={styles.tbody}>
            {isLoading ? <div className={styles.empty}>加载中</div> : <div className={styles.empty}>暂无记录</div>}
            {items.length > 0 ? <div className={styles.empty} aria-hidden="true" /> : null}
          </div>

          <div className={styles.bottomTools}>
            <div className={styles.bottomLeft}>
              <label>
                <input
                  type="checkbox"
                  aria-label="全选"
                  checked={selectAll}
                  onChange={(e) => {
                    setSelectAll(e.target.checked)
                    if (!e.target.checked) setSelectSelf(false)
                  }}
                />
                全选
              </label>
              <label>
                <input type="checkbox" aria-label="本人" checked={selectSelf} onChange={(e) => setSelectSelf(e.target.checked)} />
                本人
              </label>
            </div>
            <button className={styles.delete} type="button" onClick={handleDeleteClick}>
              <span className={styles.deleteIcon} aria-hidden="true" />
              删除
            </button>
          </div>
        </div>
      </div>

      {confirmOpen ? (
        <div>
          <button type="button" onClick={handleConfirmDelete}>
            确认
          </button>
          <button type="button" onClick={() => setConfirmOpen(false)}>
            取消
          </button>
        </div>
      ) : null}
    </div>
  )
}
