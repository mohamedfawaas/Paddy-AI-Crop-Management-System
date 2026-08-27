export default function PredictionCard({ icon, label, value, sub, color = 'var(--green)' }) {
  return (
    <div className="card" style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{width:40,height:40,borderRadius:10,background:`${color}18`,border:`1px solid ${color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{icon}</div>
      <div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontFamily:'monospace',letterSpacing:1,textTransform:'uppercase',marginBottom:4}}>{label}</div>
        <div style={{fontSize:26,fontWeight:800,color,lineHeight:1}}>{value}</div>
        {sub && <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:4}}>{sub}</div>}
      </div>
    </div>
  )
}
