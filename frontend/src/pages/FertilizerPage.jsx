import { useState } from 'react'
import { predictFertilizer } from '../services/fertilizerService'
import ResultDisplay from '../components/ResultDisplay'
import MLServerBanner from '../components/MLServerBanner'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { Sprout } from 'lucide-react'

const def = { temperature:'', humidity:'', moisture:'', soil_type:'Loamy', crop_type:'Paddy', nitrogen:'', potassium:'', phosphorous:'' }
const SOILS = ['Black', 'Clayey', 'Loamy', 'Red', 'Sandy']

export default function FertilizerPage() {
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
      const data = await predictFertilizer({
        temperature: parseFloat(form.temperature),
        humidity:    parseFloat(form.humidity),
        moisture:    parseFloat(form.moisture),
        soil_type:   form.soil_type,
        crop_type:   form.crop_type,
        nitrogen:    parseFloat(form.nitrogen),
        potassium:   parseFloat(form.potassium),
        phosphorous: parseFloat(form.phosphorous),
      })
      setResult(data)
      toast.success(`✅ ${t('recommendationReadyMsg')}`)
    } catch (err) {
      if (err.isMLDown) { setMlDown(true) }
      else toast.error(err.response?.data?.error || t('predictionFailedMsg'))
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <Sprout size={16} color="var(--green)"/>
          <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'var(--green)', textTransform:'uppercase' }}>{t('fertilizer')}</span>
        </div>
        <h1>{t('fertilizerTitle')}</h1>
        <p>{t('fertilizerSub')}</p>
      </div>

      {mlDown && <MLServerBanner onClose={() => setMlDown(false)} />}

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          <div style={{ fontSize:14, fontWeight:700, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:14 }}>
            🌱 {t('soilNutrientParams')}
          </div>
          <form onSubmit={submit}>
            <div className="grid-2">
              <div className="input-group">
                <label>{t('temperature')}</label>
                <input className="input-field" name="temperature" type="number" step="0.1" placeholder="e.g. 28" value={form.temperature} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('humidity')}</label>
                <input className="input-field" name="humidity" type="number" step="0.1" placeholder="e.g. 65" value={form.humidity} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('soilMoisture')}</label>
                <input className="input-field" name="moisture" type="number" step="0.1" placeholder="e.g. 40" value={form.moisture} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('soilType')}</label>
                <select className="input-field" name="soil_type" value={form.soil_type} onChange={handle}>
                  {SOILS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>{t('nitrogen')}</label>
                <input className="input-field" name="nitrogen" type="number" step="0.1" placeholder="e.g. 25" value={form.nitrogen} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('potassium')}</label>
                <input className="input-field" name="potassium" type="number" step="0.1" placeholder="e.g. 10" value={form.potassium} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('phosphorous')}</label>
                <input className="input-field" name="phosphorous" type="number" step="0.1" placeholder="e.g. 15" value={form.phosphorous} onChange={handle} required/>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> {t('predicting')}</>
                : `🌱 ${t('getFertilizerAdvice')}`}
            </button>
          </form>
        </div>

        <div>
          {result
            ? <ResultDisplay result={result} type="fertilizer" t={t}/>
            : <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:280, textAlign:'center', gap:14 }}>
                <div style={{ fontSize:64, opacity:0.1 }}>🌱</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.3)' }}>
                  {t('fillForm')}<br/><strong style={{color:'var(--green)'}}>{t('getFertilizerAdvice')}</strong>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
