'use client'

import { useState, useEffect } from 'react'
import { Download, CheckCircle2, Loader2, WifiOff } from 'lucide-react'
import { Button } from './ui/Button'

interface SaveForOfflineButtonProps {
  courseId: string
  lessonIds: string[]
}

export default function SaveForOfflineButton({ courseId, lessonIds }: SaveForOfflineButtonProps) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'saved' | 'error'>('idle')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Check if already saved in DYNAMIC_CACHE (simplified check via localStorage for UI state)
    const isSaved = localStorage.getItem(`offline_course_${courseId}`)
    if (isSaved) setStatus('saved')
  }, [courseId])

  const saveOffline = async () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      alert('Offline mode requires a supported browser and active session.')
      return
    }

    setStatus('downloading')
    setProgress(0)

    const urlsToCache = [
      `/student/courses/${courseId}`,
      ...lessonIds.map(id => `/student/lessons/${id}`),
      // Also cache API responses for these lessons
      ...lessonIds.map(id => `/api/student/lessons/${id}`),
      `/api/student/courses/${courseId}/lessons`
    ]

    try {
      // Send message to Service Worker to cache these URLs
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        urls: urlsToCache
      })

      // Simulate progress for better UX
      let p = 0
      const interval = setInterval(() => {
        p += 10
        setProgress(p)
        if (p >= 100) {
          clearInterval(interval)
          setStatus('saved')
          localStorage.setItem(`offline_course_${courseId}`, 'true')
        }
      }, 200)

    } catch (err) {
      console.error('Offline save failed:', err)
      setStatus('error')
    }
  }

  if (status === 'saved') {
    return (
      <Button variant="outline" className="w-full h-12 rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700 gap-2 font-bold no-select">
        <CheckCircle2 size={18} />
        Offline Access Ready
      </Button>
    )
  }

  return (
    <Button 
      onClick={saveOffline}
      disabled={status === 'downloading'}
      variant="outline" 
      className="w-full h-12 rounded-2xl border-gray-200 gap-2 font-bold no-select hover:bg-gray-50 active:scale-95 transition-all"
    >
      {status === 'downloading' ? (
        <>
          <Loader2 size={18} className="animate-spin text-indigo-600" />
          Saving... {progress}%
        </>
      ) : (
        <>
          <Download size={18} className="text-indigo-600" />
          Save for Offline Study
        </>
      )}
    </Button>
  )
}
