'use client'

import { useState } from 'react'
import { Phone, CheckCircle2, Loader2 } from 'lucide-react'

type SmsButtonProps = {
  studentId: string
  studentName: string
  phoneNumber: string
  averagePulse: number
}

export function SmsSummaryButton({ studentId, studentName, phoneNumber, averagePulse }: SmsButtonProps) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function sendSms() {
    if (loading || sent) return
    setLoading(true)
    try {
      const res = await fetch('/api/parent/send-summary-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          student_name: studentName,
          phone_number: phoneNumber,
          average_pulse: averagePulse
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
        setTimeout(() => setSent(false), 5000)
      } else {
        alert(data.error || 'Failed to send SMS')
      }
    } catch (_err) {
      alert('Error sending SMS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={sendSms}
      disabled={loading || sent}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
        sent 
          ? 'bg-green-500 text-white' 
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      }`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : sent ? <CheckCircle2 size={12} /> : <Phone size={12} />}
      {sent ? 'Sent to Phone!' : 'Send SMS Pulse'}
    </button>
  )
}
