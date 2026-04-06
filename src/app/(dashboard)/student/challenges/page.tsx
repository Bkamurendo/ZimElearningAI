'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Zap, Trophy, Clock, CheckCircle2, XCircle, Share2, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { fireConfetti, firePrideConfetti } from '@/lib/confetti'

// ---------- Types ----------

interface QuestionOption {
  label: string
  text: string
  correct: boolean
}

interface ChallengeQuestion {
  subject: string
  topic: string
  question: string
  options: QuestionOption[]
  explanation: string
}

interface DailyChallenge {
  id: string
  challenge_date: string
  zimsec_level: string
  title: string
  questions: ChallengeQuestion[]
  xp_reward: number
  bonus_xp: number
  created_at: string
}

interface AttemptAnswer {
  questionIndex: number
  selected: string
  correct: boolean
}

interface ExistingAttempt {
  id: string
  score: number
  xp_earned: number
  time_taken_seconds: number | null
  completed_at: string
  answers: AttemptAnswer[]
}

interface LeaderboardEntry {
  user_id: string
  score: number
  xp_earned: number
  time_taken_seconds: number | null
  completed_at: string
  profiles: { full_name: string } | null
}

interface ResultItem {
  questionIndex: number
  subject: string
  question: string
  selected: string | null
  correct: boolean
  correctLabel: string
  correctText: string
  explanation: string
}

type Phase = 'loading' | 'error' | 'quiz' | 'results' | 'already_done'

// ---------- Helpers ----------

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function getCountdownToMidnight(): string {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000))
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

function formatName(fullName: string | null | undefined): string {
  if (!fullName) return 'Anonymous'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

// ---------- Leaderboard ----------

function Leaderboard({
  challengeId,
  currentUserId,
  justCompleted,
}: {
  challengeId: string
  currentUserId: string | null
  justCompleted: boolean
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/daily-challenge/leaderboard?challengeId=${challengeId}`)
        if (res.ok) {
          const data = await res.json() as { entries: LeaderboardEntry[] }
          setEntries(data.entries ?? [])
        }
      } catch {
        // non-critical
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [challengeId, justCompleted])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center gap-2 text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Loading leaderboard…
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-400 text-sm">
        No entries yet — be the first to complete today&apos;s challenge!
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
        <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center shadow-sm">
          <Trophy size={15} className="text-white" />
        </div>
        <h2 className="text-sm font-bold text-gray-800">Today&apos;s Leaderboard</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {entries.slice(0, 10).map((entry, i) => {
          const isMe = entry.user_id === currentUserId
          const medalEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 px-5 py-3 ${isMe ? 'bg-amber-50' : 'hover:bg-gray-50'} transition`}
            >
              <span className={`text-sm font-bold w-6 text-center flex-shrink-0 ${isMe ? 'text-amber-600' : 'text-gray-400'}`}>
                {medalEmoji ?? `#${i + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isMe ? 'text-amber-700' : 'text-gray-800'}`}>
                  {formatName(entry.profiles?.full_name)}
                  {isMe && <span className="ml-1.5 text-[10px] bg-amber-200 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">YOU</span>}
                </p>
                {entry.time_taken_seconds != null && (
                  <p className="text-[11px] text-gray-400">{formatTime(entry.time_taken_seconds)}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">{entry.score}/5</p>
                <p className="text-[11px] text-amber-600 font-semibold">+{entry.xp_earned} XP</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Main Page ----------

export default function DailyChallengesPage() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [_zimsecLevel, setZimsecLevel] = useState<string | null>(null)

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [pendingSelection, setPendingSelection] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Results state
  const [results, setResults] = useState<ResultItem[]>([])
  const [score, setScore] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [isPerfect, setIsPerfect] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Already done state
  const [existingAttempt, setExistingAttempt] = useState<ExistingAttempt | null>(null)

  // Countdown
  const [countdown, setCountdown] = useState(getCountdownToMidnight())

  // Leaderboard re-render trigger
  const [justCompleted, setJustCompleted] = useState(false)

  // Shared copied state
  const [copied, setCopied] = useState(false)

  // ---------- Timer ----------
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  // Countdown clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdownToMidnight())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // ---------- Load challenge ----------
  useEffect(() => {
    async function load() {
      setPhase('loading')
      setError(null)
      try {
        // Get student profile to determine level
        const profileRes = await fetch('/api/student/profile')
        let level = 'olevel'
        let userId = ''
        if (profileRes.ok) {
          const profileData = await profileRes.json() as { zimsec_level?: string; user_id?: string }
          level = profileData.zimsec_level ?? 'olevel'
          userId = profileData.user_id ?? ''
        }
        setZimsecLevel(level)
        setCurrentUserId(userId)

        const res = await fetch(`/api/daily-challenge?level=${level}`)
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          throw new Error(data.error ?? 'Failed to load challenge')
        }
        const data = await res.json() as { challenge: DailyChallenge; attempt: ExistingAttempt | null }
        setChallenge(data.challenge)

        if (data.attempt) {
          setExistingAttempt(data.attempt)
          setPhase('already_done')
        } else {
          setPhase('quiz')
          startTimer()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenge')
        setPhase('error')
      }
    }
    load()
  }, [startTimer])

  // ---------- Quiz interaction ----------
  function selectOption(label: string) {
    // Already answered this question
    if (selectedAnswers[currentQ] !== undefined) return
    setPendingSelection(label)
  }

  function confirmAndNext() {
    if (!pendingSelection) return
    const newAnswers = { ...selectedAnswers, [currentQ]: pendingSelection }
    setSelectedAnswers(newAnswers)
    setPendingSelection(null)

    if (currentQ < (challenge?.questions.length ?? 5) - 1) {
      setCurrentQ(currentQ + 1)
    }
    // Last question: selection is confirmed; "Submit" button becomes active
  }

  async function handleSubmit() {
    if (!challenge) return
    const questions = challenge.questions

    // All 5 must be answered
    const finalAnswers = { ...selectedAnswers }
    if (pendingSelection !== null) {
      finalAnswers[currentQ] = pendingSelection
    }

    if (Object.keys(finalAnswers).length < questions.length) return

    stopTimer()
    setSubmitting(true)

    try {
      const answersPayload = Object.entries(finalAnswers).map(([qi, sel]) => ({
        questionIndex: parseInt(qi),
        selected: sel,
      }))

      const res = await fetch('/api/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          answers: answersPayload,
          timeTakenSeconds: elapsedSeconds,
        }),
      })

      const data = await res.json() as {
        score?: number
        xpEarned?: number
        results?: ResultItem[]
        isPerfect?: boolean
        error?: string
      }

      if (!res.ok) {
        if (res.status === 409) {
          // Already attempted
          setPhase('already_done')
          return
        }
        throw new Error(data.error ?? 'Submission failed')
      }

      setScore(data.score ?? 0)
      setXpEarned(data.xpEarned ?? 0)
      setResults(data.results ?? [])
      setIsPerfect(data.isPerfect ?? false)
      setJustCompleted(true)
      setPhase('results')
      
      // FIRE CELEBRATION!
      if (data.score && data.score >= 4) {
        if (data.isPerfect) {
          firePrideConfetti()
        } else {
          fireConfetti()
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleShare() {
    if (!challenge) return
    const dayLabel = new Date().toLocaleDateString('en-ZW', { weekday: 'long', month: 'long', day: 'numeric' })
    const text = `I scored ${score}/5 on ZimLearn's Daily Challenge (${dayLabel})! 🎯 Earned ${xpEarned} XP${isPerfect ? ' with a PERFECT score! 🌟' : '.'} #ZimLearn #ZIMSEC`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // ---------- Derived ----------
  const _allAnswered = challenge
    ? Object.keys(selectedAnswers).length === challenge.questions.length ||
      (Object.keys(selectedAnswers).length === challenge.questions.length - 1 && pendingSelection !== null)
    : false

  const todayLabel = new Date().toLocaleDateString('en-ZW', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // ---------- Render helpers ----------

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading today&apos;s challenge…</p>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <XCircle size={24} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Couldn&apos;t load challenge</h2>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition"
          >
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      </div>
    )
  }

  // ---------- Already completed ----------
  if (phase === 'already_done' && existingAttempt && challenge) {
    const scorePercent = Math.round((existingAttempt.score / 5) * 100)
    const scoreColor =
      scorePercent >= 80 ? 'from-emerald-500 to-teal-600'
      : scorePercent >= 60 ? 'from-blue-500 to-indigo-600'
      : scorePercent >= 40 ? 'from-amber-500 to-orange-500'
      : 'from-red-500 to-rose-600'

    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/student/dashboard" className="hover:text-gray-600 transition">Dashboard</Link>
            <ChevronRight size={13} />
            <span className="text-gray-700 font-medium">Daily Challenge</span>
          </div>

          <div className={`bg-gradient-to-br ${scoreColor} rounded-2xl p-6 text-white text-center shadow-lg`}>
            <p className="text-sm font-medium text-white/80 mb-1">Today&apos;s Challenge — Completed</p>
            <p className="text-5xl font-bold">{existingAttempt.score}/5</p>
            <p className="text-white/90 mt-1 text-sm">
              {existingAttempt.score === 5 ? 'Perfect score! 🌟' : existingAttempt.score >= 4 ? 'Excellent! 🎉' : existingAttempt.score >= 3 ? 'Well done! 👍' : 'Keep practising! 💪'}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
              <Zap size={13} className="text-yellow-300" />
              +{existingAttempt.xp_earned} XP earned
            </div>
            {existingAttempt.time_taken_seconds != null && (
              <p className="text-white/60 text-xs mt-2">Completed in {formatTime(existingAttempt.time_taken_seconds)}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Next challenge in</p>
              <p className="text-xl font-bold text-gray-900 font-mono">{countdown}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
          </div>

          <Leaderboard challengeId={challenge.id} currentUserId={currentUserId} justCompleted={false} />
        </div>
      </div>
    )
  }

  // ---------- Results screen ----------
  if (phase === 'results' && challenge) {
    const scorePercent = Math.round((score / 5) * 100)
    const scoreColor =
      scorePercent >= 80 ? 'from-emerald-500 to-teal-600'
      : scorePercent >= 60 ? 'from-blue-500 to-indigo-600'
      : scorePercent >= 40 ? 'from-amber-500 to-orange-500'
      : 'from-red-500 to-rose-600'

    const scoreEmoji =
      score === 5 ? '🌟' : score >= 4 ? '🎉' : score >= 3 ? '👍' : '💪'

    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/student/dashboard" className="hover:text-gray-600 transition">Dashboard</Link>
            <ChevronRight size={13} />
            <span className="text-gray-700 font-medium">Daily Challenge</span>
          </div>

          {/* Score card */}
          <div className={`bg-gradient-to-br ${scoreColor} rounded-2xl p-6 text-white text-center shadow-lg`}>
            <p className="text-sm font-medium text-white/80 mb-1">{challenge.title}</p>
            <p className="text-5xl font-bold">{score}/5 Correct! {scoreEmoji}</p>
            {isPerfect && (
              <p className="text-white/90 mt-1 text-sm font-semibold">Perfect score! Bonus XP awarded!</p>
            )}
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
                <Zap size={13} className="text-yellow-300" />
                +{xpEarned} XP earned
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-sm">
                <Clock size={13} className="text-white/70" />
                {formatTime(elapsedSeconds)}
              </div>
            </div>
          </div>

          {/* Share / leaderboard buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
            >
              <Share2 size={15} />
              {copied ? 'Copied!' : 'Share your score'}
            </button>
          </div>

          {/* Question review */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Review</h2>
            {results.map((r) => (
              <div
                key={r.questionIndex}
                className={`bg-white rounded-2xl border shadow-sm p-4 ${r.correct ? 'border-emerald-200' : 'border-red-200'}`}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${r.correct ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {r.correct
                      ? <CheckCircle2 size={14} className="text-emerald-600" />
                      : <XCircle size={14} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">{r.subject}</p>
                    <p className="text-sm font-medium text-gray-900 leading-snug">{r.question}</p>
                  </div>
                </div>
                {!r.correct && (
                  <p className="text-xs text-gray-500 ml-8.5 mb-1">
                    Your answer: <span className="text-red-600 font-semibold">{r.selected}</span>
                    {' · '}
                    Correct: <span className="text-emerald-600 font-semibold">{r.correctLabel}) {r.correctText}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 ml-8.5 italic leading-snug">{r.explanation}</p>
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          <Leaderboard challengeId={challenge.id} currentUserId={currentUserId} justCompleted={justCompleted} />

          <div className="text-center">
            <Link href="/student/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---------- Quiz phase ----------
  if (phase === 'quiz' && challenge) {
    const q = challenge.questions[currentQ]
    const confirmedAnswer = selectedAnswers[currentQ]
    const isLastQuestion = currentQ === challenge.questions.length - 1
    const progressDots = challenge.questions.map((_, i) => {
      if (i < currentQ || (i === currentQ && confirmedAnswer !== undefined)) {
        return selectedAnswers[i] !== undefined ? 'done' : 'current'
      }
      if (i === currentQ) return 'current'
      return 'pending'
    })

    return (
      <div className="min-h-screen bg-gray-50/50">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-gray-400 font-medium">{challenge.title}</p>
              <p className="text-sm font-bold text-gray-900">
                Question {currentQ + 1} of {challenge.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-gray-400 font-mono">
                <Clock size={12} />
                {formatTime(elapsedSeconds)}
              </div>
              <div className="flex gap-1.5">
                {progressDots.map((state, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      state === 'done' ? 'w-6 bg-emerald-400'
                      : state === 'current' ? 'w-6 bg-amber-400'
                      : 'w-4 bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* XP reminder */}
          <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-2 flex items-center gap-2 text-xs text-amber-700">
            <Zap size={11} className="text-amber-500" />
            <span>Complete for <strong>{challenge.xp_reward} XP</strong> + <strong>{challenge.bonus_xp} bonus</strong> for perfect score</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {/* Date / level badge */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{todayLabel}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="capitalize">{challenge.zimsec_level === 'olevel' ? 'O-Level' : challenge.zimsec_level === 'alevel' ? 'A-Level' : 'Primary'}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-emerald-600 font-medium">{q.subject}</span>
          </div>

          {/* Question card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <p className="text-base font-semibold text-gray-900 leading-relaxed">{q.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt) => {
              let style = 'border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50/50 cursor-pointer'

              if (pendingSelection === opt.label && confirmedAnswer === undefined) {
                style = 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-300/50 cursor-pointer'
              }

              if (confirmedAnswer !== undefined) {
                // This question was answered
                if (opt.label === confirmedAnswer) {
                  style = 'border-gray-300 bg-gray-100 text-gray-500 cursor-default'
                } else {
                  style = 'border-gray-100 bg-gray-50/50 text-gray-300 cursor-default'
                }
              }

              return (
                <button
                  key={opt.label}
                  onClick={() => selectOption(opt.label)}
                  disabled={confirmedAnswer !== undefined}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 ${style}`}
                >
                  <span className="font-bold mr-2">{opt.label})</span>{opt.text}
                </button>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-1">
            {!isLastQuestion ? (
              <button
                onClick={confirmAndNext}
                disabled={pendingSelection === null && confirmedAnswer === undefined}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-sm"
              >
                {confirmedAnswer !== undefined ? `Next Question →` : pendingSelection ? 'Confirm & Next →' : 'Select an answer'}
              </button>
            ) : (
              <button
                onClick={() => {
                  // Confirm last answer if pending, then submit
                  if (pendingSelection && selectedAnswers[currentQ] === undefined) {
                    setSelectedAnswers((prev) => ({ ...prev, [currentQ]: pendingSelection }))
                    setPendingSelection(null)
                  }
                  handleSubmit()
                }}
                disabled={(!pendingSelection && confirmedAnswer === undefined) || submitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                ) : (
                  'Submit Answers'
                )}
              </button>
            )}
          </div>

          {/* Answered questions summary */}
          {Object.keys(selectedAnswers).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">Answered so far</p>
              <div className="flex flex-wrap gap-2">
                {challenge.questions.map((_, i) => {
                  const ans = selectedAnswers[i]
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (pendingSelection && selectedAnswers[currentQ] === undefined) {
                          setSelectedAnswers((prev) => ({ ...prev, [currentQ]: pendingSelection }))
                          setPendingSelection(null)
                        }
                        setCurrentQ(i)
                      }}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                        i === currentQ
                          ? 'bg-amber-400 text-white ring-2 ring-amber-300'
                          : ans
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
