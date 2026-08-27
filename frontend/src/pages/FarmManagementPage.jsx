import { useState, useEffect } from 'react'
import { getFarms, createFarm, updateFarm, deleteFarm, getFarmActivities, addFarmActivity, deleteFarmActivity } from '../services/farmService'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { Tractor, Plus, MapPin, Ruler, Sprout, Calendar, Trash2, Edit2, X, ClipboardList } from 'lucide-react'

const SOILS = ['Black', 'Clayey', 'Loamy', 'Red', 'Sandy']
const ACTIVITY_TYPES = ['PLANTING', 'FERTILIZER', 'IRRIGATION', 'PEST_CONTROL', 'HARVEST', 'OTHER']
const ACTIVITY_ICON = { PLANTING:'🌱', FERTILIZER:'🌾', IRRIGATION:'💧', PEST_CONTROL:'🐛', HARVEST:'🌾', OTHER:'📋' }

const emptyFarm = { name:'', location:'', sizeAcres:'', soilType:'Loamy', currentCropVariety:'', plantingDate:'', notes:'' }
const emptyActivity = { activityType:'FERTILIZER', description:'', activityDate:'' }

export default function FarmManagementPage() {
  const { t } = useLang()
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyFarm)
  const [selectedFarm, setSelectedFarm] = useState(null)
  const [activities, setActivities] = useState([])
  const [actForm, setActForm] = useState(emptyActivity)
  const [showActForm, setShowActForm] = useState(false)

  const load = async () => { setLoading(true); setFarms(await getFarms()); setLoading(false) }
  useEffect(() => { load() }, [])

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const handleAct = e => setActForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submitFarm = async e => {
    e.preventDefault()
    try {
      const payload = { ...form, sizeAcres: form.sizeAcres ? parseFloat(form.sizeAcres) : null }
      if (editingId) { await updateFarm(editingId, payload); toast.success(`✅ ${t('farmUpdated')}`) }
      else { await createFarm(payload); toast.success(`✅ ${t('farmAdded')}`) }
      setForm(emptyFarm); setShowForm(false); setEditingId(null)
      load()
    } catch (err) { toast.error(err.response?.data?.error || t('failedSaveFarm')) }
  }

  const editFarm = (f) => {
    setForm({ name:f.name||'', location:f.location||'', sizeAcres:f.sizeAcres||'', soilType:f.soilType||'Loamy',
               currentCropVariety:f.currentCropVariety||'', plantingDate:f.plantingDate||'', notes:f.notes||'' })
    setEditingId(f.id); setShowForm(true)
  }

  const removeFarm = async (id) => {
    if (!window.confirm(t('confirmDeleteFarm'))) return
    try { await deleteFarm(id); toast.success(t('farmDeleted')); if (selectedFarm?.id === id) setSelectedFarm(null); load() }
    catch { toast.error(t('failedDeleteFarm')) }
  }

  const openActivities = async (f) => {
    setSelectedFarm(f); setShowActForm(false)
    setActivities(await getFarmActivities(f.id))
  }

  const submitActivity = async e => {
    e.preventDefault()
    try {
      await addFarmActivity(selectedFarm.id, actForm)
      toast.success(`✅ ${t('activityLogged')}`)
      setActForm(emptyActivity); setShowActForm(false)
      setActivities(await getFarmActivities(selectedFarm.id))
    } catch { toast.error(t('failedLogActivity')) }
  }

  const removeActivity = async (activityId) => {
    try { await deleteFarmActivity(selectedFarm.id, activityId); setActivities(await getFarmActivities(selectedFarm.id)); toast.success(t('activityDeleted')) }
    catch { toast.error(t('failedDeleteActivity')) }
  }

  return (
    <div>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Tractor size={16} color="var(--green)"/>
            <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:3, color:'var(--green)', textTransform:'uppercase' }}>{t('farmManagementTitle')}</span>
          </div>
          <h1>{t('myFarms')}</h1>
          <p>{t('farmManagementSub')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyFarm); setEditingId(null); setShowForm(v => !v) }}>
          <Plus size={16}/> {t('addFarm')}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>{editingId ? t('editFarm') : t('newFarm')}</div>
            <X size={18} style={{ cursor:'pointer', color:'rgba(255,255,255,0.4)' }} onClick={() => { setShowForm(false); setEditingId(null) }}/>
          </div>
          <form onSubmit={submitFarm}>
            <div className="grid-2">
              <div className="input-group">
                <label>{t('farmName')}</label>
                <input className="input-field" name="name" placeholder={t('farmNamePlaceholder')} value={form.name} onChange={handle} required/>
              </div>
              <div className="input-group">
                <label>{t('location')}</label>
                <input className="input-field" name="location" placeholder={t('farmLocationPlaceholder')} value={form.location} onChange={handle}/>
              </div>
              <div className="input-group">
                <label>{t('sizeAcres')}</label>
                <input className="input-field" name="sizeAcres" type="number" step="0.1" placeholder="e.g. 2.5" value={form.sizeAcres} onChange={handle}/>
              </div>
              <div className="input-group">
                <label>{t('soilType')}</label>
                <select className="input-field" name="soilType" value={form.soilType} onChange={handle}>
                  {SOILS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>{t('currentCropVariety')}</label>
                <input className="input-field" name="currentCropVariety" placeholder="e.g. BG 358" value={form.currentCropVariety} onChange={handle}/>
              </div>
              <div className="input-group">
                <label>{t('plantingDate')}</label>
                <input className="input-field" name="plantingDate" type="date" value={form.plantingDate} onChange={handle}/>
              </div>
            </div>
            <div className="input-group">
              <label>{t('notes')}</label>
              <textarea className="input-field" name="notes" rows={2} placeholder={t('additionalNotesPlaceholder')} value={form.notes} onChange={handle}/>
            </div>
            <button type="submit" className="btn btn-primary w-full">{editingId ? t('saveChanges') : t('addFarm')}</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign:'center', padding:40, color:'rgba(255,255,255,0.4)' }}>{t('loadingFarms')}</div>
      ) : farms.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:40, color:'rgba(255,255,255,0.4)' }}>
          {t('noFarms')} <strong style={{color:'var(--green)'}}>{t('addFarm')}</strong>
        </div>
      ) : (
        <div className="grid-2" style={{ gap:16, marginBottom:24 }}>
          {farms.map(f => (
            <div key={f.id} className="card" style={{ border: selectedFarm?.id===f.id ? '1px solid var(--green)' : undefined }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ fontSize:16, fontWeight:800 }}>{f.name}</div>
                <div style={{ display:'flex', gap:10 }}>
                  <Edit2 size={15} style={{ cursor:'pointer', color:'rgba(255,255,255,0.4)' }} onClick={() => editFarm(f)}/>
                  <Trash2 size={15} style={{ cursor:'pointer', color:'#e74c3c' }} onClick={() => removeFarm(f.id)}/>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:10, fontSize:12.5, color:'rgba(255,255,255,0.6)' }}>
                {f.location && <div style={{display:'flex',alignItems:'center',gap:6}}><MapPin size={13}/> {f.location}</div>}
                {f.sizeAcres && <div style={{display:'flex',alignItems:'center',gap:6}}><Ruler size={13}/> {f.sizeAcres} {t('acres')} • {f.soilType}</div>}
                {f.currentCropVariety && <div style={{display:'flex',alignItems:'center',gap:6}}><Sprout size={13}/> {f.currentCropVariety}</div>}
                {f.plantingDate && <div style={{display:'flex',alignItems:'center',gap:6}}><Calendar size={13}/> {t('planted')}: {f.plantingDate}</div>}
              </div>
              <button className="btn" style={{ marginTop:14, width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}
                onClick={() => openActivities(f)}>
                <ClipboardList size={14}/> {selectedFarm?.id===f.id ? t('activitiesShown') : t('viewActivities')}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedFarm && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>📋 {t('activityLog')} — {selectedFarm.name}</div>
            <button className="btn btn-primary" style={{ padding:'8px 14px', fontSize:12.5 }} onClick={() => setShowActForm(v => !v)}>
              <Plus size={14}/> {t('logActivity')}
            </button>
          </div>

          {showActForm && (
            <form onSubmit={submitActivity} style={{ marginBottom:18, background:'rgba(255,255,255,0.03)', padding:16, borderRadius:10 }}>
              <div className="grid-2">
                <div className="input-group">
                  <label>{t('activityType')}</label>
                  <select className="input-field" name="activityType" value={actForm.activityType} onChange={handleAct}>
                    {ACTIVITY_TYPES.map(a => <option key={a} value={a}>{ACTIVITY_ICON[a]} {a.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>{t('date')}</label>
                  <input className="input-field" name="activityDate" type="date" value={actForm.activityDate} onChange={handleAct}/>
                </div>
              </div>
              <div className="input-group">
                <label>{t('description')}</label>
                <input className="input-field" name="description" placeholder={t('activityDescriptionPlaceholder')} value={actForm.description} onChange={handleAct}/>
              </div>
              <button type="submit" className="btn btn-primary w-full">{t('saveActivity')}</button>
            </form>
          )}

          {activities.length === 0 ? (
            <div style={{ textAlign:'center', padding:24, color:'rgba(255,255,255,0.35)', fontSize:13 }}>{t('noActivities')}</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {activities.map(a => (
                <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{ACTIVITY_ICON[a.activityType] || '📋'}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{a.activityType?.replace('_',' ')} {a.activityDate ? `• ${a.activityDate}` : ''}</div>
                      {a.description && <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{a.description}</div>}
                    </div>
                  </div>
                  <Trash2 size={14} style={{ cursor:'pointer', color:'rgba(255,255,255,0.3)' }} onClick={() => removeActivity(a.id)}/>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
