'use client'

import { completeGeneralOnboarding } from '@/app/actions/onboarding'
import type { UserRole } from '@/types/database'

const ROLE_CONFIG: Record<
  Exclude<UserRole, 'student'>,
  { title: string; desc: string; extra?: React.ReactNode }
> = {
  teacher: {
    title: 'Teacher Setup',
    desc: 'Tell us about your qualifications.',
    extra: (
      <div>
        <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">
          Highest Qualification
        </label>
        <input
          id="qualification"
          name="qualification"
          type="text"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          placeholder="e.g. B.Ed, BSc Mathematics"
        />
      </div>
    ),
  },
  parent: {
    title: 'Parent / Guardian Setup',
    desc: 'Add your contact details so teachers can reach you.',
    extra: (
      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          id="phone_number"
          name="phone_number"
          type="tel"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          placeholder="+263 77 123 4567"
        />
      </div>
    ),
  },
  admin: {
    title: 'Admin Setup',
    desc: 'You have full platform access.',
  },
}

export default function GeneralOnboarding({
  role,
  fullName,
  error,
}: {
  role: Exclude<UserRole, 'student'>
  fullName: string
  error?: string
}) {
  const config = ROLE_CONFIG[role]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">ZL</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {fullName || 'User'}!
          </h1>
          <p className="text-gray-500 mt-1">{config.desc}</p>
        </div>

        <form action={completeGeneralOnboarding} className="space-y-4">
          <input type="hidden" name="role" value={role} />
          {config.extra}
          <button
            type="submit"
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Go to dashboard
          </button>
        </form>
      </div>
    </div>
  )
}
