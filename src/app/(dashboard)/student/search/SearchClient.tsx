'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, FormEvent } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  initialQuery: string
  initialType: string
  initialLevel: string
}

export default function SearchClient({ initialQuery, initialType, initialLevel }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value?.trim() ?? ''
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (initialType !== 'all') params.set('type', initialType)
    if (initialLevel !== 'all') params.set('level', initialLevel)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = ''
    const params = new URLSearchParams()
    if (initialType !== 'all') params.set('type', initialType)
    if (initialLevel !== 'all') params.set('level', initialLevel)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          defaultValue={initialQuery}
          placeholder="Search by title, subject, topic…"
          className="w-full pl-10 pr-10 py-3 bg-white text-gray-900 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-400 focus:outline-none text-sm placeholder:text-gray-400"
          autoFocus={!initialQuery}
        />
        {initialQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-sm flex-shrink-0"
      >
        Search
      </button>
    </form>
  )
}
