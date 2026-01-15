import styles from './SetInformation.module.css'

import { useState } from 'react'
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

export default function SetInformation() {
  const [cnName, setCnName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('+86')
  const [countryRegion, setCountryRegion] = useState('CN')
  const [documentType, setDocumentType] = useState('choose')
  const [documentNumber, setDocumentNumber] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function isValidPhone({ prefix, phone }) {
    const s = String(phone || '').trim()
    const p = String(prefix || '').trim()
    if (p === '+86') return /^1\d{10}$/.test(s)
    return /^\d{6,15}$/.test(s)
  }

  function isValidDocument({ docType, docNo }) {
    const t = String(docType || '').trim()
    const s = String(docNo || '').trim()
    if (!t || t === 'choose') return false
    if (t === '身份证') return /^\d{17}(\d|X|x)$/.test(s)
    if (t === '护照') return /^[A-Za-z0-9]{5,17}$/.test(s)
    return /^[A-Za-z0-9]{5,20}$/.test(s)
  }

  async function save() {
    setMessage('')
    setErrorMessage('')

    const name = String(cnName || '').trim()
    const phone = String(phoneNumber || '').trim()
    const docType = String(documentType || '').trim()
    const docNo = String(documentNumber || '').trim()

    if (!name || !phone) {
      setErrorMessage('请输入正确的常用旅客相关信息')
      return
    }
    if (!isValidPhone({ prefix: phonePrefix, phone })) {
      setErrorMessage('请输入正确格式的手机号码')
      return
    }
    if (!isValidDocument({ docType, docNo })) {
      setErrorMessage(docType && docType !== 'choose' ? '请输入正确格式的证件号' : '请输入正确的常用旅客相关信息')
      return
    }

    try {
      const res = await fetch('/api/v1/user/common-travelers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name, phoneNumber: phone, documentType: docType, documentNumber: docNo }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setErrorMessage(String(data?.message || '保存失败'))
        return
      }
      setMessage(String(data?.message || '常用旅客信息已更新'))
    } catch {
      setErrorMessage('保存失败')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div className={styles.topLeft}>
          <div className={styles.topTitle}>新增常用旅客信息</div>
          <div className={styles.topDesc}>请填写如下常用旅客信息，*为必选项</div>
        </div>
        <Link className={styles.topLink} to="/user/common-traveler">
          查看所有旅客信息
        </Link>
      </div>

      <div className={styles.panel}>
        {message ? <div>{message}</div> : null}
        {errorMessage ? <div>{errorMessage}</div> : null}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>旅客信息</div>
          <div className={styles.sectionBody}>
            <div className={styles.note}>*中文名与英文名两者必填一项</div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <div className={styles.label}>中文名</div>
                <input
                  className={styles.input}
                  placeholder="请输入中文姓名"
                  value={cnName}
                  onChange={(e) => setCnName(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>英文名</div>
                <div className={styles.inlineInputs}>
                  <input className={styles.inputSm} placeholder="LastName(姓)" />
                  <input className={styles.inputSm} placeholder="FirstName(名)" />
                  <div className={styles.helpIcon} />
                </div>
                <label className={styles.checkInline}>
                  <input type="checkbox" />
                  <span>设置为本人</span>
                </label>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="si_country_region">
                  国籍(国家/地区)
                </label>
                <div className={styles.selectWrap}>
                  <select
                    id="si_country_region"
                    className={styles.select}
                    value={countryRegion}
                    onChange={(e) => setCountryRegion(e.target.value)}
                  >
                    <option value="CN">中国大陆</option>
                    <option value="HK">中国香港</option>
                    <option value="MO">中国澳门</option>
                    <option value="TW">中国台湾</option>
                    <option value="US">美国</option>
                    <option value="GB">英国</option>
                    <option value="JP">日本</option>
                    <option value="KR">韩国</option>
                  </select>
                  <div className={styles.selectArrow} />
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>性别</div>
                <div className={styles.radios}>
                  <label className={styles.radio}>
                    <input type="radio" name="gender" />
                    <span>男</span>
                  </label>
                  <label className={styles.radio}>
                    <input type="radio" name="gender" />
                    <span>女</span>
                  </label>
                  <label className={styles.radio}>
                    <input type="radio" name="gender" defaultChecked />
                    <span>未知</span>
                  </label>
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>生日</div>
                <input className={styles.input} placeholder="yyyy-MM-dd" />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>出生地</div>
                <input className={styles.input} />
              </div>

              <div className={`${styles.field} ${styles.phoneRow}`}>
                <div className={styles.label}>手机号码</div>
                <div className={styles.phoneInline}>
                  <div className={styles.selectWrap}>
                    <label htmlFor="si_phone_prefix" style={{ display: 'none' }}>
                      手机号码前缀（国家码）
                    </label>
                    <select
                      id="si_phone_prefix"
                      className={styles.select}
                      aria-label="手机号码前缀（国家码）"
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                    >
                      <option value="+86">中国大陆 +86</option>
                      <option value="+852">中国香港 +852</option>
                      <option value="+853">中国澳门 +853</option>
                      <option value="+886">中国台湾 +886</option>
                      <option value="+1">美国 +1</option>
                      <option value="+44">英国 +44</option>
                      <option value="+81">日本 +81</option>
                      <option value="+82">韩国 +82</option>
                    </select>
                    <div className={styles.selectArrow} />
                  </div>
                  <div className={styles.phoneSep}>或</div>
                  <input
                    className={styles.inputPhone}
                    placeholder="大陆手机"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <input className={styles.inputPhone} placeholder="非大陆手机" />
                </div>
              </div>

              <div className={`${styles.field} ${styles.faxRow}`}>
                <div className={styles.label}>传真号码</div>
                <div className={styles.faxInline}>
                  <input className={styles.inputXs} placeholder="区号" />
                  <input className={styles.inputFax} placeholder="电话" />
                  <input className={styles.inputXs} placeholder="分机" />
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>Email</div>
                <input className={styles.input} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>证件信息</div>
          <div className={styles.sectionBody}>
            <div className={styles.idGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="si_doc_type">
                  证件类型
                </label>
                <div className={styles.selectWrap}>
                  <select
                    id="si_doc_type"
                    className={styles.select}
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                  >
                    <option value="choose">请选择</option>
                    <option value="身份证">身份证</option>
                    <option value="护照">护照</option>
                    <option value="港澳居民来往内地通行证">港澳居民来往内地通行证</option>
                    <option value="台湾居民来往大陆通行证">台湾居民来往大陆通行证</option>
                  </select>
                  <div className={styles.selectArrow} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="si_doc_number">
                  证件号码
                </label>
                <input
                  id="si_doc_number"
                  className={styles.input}
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>有效期</div>
                <div className={styles.validInline}>
                  <input className={styles.input} placeholder="yyyy-MM-dd" />
                  <div className={styles.validLink}>设为长期有效</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>常旅客卡</div>
          <div className={styles.sectionBody}>
            <div className={styles.addCardRow}>
              <div className={styles.addCardIcon} />
              <div className={styles.addCardText}>添加常旅客卡</div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.saveBtn} onClick={save}>
            保存
          </button>
          <button type="button" className={styles.cancelBtn}>
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
