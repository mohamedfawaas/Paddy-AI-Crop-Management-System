import { useState } from 'react'
import { ChevronDown, ChevronUp, Shield, Stethoscope, AlertTriangle, Info, ThumbsUp, ThumbsDown, Eye, EyeOff, Check, FileDown } from 'lucide-react'
import { submitPredictionFeedback } from '../services/predictionService'
import { exportPredictionPdf } from '../utils/pdfExport'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'

// ── Shared: low-confidence warning banner (Feature 4) ───────────────────────
function LowConfidenceWarning({ result }) {
  const { t } = useLang()
  if (!result?.low_confidence) return null
  return (
    <div style={{
      display:'flex', gap:10, alignItems:'flex-start', padding:'12px 16px',
      background:'rgba(244,196,48,0.08)', border:'1px solid rgba(244,196,48,0.3)',
      borderRadius:10, marginBottom:14,
    }}>
      <AlertTriangle size={16} color="var(--gold)" style={{ flexShrink:0, marginTop:1 }}/>
      <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>
        <strong style={{ color:'var(--gold)' }}>{t('lowConfidence')}</strong> {t('lowConfidenceHelp')}
      </div>
    </div>
  )
}

// ── Shared: farmer feedback widget (Feature 2) ───────────────────────────────
function FeedbackWidget({ predictionId, color = 'var(--green)' }) {
  const { t } = useLang()
  const [sent, setSent] = useState(null) // null | 'ACCURATE' | 'INACCURATE'
  const [busy, setBusy] = useState(false)

  if (!predictionId) return null

  const send = async (value) => {
    if (busy || sent) return
    setBusy(true)
    try {
      await submitPredictionFeedback(predictionId, value)
      setSent(value)
      toast.success(value === 'ACCURATE' ? t('feedbackThanksAccurate') : t('feedbackThanksRecorded'))
    } catch {
      toast.error(t('feedbackSaveFailed'))
    } finally { setBusy(false) }
  }

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
      padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:10, marginTop:4,
    }}>
      <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.5)' }}>{t('predictionAccurateQuestion')}</span>
      {sent ? (
        <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color }}>
          <Check size={14}/> {sent === 'ACCURATE' ? t('markedAccurate') : t('feedbackRecorded')}
        </span>
      ) : (
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => send('ACCURATE')} disabled={busy} style={{
            display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8,
            background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.3)',
            color:'#2ecc71', fontSize:12, fontWeight:600, cursor:'pointer', outline:'none',
          }}><ThumbsUp size={13}/> {t('yes')}</button>
          <button onClick={() => send('INACCURATE')} disabled={busy} style={{
            display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8,
            background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.3)',
            color:'#e74c3c', fontSize:12, fontWeight:600, cursor:'pointer', outline:'none',
          }}><ThumbsDown size={13}/> {t('no')}</button>
        </div>
      )}
    </div>
  )
}

// ── Shared: Grad-CAM explainability heatmap (Feature 3, disease only) ───────
function GradCamViewer({ heatmapImage }) {
  const { t } = useLang()
  const [show, setShow] = useState(false)
  if (!heatmapImage) return null
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'14px 16px' }}>
      <button onClick={() => setShow(!show)} style={{
        width:'100%', background:'none', border:'none', display:'flex', justifyContent:'space-between',
        alignItems:'center', cursor:'pointer', color:'white', padding:0, outline:'none',
      }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#3498db', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', display:'flex', alignItems:'center', gap:6 }}>
          {show ? <Eye size={13}/> : <EyeOff size={13}/>} {t('aiFocusMap')}
        </span>
        {show ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
      </button>
      {show && (
        <div style={{ marginTop:12 }}>
          <img src={heatmapImage} alt="Grad-CAM heatmap" style={{ width:'100%', borderRadius:10, display:'block' }}/>
          <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.4)', marginTop:8, lineHeight:1.6 }}>
            {t('aiFocusHelp')}
          </div>
        </div>
      )}
    </div>
  )
}


// ── Disease treatment data with Wikimedia images (free-to-use) ──────────────
const DISEASE_DETAIL = {
  'Leaf Blast': {
    color: '#e74c3c',
    symptoms: [
      'Diamond or spindle-shaped grey/white spots on leaves',
      'Brown or reddish-brown border around each lesion',
      'Lesions appear first on young leaves during humid weather',
      'Severe infection causes entire leaf to die and fall',
    ],
    treatments: [
      {
        step: '1', icon: '💊', title: 'Apply Tricyclazole Fungicide',
        desc: 'Mix Tricyclazole (0.6g per 1 litre of water). Spray evenly on all affected leaves, especially the underside. Repeat after 7–10 days.',
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Fungicide_spray.jpg/320px-Fungicide_spray.jpg',
        imgAlt: 'Fungicide spraying on paddy',
        howTo: 'Fill sprayer → Add 0.6g Tricyclazole per litre → Spray in morning or evening (not midday). Cover both sides of leaves.'
      },
      {
        step: '2', icon: '🌿', title: 'Remove & Burn Infected Leaves',
        desc: 'Cut off severely infected leaves using clean scissors. Burn or bury them away from the field to stop fungal spores spreading.',
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Rice_leaf_blast.jpg/320px-Rice_leaf_blast.jpg',
        imgAlt: 'Leaf blast infected rice leaf',
        howTo: 'Wear gloves → Cut leaf 2cm below the lesion → Collect in bag → Burn away from field. Do NOT leave on ground.'
      },
      {
        step: '3', icon: '💧', title: 'Drain Standing Water',
        desc: 'Drain field water for 3–4 days. High humidity and standing water accelerate leaf blast spread. Allow soil surface to dry slightly.',
        howTo: 'Open drainage channels → Allow field to dry for 3–4 days → Re-flood only when symptoms reduce.'
      },
      {
        step: '4', icon: '🔬', title: 'Monitor Every 7 Days',
        desc: 'Check all plants weekly. If disease spreads to more than 20% of plants, apply second fungicide spray immediately.',
        howTo: 'Walk through field diagonally → Check 10 plants per row → Count % of infected leaves → Act if >20% infected.'
      },
    ],
    prevention: [
      'Use blast-resistant varieties: BG 366, BG 250, BG 300',
      'Avoid applying excess nitrogen fertilizer',
      'Maintain proper plant spacing for air circulation',
      'Apply preventive fungicide spray at tillering stage',
      'Use certified disease-free seeds only',
    ],
    severityAction: {
      Severe:   '🚨 Spray fungicide within 24 hours. Drain field immediately.',
      Moderate: '⚠️ Apply fungicide within 3 days. Remove worst-affected leaves.',
      Mild:     '👀 Monitor daily. Prepare fungicide for spray.',
      None:     '✅ No action needed. Continue regular monitoring.',
    }
  },

  'Brown Spot': {
    color: '#e67e22',
    symptoms: [
      'Oval or circular brown spots with yellowish halo on leaves',
      'Spots also appear on leaf sheaths, grains, and glumes',
      'Lesions have grey/white centre with brown or purple border',
      'Can appear at any stage from seedling to grain filling',
    ],
    treatments: [
      {
        step: '1', icon: '💊', title: 'Apply Mancozeb Fungicide',
        desc: 'Spray Mancozeb 75 WP (2.5g per litre) or Propiconazole (1ml per litre). Spray 2 times with 10-day interval.',
        howTo: 'Mix 2.5g Mancozeb in 1L water → Use knapsack sprayer → Spray on leaves thoroughly → Repeat after 10 days.'
      },
      {
        step: '2', icon: '🌱', title: 'Apply Potassium Fertilizer',
        desc: 'Brown spot is linked to potassium and silicon deficiency. Apply Muriate of Potash (MOP) at 25kg/acre to strengthen plant immunity.',
        howTo: 'Broadcast MOP evenly → Mix into soil or apply to wet soil → Water the field after application.'
      },
      {
        step: '3', icon: '💧', title: 'Improve Water Management',
        desc: 'Avoid water stress — alternate wetting and drying. Waterlogged or too-dry conditions both increase Brown Spot severity.',
        howTo: 'Maintain 5cm water depth → Drain only at panicle stage → Avoid drought stress especially at flowering.'
      },
    ],
    prevention: [
      'Treat seeds with Thiram (3g per kg seed) before sowing',
      'Maintain balanced NPK fertilization — avoid nitrogen excess',
      'Use certified disease-free seeds',
      'Avoid water stress and waterlogging',
      'Apply silicon fertilizer to strengthen leaf cells',
    ],
    severityAction: {
      Severe:   '🚨 Spray Mancozeb immediately + apply potassium fertilizer.',
      Moderate: '⚠️ Fungicide spray within 3 days + check soil nutrition.',
      Mild:     '👀 Improve fertilization and water management.',
      None:     '✅ No action needed.',
    }
  },

  'Bacterial Leaf Blight': {
    color: '#f4c430',
    symptoms: [
      'Water-soaked lesions starting from leaf tip or margins',
      'Lesions turn yellow, then white/grey as they spread',
      'Bacterial ooze dries as yellowish beads on leaf surface',
      'Leaves wither and die from tip downward',
      'Most severe during heavy rain and flood conditions',
    ],
    treatments: [
      {
        step: '1', icon: '💊', title: 'Spray Copper Oxychloride',
        desc: 'Mix Copper Oxychloride (3g per litre) and spray on all plants. Alternatively use Streptomycin Sulphate (0.1g/L). Repeat after 7 days.',
        howTo: 'Mix 3g Copper Oxychloride in 1L water → Spray whole plant including stem base → Do not spray during rain → Repeat after 7 days.'
      },
      {
        step: '2', icon: '💧', title: 'Drain Field IMMEDIATELY',
        desc: 'Bacteria spread through water. Drain the entire field to reduce water-borne spread. Keep field dry for at least 5 days.',
        howTo: 'Open all drainage outlets → Remove standing water → Keep bunds intact to prevent water flow between fields.'
      },
      {
        step: '3', icon: '⚠️', title: 'STOP Nitrogen Fertilizer',
        desc: 'Do NOT apply any nitrogen fertilizer until disease is controlled. Nitrogen causes lush growth which bacteria thrive on.',
        howTo: 'Stop all urea and ammonium sulphate applications → Resume only after full recovery (minimum 3 weeks).'
      },
      {
        step: '4', icon: '🔥', title: 'Remove Severely Infected Plants',
        desc: 'Uproot and burn plants that are more than 70% infected. This prevents bacterial reservoir from reinfecting healthy plants.',
        howTo: 'Uproot entire plant (including roots) → Place in bag → Burn far from field → Wash hands with soap after handling.'
      },
    ],
    prevention: [
      'Plant resistant varieties: BG 300, BG 406, At 307',
      'Never apply excess nitrogen fertilizer',
      'Use clean uninfected water source for irrigation',
      'Do not work in wet field — spreads bacteria on tools and shoes',
      'Treat seeds with Agrimycin before sowing',
    ],
    severityAction: {
      Severe:   '🚨 Drain field + copper fungicide within 24h. Stop all nitrogen.',
      Moderate: '⚠️ Apply copper fungicide + drain field this week.',
      Mild:     '👀 Monitor, prepare copper fungicide, stop excess nitrogen.',
      None:     '✅ No action needed.',
    }
  },

  'Healthy': {
    color: '#2ecc71',
    symptoms: [
      'Bright, uniform green leaf color throughout',
      'No spots, lesions, or discoloration visible',
      'Leaves are firm, upright and healthy',
      'Normal growth pattern and plant height',
    ],
    treatments: [],
    prevention: [
      'Continue monitoring every 7–10 days',
      'Maintain balanced NPK fertilization schedule',
      'Ensure proper field drainage',
      'Keep field free from weeds',
      'Use certified seeds for next season',
    ],
    severityAction: {}
  },

  'Leaf Smut': {
    color: '#8e44ad',
    symptoms: [
      'Small, angular, black speckled spots scattered on leaf surface',
      'Spots may merge to form larger irregular black patches',
      'Older leaves affected more than younger leaves',
      'Usually a minor disease, rarely causes major yield loss',
    ],
    treatments: [
      {
        step: '1', icon: '💊', title: 'Apply Propiconazole / Tricyclazole',
        desc: 'Spray Propiconazole (1ml per litre) or Tricyclazole (0.6g per litre) on affected leaves. Repeat after 10 days if needed.',
        howTo: 'Mix fungicide as per label rate → Spray evenly on both leaf surfaces → Avoid spraying right before rain.'
      },
      {
        step: '2', icon: '🌱', title: 'Balance Fertilization',
        desc: 'Avoid excess nitrogen and ensure balanced NPK application — over-lush growth increases susceptibility.',
        howTo: 'Follow recommended NPK schedule for your seed variety → Split nitrogen doses instead of one heavy application.'
      },
    ],
    prevention: [
      'Use clean, disease-free certified seed',
      'Treat seed before sowing with a recommended fungicide',
      'Avoid excess nitrogen fertilization',
      'Remove and destroy crop residue after harvest',
    ],
    severityAction: {
      Severe:   '🚨 Apply fungicide spray + review fertilization plan.',
      Moderate: '⚠️ Fungicide spray recommended within the week.',
      Mild:     '👀 Monitor; usually low impact on yield.',
      None:     '✅ No action needed.',
    }
  }
}

function getDiseaseName(name) {
  if (!name) return null
  const keys = Object.keys(DISEASE_DETAIL)
  return keys.find(k => k.toLowerCase() === name.toLowerCase()) || null
}

// ── Suitability Result ──────────────────────────────────────────────────────
function SuitabilityResult({ result }) {
  const { t } = useLang()
  const ok    = result.suitable
  const color = ok ? '#2ecc71' : '#e74c3c'
  const conf  = result.confidence || 0
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <LowConfidenceWarning result={result}/>
      <div style={{ background: ok ? 'linear-gradient(135deg,rgba(46,204,113,0.15),rgba(46,204,113,0.05))' : 'linear-gradient(135deg,rgba(231,76,60,0.15),rgba(231,76,60,0.05))', border:`1px solid ${color}40`, borderRadius:14, padding:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:16, right:20, fontSize:72, opacity:0.07 }}>{ok?'🌱':'⚠️'}</div>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color, textTransform:'uppercase', marginBottom:8 }}>{t('suitabilityResultLabel')}</div>
        <div style={{ fontSize:28, fontWeight:900, color, marginBottom:4 }}>{ok ? '✅ SUITABLE' : '❌ NOT SUITABLE'}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:20 }}>{t('forPaddy')}</div>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>
            <span>{t('aiConfidence')}</span><span style={{ color, fontWeight:700, fontSize:16 }}>{conf}%</span>
          </div>
          <div style={{ height:10, background:'rgba(255,255,255,0.07)', borderRadius:5, overflow:'hidden' }}>
            <div style={{ height:'100%', background:`linear-gradient(90deg,${color}80,${color})`, borderRadius:5, width:`${conf}%`, transition:'width 1.2s ease' }}/>
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[
          { label:'Risk Level',  value:result.risk_level,  color: result.risk_level==='Low'?'#2ecc71':'#e74c3c', icon:'⚡' },
          { label:'Soil Type',   value:result.soil_type,   color:'var(--gold)', icon:'🌍' },
          { label:'Confidence',  value:`${conf}%`,          color:'#3498db',     icon:'🎯' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'14px 12px', textAlign:'center', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:16, fontWeight:800, color:s.color, marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 18px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>💡 {t('recommendation')}</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.7 }}>{result.recommendation}</div>
      </div>
      <FeedbackWidget predictionId={result.predictionId} color="#2ecc71"/>
    </div>
  )
}

// ── Disease Result ──────────────────────────────────────────────────────────
function DiseaseResult({ result }) {
  const { t } = useLang()
  const [showPrev, setShowPrev] = useState(false)
  const healthy   = (result.disease_name || '').toLowerCase().includes('healthy')
  const color     = healthy ? '#2ecc71' : '#e74c3c'
  const dKey      = getDiseaseName(result.disease_name)
  const info      = dKey ? DISEASE_DETAIL[dKey] : null
  const dcolor    = info?.color || color

  const sevColor = { None:'#2ecc71', Mild:'#f4c430', Moderate:'#e67e22', Severe:'#e74c3c' }
  const sevPct   = { None:5, Mild:33, Moderate:66, Severe:100 }
  const sc  = sevColor[result.severity] || '#fff'
  const sp  = sevPct[result.severity] || 0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <LowConfidenceWarning result={result}/>
      {/* Verdict */}
      <div style={{ background: healthy ? 'linear-gradient(135deg,rgba(46,204,113,0.15),rgba(46,204,113,0.05))' : 'linear-gradient(135deg,rgba(231,76,60,0.15),rgba(231,76,60,0.05))', border:`1px solid ${color}40`, borderRadius:14, padding:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:12, right:20, fontSize:72, opacity:0.07 }}>{healthy?'🌿':'🦠'}</div>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color, textTransform:'uppercase', marginBottom:8 }}>{t('diseaseScanResult')}</div>
        <div style={{ fontSize:26, fontWeight:900, color, marginBottom:4 }}>{healthy ? '🌿 HEALTHY LEAF' : `🦠 ${result.disease_name?.toUpperCase()}`}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:20 }}>
          {healthy ? 'No disease detected — plant is healthy!' : 'Disease detected by CNN model'}
        </div>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>
            <span>{t('aiConfidence')}</span><span style={{ color, fontWeight:700, fontSize:15 }}>{result.confidence}%</span>
          </div>
          <div style={{ height:8, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', background:`linear-gradient(90deg,${color}70,${color})`, borderRadius:4, width:`${result.confidence}%`, transition:'width 1.2s' }}/>
          </div>
        </div>
      </div>

      {/* Severity */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px 18px' }}>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:2, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', marginBottom:12 }}>{t('severityLevel')}</div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {['None','Mild','Moderate','Severe'].map(s => (
            <div key={s} style={{
              flex:1, padding:'8px 4px', borderRadius:8, textAlign:'center', fontSize:11, fontWeight:700,
              background: result.severity===s ? `${sevColor[s]}25` : 'rgba(255,255,255,0.03)',
              color:      result.severity===s ? sevColor[s] : 'rgba(255,255,255,0.25)',
              border:`1px solid ${result.severity===s ? sevColor[s]+'50' : 'rgba(255,255,255,0.06)'}`,
            }}>{s}</div>
          ))}
        </div>
        <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#2ecc71,#f4c430,#e67e22,#e74c3c)', width:`${sp}%`, borderRadius:3, transition:'width 1s' }}/>
        </div>
        {info?.severityAction?.[result.severity] && (
          <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8, fontSize:12, color:'rgba(255,255,255,0.6)', display:'flex', gap:8 }}>
            <AlertTriangle size={14} color={sc} style={{ flexShrink:0, marginTop:1 }}/> {info.severityAction[result.severity]}
          </div>
        )}
      </div>

      {/* Symptoms */}
      {info?.symptoms && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 18px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.4)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            <Info size={13}/> {t('symptomsToLookFor')}
          </div>
          {info.symptoms.map((s, i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:6, fontSize:13, color:'rgba(255,255,255,0.65)' }}>
              <span style={{ color:'var(--gold)', flexShrink:0 }}>•</span>{s}
            </div>
          ))}
        </div>
      )}

      {/* Treatment Steps with Images */}
      {!healthy && info?.treatments?.length > 0 && (
        <div style={{ background:'rgba(231,76,60,0.05)', border:'1px solid rgba(231,76,60,0.2)', borderRadius:12, padding:'16px 18px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#e74c3c', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
            <Stethoscope size={13}/> {t('treatmentGuide')}
          </div>
          {info.treatments.map((step, i) => (
            <div key={i} style={{ marginBottom:16, background:'rgba(255,255,255,0.03)', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
              {/* Step header */}
              <div style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 14px' }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'rgba(231,76,60,0.15)', border:'1px solid rgba(231,76,60,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'monospace', letterSpacing:1 }}>{t('step')} {step.step}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{step.title}</div>
                </div>
              </div>
              {/* Step image (if available) */}
              {step.img && (
                <div style={{ position:'relative' }}>
                  <img src={step.img} alt={step.imgAlt}
                    style={{ width:'100%', height:140, objectFit:'cover', display:'block' }}
                    onError={e => { e.target.style.display='none' }}
                  />
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'6px 12px', background:'rgba(0,0,0,0.6)', fontSize:11, color:'rgba(255,255,255,0.6)' }}>
                    📷 {step.imgAlt}
                  </div>
                </div>
              )}
              {/* Description + How to */}
              <div style={{ padding:'12px 14px' }}>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6, marginBottom:8 }}>{step.desc}</div>
                {step.howTo && (
                  <div style={{ padding:'8px 12px', background:'rgba(46,204,113,0.06)', border:'1px solid rgba(46,204,113,0.15)', borderRadius:7, fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
                    <span style={{ color:'var(--green)', fontWeight:700, display:'block', marginBottom:3 }}>📋 {t('howToUse')}:</span>
                    {step.howTo}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prevention (collapsible) */}
      {info?.prevention && (
        <div style={{ background:'rgba(46,204,113,0.05)', border:'1px solid rgba(46,204,113,0.15)', borderRadius:12, padding:'14px 18px' }}>
          <button onClick={() => setShowPrev(!showPrev)} style={{ width:'100%', background:'none', border:'none', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', color:'white', padding:0, outline:'none' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--green)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', display:'flex', alignItems:'center', gap:6 }}>
              <Shield size={13}/> {t('preventionTips')}
            </span>
            {showPrev ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
          {showPrev && (
            <div style={{ marginTop:12 }}>
              {info.prevention.map((p, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8, fontSize:13, color:'rgba(255,255,255,0.65)' }}>
                  <span style={{ color:'var(--green)', flexShrink:0 }}>✓</span>{p}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Feature 3: Grad-CAM explainability heatmap */}
      <GradCamViewer heatmapImage={result.heatmap_image}/>

      <FeedbackWidget predictionId={result.predictionId} color="#e74c3c"/>
    </div>
  )
}

// ── Irrigation Result ───────────────────────────────────────────────────────
function IrrigationResult({ result }) {
  const { t } = useLang()
  const needed = result.irrigation_needed
  const color  = needed ? '#e67e22' : '#2ecc71'
  const urgColor = { 'Not Required':'#2ecc71', 'Moderate':'#e67e22', 'Urgent':'#e74c3c' }
  const uc = urgColor[result.urgency] || '#fff'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <LowConfidenceWarning result={result}/>
      <div style={{ background: needed ? 'linear-gradient(135deg,rgba(230,126,34,0.15),rgba(230,126,34,0.05))' : 'linear-gradient(135deg,rgba(46,204,113,0.15),rgba(46,204,113,0.05))', border:`1px solid ${color}40`, borderRadius:14, padding:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:12, right:20, fontSize:72, opacity:0.07 }}>{needed?'💧':'✅'}</div>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color, textTransform:'uppercase', marginBottom:8 }}>{t('irrigationStatus')}</div>
        <div style={{ fontSize:26, fontWeight:900, color, marginBottom:4 }}>{needed ? '💧 IRRIGATION REQUIRED' : '✅ NO IRRIGATION NEEDED'}</div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12 }}>
          <div style={{ padding:'5px 14px', borderRadius:20, background:`${uc}20`, border:`1px solid ${uc}40`, color:uc, fontSize:12, fontWeight:700 }}>
            {result.urgency}
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[
          { label:'Recommended Water', value:`${result.recommended_water_mm} mm`, color:'#3498db', icon:'💧' },
          { label:'Next Check In',     value:`${result.next_check_days} day(s)`,  color:'var(--gold)', icon:'📅' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'18px 16px', textAlign:'center', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 18px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>ℹ️ {t('analysis')}</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.7 }}>{result.reason}</div>
      </div>
      <FeedbackWidget predictionId={result.predictionId} color="#3498db"/>
    </div>
  )
}

// ── Fertilizer Result ───────────────────────────────────────────────────────
function FertilizerResult({ result }) {
  const { t } = useLang()
  const color = '#f4c430'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <LowConfidenceWarning result={result}/>
      <div style={{ background:'linear-gradient(135deg,rgba(244,196,48,0.15),rgba(244,196,48,0.05))', border:`1px solid ${color}40`, borderRadius:14, padding:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:12, right:20, fontSize:72, opacity:0.07 }}>🌱</div>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color, textTransform:'uppercase', marginBottom:8 }}>{t('recommendedFertilizerLabel')}</div>
        <div style={{ fontSize:30, fontWeight:900, color, marginBottom:4 }}>{result.fertilizer_name}</div>
        <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.5)', marginTop:8 }}>Confidence: {result.confidence}%</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'16px 18px', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>⚖️ {t('quantityRequired')}</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{result.quantity_kg_per_acre} kg / acre</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'16px 18px', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>📅 {t('applicationSchedule')}</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.7 }}>{result.application_schedule}</div>
        </div>
        <div style={{ background:'rgba(46,204,113,0.05)', border:'1px solid rgba(46,204,113,0.15)', borderRadius:12, padding:'16px 18px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--green)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>🌿 {t('organicAlternative')}</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.7 }}>{result.organic_alternative}</div>
        </div>
      </div>
      <FeedbackWidget predictionId={result.predictionId} color={color}/>
    </div>
  )
}

// ── Yield Result ─────────────────────────────────────────────────────────────
function YieldResult({ result }) {
  const { t } = useLang()
  const color = '#2ecc71'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <LowConfidenceWarning result={result}/>
      <div style={{ background:'linear-gradient(135deg,rgba(46,204,113,0.15),rgba(46,204,113,0.05))', border:`1px solid ${color}40`, borderRadius:14, padding:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:12, right:20, fontSize:72, opacity:0.07 }}>📈</div>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color, textTransform:'uppercase', marginBottom:8 }}>{t('estimatedYieldLabel')}</div>
        <div style={{ fontSize:30, fontWeight:900, color, marginBottom:4 }}>{result.estimated_yield_kg_acre} kg/acre</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[
          { label:'Expected Harvest', value:`${result.expected_harvest_days} days`, color:'var(--gold)', icon:'📅' },
          { label:'Production Efficiency', value:`${result.production_efficiency_score}%`, color:'#3498db', icon:'⚡' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'18px 16px', textAlign:'center', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'16px 18px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>ℹ️ {t('notesLabel')}</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.7 }}>{result.notes}</div>
      </div>
      <FeedbackWidget predictionId={result.predictionId} color={color}/>
    </div>
  )
}

// ── Pest Result ──────────────────────────────────────────────────────────────
function PestResult({ result }) {
  const { t } = useLang()
  const riskColor = { Low:'#2ecc71', Medium:'#e67e22', High:'#e74c3c' }
  const color = riskColor[result.risk_level] || '#e67e22'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <LowConfidenceWarning result={result}/>
      <div style={{ background:`linear-gradient(135deg,${color}25,${color}08)`, border:`1px solid ${color}40`, borderRadius:14, padding:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:12, right:20, fontSize:72, opacity:0.07 }}>🐛</div>
        <div style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color, textTransform:'uppercase', marginBottom:8 }}>{t('pestRiskLabel')}</div>
        <div style={{ fontSize:30, fontWeight:900, color, marginBottom:4 }}>{result.risk_level}</div>
        <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.5)', marginTop:8 }}>Confidence: {result.risk_score}%</div>
      </div>
      <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'16px 18px', border:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>🔍 {t('mostLikelyPest')}</div>
        <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{result.likely_pest}</div>
      </div>
      <div style={{ background:'rgba(46,204,113,0.05)', border:'1px solid rgba(46,204,113,0.15)', borderRadius:12, padding:'16px 18px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--green)', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>🛡 {t('preventionMeasures')}</div>
        {(result.prevention || []).map((p, i) => (
          <div key={i} style={{ display:'flex', gap:8, marginBottom:8, fontSize:13, color:'rgba(255,255,255,0.65)' }}>
            <span style={{ color:'var(--green)', flexShrink:0 }}>✓</span>{p}
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>💊 {t('chemicalOptionLabel')}</div>
          <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>{result.recommended_pesticide}</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'14px 16px', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>🌿 {t('organicOptionLabel')}</div>
          <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>{result.organic_option}</div>
        </div>
      </div>
      <FeedbackWidget predictionId={result.predictionId} color={color}/>
    </div>
  )
}

// ── Weather Advisory Result ─────────────────────────────────────────────────
function WeatherResult({ result }) {
  const { t } = useLang()
  const color = '#3498db'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {(result.alerts || []).some(a => !a.startsWith('✅')) && (
        <div style={{ background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.3)', borderRadius:12, padding:'14px 16px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#e74c3c', fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>⚠️ {t('alerts')}</div>
          {(result.alerts || []).map((a, i) => (
            <div key={i} style={{ fontSize:13, color:'rgba(255,255,255,0.8)', marginBottom:6 }}>{a}</div>
          ))}
        </div>
      )}
      {(result.alerts || []).every(a => a.startsWith('✅')) && (
        <div style={{ background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.3)', borderRadius:12, padding:'14px 16px', fontSize:13, color:'rgba(255,255,255,0.8)' }}>
          {result.alerts?.[0]}
        </div>
      )}
      {[
        { key:'best_planting_advice', label:'🌱 PLANTING ADVICE' },
        { key:'fertilizer_timing',    label:'🌾 FERTILIZER TIMING' },
        { key:'irrigation_timing',    label:'💧 IRRIGATION TIMING' },
        { key:'harvest_planning',     label:'🌾 HARVEST PLANNING' },
      ].map(f => (
        <div key={f.key} style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'16px 18px', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:11, fontWeight:700, color, fontFamily:'monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>{f.label}</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.7 }}>{result[f.key]}</div>
        </div>
      ))}
      <FeedbackWidget predictionId={result.predictionId} color={color}/>
    </div>
  )
}

// ── Main Export ─────────────────────────────────────────────────────────────
function DownloadPdfButton({ type, result, image }) {
  const { t } = useLang()
  const handle = () => {
    const typeMap = { suitability: 'SUITABILITY', disease: 'DISEASE', irrigation: 'IRRIGATION', fertilizer: 'FERTILIZER', yield: 'YIELD', pest: 'PEST', weather: 'WEATHER' }
    // For Disease reports, include the uploaded leaf photo (passed down from
    // DiseasePage) alongside the AI's Grad-CAM focus map already in `result`.
    const images = type === 'disease' ? { photo: image, heatmap: result.heatmap_image } : {}
    exportPredictionPdf(typeMap[type], result, {}, images)
    toast.success(`📄 ${t('pdfDownloaded')}`)
  }
  return (
    <button onClick={handle} style={{
      display:'flex', alignItems:'center', gap:8, width:'100%', justifyContent:'center',
      padding:'11px', borderRadius:10, marginTop:4,
      background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)',
      color:'rgba(255,255,255,0.6)', fontSize:12.5, fontWeight:600, cursor:'pointer', outline:'none',
    }}>
      <FileDown size={14}/> {t('pdfDownloaded')}
    </button>
  )
}

export default function ResultDisplay({ result, type, image }) {
  if (!result) return null
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {type === 'suitability' && <SuitabilityResult result={result}/>}
      {type === 'disease'     && <DiseaseResult result={result}/>}
      {type === 'irrigation'  && <IrrigationResult result={result}/>}
      {type === 'fertilizer'  && <FertilizerResult result={result}/>}
      {type === 'yield'       && <YieldResult result={result}/>}
      {type === 'pest'        && <PestResult result={result}/>}
      {type === 'weather'     && <WeatherResult result={result}/>}
      <DownloadPdfButton type={type} result={result} image={image}/>
    </div>
  )
}
