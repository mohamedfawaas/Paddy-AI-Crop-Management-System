import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import { forgotPassword } from '../services/authService'
import { useLang } from '../context/LanguageContext'

export default function ForgotPasswordPage() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
      toast.success(t('resetEmailSent'))
    } catch (err) {
      toast.error(err.response?.data?.error || t('operationFailed'))
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout tagline={<>{t('forgotTagline')} 🔑</> }>
      <div style={{
        background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)',
        border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:32,
        boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12.5, color:'rgba(255,255,255,0.4)', textDecoration:'none', marginBottom:20 }}>
          <ArrowLeft size={14}/> {t('backToSignIn')}
        </Link>

        {sent ? (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(46,204,113,0.12)', border:'1px solid rgba(46,204,113,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <CheckCircle2 size={26} color="#2ecc71"/>
            </div>
            <h2 style={{ fontSize:19, fontWeight:800, color:'#fff', marginBottom:8 }}>{t('checkInbox')}</h2>
            <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
              {t('forgotSentPrefix')} <strong style={{ color:'#2ecc71' }}>{email}</strong> {t('forgotSentSuffix')}
            </p>
            <button onClick={() => setSent(false)} style={{
              marginTop:20, background:'none', border:'none', color:'#2ecc71', fontSize:12.5, fontWeight:600, cursor:'pointer',
            }}>
              {t('tryAgain')}
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>{t('resetPassword')}</h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>
                {t('resetHelp')}
              </p>
            </div>
            <form onSubmit={submit}>
              <div style={{ position:'relative', marginBottom:20 }}>
                <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)' }}/>
                <input className="input-field" style={{ paddingLeft:42 }} type="email" placeholder={t('emailExample')}
                  value={email} onChange={e => setEmail(e.target.value)} required autoFocus/>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading
                  ? <span className="spinner" style={{ width:18, height:18, borderWidth:2 }}/>
                  : <>{t('sendResetLink')} <ArrowRight size={15}/></>}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
