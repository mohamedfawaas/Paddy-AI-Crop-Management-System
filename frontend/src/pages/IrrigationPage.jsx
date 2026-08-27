import { useState } from 'react'
import { predictIrrigation } from '../services/irrigationService'
import ResultDisplay from '../components/ResultDisplay'
import MLServerBanner from '../components/MLServerBanner'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { pingNotificationRefresh } from '../utils/notifyBus'
import { Droplets } from 'lucide-react'

const def = { temperature:'', humidity:'', rainfall:'', soil_moisture:'', crop_stage:'vegetative' }

export default function IrrigationPage() {
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
      const data = await predictIrrigation({
        temperature:   parseFloat(form.temperature),
        humidity:      parseFloat(form.humidity),
        rainfall:      parseFloat(form.rainfall),
        soil_moisture: parseFloat(form.soil_moisture),
        crop_stage:    form.crop_stage
      })
      setResult(data)
      toast.success(`✅ ${t('analysisCompleteMsg')}`)
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
          <Droplets size={16} color="#3498db"/>
          <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'#3498db', textTransform:'uppercase' }}>{t('irrigation')}</span>
        </div>
        <h1>{t('irrigationTitle')}</h1>
        <p>{t('irrigationSub')}</p>
      </div>

      {mlDown && <MLServerBanner onClose={() => setMlDown(false)} />}

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div style={{ fontSize:14, fontWeight:700, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:14 }}>
            💧 {t('fieldConditions')}
          </div>
          <form onSubmit={submit}>
            <div className="grid-2">
              <div className="input-group">
                <label>{t('temperature')}</label>
                <input className="input-field" name="temperature" type="number" step="0.1" placeholder="e.g. 30" value={form.temperature} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('humidity')}</label>
                <input className="input-field" name="humidity" type="number" step="0.1" min="0" max="100" placeholder="e.g. 65" value={form.humidity} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('rainfall')}</label>
                <input className="input-field" name="rainfall" type="number" step="0.1" min="0" placeholder="e.g. 20" value={form.rainfall} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('soilMoisture')}</label>
                <input className="input-field" name="soil_moisture" type="number" step="0.1" min="0" max="100" placeholder="e.g. 35" value={form.soil_moisture} onChange={handle} required/>
              </div>
            </div>
            <div className="input-group">
              <label>{t('cropStage')}</label>
              <select className="input-field" name="crop_stage" value={form.crop_stage} onChange={handle}>
                <option value="seedling">🌱 {t('seedling')} (25mm)</option>
                <option value="vegetative">🌿 {t('vegetative')} (40mm)</option>
                <option value="flowering">🌸 {t('flowering')} (50mm)</option>
                <option value="ripening">🌾 {t('ripening')} (20mm)</option>
              </select>
            </div>
            <div style={{ background:'rgba(52,152,219,0.05)', border:'1px solid rgba(52,152,219,0.15)', borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
              <div style={{ fontSize:11, color:'#3498db', fontWeight:700, marginBottom:6, fontFamily:'monospace' }}>{t('waterNeeds').toUpperCase()}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.8 }}>🌱 25mm &nbsp;|&nbsp; 🌿 40mm &nbsp;|&nbsp; 🌸 50mm &nbsp;|&nbsp; 🌾 20mm</div>
            </div>
            <button type="submit" className="btn w-full" disabled={loading} style={{ background:loading?undefined:'#3498db', color:'#fff', border:'none', fontWeight:600 }}>
              {loading
                ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> {t('analyzing')}</>
                : `💧 ${t('getAdvice')}`}
            </button>
          </form>
        </div>

        <div>
          {result
            ? <ResultDisplay result={result} type="irrigation" t={t}/>
            : <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:280, textAlign:'center', gap:14 }}>
                <div style={{ fontSize:64, opacity:0.1 }}>💧</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.3)' }}>
                  {t('fillForm')}<br/><strong style={{color:'#3498db'}}>{t('getAdvice')}</strong>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
