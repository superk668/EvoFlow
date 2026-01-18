import { Link } from 'react-router-dom'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'

export default function CommonInfoIndex() {
  return (
    <div>
      <PersonalLeftBar activeKey="common" />
      <h1>常用信息</h1>
      <div>
        <Link to="/user-center/common-info/travelers">常用旅客信息</Link>
      </div>
      <div>
        <button type="button">常用联系人</button>
      </div>
      <div>
        <button type="button">常用报销凭证</button>
      </div>
      <div>
        <button type="button">常用地址</button>
      </div>
    </div>
  )
}

