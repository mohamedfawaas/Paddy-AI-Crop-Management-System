import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getAdminStats, getAdminUsers, getAdminPredictions, changeUserRole, deleteUser } from '../services/adminService'
import toast from 'react-hot-toast'
import { Shield, Users, BarChart2, Activity, Trash2, Crown, RefreshCw } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

const TYPE_META = {
  SUITABILITY: { color:'#2ecc71', icon:'🌱', label:'Suitability' },
  DISEASE:     { color:'#e74c3c', icon:'🔬', label:'Disease' },
  IRRIGATION:  { color:'#3498db', icon:'💧', label:'Irrigation' },
  FERTILIZER:  { color:'#f4c430', icon:'🌾', label:'Fertilizer' },
  YIELD:       { color:'#2ecc71', icon:'📈', label:'Yield' },
  PEST:        { color:'#e67e22', icon:'🐛', label:'Pest' },
  WEATHER:     { color:'#5dade2', icon:'☁️', label:'Weather' },
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ textAlign:'center' }}>
      <div style={{ fontSize:30, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:28, fontWeight:900, color, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>{sub}</div>}
    </div>
  )
}

function parseResult(value) {
  if (value && typeof value === 'object') return value
  if (!value || typeof value !== 'string') return {}
  try { return JSON.parse(value) } catch { return {} }
}

function getResultSummary(rec) {
  const o = parseResult(rec?.result)
  switch (rec?.type) {
    case 'SUITABILITY':
      return o.suitable === true ? 'Suitable' : o.suitable === false ? 'Not suitable' : '—'
    case 'DISEASE':
      return o.disease_name || '—'
    case 'IRRIGATION':
      return o.irrigation_needed === true ? `${o.urgency || 'Irrigation'} needed` : o.irrigation_needed === false ? 'Not needed' : '—'
    case 'FERTILIZER':
      return o.fertilizer_name || '—'
    case 'YIELD':
      return o.estimated_yield_kg_acre != null ? `${o.estimated_yield_kg_acre} kg/acre` : '—'
    case 'PEST':
      return o.likely_pest ? `${o.likely_pest}${o.risk_level ? ` · ${o.risk_level} risk` : ''}` : (o.risk_level || '—')
    case 'WEATHER': {
      const alerts = Array.isArray(o.alerts) ? o.alerts : []
      return alerts[0] || o.best_planting_advice || 'Advisory generated'
    }
    default:
      return '—'
  }
}

function formatDate(value, withYear=false) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-LK', withYear
    ? { day:'2-digit', month:'short', year:'numeric' }
    : { day:'2-digit', month:'short' })
}

export default function AdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useLang()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [preds, setPreds] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAll = async (refresh=false) => {
    if (refresh) setRefreshing(true)
    try {
      const [s, u, p] = await Promise.all([
        getAdminStats().catch(() => null),
        getAdminUsers().catch(() => []),
        getAdminPredictions().catch(() => [])
      ])
      setStats(s)
      setUsers(Array.isArray(u) ? u : [])
      setPreds(Array.isArray(p) ? p : [])
    } catch {
      toast.error(t('adminLoadFailed'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!user) return
    if (user.role !== 'ADMIN') { navigate('/dashboard', { replace:true }); return }
    loadAll()
    // AdminRoute already protects this page; load once for the authenticated admin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, user?.role])

  const handleRoleChange = async (id, currentRole, email) => {
    if (email === user?.email) {
      toast.error(t('selfRoleBlocked'))
      return
    }
    const newRole = currentRole === 'ADMIN' ? 'FARMER' : 'ADMIN'
    try {
      await changeUserRole(id, newRole)
      toast.success(`${t('roleChanged')}: ${newRole}`)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role:newRole } : u))
    } catch (err) {
      toast.error(err?.response?.data?.error || t('roleChangeFailed'))
    }
  }

  const handleDelete = async (id, name, email) => {
    if (email === user?.email) {
      toast.error(t('selfDeleteBlocked'))
      return
    }
    if (!window.confirm(`Delete user "${name}" and all of their farms, activities, notifications and predictions? This cannot be undone.`)) return
    try {
      await deleteUser(id)
      toast.success(t('userDeleted'))
      setUsers(prev => prev.filter(u => u.id !== id))
      setPreds(prev => prev.filter(p => p.userId !== id))
      await loadAll(true)
    } catch (err) {
      toast.error(err?.response?.data?.error || t('userDeleteFailed'))
    }
  }

  const TABS = [
    { id:'overview', label:t('overview'), icon:<BarChart2 size={14}/> },
    { id:'users', label:t('users'), icon:<Users size={14}/> },
    { id:'predictions', label:t('predictions'), icon:<Activity size={14}/> },
  ]

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300 }}>
      <span className="spinner" style={{ width:40, height:40, borderWidth:3 }}/>
    </div>
  )

  const breakdown = [
    { type:'SUITABILITY', count:stats?.suitabilityCount || 0 },
    { type:'DISEASE', count:stats?.diseaseCount || 0 },
    { type:'IRRIGATION', count:stats?.irrigationCount || 0 },
    { type:'FERTILIZER', count:stats?.fertilizerCount || 0 },
    { type:'YIELD', count:stats?.yieldCount || 0 },
    { type:'PEST', count:stats?.pestCount || 0 },
    { type:'WEATHER', count:stats?.weatherCount || 0 },
  ]

  return (
    <div className="admin-panel-page">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <Shield size={16} color="var(--gold)"/>
          <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'var(--gold)', textTransform:'uppercase' }}>{t('adminPanel')}</span>
        </div>
        <h1>👨‍💼 {t('systemAdministration')}</h1>
        <p>{t('adminSub')}</p>
      </div>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`admin-tab-button${tab===t.id ? ' active' : ''}`}>
            {t.icon} {t.label}
          </button>
        ))}
        <button onClick={() => loadAll(true)} disabled={refreshing} className="admin-refresh-button">
          <RefreshCw size={13} style={{ animation:refreshing ? 'spin 1s linear infinite' : 'none' }}/>
          {refreshing ? t('loading') : t('refresh')}
        </button>
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid-4" style={{ marginBottom:24 }}>
            <StatCard icon="👥" label={t('totalUsers')} value={stats?.totalUsers ?? users.length} color="var(--green)" sub={t('registeredAccounts')}/>
            <StatCard icon="📊" label={t('totalPredictions')} value={stats?.totalPredictions ?? preds.length} color="var(--gold)" sub={t('allModelTypes')}/>
            <StatCard icon="🔬" label={t('diseaseScans')} value={stats?.diseaseCount ?? '—'} color="#e74c3c" sub={t('leafImageScans')}/>
            <StatCard icon="👍" label={t('farmerValidatedAccuracy')} value={stats?.feedbackTotal ? `${stats.feedbackAccuracyPct}%` : '—'} color="#2ecc71" sub={stats?.feedbackTotal ? `${stats.feedbackAccurate}/${stats.feedbackTotal} rated accurate` : t('noFeedbackYet')}/>
          </div>

          <div className="grid-2" style={{ marginBottom:20 }}>
            <div className="card">
              <div className="admin-section-title">📈 {t('predictionBreakdown')}</div>
              {breakdown.map(row => {
                const meta = TYPE_META[row.type]
                const total = Number(stats?.totalPredictions || preds.length || 0)
                const pct = total > 0 ? Math.round((row.count / total) * 100) : 0
                return (
                  <div key={row.type} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:10, fontSize:13, marginBottom:5 }}>
                      <span>{meta.icon} {meta.label}</span>
                      <span style={{ color:meta.color, fontWeight:700 }}>{row.count} ({pct}%)</span>
                    </div>
                    <div style={{ height:7, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:meta.color, width:`${pct}%`, borderRadius:4, transition:'width 0.4s ease' }}/>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="card">
              <div className="admin-section-title">⚡ {t('serviceConfiguration')}</div>
              {[
                { label:t('javaBackend'), port:'8080', color:'#2ecc71', status:t('responding') },
                { label:t('reactFrontend'), port:'5173', color:'#2ecc71', status:t('currentApp') },
                { label:t('mysqlDb'), port:'3306', color:'#2ecc71', status:t('backendConnected') },
                { label:t('pythonMlApi'), port:'8000', color:'#f4c430', status:t('usedOnPredictions') },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>port {s.port}</div>
                  </div>
                  <span style={{ fontSize:12, color:s.color, fontWeight:600, textAlign:'right' }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="admin-section-title">🕐 {t('recentPredictions')}</div>
            {preds.length === 0 ? (
              <div className="admin-empty">{t('noAdminPredictions')}</div>
            ) : preds.slice(0,10).map((p, i) => {
              const meta = TYPE_META[p.type] || { color:'#fff', icon:'📋' }
              return (
                <div key={p.id || i} className="admin-recent-row">
                  <div style={{ fontSize:20, textAlign:'center' }}>{meta.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:meta.color }}>{p.type}</div>
                  <div className="admin-result-summary" title={getResultSummary(p)}>{getResultSummary(p)}</div>
                  <div className="admin-date">{formatDate(p.createdAt)}</div>
                  <div className={`admin-status ${String(p.status || '').toLowerCase()}`}>{p.status || '—'}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div style={{ fontSize:13, fontWeight:700, marginBottom:20 }}>👥 {t('allUsers')} ({users.length})</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>{['ID',t('name'),t('email'),t('role'),t('predictions'),t('joined'),t('actions')].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isSelf = u.email === user?.email
                  return (
                    <tr key={u.id}>
                      <td className="mono muted">#{u.id}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div className="admin-avatar">{u.name?.charAt(0)?.toUpperCase() || '?'}</div>
                          <span style={{ fontWeight:600 }}>{u.name || t('unnamedUser')}{isSelf ? ` (${t('you')})` : ''}</span>
                        </div>
                      </td>
                      <td className="muted">{u.email}</td>
                      <td><span className={`admin-role ${u.role === 'ADMIN' ? 'admin' : 'farmer'}`}>{u.role === 'ADMIN' ? '👑 ADMIN' : '🧑‍🌾 FARMER'}</span></td>
                      <td style={{ textAlign:'center', color:'var(--green)', fontWeight:700 }}>{u.predictions || 0}</td>
                      <td className="mono muted">{formatDate(u.createdAt, true)}</td>
                      <td>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          <button disabled={isSelf} onClick={() => handleRoleChange(u.id, u.role, u.email)} className="admin-action role"><Crown size={11}/>{u.role === 'ADMIN' ? t('demote') : t('promote')}</button>
                          <button disabled={isSelf} onClick={() => handleDelete(u.id, u.name, u.email)} className="admin-action delete"><Trash2 size={11}/>{t('delete')}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'predictions' && (
        <div className="card">
          <div style={{ fontSize:13, fontWeight:700, marginBottom:20 }}>📊 {t('allPredictions')} ({preds.length})</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr>{['ID',t('type'),t('userLabel'),t('result'),t('status'),t('date')].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {preds.map((p, i) => {
                  const meta = TYPE_META[p.type] || { color:'#fff', icon:'📋' }
                  return (
                    <tr key={p.id || i}>
                      <td className="mono muted">#{p.id}</td>
                      <td><span style={{ display:'flex', alignItems:'center', gap:6, color:meta.color, fontWeight:700, fontSize:12 }}>{meta.icon} {p.type}</span></td>
                      <td className="muted">{p.userName || p.user?.name || (p.userId ? `User #${p.userId}` : t('unknownUser'))}</td>
                      <td className="admin-prediction-result" title={getResultSummary(p)}>{getResultSummary(p)}</td>
                      <td><span className={`admin-status ${String(p.status || '').toLowerCase()}`}>{p.status || '—'}</span></td>
                      <td className="mono muted">{formatDate(p.createdAt, true)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
