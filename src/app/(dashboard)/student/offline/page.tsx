'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  WifiOff, BookOpen, Trash2, 
  ArrowRight, CloudOff, Info, 
  CheckCircle2, Loader2, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

type OfflineCourse = {
  id: string
  title: string
  lessonCount: number
  savedAt: string
}

export default function OfflineLibraryPage() {
  const [savedCourses, setSavedCourses] = useState<OfflineCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadOfflineData()
  }, [])

  const loadOfflineData = () => {
    setLoading(true)
    // In a real app, we'd query the Service Worker or Cache Storage directly
    // For this UI, we use a synchronized localStorage manifest
    const courses: OfflineCourse[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('offline_course_')) {
        const id = key.replace('offline_course_', '')
        // We simulate fetching the title from the manifest or last-known data
        courses.push({
          id,
          title: `Subject Bundle: ${id.split('-')[0].toUpperCase()}`, // Simulated title
          lessonCount: 12, // Simulated count
          savedAt: new Date().toLocaleDateString()
        })
      }
    }
    setSavedCourses(courses)
    setLoading(false)
  }

  const deleteBundle = async (id: string) => {
    setIsDeleting(id)
    // 1. Remove from localStorage
    localStorage.removeItem(`offline_course_${id}`)
    
    // 2. Tell Service Worker to clear this specific cache if possible
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
        cacheName: 'zimlearn-v2-dynamic' // This is simple, real logic would be more granular
      })
    }

    // 3. Refresh list
    setTimeout(() => {
      loadOfflineData()
      setIsDeleting(null)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                  <CloudOff size={24} className="text-white" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-widest">Offline Library</h1>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Manage your downloaded courses and study materials. These items are available even without an internet connection.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
               <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase">Storage Used</p>
                 <p className="text-xl font-black text-teal-400">124 MB</p>
               </div>
               <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                 <RefreshCw size={20} className="text-slate-300" />
               </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-teal-500" />
          </div>
        ) : savedCourses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center space-y-4">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
               <WifiOff size={40} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-900">Your Offline Library is Empty</h2>
               <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                 Go to any course page and click "Save for Offline Study" to bundle your lessons for data-free learning.
               </p>
             </div>
             <Link href="/student/subjects" className="inline-block">
                <Button className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">
                  Browse Subjects
                </Button>
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition group">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <button 
                    onClick={() => deleteBundle(course.id)}
                    disabled={isDeleting === course.id}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    title="Remove from device"
                  >
                    {isDeleting === course.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  </button>
                </div>
                
                <h3 className="text-lg font-black text-slate-900 mb-1">{course.title}</h3>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {course.lessonCount} Lessons Cached
                  </span>
                  <span>•</span>
                  <span>Saved: {course.savedAt}</span>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                     <span className="text-[10px] font-black text-emerald-600 uppercase">Ready Offline</span>
                   </div>
                   <Link href={`/student/courses/${course.id}`}>
                      <button className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">
                        Study Now <ArrowRight size={14} />
                      </button>
                   </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offline FAQ / Info */}
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
          <Info size={24} className="text-amber-600 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="text-sm font-black text-amber-900 uppercase">How Offline Study Works</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              When you save a course, MaFundi bundles all text lessons, summaries, and revision notes onto your device. 
              <strong> Note:</strong> External videos may still require a connection unless they are specifically downloaded by the provider.
              Your progress will be saved locally and synced automatically the next time you go online.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
