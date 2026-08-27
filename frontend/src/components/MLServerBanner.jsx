import { AlertTriangle, Terminal } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

export default function MLServerBanner({ onClose }) {
  const { t } = useLang()
  return (
    <div style={{
      background:'rgba(231,76,60,0.08)', border:'1px solid rgba(231,76,60,0.35)',
      borderRadius:12, padding:'18px 20px', marginBottom:20
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <AlertTriangle size={20} color="#e74c3c" style={{ flexShrink:0, marginTop:2 }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#e74c3c', marginBottom:6 }}>
            🐍 {t('mlServerDown')}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginBottom:12, lineHeight:1.6 }}>
            {t('mlServerInactive')}
          </div>
          <div style={{
            background:'rgba(0,0,0,0.4)', borderRadius:8, padding:'10px 14px',
            fontFamily:'monospace', fontSize:13, color:'#2ecc71',
            display:'flex', alignItems:'center', gap:10
          }}>
            <Terminal size={14} color="#2ecc71"/>
            <span>cd ml-module &nbsp;&nbsp; bash start_server.sh</span>
          </div>
          <div style={{ marginTop:10, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
            {t('mlServerAfterStart')} <span style={{color:'var(--gold)'}}>http://localhost:8000</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
        )}
      </div>
    </div>
  )
}
