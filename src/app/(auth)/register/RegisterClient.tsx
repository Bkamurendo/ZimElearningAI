'use client'

import { useState } from 'react'
import WorldClassOnboarding from '@/components/auth/WorldClassOnboarding'
import { register } from '@/app/actions/auth'

export default function RegisterClient({ error: serverError }: { error?: string }) {
  const [error, setError] = useState(serverError)
  const [loading, setLoading] = useState(false)

  const handleComplete = async (data: any) => {
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('full_name', data.fullName)
    formData.append('role', data.role)
    formData.append('curriculum', data.curriculum)
    formData.append('grade', data.grade)
    
    // Using a try-catch for any client-side errors before the server action takes over
    try {
      await register(formData)
    } catch (err: any) {
      // Server actions that redirect throw an error in the catch block, 
      // which is normal. But real errors should be displayed.
      if (err.message !== 'NEXT_REDIRECT') {
        setError(err.message || 'Registration failed. Please try again.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <WorldClassOnboarding onComplete={handleComplete} error={error} />
    </div>
  )
}
