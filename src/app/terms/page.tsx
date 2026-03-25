import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — ZimLearn',
  description: 'Terms of Service for ZimLearn, Zimbabwe\'s AI-powered ZIMSEC learning platform.',
}

export default function TermsOfServicePage() {
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
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Terms of Service</h1>
            <p className="text-gray-400 mt-2 text-sm">Last updated: March 2026</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using ZimLearn (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, do not use ZimLearn. These terms apply to all users including
                students, teachers, parents, and administrators.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Description of Service</h2>
              <p>
                ZimLearn is an AI-powered educational platform designed to help Zimbabwean students prepare for
                ZIMSEC examinations (Primary, O-Level, and A-Level). The Platform provides AI tutoring,
                adaptive quizzes, past paper practice, progress tracking, and study planning tools.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You must provide accurate and complete information when creating an account.</li>
                <li>You are responsible for maintaining the confidentiality of your password.</li>
                <li>You must be at least 8 years old to use ZimLearn (with parental consent for under-18s).</li>
                <li>Admin accounts may only be created by ZimLearn staff — self-registration as an admin is not permitted.</li>
                <li>One account per user. Multiple accounts for the same person are not allowed.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Share your account credentials with others.</li>
                <li>Upload content that is harmful, offensive, or violates Zimbabwean law.</li>
                <li>Attempt to reverse-engineer, hack, or disrupt the Platform.</li>
                <li>Use AI tutoring features to generate content intended to deceive teachers or examiners.</li>
                <li>Scrape, copy, or redistribute ZimLearn content without written permission.</li>
                <li>Impersonate another user, teacher, or ZimLearn staff member.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. Subscriptions & Payments</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>ZimLearn offers both free and premium subscription tiers.</li>
                <li>Premium subscriptions are billed monthly or annually as selected at checkout.</li>
                <li>Payments are processed via Paynow (RTGS/EcoCash) and Flutterwave (Visa/Mastercard).</li>
                <li>Subscriptions automatically renew unless cancelled before the renewal date.</li>
                <li>Refunds are considered on a case-by-case basis — contact support within 7 days of payment.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. AI-Generated Content</h2>
              <p>
                ZimLearn uses AI (powered by Anthropic&apos;s Claude) to generate tutoring responses, quiz questions,
                and study materials. While we strive for accuracy aligned with the ZIMSEC syllabus:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>AI-generated content is for educational guidance only and may occasionally contain errors.</li>
                <li>Always verify important answers against official ZIMSEC materials and your teacher.</li>
                <li>ZimLearn is not liable for exam outcomes based solely on AI-generated content.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
              <p>
                All content on ZimLearn — including the AI system, design, curriculum materials, and brand assets —
                is the intellectual property of ZimLearn. ZIMSEC syllabi and past papers remain the property of
                the Zimbabwe School Examinations Council (ZIMSEC). Users may not reproduce or distribute
                ZimLearn content without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. Teacher & Content Creator Terms</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Teachers who upload content confirm they have the right to share that material.</li>
                <li>Uploaded content is subject to AI moderation for quality and appropriateness.</li>
                <li>ZimLearn may remove content that violates these terms or the ZIMSEC curriculum guidelines.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                ZimLearn is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted
                by Zimbabwean law, ZimLearn shall not be liable for any indirect, incidental, or consequential
                damages arising from use of the Platform, including exam results, data loss, or service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">10. Termination</h2>
              <p>
                ZimLearn reserves the right to suspend or terminate accounts that violate these Terms.
                You may delete your account at any time through your profile settings. Upon termination,
                your data will be handled in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">11. Governing Law</h2>
              <p>
                These Terms are governed by the laws of Zimbabwe. Any disputes shall be resolved under
                the jurisdiction of Zimbabwean courts.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">12. Contact Us</h2>
              <p>
                For questions about these Terms, contact:<br />
                <strong>ZimLearn Support</strong><br />
                Email: <a href="mailto:support@zimlearn.app" className="text-emerald-600 hover:underline">support@zimlearn.app</a><br />
                Website: <a href="https://zim-elearningai.co.zw" className="text-emerald-600 hover:underline">zim-elearningai.co.zw</a>
              </p>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        © {new Date().getFullYear()} ZimLearn · Empowering Zimbabwean students ·{' '}
        <Link href="/privacy" className="hover:text-gray-600 underline transition">Privacy Policy</Link>
      </footer>
    </div>
  )
}
