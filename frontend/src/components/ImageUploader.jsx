import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
export default function ImageUploader({ onFileSelect, t: tProp }) {
  const t = tProp || (k => k)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()
  const handleFile = file => {
    if (!file) return
    if (!['image/jpeg','image/png','image/jpg','image/webp'].includes(file.type)) { toast.error(t('invalidDiseaseFile')); return }
    if (file.size > 5 * 1024 * 1024) { toast.error(t('imageTooLarge')); return }
    setPreview(URL.createObjectURL(file)); onFileSelect(file)
  }
  const handleDrop = e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }
  const clear = () => { setPreview(null); onFileSelect(null); if (inputRef.current) inputRef.current.value = '' }
  return (
    <div>
      {!preview ? (
        <div onDrop={handleDrop} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
          onClick={()=>inputRef.current?.click()} style={{border:`2px dashed ${dragging?'var(--green)':'rgba(46,204,113,0.3)'}`,borderRadius:12,padding:'40px 24px',textAlign:'center',cursor:'pointer',background:dragging?'rgba(46,204,113,0.05)':'rgba(255,255,255,0.02)',transition:'all 0.2s'}}>
          <Upload size={32} color="rgba(46,204,113,0.6)" style={{margin:'0 auto 12px'}} />
          <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{t('dragDrop')}</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:16}}>{t('supportedImages')}</div>
          <span className="btn btn-outline" style={{fontSize:12,padding:'8px 18px'}}><ImageIcon size={14}/> {t('browseImage')}</span>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={e=>handleFile(e.target.files[0])} style={{display:'none'}} />
        </div>
      ) : (
        <div style={{position:'relative',display:'inline-block',width:'100%'}}>
          <img src={preview} alt="preview" style={{width:'100%',maxHeight:280,objectFit:'cover',borderRadius:10,border:'1px solid rgba(46,204,113,0.25)'}} />
          <button onClick={clear} style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,0.7)',border:'none',borderRadius:'50%',width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'white'}}><X size={14}/></button>
          <div style={{marginTop:8,fontSize:12,color:'rgba(255,255,255,0.4)',textAlign:'center'}}>✅ {t('imageReady')}</div>
        </div>
      )}
    </div>
  )
}
