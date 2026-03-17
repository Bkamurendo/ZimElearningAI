'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'

export function PushNotificationSetup() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
      })
    }
  }, [])

  const subscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) { alert('Push notifications not configured'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      })

      const subJson = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        }),
      })

      setSubscribed(true)
    } catch (err) {
      console.error('Push subscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })
        setSubscribed(false)
      }
    } catch (err) {
      console.error('Push unsubscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
        subscribed
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
      }`}
      title={subscribed ? 'Disable notifications' : 'Enable notifications'}
    >
      {subscribed ? <Bell size={13} /> : <BellOff size={13} />}
      {loading ? '...' : subscribed ? 'Notifications on' : 'Enable notifications'}
    </button>
  )
}
