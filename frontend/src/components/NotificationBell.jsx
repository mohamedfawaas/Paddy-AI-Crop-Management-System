import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X, Check, CheckCheck } from 'lucide-react'
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../services/notificationService'
import { NOTIFY_REFRESH_EVENT } from '../utils/notifyBus'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  IRRIGATION_REMINDER: '💧', DISEASE_ALERT: '🔬', PEST_WARNING: '🐛',
  WEATHER_ALERT: '☁️', FERTILIZER_REMINDER: '🌾', HARVEST_REMINDER: '🌾',
}

function timeAgo(iso, t) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return t('justNow')
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)
  const { t } = useLang()

  const refresh = async () => {
    try {
      setUnread(await getUnreadCount())
      if (open) setItems(await getNotifications())
    } catch { /* silent background refresh; button actions show explicit alerts */ }
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15000) // poll every 15s as a fallback
    const onLiveRefresh = () => refresh()
    const onFocus = () => refresh()
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener(NOTIFY_REFRESH_EVENT, onLiveRefresh)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      window.removeEventListener(NOTIFY_REFRESH_EVENT, onLiveRefresh)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggleOpen = async () => {
    const next = !open
    setOpen(next)
    if (next) { try { setItems(await getNotifications()) } catch { toast.error(t('operationFailed')) } }
  }

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id)
      setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      refresh()
    } catch { toast.error(t('operationFailed')) }
  }
  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead()
      setItems(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
      toast.success(t('markAllRead'))
    } catch { toast.error(t('operationFailed')) }
  }
  const handleDelete = async (id) => {
    try {
      await deleteNotification(id)
      setItems(prev => prev.filter(n => n.id !== id))
      setUnread(prev => Math.max(0, prev - (items.find(n => n.id === id)?.read ? 0 : 1)))
      toast.success(t('deleteSuccess'))
    } catch { toast.error(t('operationFailed')) }
  }

  return (
    <div ref={ref} style={{ position:'relative', marginLeft:'auto' }}>
      <button onClick={toggleOpen} style={{
        position:'relative', width:32, height:32, borderRadius:8, cursor:'pointer', outline:'none',
        background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Bell size={15} color={unread > 0 ? '#f4c430' : 'rgba(255,255,255,0.5)'}/>
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-4, right:-4, minWidth:16, height:16, borderRadius:8,
            background:'#e74c3c', color:'#fff', fontSize:9, fontWeight:800,
            display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && createPortal(
        <div className="notification-popover" style={{
          position:'fixed', top:64, right:16,
          width:'min(340px, calc(100vw - 32px))',
          maxHeight:'min(480px, calc(100vh - 90px))', overflowY:'auto',
          background:'#0d1610', border:'1px solid rgba(46,204,113,0.2)', borderRadius:12,
          boxShadow:'0 8px 30px rgba(0,0,0,0.5)', zIndex:200,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, background:'#0d1610' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>🔔 {t('notifications')}</div>
            {unread > 0 && (
              <button onClick={handleReadAll} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color:'#2ecc71', fontSize:11, cursor:'pointer' }}>
                <CheckCheck size={12}/> {t('markAllRead')}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ padding:'30px 14px', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12.5 }}>
              {t('noNotifications')}
            </div>
          ) : (
            <div>
              {items.map(n => (
                <div key={n.id} style={{
                  display:'flex', gap:10, padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)',
                  background: n.read ? 'transparent' : 'rgba(46,204,113,0.04)',
                }}>
                  <div style={{ fontSize:18, flexShrink:0 }}>{TYPE_ICON[n.type] || '📋'}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    {n.title && <div style={{ fontSize:12.5, fontWeight:700, color: n.read ? 'rgba(255,255,255,0.5)' : '#fff', marginBottom:2 }}>{n.title}</div>}
                    <div style={{ fontSize:12, color: n.read ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.75)', lineHeight:1.4, wordBreak:'break-word' }}>{n.message}</div>
                    <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.3)', marginTop:4 }}>{timeAgo(n.createdAt, t)}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                    {!n.read && <Check size={13} style={{ cursor:'pointer', color:'#2ecc71' }} onClick={() => handleRead(n.id)}/>}
                    <X size={13} style={{ cursor:'pointer', color:'rgba(255,255,255,0.3)' }} onClick={() => handleDelete(n.id)}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>, document.body
      )}
    </div>
  )
}
