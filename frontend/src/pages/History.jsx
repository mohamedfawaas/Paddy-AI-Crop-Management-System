import { useState, useEffect } from 'react'
import { getAllHistory } from '../services/predictionService'
import { submitPredictionFeedback } from '../services/predictionService'
import { exportHistoryPdf } from '../utils/pdfExport'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { History as HistoryIcon, TrendingUp, CheckCircle, AlertTriangle, RefreshCw, ThumbsUp, ThumbsDown, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_META = {
  SUITABILITY: { icon:'🌱', color:'#2ecc71', label:'Suitability' },
  DISEASE:     { icon:'🔬', color:'#e74c3c', label:'Disease' },
  IRRIGATION:  { icon:'💧', color:'#3498db', label:'Irrigation' },
  FERTILIZER:  { icon:'🌾', color:'#f4c430', label:'Fertilizer' },
  YIELD:       { icon:'📈', color:'#2ecc71', label:'Yield' },
  PEST:        { icon:'🐛', color:'#e67e22', label:'Pest' },
  WEATHER:     { icon:'☁️', color:'#3498db', label:'Weather' },
}

function getResultInfo(rec) {
  try {
    const o = JSON.parse(rec.result || '{}')
    if (rec.type === 'SUITABILITY') {
      const ok = !!o.suitable
      return {
        ok, color: ok ? '#2ecc71' : '#e74c3c',
        label:  ok ? '✅ Suitable for Paddy' : '❌ Not Suitable',
        detail: `Confidence: ${o.confidence || 0}%  •  Risk: ${o.risk_level || '—'}`,
      }
    }
    if (rec.type === 'DISEASE') {
      const healthy = (o.disease_name || '').toLowerCase() === 'healthy'
      return {
        ok: healthy, color: healthy ? '#2ecc71' : '#e74c3c',
        label:  healthy ? '🌿 Healthy Leaf' : `🦠 ${o.disease_name || 'Unknown'}`,
        detail: `Confidence: ${o.confidence || 0}%  •  Severity: ${o.severity || '—'}`,
      }
    }
    if (rec.type === 'IRRIGATION') {
      const needed = !!o.irrigation_needed
      return {
        ok: !needed, color: needed ? '#e67e22' : '#2ecc71',
        label:  needed ? '💧 Irrigation Required' : '✅ No Irrigation Needed',
        detail: `Urgency: ${o.urgency || '—'}  •  Water: ${o.recommended_water_mm || 0}mm`,
      }
    }
    if (rec.type === 'FERTILIZER') {
      return {
        ok: true, color:'#f4c430',
        label: `🌾 ${o.fertilizer_name || 'Fertilizer Advice'}`,
        detail: `Confidence: ${o.confidence || 0}%  •  Qty: ${o.quantity_kg_per_acre || 0} kg/acre`,
      }
    }
    if (rec.type === 'YIELD') {
      return {
        ok: true, color:'#2ecc71',
        label: `📈 ${o.estimated_yield_kg_acre || 0} kg/acre`,
        detail: `Harvest in: ${o.expected_harvest_days || 0} days  •  Efficiency: ${o.production_efficiency_score || 0}%`,
      }
    }
    if (rec.type === 'PEST') {
      const high = o.risk_level === 'High'
      return {
        ok: !high, color: high ? '#e74c3c' : (o.risk_level === 'Medium' ? '#e67e22' : '#2ecc71'),
        label: `🐛 ${o.risk_level || '—'} Risk`,
        detail: `Pest: ${o.likely_pest || '—'}  •  Confidence: ${o.risk_score || 0}%`,
      }
    }
    if (rec.type === 'WEATHER') {
      const hasAlert = (o.alerts || []).some(a => !a.startsWith('✅'))
      return {
        ok: !hasAlert, color: hasAlert ? '#e67e22' : '#2ecc71',
        label: hasAlert ? '⚠️ Weather Alert' : '☁️ Weather Advisory',
        detail: o.best_planting_advice ? o.best_planting_advice.slice(0, 70) + (o.best_planting_advice.length > 70 ? '...' : '') : '—',
      }
    }
  } catch {}
  return { ok:true, color:'rgba(255,255,255,0.5)', label:'—', detail:'' }
}

export default function History() {
  const [records,    setRecords]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('ALL')
  const [refreshing, setRefreshing] = useState(false)
  const { t } = useLang()
  const { user } = useAuth()

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    const data = await getAllHistory()
    setRecords(data)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  // Feature 2: farmer confirms whether a past prediction was accurate
  const handleFeedback = async (id, value) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, feedback: value } : r)) // optimistic
    try {
      await submitPredictionFeedback(id, value)
      toast.success(value === 'ACCURATE' ? t('feedbackThanksAccurate') : t('feedbackThanksRecorded'))
    } catch {
      toast.error(t('feedbackSaveFailed'))
      load(true)
    }
  }

  // Feature 5: export the full (filtered) history as a printable PDF
  const handleExportPdf = () => {
    if (filtered.length === 0) { toast.error(t('noRecordsExport')); return }
    exportHistoryPdf(filtered, { farmerName: user?.name })
    toast.success(`📄 ${t('pdfDownloaded')}`)
  }

  const filtered = filter === 'ALL' ? records : records.filter(r => r.type === filter)
  const suit     = records.filter(r => r.type === 'SUITABILITY')
  const disease  = records.filter(r => r.type === 'DISEASE')
  const irr      = records.filter(r => r.type === 'IRRIGATION')
  const fert     = records.filter(r => r.type === 'FERTILIZER')
  const yieldR   = records.filter(r => r.type === 'YIELD')
  const pest     = records.filter(r => r.type === 'PEST')
  const weather  = records.filter(r => r.type === 'WEATHER')

  // FIX: "Success Rate" previously mixed up two different things — the
  // agricultural OUTCOME of a prediction (e.g. "disease found" = bad) with
  // how ACCURATE the AI actually was. That's why a Disease card the farmer
  // had just rated 👍 "accurate" still showed a 0% success rate — the old
  // formula scored it as a failure just because a disease was detected, even
  // though the AI got it right. Success Rate now reflects real accuracy: the
  // % of a model's predictions the farmer has rated 👍 "Accurate", out of the
  // ones that have been rated at all.
  const accuracyStats = (arr) => {
    const rated = arr.filter(r => r.feedback)
    if (rated.length === 0) return { pct:null, rated:0, total:arr.length }
    const accurate = rated.filter(r => r.feedback === 'ACCURATE').length
    return { pct: Math.round((accurate / rated.length) * 100), rated: rated.length, total: arr.length }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <HistoryIcon size={16} color="var(--gold)"/>
          <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'var(--gold)', textTransform:'uppercase' }}>{t('history')}</span>
        </div>
        <h1>📋 {t('historyHeading')}</h1>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14 }}>{t('historyAll')}</p>
      </div>

      {/* Stat Cards — all models represented, not just the original three */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:14, marginBottom:20 }}>
        {[
          { icon:'📊', label:t('total'),       value:records.length, color:'var(--green)' },
          { icon:'🌱', label:t('suitability'), value:suit.length,    color:'#2ecc71' },
          { icon:'🔬', label:t('disease'),     value:disease.length, color:'#e74c3c' },
          { icon:'💧', label:t('irrigation'),  value:irr.length,     color:'#3498db' },
          { icon:'🌾', label:t('fertilizer'),  value:fert.length,    color:'#f4c430' },
          { icon:'📈', label:t('yield'),       value:yieldR.length,  color:'#2ecc71' },
          { icon:'🐛', label:t('pest'),        value:pest.length,    color:'#e67e22' },
          { icon:'☁️', label:t('weather'),     value:weather.length, color:'#3498db' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign:'center', padding:'16px 10px' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Success Rate — real AI accuracy, based on farmer 👍/👎 feedback, across every model */}
      {records.length > 0 && (
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
            <TrendingUp size={13}/> {t('successRateAll')}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginBottom:16 }}>
            {t('successRateHelp')}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:20 }}>
            {[
              { label:'Suitability', arr:suit,    color:'#2ecc71' },
              { label:'Disease',     arr:disease,  color:'#e74c3c' },
              { label:'Irrigation',  arr:irr,      color:'#3498db' },
              { label:'Fertilizer',  arr:fert,     color:'#f4c430' },
              { label:'Yield',       arr:yieldR,   color:'#2ecc71' },
              { label:'Pest',        arr:pest,     color:'#e67e22' },
              { label:'Weather',     arr:weather,  color:'#3498db' },
            ].map(({ label, arr, color }) => {
              const { pct, rated, total } = accuracyStats(arr)
              return (
                <div key={label}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                    <span style={{ color:'rgba(255,255,255,0.5)' }}>{label}</span>
                    <span style={{ color, fontWeight:700 }}>{pct !== null ? `${pct}%` : '—'}</span>
                  </div>
                  <div style={{ height:8, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:color, borderRadius:4, width:`${pct ?? 0}%`, transition:'width 1s' }}/>
                  </div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:4 }}>
                    {total === 0 ? 'No data yet' : rated === 0 ? `${total} unrated` : `${rated}/${total} rated`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter + Refresh */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        {['ALL','SUITABILITY','DISEASE','IRRIGATION','FERTILIZER','YIELD','PEST','WEATHER'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'7px 16px', borderRadius:20, border:'none', fontSize:12, fontWeight:600, cursor:'pointer',
            background: filter===f ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.05)',
            color:      filter===f ? 'var(--green)' : 'rgba(255,255,255,0.4)',
            outline:    filter===f ? '1px solid rgba(46,204,113,0.3)' : '1px solid transparent',
          }}>
            {TYPE_META[f]?.icon || '📋'} {f === 'ALL' ? 'All Types' : TYPE_META[f]?.label}
          </button>
        ))}
        <button onClick={() => load(true)} disabled={refreshing} style={{
          marginLeft:'auto', display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
          borderRadius:20, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
          color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer', outline:'none',
        }}>
          <RefreshCw size={13} style={{ animation:refreshing?'spin 1s linear infinite':'none' }}/>
          {refreshing ? t('loading') : t('refresh')}
        </button>
        <button onClick={handleExportPdf} style={{
          display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
          borderRadius:20, background:'rgba(52,152,219,0.1)', border:'1px solid rgba(52,152,219,0.3)',
          color:'#3498db', fontSize:12, fontWeight:600, cursor:'pointer', outline:'none',
        }}>
          <FileDown size={13}/> {t('exportPdf')}
        </button>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>{filtered.length} {t('records')}</span>
      </div>

      {/* Records */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <span className="spinner" style={{ width:40, height:40, borderWidth:3 }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:56, opacity:0.1, marginBottom:14 }}>📋</div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:15, marginBottom:8 }}>
            {records.length === 0 ? 'No predictions yet' : `No ${filter} predictions`}
          </div>
          <div style={{ color:'rgba(255,255,255,0.2)', fontSize:13 }}>
            {records.length === 0 ? 'Make predictions using Suitability, Disease or Irrigation pages' : 'Try a different filter'}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((rec, idx) => {
            const meta = TYPE_META[rec.type] || {}
            const info = getResultInfo(rec)
            const dt   = rec.createdAt ? new Date(rec.createdAt) : null
            return (
              <div key={rec.id || idx} style={{
                display:'grid', gridTemplateColumns:'48px 1fr auto', gap:16, alignItems:'center',
                padding:'16px 18px', background:'rgba(255,255,255,0.03)',
                border:`1px solid rgba(255,255,255,0.07)`,
                borderLeft:`3px solid ${meta.color||'#2ecc71'}`,
                borderRadius:12, transition:'background 0.15s', cursor:'default',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
              >
                <div style={{ width:48, height:48, borderRadius:12, background:`${meta.color||'#2ecc71'}18`, border:`1px solid ${meta.color||'#2ecc71'}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                  {meta.icon || '📋'}
                </div>
                <div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'monospace', marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>
                    {meta.label || rec.type} Prediction
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:info.color, marginBottom:3 }}>{info.label}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{info.detail}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', marginBottom:2 }}>
                    {dt ? dt.toLocaleDateString('en-LK', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                  </div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginBottom:6 }}>
                    {dt ? dt.toLocaleTimeString('en-LK', { hour:'2-digit', minute:'2-digit' }) : ''}
                  </div>
                  {info.ok
                    ? <CheckCircle size={16} color="#2ecc71" title={t('goodOutcome')}/>
                    : <AlertTriangle size={16} color="#f4c430" title={t('attentionNeeded')}/>
                  }
                  {/* Feature 2: feedback thumbs on each past prediction */}
                  <div style={{ display:'flex', gap:5, marginTop:8, justifyContent:'flex-end' }}>
                    {rec.feedback ? (
                      <span style={{ fontSize:10, color: rec.feedback==='ACCURATE' ? '#2ecc71' : '#e74c3c', fontWeight:600 }}>
                        {rec.feedback === 'ACCURATE' ? '👍 Rated accurate' : '👎 Rated inaccurate'}
                      </span>
                    ) : (
                      <>
                        <button onClick={() => handleFeedback(rec.id, 'ACCURATE')} title={t('accurate')} style={{
                          background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.25)',
                          borderRadius:6, padding:'3px 6px', cursor:'pointer', color:'#2ecc71', outline:'none',
                        }}><ThumbsUp size={11}/></button>
                        <button onClick={() => handleFeedback(rec.id, 'INACCURATE')} title={t('inaccurate')} style={{
                          background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.25)',
                          borderRadius:6, padding:'3px 6px', cursor:'pointer', color:'#e74c3c', outline:'none',
                        }}><ThumbsDown size={11}/></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
