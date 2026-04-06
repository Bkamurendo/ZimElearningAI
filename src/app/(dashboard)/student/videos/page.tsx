/* eslint-disable @next/next/no-img-element */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Play, Clock, BookOpen, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type SubRow = { subject: { id: string; name: string; code: string } | null }
type VideoRow = { 
  id: string; 
  title: string; 
  description: string | null; 
  youtube_id: string | null; 
  topic: string | null; 
  duration_mins: number | null; 
  subject: { name: string; code: string } | null 
}

export default async function VideosPage() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, zimsec_level')
      .eq('user_id', user.id)
      .single() as { data: { id: string; zimsec_level: string } | null; error: unknown }

    // Get enrolled subjects
    const { data: enrolments } = await supabase
      .from('student_subjects')
      .select('subject:subjects(id, name, code)')
      .eq('student_id', studentProfile?.id ?? '') as { data: SubRow[] | null; error: unknown }

    const subjectIds = enrolments?.map(e => e.subject?.id).filter(Boolean) as string[] ?? []

    // Get video lessons for enrolled subjects
    const { data: videoData } = await supabase
      .from('video_lessons')
      .select('id, title, description, youtube_id, topic, duration_mins, subject:subjects(name, code)')
      .in('subject_id', subjectIds.length > 0 ? subjectIds : ['none'])
      .eq('is_published', true)
      .order('sort_order') as { data: VideoRow[] | null; error: unknown }

    // Group by subject
    const grouped = (videoData ?? []).reduce((acc, v) => {
      const key = v.subject?.name ?? 'Other'
      if (!acc[key]) acc[key] = []
      acc[key].push(v)
      return acc
    }, {} as Record<string, VideoRow[]>)

    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video Lessons</h1>
            <p className="text-sm text-gray-500 mt-1">Watch ZIMSEC-aligned video lessons for your subjects</p>
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Play size={28} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-600">No videos available yet</p>
              <p className="text-sm text-gray-400 mt-1">Video lessons will appear here once uploaded by your teachers</p>
            </div>
          ) : (
            Object.entries(grouped).map(([subject, vids]) => (
              <div key={subject}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <BookOpen size={15} className="text-white" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">{subject}</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{vids.length} videos</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vids.map(video => (
                    <Link
                      key={video.id}
                      href={`/student/videos/${video.id}`}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-100 transition-all duration-200"
                    >
                      <div className="relative aspect-video bg-gray-900 overflow-hidden">
                        {video.youtube_id ? (
                          <img
                            src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={32} className="text-white/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                            <Play size={20} className="text-gray-900 ml-0.5" />
                          </div>
                        </div>
                        {video.duration_mins && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1">
                            <Clock size={10} /> {video.duration_mins}m
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors uppercase">{video.title}</p>
                        {video.topic && <p className="text-xs text-gray-400 mt-1 uppercase">{video.topic}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  } catch (err) {
    console.error('[Videos] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <Video size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Couldn&apos;t load videos</h2>
        <p className="text-slate-500 max-w-xs">We encountered an error while fetching your video lessons. Please refresh the page.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
