import { Sprout, Leaf, CloudSun, TrendingUp, ShieldCheck } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import Footer from './Footer'

const LANGS = [{ code:'en', label:'EN', flag:'🇬🇧' }, { code:'si', label:'සි', flag:'🇱🇰' }, { code:'ta', label:'த', flag:'🇱🇰' }]

const FEATURES = [
  { icon: Leaf, key: 'suitabilityDesc' },
  { icon: CloudSun, key: 'irrigationDesc' },
  { icon: TrendingUp, key: 'yieldDesc' },
  { icon: ShieldCheck, key: 'aboutText' },
]

export default function AuthLayout({ children, tagline }) {
  const { t, lang, changeLang } = useLang()

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#060b07' }}>
      {/* ── Left branding panel — hidden on narrow screens via CSS class ── */}
      <div className="auth-brand-panel" style={{
        flex:'1 1 50%', position:'relative', overflow:'hidden',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        padding:'48px 56px', background:'radial-gradient(circle at 20% 20%, rgba(46,204,113,0.18), transparent 55%), radial-gradient(circle at 80% 80%, rgba(52,152,219,0.13), transparent 55%), #081008',
      }}>
        {/* decorative blurred blobs */}
        <div style={{ position:'absolute', top:-80, right:-80, width:280, height:280, borderRadius:'50%', background:'rgba(46,204,113,0.15)', filter:'blur(60px)' }}/>
        <div style={{ position:'absolute', bottom:-100, left:-60, width:320, height:320, borderRadius:'50%', background:'rgba(52,152,219,0.1)', filter:'blur(70px)' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, background:'rgba(46,204,113,0.15)', border:'1px solid rgba(46,204,113,0.35)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sprout size={22} color="#2ecc71"/>
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>{t('appName')}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:1 }}>{t('cropManagement')}</div>
            </div>
          </div>
        </div>

        <div style={{ position:'relative', zIndex:1 }}>
          <h1 style={{ fontSize:34, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:14 }}>
            {tagline || <>{t('appTagline')} 🌾</>}
          </h1>
          <p style={{ fontSize:14.5, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:32, maxWidth:420 }}>
            {t('appTagline')}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:32, height:32, flexShrink:0, borderRadius:9, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <f.icon size={15} color="#2ecc71"/>
                </div>
                <span style={{ fontSize:13.5, color:'rgba(255,255,255,0.65)' }}>{t(f.key)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position:'relative', zIndex:1 }}>
          <Footer variant="auth"/>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex:'1 1 50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', position:'relative' }}>
        <div style={{ position:'absolute', top:20, right:24, display:'flex', gap:5 }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)} style={{
              padding:'6px 12px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
              background: lang === l.code ? 'rgba(46,204,113,0.2)' : 'rgba(255,255,255,0.06)',
              color: lang === l.code ? '#2ecc71' : 'rgba(255,255,255,0.5)',
              outline:'1px solid ' + (lang === l.code ? 'rgba(46,204,113,0.4)' : 'transparent'), transition:'all 0.15s',
            }}>
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        {/* mobile-only compact brand mark */}
        <div className="auth-mobile-brand" style={{ display:'none', flexDirection:'column', alignItems:'center', marginBottom:20 }}>
          <div style={{ width:52, height:52, background:'rgba(46,204,113,0.12)', border:'1px solid rgba(46,204,113,0.3)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <Sprout size={26} color="#2ecc71"/>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{t('appName')}</div>
        </div>

        <div style={{ width:'100%', maxWidth:400 }}>
          {children}
        </div>

        {/* mobile-only footer — brand panel (with its own footer) is hidden on narrow screens */}
        <div className="auth-mobile-brand" style={{ display:'none', marginTop:28 }}>
          <Footer variant="auth"/>
        </div>
      </div>
    </div>
  )
}
