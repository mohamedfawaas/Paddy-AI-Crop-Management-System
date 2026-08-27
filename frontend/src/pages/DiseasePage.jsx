import { useState, useRef } from 'react'
import { predictDisease } from '../services/diseaseService'
import ResultDisplay from '../components/ResultDisplay'
import MLServerBanner from '../components/MLServerBanner'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { pingNotificationRefresh } from '../utils/notifyBus'
import { Bug, Camera, Upload, X } from 'lucide-react'

const DISEASES_REF = [
  { name:'Leaf Blast',             emoji:'🍃', color:'#e74c3c', desc:'Diamond grey/white lesions on leaves',       tip:'Close-up of affected leaf blade in daylight' },
  { name:'Brown Spot',             emoji:'🟤', color:'#e67e22', desc:'Oval brown spots with yellow halo',          tip:'Capture spots clearly — avoid blur' },
  { name:'Bacterial Leaf Blight',  emoji:'⚡', color:'#f4c430', desc:'Yellow margin lesions on leaf tips',          tip:'Include leaf tip and margin in frame' },
  { name:'Sheath Blight',          emoji:'🌾', color:'#c0392b', desc:'Greenish-grey oval lesions on leaf sheaths', tip:'Photograph lower stem/sheath area' },
  { name:'Healthy Rice Leaf',      emoji:'✅', color:'#2ecc71', desc:'No disease — healthy green leaf',            tip:'Full leaf with natural lighting' },
]
// NOTE: Tungro Disease (from the project report) is not yet covered — the
// trained model's dataset (Kaggle "Rice Leaf Disease Dataset") doesn't include
// it. The model also detects 2 extra classes not in the report (Leaf Scald,
// Narrow Brown Leaf Spot, Rice Hispa) — those still return valid results, just
// aren't listed here since they're outside the original 6-disease scope.

export default function DiseasePage() {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [imageData, setImageData] = useState(null) // base64 data URL — used for the PDF report
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [mlDown, setMlDown]   = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()
  const { t } = useLang()

  const handleFile = (f) => {
    if (!f) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const allowedExt = /\.(jpe?g|png|webp)$/i.test(f.name || '')
    if (!allowedTypes.includes((f.type || '').toLowerCase()) || !allowedExt) {
      toast.error(t('invalidDiseaseFile'))
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error(t('imageTooLarge'))
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); setMlDown(false)
    // Also keep a base64 copy (not just the blob: URL) so it can be embedded
    // directly into the downloadable PDF report later.
    const reader = new FileReader()
    reader.onload = () => setImageData(reader.result)
    reader.readAsDataURL(f)
  }

  const clearFile = () => { setFile(null); setPreview(null); setImageData(null); setResult(null); if (inputRef.current) inputRef.current.value = '' }

  const onDrop = e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const submit = async () => {
    if (!file) { toast.error(t('selectLeafFirst')); return }
    setLoading(true); setResult(null); setMlDown(false)
    try {
      const data = await predictDisease(file)
      setResult(data)
      toast.success(`🔬 ${t('diseaseComplete')}`)
      pingNotificationRefresh()
    } catch (err) {
      if (err.isMLDown) { setMlDown(true); toast.error(t('mlServerDown')) }
      else toast.error(err.response?.data?.error || t('detectionFailed'))
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <Bug size={16} color="#e74c3c"/>
          <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'#e74c3c', textTransform:'uppercase' }}>{t('disease')}</span>
        </div>
        <h1>{t('diseaseTitle')}</h1>
        <p>{t('diseaseSub')}</p>
      </div>

      {mlDown && <MLServerBanner onClose={() => setMlDown(false)} />}

      <div className="grid-2" style={{ alignItems:'start' }}>
        {/* LEFT — Upload */}
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:16, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:14 }}>
              <Camera size={14} style={{marginRight:6, verticalAlign:'middle'}}/> {t('uploadPaddyLeafImage')}
            </div>

            {/* Drop zone */}
            {!preview ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? '#e74c3c' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius:12, padding:'36px 20px', textAlign:'center', cursor:'pointer',
                  background: dragging ? 'rgba(231,76,60,0.05)' : 'rgba(255,255,255,0.02)',
                  transition:'all 0.2s', marginBottom:14
                }}>
                <div style={{ fontSize:40, marginBottom:12, opacity:0.4 }}>🌿</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>
                  {t('dragDrop')}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)', marginBottom:14 }}>{t('or')}</div>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  padding:'8px 20px', borderRadius:8,
                  background:'rgba(231,76,60,0.12)', border:'1px solid rgba(231,76,60,0.3)',
                  color:'#e74c3c', fontSize:13, fontWeight:600
                }}>
                  <Upload size={14}/> {t('browseImage')}
                </div>
                <div style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,0.2)' }}>{t('supportedImages')}</div>
              </div>
            ) : (
              <div style={{ marginBottom:14, position:'relative', borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
                <img src={preview} alt="Leaf preview" style={{ width:'100%', height:200, objectFit:'cover', display:'block' }}/>
                <div style={{ padding:'8px 12px', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', gap:6 }}>
                    <Camera size={12}/> {file?.name} ({(file?.size/1024).toFixed(1)} KB)
                  </span>
                  <button onClick={clearFile} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12 }}>
                    <X size={14}/> {t('remove')}
                  </button>
                </div>
              </div>
            )}

            <input ref={inputRef} type="file" style={{ display:'none' }}
              onChange={e => handleFile(e.target.files[0])}/>

            {preview && (
              <button onClick={() => inputRef.current?.click()}
                style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px', color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer', marginBottom:10 }}>
                🔄 {t('changeImage')}
              </button>
            )}

            <button onClick={submit} disabled={loading || !file}
              style={{
                width:'100%', padding:'13px', borderRadius:10, border:'none',
                background: (!file||loading) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#c0392b,#e74c3c)',
                color: (!file||loading) ? 'rgba(255,255,255,0.3)' : '#fff',
                fontSize:14, fontWeight:700, cursor: (!file||loading)?'not-allowed':'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.2s'
              }}>
              {loading
                ? <><span className="spinner" style={{width:18,height:18,borderWidth:2}}/> {t('detecting')}</>
                : `🔬 ${t('detectDisease')}`}
            </button>

            {/* Photo tips */}
            <div style={{ marginTop:14, padding:'12px 14px', background:'rgba(52,152,219,0.06)', border:'1px solid rgba(52,152,219,0.15)', borderRadius:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#3498db', marginBottom:6, fontFamily:'monospace', letterSpacing:1 }}>📷 {t('betterScanTips')}</div>
              {[t('scanTip1'),t('scanTip2'),t('scanTip3'),t('scanTip4')].map((tip,i) => (
                <div key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:3, display:'flex', gap:8 }}>
                  <span style={{ color:'#3498db' }}>✓</span>{tip}
                </div>
              ))}
            </div>
          </div>

          {/* Disease Reference */}
          <div className="card">
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
              📚 {t('detectableDiseases')}
            </div>
            {DISEASES_REF.map(d => (
              <div key={d.name} style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:`1px solid ${d.color}15`, marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:18 }}>{d.emoji}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:d.color }}>{d.name}</span>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:3 }}>{d.desc}</div>
                <div style={{ fontSize:11, color:'rgba(52,152,219,0.65)', display:'flex', gap:4, alignItems:'center' }}>
                  <Camera size={10}/> {d.tip}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Result */}
        <div>
          {result
            ? <ResultDisplay result={result} type="disease" t={t} image={imageData}/>
            : <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:340, textAlign:'center', gap:16 }}>
                <div style={{ fontSize:72, opacity:0.08 }}>🔬</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.3)', lineHeight:1.7 }}>
                  {t('uploadPrompt')}<br/>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>{t('cnnAnalyze')}</span>
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
