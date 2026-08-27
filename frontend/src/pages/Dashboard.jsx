import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import PredictionCard from '../components/PredictionCard'
import { Link } from 'react-router-dom'
import { ArrowRight, Globe, TrendingUp, Leaf, Bug, Droplets, Clock, ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAllHistory, getRecentPredictions } from '../services/predictionService'

const LANGS = [
  { code:'en', label:'EN', flag:'🇬🇧' },
  { code:'si', label:'සි', flag:'🇱🇰' },
  { code:'ta', label:'த',  flag:'🇱🇰' },
]

function MiniBarChart({ data, color, emptyText }) {
  if (!data || !data.length) return (
    <div style={{ height:48, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.2)', fontSize:11 }}>
      {emptyText}
    </div>
  )
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:48 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
          <div style={{ width:'100%', background:`${color}20`, borderRadius:3, height:40, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, background:color, borderRadius:3, height:`${(d.count/max)*100}%`, transition:'height 0.8s ease' }}/>
          </div>
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { t, lang, changeLang } = useLang()
  const hr = new Date().getHours()
  const greeting = hr < 12 ? t('goodMorning') : hr < 18 ? t('goodAfternoon') : t('goodEvening')

  const [stats, setStats]     = useState({ suit:0, disease:0, irr:0, fert:0, yieldN:0, pest:0, weather:0, total:0 })
  const [charts, setCharts]   = useState({ suit:[], disease:[], irr:[], fert:[], yieldN:[], pest:[], weather:[] })
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [all, recentData] = await Promise.all([
        getAllHistory(),
        getRecentPredictions(6),
      ])
      const suit    = all.filter(r => r.type === 'SUITABILITY')
      const disease = all.filter(r => r.type === 'DISEASE')
      const irr     = all.filter(r => r.type === 'IRRIGATION')
      const fert    = all.filter(r => r.type === 'FERTILIZER')
      const yieldN  = all.filter(r => r.type === 'YIELD')
      const pest    = all.filter(r => r.type === 'PEST')
      const weather = all.filter(r => r.type === 'WEATHER')

      const buildChart = (arr) => {
        const days = Array.from({ length:7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i))
          return { label: d.toLocaleDateString('en', { weekday:'short' }).slice(0,1), date: d.toDateString(), count:0 }
        })
        arr.forEach(item => {
          if (!item.createdAt) return
          const ds = new Date(item.createdAt).toDateString()
          const found = days.find(x => x.date === ds)
          if (found) found.count++
        })
        return days
      }

      setStats({
        suit:suit.length, disease:disease.length, irr:irr.length,
        fert:fert.length, yieldN:yieldN.length, pest:pest.length, weather:weather.length,
        total:all.length,
      })
      setCharts({
        suit:buildChart(suit), disease:buildChart(disease), irr:buildChart(irr),
        fert:buildChart(fert), yieldN:buildChart(yieldN), pest:buildChart(pest), weather:buildChart(weather),
      })
      setRecent(recentData)
      setLoading(false)
    }
    load()
  }, [])

  const links = [
    { to:'/suitability', icon:'🌱', key:'suitability', descKey:'suitabilityDesc', color:'var(--green)' },
    { to:'/disease',     icon:'🔬', key:'disease',     descKey:'diseaseDesc',     color:'#e74c3c' },
    { to:'/irrigation',  icon:'💧', key:'irrigation',  descKey:'irrigationDesc',  color:'#3498db' },
    { to:'/fertilizer',  icon:'🌾', key:'fertilizer',  descKey:'fertilizerDesc',  color:'#f4c430' },
    { to:'/yield',       icon:'📈', key:'yield',       descKey:'yieldDesc',       color:'#2ecc71' },
    { to:'/pest',        icon:'🐛', key:'pest',        descKey:'pestDesc',        color:'#e67e22' },
    { to:'/weather',     icon:'☁️', key:'weather',     descKey:'weatherDesc',     color:'#3498db' },
    { to:'/farms',       icon:'🚜', key:'farmManagement', descKey:'farmManagementDesc', color:'#8e6a4a' },
  ]

  return (
    <div>
      {/* Language Switcher */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, padding:'10px 14px', background:'rgba(46,204,113,0.05)', border:'1px solid rgba(46,204,113,0.15)', borderRadius:10 }}>
        <Globe size={14} color="rgba(255,255,255,0.4)"/>
        <span style={{ fontSize:11, letterSpacing:2, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', fontFamily:'monospace' }}>
          {t('languageLabel')}
        </span>
        <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)} style={{
              padding:'6px 14px', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700, outline:'none',
              background: lang===l.code ? 'rgba(46,204,113,0.25)' : 'rgba(255,255,255,0.06)',
              color:      lang===l.code ? '#2ecc71' : 'rgba(255,255,255,0.5)',
              border:     lang===l.code ? '1px solid rgba(46,204,113,0.5)' : '1px solid rgba(255,255,255,0.1)',
              transition:'all 0.15s',
            }}>
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-header">
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'var(--green)', textTransform:'uppercase', marginBottom:6 }}>{t('dashboard')}</div>
        <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14 }}>{t('dashboardSub')}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:14, marginBottom:24 }}>
        <PredictionCard icon="📊" label={t('totalPredictions')} value={loading ? '…' : stats.total}   sub={t('allTime')}      color="var(--green)"/>
        <PredictionCard icon="🌱" label={t('suitability')}  value={loading ? '…' : stats.suit}    sub={t('landChecks')}   color="#2ecc71"/>
        <PredictionCard icon="🔬" label={t('disease')}      value={loading ? '…' : stats.disease} sub={t('leafScans')}    color="#e74c3c"/>
        <PredictionCard icon="💧" label={t('irrigation')}   value={loading ? '…' : stats.irr}     sub={t('fieldAdvices')} color="#3498db"/>
        <PredictionCard icon="🌾" label={t('fertilizer')}   value={loading ? '…' : stats.fert}    sub={t('recommendations')} color="#f4c430"/>
        <PredictionCard icon="📈" label={t('yield')}        value={loading ? '…' : stats.yieldN}  sub={t('estimates')}     color="#2ecc71"/>
        <PredictionCard icon="🐛" label={t('pest')}         value={loading ? '…' : stats.pest}    sub={t('riskChecks')}   color="#e67e22"/>
        <PredictionCard icon="☁️" label={t('weather')}      value={loading ? '…' : stats.weather} sub={t('advisories')}    color="#3498db"/>
      </div>

      {/* Weekly Charts — now covers all 7 prediction models */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          <TrendingUp size={14}/> {t('weeklyActivity7')}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
          {[
            { label:t('suitability'), data:charts.suit,    color:'#2ecc71', icon:<Leaf size={13}/> },
            { label:t('disease'),     data:charts.disease,  color:'#e74c3c', icon:<Bug size={13}/> },
            { label:t('irrigation'),  data:charts.irr,      color:'#3498db', icon:<Droplets size={13}/> },
            { label:t('fertilizer'),  data:charts.fert,     color:'#f4c430', icon:<Leaf size={13}/> },
            { label:t('yield'),       data:charts.yieldN,   color:'#2ecc71', icon:<TrendingUp size={13}/> },
            { label:t('pest'),        data:charts.pest,     color:'#e67e22', icon:<Bug size={13}/> },
            { label:t('weather'),     data:charts.weather,  color:'#3498db', icon:<Droplets size={13}/> },
          ].map(({ label, data, color, icon }) => (
            <div key={label} className="card">
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, fontSize:12, fontWeight:700, color }}>
                {icon} {label}
              </div>
              <MiniBarChart data={data} color={color} emptyText={t('makePredictionsChart')}/>
              <div style={{ marginTop:8, fontSize:11, color:'rgba(255,255,255,0.3)' }}>
                {data.reduce((a, b) => a + b.count, 0)} {t('predictionsThisWeek')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature 1: Recent Predictions feed — shows actual leaf photos + confidence,
          giving farmers visual proof of what the AI saw and how confident it was */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          <Clock size={14}/> {t('recentActivity')}
        </div>
        {!loading && recent.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'28px 16px', color:'rgba(255,255,255,0.3)', fontSize:13 }}>
            {t('recentEmpty')}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
            {recent.map(r => {
              let parsed = {}
              try { parsed = JSON.parse(r.result || '{}') } catch {}
              const typeMeta = {
                SUITABILITY: { icon:'🌱', color:'#2ecc71', label: parsed.suitable ? 'Suitable' : 'Not Suitable' },
                DISEASE:     { icon:'🔬', color:'#e74c3c', label: parsed.disease_name || 'Disease Scan' },
                IRRIGATION:  { icon:'💧', color:'#3498db', label: parsed.irrigation_needed ? 'Irrigation Needed' : 'No Irrigation' },
                FERTILIZER:  { icon:'🌾', color:'#f4c430', label: parsed.fertilizer_name || 'Fertilizer Advice' },
                YIELD:       { icon:'📈', color:'#2ecc71', label: parsed.estimated_yield_kg_acre ? `${parsed.estimated_yield_kg_acre} kg/acre` : 'Yield Estimate' },
                PEST:        { icon:'🐛', color:'#e67e22', label: parsed.risk_level ? `${parsed.risk_level} Risk` : 'Pest Check' },
                WEATHER:     { icon:'☁️', color:'#3498db', label: 'Weather Advisory' },
              }[r.type] || { icon:'📋', color:'#888', label:'Prediction' }
              // Every model has a "how confident/how good" percentage under a
              // different field name — surface it consistently everywhere,
              // not just for Disease (which only had `confidence`).
              const conf =
                typeof parsed.confidence === 'number' ? parsed.confidence :
                typeof parsed.risk_score === 'number' ? parsed.risk_score :
                typeof parsed.production_efficiency_score === 'number' ? parsed.production_efficiency_score :
                undefined
              return (
                <div key={r.id} className="card" style={{ padding:0, overflow:'hidden' }}>
                  {r.imageData ? (
                    <img src={r.imageData} alt="leaf" style={{ width:'100%', height:100, objectFit:'cover', display:'block' }}/>
                  ) : (
                    <div style={{ width:'100%', height:100, background:`${typeMeta.color}12`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>
                      {typeMeta.icon}
                    </div>
                  )}
                  <div style={{ padding:'10px 12px' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:typeMeta.color, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {typeMeta.icon} {typeMeta.label}
                    </div>
                    {typeof conf === 'number' && (
                      <div>
                        <div style={{ height:5, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden', marginBottom:4 }}>
                          <div style={{ height:'100%', width:`${conf}%`, background:typeMeta.color, borderRadius:3 }}/>
                        </div>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{conf}% confidence</div>
                      </div>
                    )}
                    <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.25)', marginTop:4 }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-LK',{day:'2-digit',month:'short'}) : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Access */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:16 }}>
          {t('quickAccess')}
        </div>
        <div className="grid-3">
          {links.map(({ to, icon, key, descKey, color }) => (
            <Link key={to} to={to} style={{ textDecoration:'none' }}>
              <div className="card" style={{ cursor:'pointer', height:'100%' }}>
                <div style={{ width:44, height:44, borderRadius:10, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:14 }}>
                  {icon}
                </div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>{t(key)}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.5, marginBottom:14 }}>{t(descKey)}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color, fontWeight:600 }}>
                  {t('tryNow')} <ArrowRight size={13}/>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ marginTop:24, padding:'16px 20px', background:'rgba(46,204,113,0.05)', border:'1px solid rgba(46,204,113,0.15)', borderRadius:12, fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>
        <strong style={{ color:'var(--green)' }}>🌾 {t('aboutSystem')} — </strong>{t('aboutText')}
      </div>
    </div>
  )
}
