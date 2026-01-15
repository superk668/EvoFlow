import styles from './CommonTraveler.module.css'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export default function CommonTraveler() {
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  async function load({ kw }) {
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const qs = new URLSearchParams()
      if (kw) qs.set('keyword', kw)
      const url = `/api/v1/user/common-travelers${qs.toString() ? `?${qs.toString()}` : ''}`
      const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setErrorMessage(String(data?.message || '常用旅客加载失败'))
        setItems([])
        return
      }
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setErrorMessage('常用旅客加载失败')
      setItems([])
    }
  }

  async function deleteSelected() {
    const ids = Array.isArray(selectedIds) ? selectedIds : []
    if (ids.length === 0) return

    setErrorMessage('')
    setSuccessMessage('')

    try {
      for (const travelerId of ids) {
        const res = await fetch(`/api/v1/user/common-travelers/${encodeURIComponent(travelerId)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setErrorMessage(String(data?.message || '删除失败'))
          return
        }
      }

      setItems((prev) => (Array.isArray(prev) ? prev.filter((t) => !ids.includes(String(t?.travelerId || ''))) : []))
      setSelectedIds([])
      setSuccessMessage('常用旅客信息已删除')
    } catch {
      setErrorMessage('删除失败')
    }
  }

  async function deleteById(travelerId) {
    const tid = String(travelerId || '')
    if (!tid) return

    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch(`/api/v1/user/common-travelers/${encodeURIComponent(tid)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setErrorMessage(String(data?.message || '删除失败'))
        return
      }
      setItems((prev) => (Array.isArray(prev) ? prev.filter((t) => String(t?.travelerId || '') !== tid) : []))
      setSelectedIds((prev) => (Array.isArray(prev) ? prev.filter((id) => id !== tid) : []))
      setSuccessMessage('常用旅客信息已删除')
    } catch {
      setErrorMessage('删除失败')
    }
  }

  useEffect(() => {
    let alive = true
    const url = '/api/v1/user/common-travelers'
    const request = typeof fetch === 'function' ? fetch(url, { method: 'GET', headers: getAuthHeaders() }) : null
    Promise.resolve(request)
      .then(async (res) => {
        const data = res?.json ? await res.json().catch(() => null) : null
        return { res, data }
      })
      .then(({ res, data }) => {
        if (!alive) return
        if (!res || !res.ok) {
          setErrorMessage(String(data?.message || '常用旅客加载失败'))
          setItems([])
          return
        }
        setErrorMessage('')
        setItems(Array.isArray(data?.items) ? data.items : [])
      })
      .catch(() => {
        if (!alive) return
        setErrorMessage('常用旅客加载失败')
        setItems([])
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.headRow}>
        <div className={styles.title}>常用旅客信息</div>
        <div className={styles.subtitle}>维护本人及常用同行人信息</div>
      </div>

      <div className={styles.searchBar}>
        <label htmlFor="ct_keyword" style={{ display: 'none' }}>
          查询关键词
        </label>
        <input
          id="ct_keyword"
          className={styles.input}
          aria-label="查询关键词"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="中文名/英文名"
        />
        <button
          type="button"
          className={styles.searchBtn}
          onClick={() => {
            const kw = String(keyword || '').trim()
            if (!kw) {
              setSuccessMessage('')
              setErrorMessage('请输入姓名或手机号')
              return
            }
            load({ kw })
          }}
        >
          查询
        </button>
        <Link className={styles.createLink} to="/user/set-information">
          新增
        </Link>
      </div>

      {successMessage ? <div>{successMessage}</div> : null}
      {errorMessage ? <div>{errorMessage}</div> : null}

      <div className={styles.tableCard}>
        <div className={styles.tableHead}>
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

        {items.length === 0 ? <div className={styles.tableEmpty}>暂无记录</div> : null}

        {items.map((t) => {
          const travelerId = String(t?.travelerId || '')
          const checked = selectedIds.includes(travelerId)
          return (
            <div key={travelerId} className={styles.tableHead}>
              <div className={styles.th}>
                <input
                  type="checkbox"
                  aria-label={`选择旅客 ${travelerId}`}
                  checked={checked}
                  onChange={(e) => {
                    const nextChecked = Boolean(e.target.checked)
                    setSelectedIds((prev) => {
                      const list = Array.isArray(prev) ? prev : []
                      if (nextChecked) return list.includes(travelerId) ? list : [...list, travelerId]
                      return list.filter((id) => id !== travelerId)
                    })
                  }}
                />
              </div>
              <div className={styles.th}>{travelerId}</div>
              <div className={styles.th}>{String(t?.name || '')}</div>
              <div className={styles.th}>{String(t?.phoneNumber || '')}</div>
              <div className={styles.th}>{String(t?.documentType || '')}</div>
              <div className={styles.th}>{String(t?.documentNumberMasked || '')}</div>
              <div className={styles.th}>-</div>
              <div className={styles.th}>-</div>
              <div className={styles.th}>-</div>
              <div className={styles.th}>
                <button
                  type="button"
                  className={styles.deleteLink}
                  onClick={() => deleteById(travelerId)}
                >
                  删除
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.batchRow}>
        <label className={styles.checkRow}>
          <div className={styles.checkbox} />
          <div className={styles.checkText}>全选</div>
        </label>
        <button type="button" className={styles.deleteLink} onClick={deleteSelected}>
          删除
        </button>
      </div>
    </div>
  )
}
