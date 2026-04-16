import Link from 'next/link'
import { Lock, Zap, CheckCircle } from 'lucide-react'

interface Props {
  feature: string
  description: string
  benefits: string[]
}

export default function UpgradeWall({ feature, description, benefits }: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
          <Lock size={28} className="text-indigo-600" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">{feature} is a Premium Feature</h2>
          <p className="text-gray-500 text-sm mt-2">{description}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-2">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            href="/student/upgrade"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm"
          >
            <Zap size={16} />
            Upgrade from $2/month
          </Link>
          <p className="text-xs text-gray-400">
            Less than the cost of one exercise book · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}
