import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { User, Mail, MapPin, Save, Sparkles, Clock, Bug, Leaf, Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Select from '../components/Select'
import { getAllHistory } from '../services/predictionService'

const AVATAR_COLORS = ['#2ecc71','#3498db','#e74c3c','#f4c430','#9b59b6','#e67e22']
const SOIL_OPTIONS = [
  { value:'Clay',       label:'🟤 Clay' },
  { value:'Loam',       label:'🟫 Loam' },
  { value:'Sandy',      label:'🟡 Sandy' },
  { value:'Sandy Loam', label:'🟠 Sandy Loam' },
  { value:'Clay Loam',  label:'🔶 Clay Loam' },
]

export default function ProfilePage() {
  const { user, profile, profileLoading, updateProfile } = useAuth()
  const { t } = useLang()


  // Profile data is account-scoped on the backend. Nothing here is read from
  // one shared localStorage profile key, so one farmer can never inherit another
  // farmer's photo/details simply because they use the same browser.
  const [form, setForm] = useState({
    name:        user?.name || '',
    email:       user?.email || '',
    location:    '',
    farmSize:    '',
    soilType:    '',
    avatarColor: '#2ecc71',
    avatarImage: null,
    bio:         '',
  })
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const avatarInputRef = useRef()

  useEffect(() => {
    // Keep the page in sync with the authenticated account. The backend decides
    // which profile is returned from the JWT email; the client never supplies a
    // user id for profile reads/writes.
    if (!profile || editing) return
    setForm({
      name:        user?.name || profile.name || '',
      email:       user?.email || profile.email || '',
      location:    profile.location || '',
      farmSize:    profile.farmSize ?? '',
      soilType:    profile.soilType || '',
      avatarColor: profile.avatarColor || '#2ecc71',
      avatarImage: profile.avatarImage || null,
      bio:         profile.bio || '',
    })
  }, [profile, user?.name, user?.email, editing])

  // Modern touch: live activity stats pulled from the farmer's real prediction
  // history, so the profile feels alive instead of a static form.
  const [activity, setActivity] = useState({ total:0, disease:0, lastActive:null, loading:true })
  useEffect(() => {
    (async () => {
      const data = await getAllHistory()
      const disease = data.filter(r => r.type === 'DISEASE').length
      const last = data.reduce((acc, r) => {
        if (!r.createdAt) return acc
        const d = new Date(r.createdAt)
        return (!acc || d > acc) ? d : acc
      }, null)
      setActivity({ total: data.length, disease, lastActive: last, loading:false })
    })()
  }, [])

  // Profile completeness — a small, honest, trending-app-style progress nudge
  const completenessFields = [form.location, form.farmSize, form.soilType, form.bio]
  const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100)

  // useCallback prevents function recreation — fixes input lag
  const handleChange = useCallback((field) => (e) => {
    const val = e.target.value
    setForm(prev => ({ ...prev, [field]: val }))
  }, [])

  const initial = (user?.name || 'U').charAt(0).toUpperCase()

  // Profile photos are normalized client-side before saving. This keeps every
  // avatar in a predictable JPEG format and prevents multi-megabyte originals
  // from being stored in the database.
  const compressAvatar = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Invalid image'))
      img.onload = () => {
        const maxSide = 512
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Image processing unavailable')); return }
        // JPEG has no transparency; a neutral background avoids black areas for
        // transparent PNG/WebP uploads.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.86))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })

  const handleAvatarFile = async (file) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error(t('invalidAvatar'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('avatarTooLarge'))
      return
    }
    try {
      const avatarImage = await compressAvatar(file)
      setForm(f => ({ ...f, avatarImage }))
    } catch {
      toast.error(t('avatarProcessFailed'))
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const removeAvatarImage = () => setForm(f => ({ ...f, avatarImage: null }))

  const save = async () => {
    setSaving(true)
    try {
      const updated = await updateProfile({
        location:    form.location.trim() || null,
        farmSize:    form.farmSize === '' ? null : Number(form.farmSize),
        soilType:    form.soilType || null,
        avatarColor: form.avatarColor || '#2ecc71',
        avatarImage: form.avatarImage || null,
        bio:         form.bio.trim() || null,
      })
      setForm(prev => ({
        ...prev,
        location: updated.location || '',
        farmSize: updated.farmSize ?? '',
        soilType: updated.soilType || '',
        avatarColor: updated.avatarColor || '#2ecc71',
        avatarImage: updated.avatarImage || null,
        bio: updated.bio || '',
      }))
      toast.success(`✅ ${t('profileSaved')}`)
      setEditing(false)
    } catch (err) {
      toast.error(err.response?.data?.error || t('profileSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setForm({
      name:        user?.name || profile?.name || '',
      email:       user?.email || profile?.email || '',
      location:    profile?.location || '',
      farmSize:    profile?.farmSize ?? '',
      soilType:    profile?.soilType || '',
      avatarColor: profile?.avatarColor || '#2ecc71',
      avatarImage: profile?.avatarImage || null,
      bio:         profile?.bio || '',
    })
    setEditing(false)
  }


  const inputStyle = (active) => ({
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
    background: active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? 'rgba(46,204,113,0.3)' : 'rgba(255,255,255,0.08)'}`,
    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
    outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s',
    cursor: active ? 'text' : 'default',
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'var(--green)', textTransform:'uppercase', marginBottom:6 }}>
          {t('profile')}
        </div>
        <h1>👤 {t('myProfile')}</h1>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14 }}>{t('profileSub')}</p>
      </div>

      <div className="grid-2" style={{ alignItems:'start', gap:20 }}>

        {/* LEFT — Avatar card */}
        <div className="card" style={{ textAlign:'center' }}>
          {/* Avatar circle — shows uploaded photo when present, else colored initial */}
          <div style={{ position:'relative', width:88, height:88, margin:'0 auto 16px' }}>
            <div style={{
              width:88, height:88, borderRadius:'50%',
              background: form.avatarImage ? `url(${form.avatarImage}) center/cover no-repeat` : form.avatarColor,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:36, fontWeight:900, color:'#000',
              border:`3px solid ${form.avatarColor}60`,
              boxShadow:`0 0 24px ${form.avatarColor}30`,
            }}>
              {!form.avatarImage && initial}
            </div>

            {editing && (
              <>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  title={t('uploadProfilePhoto')}
                  style={{
                    position:'absolute', bottom:0, right:0, width:30, height:30, borderRadius:'50%',
                    background:'var(--green)', border:'2px solid #0d1912', color:'#000',
                    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                  }}
                ><Camera size={14}/></button>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }}
                  onChange={e => handleAvatarFile(e.target.files[0])}/>
                {form.avatarImage && (
                  <button
                    type="button"
                    onClick={removeAvatarImage}
                    title={t('removePhoto')}
                    style={{
                      position:'absolute', top:0, right:0, width:22, height:22, borderRadius:'50%',
                      background:'#e74c3c', border:'2px solid #0d1912', color:'#fff',
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                    }}
                  ><X size={11}/></button>
                )}
              </>
            )}
          </div>

          {/* Color picker */}
          {editing && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:1.5, marginBottom:8, textTransform:'uppercase' }}>
                {form.avatarImage ? 'Avatar Accent Color' : 'Avatar Color'}
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                {AVATAR_COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({...f, avatarColor:c}))} style={{
                    width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer',
                    border: form.avatarColor===c ? '3px solid #fff' : '3px solid transparent',
                    transform: form.avatarColor===c ? 'scale(1.25)' : 'scale(1)',
                    transition:'all 0.15s',
                  }}/>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:4 }}>
            <div style={{ fontSize:20, fontWeight:800 }}>{user?.name}</div>
            <div style={{
              display:'flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:20,
              background: user?.role === 'ADMIN' ? 'rgba(244,196,48,0.15)' : 'rgba(46,204,113,0.12)',
              border: `1px solid ${user?.role === 'ADMIN' ? 'rgba(244,196,48,0.35)' : 'rgba(46,204,113,0.3)'}`,
              color: user?.role === 'ADMIN' ? 'var(--gold)' : 'var(--green)', fontSize:9.5, fontWeight:700, letterSpacing:0.5,
            }}>
              <Sparkles size={9}/> {user?.role === 'ADMIN' ? 'ADMIN' : 'FARMER'}
            </div>
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>{user?.email}</div>
          {form.location && (
            <div style={{ fontSize:13, color:'var(--green)', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              <MapPin size={12}/> {form.location}
            </div>
          )}

          {/* Profile completeness — modern nudge encouraging farmers to fill in farm details */}
          <div style={{ marginTop:4, marginBottom:16, textAlign:'left' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:6 }}>
              <span style={{ color:'rgba(255,255,255,0.4)', fontFamily:'monospace', letterSpacing:1, textTransform:'uppercase' }}>{t('profileStrength')}</span>
              <span style={{ color: completeness===100 ? '#2ecc71' : 'var(--gold)', fontWeight:700 }}>{completeness}%</span>
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:4, width:`${completeness}%`, transition:'width 0.8s ease',
                background: completeness===100 ? '#2ecc71' : 'linear-gradient(90deg,#f4c430,#2ecc71)',
              }}/>
            </div>
            {completeness < 100 && (
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.25)', marginTop:5 }}>
                {t('completeFarmDetails')}
              </div>
            )}
          </div>

          {/* Info tiles */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12, marginBottom:20 }}>
            {[
              { label:t('farmSize'), value: form.farmSize ? `${form.farmSize} ac` : '—', color:'var(--green)' },
              { label:t('soil'),      value: form.soilType || '—',                         color:'#3498db' },
              { label:t('role'),      value: user?.role || t('farmer'),                       color:'var(--gold)' },
              { label:t('status'),    value: t('active'),                                     color:'var(--green)' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {!editing ? (
            <button onClick={() => setEditing(true)} disabled={profileLoading} className="btn btn-primary w-full">
              {profileLoading ? t('loadingProfile') : <>✏️ {t('editProfile')}</>}
            </button>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <button onClick={save} disabled={saving} className="btn btn-primary w-full">
                {saving
                  ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> {t('saving')}</>
                  : <><Save size={14}/> {t('saveProfile')}</>}
              </button>
              <button onClick={cancelEdit} style={{
                padding:'10px', borderRadius:8, background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)',
                cursor:'pointer', fontSize:13, fontWeight:600,
              }}>
                {t('cancel')}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Edit form */}
        <div className="card">
          <div style={{ fontSize:14, fontWeight:700, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:14 }}>
            📋 {t('farmDetails')}
          </div>

          {/* Name (readonly — from auth) */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <User size={13}/> {t('fullName')}
            </label>
            <input style={inputStyle(false)} value={form.name} readOnly/>
          </div>

          {/* Email (readonly) */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <Mail size={13}/> {t('email')}
            </label>
            <input style={inputStyle(false)} value={form.email} readOnly/>
          </div>

          {/* Farm Location — FIXED: direct onChange, no derived state */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <MapPin size={13}/> {t('farmLocation')}
            </label>
            <input
              style={inputStyle(editing)}
              placeholder={t('farmLocationPlaceholder')}
              maxLength={150}
              value={form.location}
              readOnly={!editing}
              onChange={handleChange('location')}
            />
          </div>

          {/* Farm Size */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:6, display:'block' }}>
              🌾 {t('farmSize')} ({t('acres')})
            </label>
            <input
              style={inputStyle(editing)}
              type="number" step="0.5" min="0"
              placeholder="e.g. 2.5"
              value={form.farmSize}
              readOnly={!editing}
              onChange={handleChange('farmSize')}
            />
          </div>

          {/* Soil Type */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:6, display:'block' }}>
              🏔 {t('soilType')}
            </label>
            <Select
              value={form.soilType}
              onChange={(v) => setForm(prev => ({ ...prev, soilType: v }))}
              options={SOIL_OPTIONS}
              placeholder={t('selectSoilType')}
              disabled={!editing}
            />
          </div>

          {/* Bio */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:6, display:'block' }}>
              📝 {t('farmBio')}
            </label>
            <textarea
              style={{ ...inputStyle(editing), resize:'none', lineHeight:1.6 }}
              rows={3}
              maxLength={500}
              placeholder={t('describeFarmPlaceholder')}
              value={form.bio}
              readOnly={!editing}
              onChange={handleChange('bio')}
            />
          </div>

          {!editing && (
            <div style={{ padding:'12px 14px', background:'rgba(46,204,113,0.05)', border:'1px solid rgba(46,204,113,0.12)', borderRadius:8, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
              💡 {t('editProfileHint')}
            </div>
          )}
        </div>
      </div>

      {/* Farm Activity — modern live summary pulled from real prediction history */}
      <div className="card" style={{ marginTop:20 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
          <Sparkles size={15} color="var(--green)"/> {t('farmActivity')}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14 }}>
          {[
            { icon:<Leaf size={18}/>,  label:t('totalAiPredictions'), value: activity.loading ? '…' : activity.total,   color:'var(--green)' },
            { icon:<Bug size={18}/>,   label:t('diseaseScans'),        value: activity.loading ? '…' : activity.disease, color:'#e74c3c' },
            { icon:<Clock size={18}/>, label:t('lastActive'),
              value: activity.loading ? '…' : (activity.lastActive ? activity.lastActive.toLocaleDateString('en-LK', { day:'2-digit', month:'short' }) : '—'),
              color:'#3498db' },
          ].map(s => (
            <div key={s.label} style={{
              display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12,
            }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`${s.color}18`, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, flexShrink:0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
