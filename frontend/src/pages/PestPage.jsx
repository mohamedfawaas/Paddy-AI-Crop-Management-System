import { useState } from 'react'
import { predictPest } from '../services/pestService'
import ResultDisplay from '../components/ResultDisplay'
import MLServerBanner from '../components/MLServerBanner'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { pingNotificationRefresh } from '../utils/notifyBus'
import { Bug } from 'lucide-react'

const def = { temperature:'', humidity:'', rainfall_7d_mm:'', growth_stage:'Vegetative' }
const STAGES = ['Seedling', 'Vegetative', 'Tillering', 'Flowering', 'Ripening']

export default function PestPage() {
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
      const data = await predictPest({
        temperature:     parseFloat(form.temperature),
        humidity:        parseFloat(form.humidity),
        rainfall_7d_mm:  parseFloat(form.rainfall_7d_mm),
        growth_stage:    form.growth_stage,
      })
      setResult(data)
      toast.success(`✅ ${t('riskAssessedMsg')}`)
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
          <Bug size={16} color="var(--green)"/>
          <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'var(--green)', textTransform:'uppercase' }}>{t('pest')}</span>
        </div>
        <h1>{t('pestTitle')}</h1>
        <p>{t('pestSub')}</p>
      </div>

      {mlDown && <MLServerBanner onClose={() => setMlDown(false)} />}

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div style={{ fontSize:14, fontWeight:700, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:14 }}>
            🐛 {t('fieldConditions')}
          </div>
          <form onSubmit={submit}>
            <div className="grid-2">
              <div className="input-group">
                <label>{t('temperature')}</label>
                <input className="input-field" name="temperature" type="number" step="0.1" placeholder="e.g. 29" value={form.temperature} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('humidity')}</label>
                <input className="input-field" name="humidity" type="number" step="0.1" placeholder="e.g. 85" value={form.humidity} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('rainfall7d')}</label>
                <input className="input-field" name="rainfall_7d_mm" type="number" step="0.1" placeholder="e.g. 20" value={form.rainfall_7d_mm} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('cropStage')}</label>
                <select className="input-field" name="growth_stage" value={form.growth_stage} onChange={handle}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> {t('predicting')}</>
                : `🐛 ${t('checkPestRisk')}`}
            </button>
          </form>
        </div>

        <div>
          {result
            ? <ResultDisplay result={result} type="pest" t={t}/>
            : <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:280, textAlign:'center', gap:14 }}>
                <div style={{ fontSize:64, opacity:0.1 }}>🐛</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.3)' }}>
                  {t('fillForm')}<br/><strong style={{color:'var(--green)'}}>{t('checkPestRisk')}</strong>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
