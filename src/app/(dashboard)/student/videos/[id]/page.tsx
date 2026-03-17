import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Clock, BookOpen } from 'lucide-react'

export default async function VideoWatchPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type VideoRow = { id: string; title: string; description: string | null; youtube_id: string | null; youtube_url: string; topic: string | null; duration_mins: number | null; subject: { name: string; code: string } | null }
  const { data: video } = await supabase
    .from('video_lessons')
    .select('id, title, description, youtube_id, youtube_url, topic, duration_mins, subject:subjects(name, code)')
    .eq('id', params.id)
    .eq('is_published', true)
    .single() as { data: VideoRow | null; error: unknown }

  if (!video) notFound()

  // Mark as watched (best effort)
  await supabase.from('video_progress').upsert(
    { user_id: user.id, video_id: video.id, completed: true, watched_at: new Date().toISOString() },
    { onConflict: 'user_id,video_id' }
  )

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Link href="/student/videos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft size={15} /> Back to videos
        </Link>

        {/* Video player */}
        <div className="bg-black rounded-2xl overflow-hidden aspect-video shadow-xl">
          {video.youtube_id ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40">
              <p>Video unavailable</p>
            </div>
          )}
        </div>

        {/* Video info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{video.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {video.subject && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                <BookOpen size={11} /> {video.subject.name}
              </span>
            )}
            {video.topic && (
              <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">{video.topic}</span>
            )}
            {video.duration_mins && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                <Clock size={11} /> {video.duration_mins} min
              </span>
            )}
          </div>
          {video.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
