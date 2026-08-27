import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'
import { resetPassword } from '../services/authService'
import { useLang } from '../context/LanguageContext'

export default function ResetPasswordPage() {
  const { t } = useLang()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [form, setForm] = useState({ password:'', confirm:'' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error(t('passwordsMismatch')); return }
    if (form.password.length < 6) { toast.error(t('passwordMin')); return }
    setLoading(true)
    try {
      await resetPassword(token, form.password)
      setDone(true)
      toast.success(`${t('passwordResetDone')} 🌾`)
    } catch (err) {
      toast.error(err.response?.data?.error || t('resetFailed'))
    } finally { setLoading(false) }
  }

  const inputWrap = { position:'relative', marginBottom:16 }
  const iconStyle = { position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)' }

  if (!token) {
    return (
      <AuthLayout tagline={<>{t('invalidResetTagline')} ⚠️</>}>
        <div style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:32, textAlign:'center' }}>
          <XCircle size={40} color="#e74c3c" style={{ marginBottom:12 }}/>
          <h2 style={{ fontSize:19, fontWeight:800, color:'#fff', marginBottom:8 }}>{t('invalidResetLink')}</h2>
          <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.5)', marginBottom:20 }}>
            {t('invalidResetHelp')}
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ display:'inline-flex', textDecoration:'none' }}>
            {t('requestNewLink')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout tagline={<>{t('setNewPassword')} 🔐</>}>
      <div style={{
        background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)',
        border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:32,
        boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12.5, color:'rgba(255,255,255,0.4)', textDecoration:'none', marginBottom:20 }}>
          <ArrowLeft size={14}/> {t('backToSignIn')}
        </Link>

        {done ? (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(46,204,113,0.12)', border:'1px solid rgba(46,204,113,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <CheckCircle2 size={26} color="#2ecc71"/>
            </div>
            <h2 style={{ fontSize:19, fontWeight:800, color:'#fff', marginBottom:8 }}>{t('passwordResetDone')}</h2>
            <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.5)', lineHeight:1.6, marginBottom:20 }}>
              {t('passwordChanged')}
            </p>
            <button onClick={() => navigate('/login')} className="btn btn-primary w-full">{t('signIn')}</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>{t('createNewPassword')}</h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>{t('strongPasswordHelp')}</p>
            </div>
            <form onSubmit={submit}>
              <div style={inputWrap}>
                <Lock size={16} style={iconStyle}/>
                <input className="input-field" style={{ paddingLeft:42, paddingRight:40 }} name="password"
                  type={showPw ? 'text' : 'password'} placeholder={t('newPassword')} value={form.password} onChange={handle} required minLength={6}/>
                <button type="button" onClick={() => setShowPw(p => !p)} style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)',
                }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              <div style={inputWrap}>
                <Lock size={16} style={iconStyle}/>
                <input className="input-field" style={{ paddingLeft:42 }} name="confirm"
                  type={showPw ? 'text' : 'password'} placeholder={t('confirmNewPassword')} value={form.confirm} onChange={handle} required minLength={6}/>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading
                  ? <span className="spinner" style={{ width:18, height:18, borderWidth:2 }}/>
                  : <>{t('resetPassword')} <ArrowRight size={15}/></>}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
