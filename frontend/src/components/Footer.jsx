import { Sprout } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

/**
 * Shared professional footer — appears on every page (auth pages via
 * AuthLayout, and every authenticated page via the main Layout in App.jsx).
 */
export default function Footer({ variant = 'app' }) {
  const { t } = useLang()
  const year = new Date().getFullYear()

  if (variant === 'auth') {
    // Compact single-line variant used inside the dark auth branding panel
    return (
      <div style={{
        display:'flex', alignItems:'center', gap:6, flexWrap:'wrap',
        fontSize:11.5, color:'rgba(255,255,255,0.28)',
      }}>
        <span>© {year} Paddy AI — Sri Lanka. All Rights Reserved.</span>
        <span style={{ opacity:0.5 }}>|</span>
        <span>
          {t('designedBy')} <strong style={{ color:'rgba(46,204,113,0.75)', fontWeight:700 }}>Mohamed Fawaas</strong>
        </span>
      </div>
    )
  }

  return (
    <footer style={{
      marginTop:40, paddingTop:20, paddingBottom:8,
      borderTop:'1px solid rgba(255,255,255,0.06)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      flexWrap:'wrap', gap:10,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <div style={{ width:22, height:22, borderRadius:6, background:'rgba(46,204,113,0.12)', border:'1px solid rgba(46,204,113,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Sprout size={12} color="#2ecc71"/>
        </div>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
          © {year} Paddy AI — Sri Lanka. All Rights Reserved.
        </span>
      </div>
      <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
        {t('designedBy')} <strong style={{ color:'#2ecc71', fontWeight:700 }}>Mohamed Fawaas</strong>
      </span>
    </footer>
  )
}