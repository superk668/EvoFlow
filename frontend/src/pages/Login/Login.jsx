import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './Login.module.css'

const thirdParty = [
  { name: '微信', colorClass: styles.tpGreen },
  { name: 'QQ', colorClass: styles.tpBlue },
  { name: '微博', colorClass: styles.tpOrange },
  { name: '支付宝', colorClass: styles.tpCyan },
  { name: 'Apple', colorClass: styles.tpBlack },
]

export default function Login() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.art}>
            <PlaceholderImage name="登录页插画" width={520} height={210} className={styles.artImg} />
          </div>

          <div className={styles.panelWrap}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>账号密码登录</div>
                <div className={styles.panelRight}>手机号查单&gt;</div>
              </div>

              <div className={styles.form}>
                <input className={styles.input} placeholder="国内手机号/用户名/邮箱/卡号" />
                <div className={styles.row2}>
                  <input className={styles.input} placeholder="登录密码" />
                  <div className={styles.forgot}>忘记密码</div>
                </div>

                <button className={styles.loginBtn} type="button">
                  登 录
                </button>

                <div className={styles.agreeRow}>
                  <div className={styles.radio} aria-hidden="true" />
                  <div className={styles.agreeText}>
                    阅读并同意携程的 <span className={styles.link}>服务协议</span> 和{' '}
                    <span className={styles.link}>个人信息保护政策</span>
                  </div>
                </div>

                <div className={styles.bottomLinks}>
                  <div className={styles.smallLink}>验证码登录</div>
                  <div className={styles.smallLink}>免费注册</div>
                </div>

                <div className={styles.hr} aria-hidden="true" />
                <div className={styles.thirdLine}>
                  <div className={styles.thirdText}>境外手机</div>
                  <div className={styles.dot} aria-hidden="true" />
                  <div className={styles.thirdText}>公司客户</div>
                  <div className={styles.dot} aria-hidden="true" />
                  <div className={styles.thirdText}>网站导航</div>
                </div>

                <div className={styles.thirdIcons}>
                  {thirdParty.map((it) => (
                    <div key={it.name} className={[styles.tp, it.colorClass].join(' ')}>
                      <PlaceholderImage name={it.name} width={14} height={14} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.qrTab}>
              <div className={styles.qrText}>二维码登录</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

