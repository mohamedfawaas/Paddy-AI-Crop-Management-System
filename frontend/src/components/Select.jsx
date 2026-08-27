import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Custom dark-themed dropdown.
 *
 * FIX: native <select> elements let the *browser* render the open options
 * popup — on Chrome/Edge (Windows) that popup ignores our dark theme CSS
 * entirely and always shows as a plain white list, which looked broken next
 * to the rest of the dark UI (e.g. the Soil Type field on the Profile page).
 * This component renders its own popup with our own styles, so it always
 * matches the app's theme regardless of browser/OS.
 */
export default function Select({ value, onChange, options, placeholder = 'Select…', disabled = false, style = {} }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position:'relative', width:'100%', ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'10px 14px', borderRadius:8, fontSize:14, textAlign:'left',
          background: disabled ? 'rgba(255,255,255,0.03)' : (open ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)'),
          border: `1px solid ${open ? 'rgba(46,204,113,0.45)' : (disabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)')}`,
          color: value ? (disabled ? 'rgba(255,255,255,0.6)' : '#fff') : 'rgba(255,255,255,0.35)',
          cursor: disabled ? 'default' : 'pointer', outline:'none', transition:'all 0.15s',
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        {!disabled && <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.15s', color:'rgba(255,255,255,0.4)', flexShrink:0 }}/>}
      </button>

      {open && !disabled && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:40,
          background:'#101f16', border:'1px solid rgba(46,204,113,0.25)', borderRadius:10,
          boxShadow:'0 12px 32px rgba(0,0,0,0.5)', padding:6, maxHeight:240, overflowY:'auto',
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                padding:'9px 10px', borderRadius:7, fontSize:13.5, cursor:'pointer',
                color: opt.value === value ? '#2ecc71' : 'rgba(255,255,255,0.75)',
                background: opt.value === value ? 'rgba(46,204,113,0.12)' : 'transparent',
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={13}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
