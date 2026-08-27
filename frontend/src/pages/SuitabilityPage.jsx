import { useState } from 'react'
import { predictSuitability } from '../services/suitabilityService'
import ResultDisplay from '../components/ResultDisplay'
import MLServerBanner from '../components/MLServerBanner'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { Leaf } from 'lucide-react'

const def = { temperature:'', rainfall:'', ph:'', soil_type:'clay', humidity:'' }

export default function SuitabilityPage() {
  const [form, setForm] = useState(def)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mlDown, setMlDown] = useState(false)
  const { t } = useLang()

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setResult(null); setMlDown(false)
    try {
      const data = await predictSuitability({
        temperature: parseFloat(form.temperature),
        rainfall:    parseFloat(form.rainfall),
        ph:          parseFloat(form.ph),
        soil_type:   form.soil_type,
        humidity:    parseFloat(form.humidity)
      })
      setResult(data)
      toast.success(`✅ ${t('predictionCompleteMsg')}`)
    } catch (err) {
      if (err.isMLDown) { setMlDown(true) }
      else toast.error(err.response?.data?.error || t('predictionFailedMsg'))
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <Leaf size={16} color="var(--green)"/>
          <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'var(--green)', textTransform:'uppercase' }}>{t('suitability')}</span>
        </div>
        <h1>{t('suitabilityTitle')}</h1>
        <p>{t('suitabilitySub')}</p>
      </div>

      {mlDown && <MLServerBanner onClose={() => setMlDown(false)} />}

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div style={{ fontSize:14, fontWeight:700, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:14 }}>
            🌡 {t('environmentParams')}
          </div>
          <form onSubmit={submit}>
            <div className="grid-2">
              <div className="input-group">
                <label>{t('temperature')}</label>
                <input className="input-field" name="temperature" type="number" step="0.1" min="0" max="50" placeholder="e.g. 28.5" value={form.temperature} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('rainfall')}</label>
                <input className="input-field" name="rainfall" type="number" step="0.1" min="0" placeholder="e.g. 200" value={form.rainfall} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('soilPh')}</label>
                <input className="input-field" name="ph" type="number" step="0.1" min="0" max="14" placeholder="e.g. 6.5" value={form.ph} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('humidity')}</label>
                <input className="input-field" name="humidity" type="number" step="0.1" min="0" max="100" placeholder="e.g. 75" value={form.humidity} onChange={handle} required/>
              </div>
            </div>
            <div className="input-group">
              <label>{t('soilType')}</label>
              <select className="input-field" name="soil_type" value={form.soil_type} onChange={handle}>
                <option value="clay">{t('clay')}</option>
                <option value="loam">{t('loam')}</option>
                <option value="sandy">{t('sandy')}</option>
              </select>
            </div>
            <div style={{ background:'rgba(46,204,113,0.05)', border:'1px solid rgba(46,204,113,0.15)', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--green)', fontWeight:700, marginBottom:6, fontFamily:'monospace' }}>{t('idealConditions').toUpperCase()}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>🌡 22–32°C &nbsp;|&nbsp; 🌧 ≥150mm &nbsp;|&nbsp; 🧪 pH 5.5–7.5 &nbsp;|&nbsp; 💧 60–90%</div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> {t('predicting')}</>
                : `🌱 ${t('predictSuitability')}`}
            </button>
          </form>
        </div>

        <div>
          {result
            ? <ResultDisplay result={result} type="suitability" t={t}/>
            : <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:280, textAlign:'center', gap:14 }}>
                <div style={{ fontSize:64, opacity:0.1 }}>🌱</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.3)' }}>
                  {t('fillForm')}<br/><strong style={{color:'var(--green)'}}>{t('predictSuitability')}</strong>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
