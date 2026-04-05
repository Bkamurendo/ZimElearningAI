'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award, Loader2, Sparkles, Lock } from 'lucide-react'
import Link from 'next/link'

interface ClaimCertificateButtonProps {
  certId: string
  certName: string
  isPro: boolean
}

export default function ClaimCertificateButton({ certId, certName, isPro }: ClaimCertificateButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClaim = async () => {
    if (!isPro) return

    setLoading(true)
    try {
      const res = await fetch('/api/teacher/certificates/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId, certName })
      })

      const data = await res.json()
      if (data.success || data.id) {
        router.refresh()
      } else {
        alert(data.error || 'Failed to claim certificate')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while claiming your certificate.')
    } finally {
      setLoading(false)
    }
  }

  if (!isPro) {
    return (
      <Link 
        href="/teacher/upgrade" 
        className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-100 transition"
      >
        <Lock size={12} /> Upgrade to Claim
      </Link>
    )
  }

  return (
    <button
      onClick={handleClaim}
      disabled={loading}
      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" /> Processing...
        </>
      ) : (
        <>
          <Sparkles size={14} fill="currentColor" /> Claim Credential
        </>
      )}
    </button>
  )
}
