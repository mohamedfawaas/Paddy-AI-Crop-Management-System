import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { loginUser, registerUser } from '../services/authService'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { login } = useAuth()
  const { t } = useLang()
  useEffect(() => {
    if (sessionStorage.getItem('paddy_session_notice') === 'expired') {
      sessionStorage.removeItem('paddy_session_notice')
      toast.error(t('sessionExpired'))
    }
  }, [t])
  const navigate = useNavigate()

  // FIX: after logging out, Chrome/Edge's saved-password manager would silently
  // re-fill the email + password fields with the previously used account's
  // credentials as soon as this page mounted (this is a browser autofill
  // behaviour, not app state — logout() already clears localStorage/token).
  // Force-clearing the form on mount + using autoComplete="off" / "new-password"
  // stops the browser from restoring old saved values into a fresh login form.
  useEffect(() => {
    setForm({ name:'', email:'', password:'' })
  }, [])

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = mode === 'login' ? await loginUser({ email: form.email, password: form.password }) : await registerUser(form)
      login(data)
      toast.success(`${mode === 'login' ? t('welcomeBack') : t('createYourAccount')}${data.name ? ', ' + data.name : ''}! 🌾`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || t('operationFailed'))
    } finally { setLoading(false) }
  }

  const inputWrap = { position:'relative', marginBottom:16 }
  const iconStyle = { position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)' }
  const fieldStyle = { paddingLeft:42 }

  return (
    <AuthLayout>
      <div style={{
        background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)',
        border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:32,
        boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>
            {mode === 'login' ? `${t('welcomeBack')} 👋` : t('createYourAccount')}
          </h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>
            {mode === 'login' ? t('loginSub') : t('registerSub')}
          </p>
        </div>

        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', background:'rgba(255,255,255,0.04)',
          borderRadius:10, padding:4, marginBottom:24, position:'relative',
        }}>
          <div style={{
            position:'absolute', top:4, bottom:4, left: mode === 'login' ? 4 : 'calc(50% + 0px)',
            width:'calc(50% - 4px)', background:'rgba(46,204,113,0.18)', borderRadius:7,
            transition:'left 0.25s cubic-bezier(.4,0,.2,1)', border:'1px solid rgba(46,204,113,0.3)',
          }}/>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => setMode(m)} type="button" style={{
              padding:'10px', borderRadius:7, border:'none', cursor:'pointer', fontSize:13.5, fontWeight:700,
              background:'transparent', color: mode === m ? '#2ecc71' : 'rgba(255,255,255,0.4)',
              position:'relative', zIndex:1, transition:'color 0.2s',
            }}>
              {m === 'login' ? t('login') : t('register')}
            </button>
          ))}
        </div>

        <form onSubmit={submit} autoComplete="off">
          {mode === 'register' && (
            <div style={inputWrap}>
              <User size={16} style={iconStyle}/>
              <input className="input-field" style={fieldStyle} name="name" placeholder={t('fullName')}
                value={form.name} onChange={handle} autoComplete="off" required/>
            </div>
          )}
          <div style={inputWrap}>
            <Mail size={16} style={iconStyle}/>
            <input className="input-field" style={fieldStyle} name="email" type="email" placeholder={t('emailPlaceholder')}
              value={form.email} onChange={handle} autoComplete="off" required/>
          </div>
          <div style={inputWrap}>
            <Lock size={16} style={iconStyle}/>
            <input className="input-field" style={{ ...fieldStyle, paddingRight:40 }} name="password"
              type={showPw ? 'text' : 'password'} placeholder={t('password')} value={form.password} onChange={handle}
              autoComplete="new-password" required minLength={6}/>
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              aria-label={showPw ? t('hidePassword') : t('showPassword')}
              title={showPw ? t('hidePassword') : t('showPassword')}
              style={{
                position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
                display:'flex', alignItems:'center', justifyContent:'center',
                width:28, height:28, borderRadius:6,
                background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)',
                transition:'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color='#2ecc71'; e.currentTarget.style.background='rgba(46,204,113,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.4)'; e.currentTarget.style.background='transparent' }}
            >
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>

          {mode === 'login' && (
            <div style={{ textAlign:'right', marginBottom:18, marginTop:-6 }}>
              <Link to="/forgot-password" style={{ fontSize:12.5, color:'#2ecc71', textDecoration:'none', fontWeight:600 }}>
                {t('forgotPassword')}
              </Link>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{
            marginTop: mode === 'register' ? 8 : 0, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            {loading
              ? <span className="spinner" style={{ width:18, height:18, borderWidth:2 }}/>
              : <>{mode === 'login' ? t('signIn') : t('createAccount')} <ArrowRight size={15}/></>}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12.5, color:'rgba(255,255,255,0.35)' }}>
          {mode === 'login' ? `${t('dontHaveAccount')} ` : `${t('alreadyHaveAccount')} `}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{
            background:'none', border:'none', color:'#2ecc71', fontWeight:700, cursor:'pointer', fontSize:12.5, padding:0,
          }}>
            {mode === 'login' ? t('signUp') : t('signIn')}
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
