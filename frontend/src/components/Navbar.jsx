import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { LayoutDashboard, Leaf, Bug, Droplets, LogOut, Sprout, History, User, Shield, TrendingUp, CloudSun, Tractor, Menu, X } from 'lucide-react'
import NotificationBell from './NotificationBell'

const LANGS = [
  { code:'en', label:'EN', flag:'🇬🇧' },
  { code:'si', label:'සි', flag:'🇱🇰' },
  { code:'ta', label:'த',  flag:'🇱🇰' },
]

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const { t, lang, changeLang } = useLang()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { to:'/dashboard',   icon:LayoutDashboard, key:'dashboard' },
    { to:'/suitability', icon:Leaf,            key:'suitability' },
    { to:'/disease',     icon:Bug,             key:'disease' },
    { to:'/irrigation',  icon:Droplets,        key:'irrigation' },
    { to:'/fertilizer',  icon:Sprout,          key:'fertilizer' },
    { to:'/yield',       icon:TrendingUp,      key:'yield' },
    { to:'/pest',        icon:Bug,             key:'pest' },
    { to:'/weather',     icon:CloudSun,        key:'weather' },
    { to:'/farms',       icon:Tractor,         key:'farmManagement' },
    { to:'/history',     icon:History,         key:'history' },
    { to:'/profile',     icon:User,            key:'profile' },
  ]

  return (
    <>
      {/* Mobile hamburger — hidden on desktop via CSS */}
      <button
        className="navbar-hamburger"
        onClick={() => setMobileOpen(v => !v)}
        style={{
          display:'none', position:'fixed', top:14, left:14, zIndex:210,
          width:40, height:40, borderRadius:10, alignItems:'center', justifyContent:'center',
          background:'#0f1f16', border:'1px solid rgba(46,204,113,0.3)', cursor:'pointer', outline:'none',
        }}
      >
        {mobileOpen ? <X size={18} color="#2ecc71"/> : <Menu size={18} color="#2ecc71"/>}
      </button>

      {/* Backdrop — only rendered/interactive when the mobile drawer is open */}
      {mobileOpen && (
        <div
          className="navbar-backdrop"
          onClick={() => setMobileOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:99 }}
        />
      )}

      <aside className={`navbar-sidebar${mobileOpen ? ' open' : ''}`} style={{ position:'fixed', top:0, left:0, width:240, height:'100vh', background:'#080e0a', borderRight:'1px solid rgba(46,204,113,0.15)', display:'flex', flexDirection:'column', zIndex:100, overflowY:'auto' }}>

      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 16px 16px', borderBottom:'1px solid rgba(46,204,113,0.1)' }}>
        <div style={{ width:36, height:36, background:'rgba(46,204,113,0.15)', border:'1px solid rgba(46,204,113,0.3)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Sprout size={18} color="#2ecc71"/>
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>Paddy AI</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:1 }}>{t('cropManagement')}</div>
        </div>
        {isAdmin && (
          <div style={{ marginLeft:'auto', padding:'2px 8px', borderRadius:10, background:'rgba(244,196,48,0.15)', border:'1px solid rgba(244,196,48,0.3)', color:'var(--gold)', fontSize:9, fontWeight:700, letterSpacing:1 }}>
            ADMIN
          </div>
        )}
        <NotificationBell/>
      </div>

      {/* Language switcher */}
      <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(46,204,113,0.08)', background:'rgba(46,204,113,0.02)' }}>
        <div style={{ fontSize:9, letterSpacing:2, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', marginBottom:8 }}>
          🌐 Language / භාෂාව / மொழி
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)} style={{
              flex:1, padding:'7px 4px', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:700,
              background: lang===l.code ? 'rgba(46,204,113,0.25)' : 'rgba(255,255,255,0.05)',
              color:      lang===l.code ? '#2ecc71' : 'rgba(255,255,255,0.5)',
              border:     lang===l.code ? '1px solid rgba(46,204,113,0.5)' : '1px solid rgba(255,255,255,0.08)',
              outline:'none', transition:'all 0.15s',
            }}>
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:3 }}>
        {links.map(({ to, icon:Icon, key }) => (
          <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8,
            fontSize:13, fontWeight:500, textDecoration:'none', transition:'all 0.15s',
            color:      isActive ? '#2ecc71' : 'rgba(255,255,255,0.5)',
            background: isActive ? 'rgba(46,204,113,0.1)' : 'transparent',
            border:     `1px solid ${isActive ? 'rgba(46,204,113,0.25)' : 'transparent'}`,
          })}>
            <Icon size={16}/> {t(key)}
          </NavLink>
        ))}

        {/* Admin link — only visible to ADMIN role */}
        {isAdmin && (
          <>
            <div style={{ height:1, background:'rgba(244,196,48,0.1)', margin:'8px 0' }}/>
            <NavLink to="/admin" onClick={() => setMobileOpen(false)} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8,
              fontSize:13, fontWeight:600, textDecoration:'none', transition:'all 0.15s',
              color:      isActive ? 'var(--gold)' : 'rgba(244,196,48,0.6)',
              background: isActive ? 'rgba(244,196,48,0.1)' : 'transparent',
              border:     `1px solid ${isActive ? 'rgba(244,196,48,0.3)' : 'transparent'}`,
            })}>
              <Shield size={16}/> {t('adminPanel')}
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding:'12px', borderTop:'1px solid rgba(46,204,113,0.1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 10px', marginBottom:8 }}>
          {(() => {
            const initial = (user?.name || 'U').charAt(0).toUpperCase()
            const color = profile?.avatarColor || '#2ecc71'
            return (
              <div style={{
                width:34, height:34, borderRadius:'50%', flexShrink:0,
                background: profile?.avatarImage ? `url(${profile.avatarImage}) center/cover no-repeat` : color,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:14, fontWeight:800, color:'#000', border:`2px solid ${color}55`,
              }}>
                {!profile?.avatarImage && initial}
              </div>
            )
          })()}
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</div>
            {isAdmin && <div style={{ fontSize:10, color:'var(--gold)', fontFamily:'monospace', marginTop:2 }}>👑 {t('administrator')}</div>}
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} style={{
          display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 12px',
          background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.25)',
          borderRadius:8, color:'#e74c3c', fontSize:13, fontWeight:600, cursor:'pointer', outline:'none',
        }}>
          <LogOut size={15}/> {t('logout')}
        </button>
      </div>
    </aside>
    </>
  )
}
