import { useState } from 'react'
import { predictYield } from '../services/yieldService'
import ResultDisplay from '../components/ResultDisplay'
import MLServerBanner from '../components/MLServerBanner'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { pingNotificationRefresh } from '../utils/notifyBus'
import { TrendingUp } from 'lucide-react'

const def = { fertilizer_kg_acre:'', rainfall_mm:'', temperature:'', seed_variety:'BG 358', irrigation_type:'Full Irrigation', disease_status:'None', soil_quality:'Good' }
const SEEDS = ['BG 352', 'BG 358', 'BG 359', 'AT 362', 'Traditional']
const IRRIGATION = ['Rainfed', 'Partial Irrigation', 'Full Irrigation']
const DISEASE = ['None', 'Mild', 'Moderate', 'Severe']
const SOIL_Q = ['Poor', 'Average', 'Good', 'Excellent']

export default function YieldPage() {
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
      const data = await predictYield({
        fertilizer_kg_acre: parseFloat(form.fertilizer_kg_acre),
        rainfall_mm:         parseFloat(form.rainfall_mm),
        temperature:         parseFloat(form.temperature),
        seed_variety:        form.seed_variety,
        irrigation_type:     form.irrigation_type,
        disease_status:      form.disease_status,
        soil_quality:        form.soil_quality,
      })
      setResult(data)
      toast.success(`✅ ${t('yieldEstimatedMsg')}`)
      pingNotificationRefresh()
    } catch (err) {
      if (err.isMLDown) { setMlDown(true) }
      else toast.error(err.response?.data?.error || t('predictionFailedMsg'))
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <TrendingUp size={16} color="var(--green)"/>
          <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'var(--green)', textTransform:'uppercase' }}>{t('yield')}</span>
        </div>
        <h1>{t('yieldTitle')}</h1>
        <p>{t('yieldSub')}</p>
      </div>

      {mlDown && <MLServerBanner onClose={() => setMlDown(false)} />}

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div style={{ fontSize:14, fontWeight:700, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:14 }}>
            📈 {t('cultivationParams')}
          </div>
          <form onSubmit={submit}>
            <div className="grid-2">
              <div className="input-group">
                <label>{t('fertilizerUsed')}</label>
                <input className="input-field" name="fertilizer_kg_acre" type="number" step="0.1" placeholder="e.g. 60" value={form.fertilizer_kg_acre} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('rainfall')}</label>
                <input className="input-field" name="rainfall_mm" type="number" step="1" placeholder="e.g. 1500" value={form.rainfall_mm} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('temperature')}</label>
                <input className="input-field" name="temperature" type="number" step="0.1" placeholder="e.g. 28" value={form.temperature} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('seedVariety')}</label>
                <select className="input-field" name="seed_variety" value={form.seed_variety} onChange={handle}>
                  {SEEDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>{t('irrigationPattern')}</label>
                <select className="input-field" name="irrigation_type" value={form.irrigation_type} onChange={handle}>
                  {IRRIGATION.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>{t('diseaseStatus')}</label>
                <select className="input-field" name="disease_status" value={form.disease_status} onChange={handle}>
                  {DISEASE.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>{t('soilQuality')}</label>
                <select className="input-field" name="soil_quality" value={form.soil_quality} onChange={handle}>
                  {SOIL_Q.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> {t('predicting')}</>
                : `📈 ${t('predictYield')}`}
            </button>
          </form>
        </div>

        <div>
          {result
            ? <ResultDisplay result={result} type="yield" t={t}/>
            : <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:280, textAlign:'center', gap:14 }}>
                <div style={{ fontSize:64, opacity:0.1 }}>📈</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.3)' }}>
                  {t('fillForm')}<br/><strong style={{color:'var(--green)'}}>{t('predictYield')}</strong>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
