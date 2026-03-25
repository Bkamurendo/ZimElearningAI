import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — ZimLearn',
  description: 'Privacy Policy for ZimLearn, Zimbabwe\'s AI-powered ZIMSEC learning platform.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">ZimLearn</span>
          </Link>
          <Link href="/login" className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition">
            Back to app →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="mb-8">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Legal</span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Privacy Policy</h1>
            <p className="text-gray-400 mt-2 text-sm">Last updated: March 2026</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p>
                ZimLearn (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is an AI-powered ZIMSEC learning platform operated in Zimbabwe.
                We are committed to protecting the privacy and personal data of our users — including students,
                teachers, and parents. This Privacy Policy explains how we collect, use, store, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account information:</strong> Name, email address, and password when you register.</li>
                <li><strong>Profile data:</strong> Your role (student, teacher, parent), ZIMSEC level, grade, and selected subjects.</li>
                <li><strong>Usage data:</strong> Quiz scores, lesson progress, study planner data, and AI tutor interactions.</li>
                <li><strong>Device data:</strong> Browser type, IP address, and operating system for security and analytics.</li>
                <li><strong>Payment data:</strong> Transaction references for subscription payments (we do not store card numbers).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide and personalise your learning experience.</li>
                <li>To track academic progress and generate AI-powered recommendations.</li>
                <li>To communicate important updates, account notifications, and security alerts.</li>
                <li>To process subscription payments and verify transactions.</li>
                <li>To improve our platform through anonymised analytics.</li>
                <li>To comply with Zimbabwean laws and regulations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. Data Storage & Security</h2>
              <p>
                Your data is stored securely using Supabase infrastructure with industry-standard encryption (TLS/SSL)
                both in transit and at rest. We implement row-level security policies to ensure users can only access
                their own data. We regularly review and update our security practices.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. Children&apos;s Privacy</h2>
              <p>
                ZimLearn is designed for students including those under 18. We do not knowingly collect sensitive
                personal information beyond what is necessary for education. Parent accounts can monitor and manage
                their child&apos;s profile. If you believe a child&apos;s data has been collected without consent,
                contact us immediately at <a href="mailto:privacy@zimlearn.app" className="text-emerald-600 hover:underline">privacy@zimlearn.app</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. Sharing Your Information</h2>
              <p>We do not sell your personal data. We may share data with:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Supabase:</strong> Database and authentication infrastructure.</li>
                <li><strong>Anthropic:</strong> AI processing for tutoring features (anonymised queries only).</li>
                <li><strong>Payment processors:</strong> Paynow/Flutterwave for transaction processing.</li>
                <li><strong>Legal authorities:</strong> If required by Zimbabwean law or court order.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Access and download your personal data.</li>
                <li>Correct inaccurate information in your profile.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Opt out of non-essential communications.</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@zimlearn.app" className="text-emerald-600 hover:underline">privacy@zimlearn.app</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. Cookies</h2>
              <p>
                We use essential cookies for authentication and session management. We do not use advertising
                or tracking cookies. You can disable cookies in your browser settings, but this may affect
                platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify registered users of significant
                changes via email. Continued use of ZimLearn after changes constitutes acceptance of the
                updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">10. Contact Us</h2>
              <p>
                For privacy-related questions or concerns, contact:<br />
                <strong>ZimLearn Privacy Team</strong><br />
                Email: <a href="mailto:privacy@zimlearn.app" className="text-emerald-600 hover:underline">privacy@zimlearn.app</a><br />
                Website: <a href="https://zim-elearningai.co.zw" className="text-emerald-600 hover:underline">zim-elearningai.co.zw</a>
              </p>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        © {new Date().getFullYear()} ZimLearn · Empowering Zimbabwean students ·{' '}
        <Link href="/terms" className="hover:text-gray-600 underline transition">Terms of Service</Link>
      </footer>
    </div>
  )
}
