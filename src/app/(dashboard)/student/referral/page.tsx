import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReferralPageClient from './ReferralPageClient'

export const metadata = {
  title: 'Refer Friends – ZimLearn AI',
  description: 'Share ZimLearn with friends and earn free months when they upgrade.',
}

export default async function ReferralPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get this user's referral code and stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, referral_credits')
    .eq('id', user.id)
    .single()

  // Generate a code if somehow missing (fallback)
  let referralCode = profile?.referral_code ?? ''
  if (!referralCode) {
    referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    await supabase.from('profiles').update({ referral_code: referralCode }).eq('id', user.id)
  }

  // Count referrals
  const { count: referralCount } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id)

  // Count converted (those who upgraded)
  const { count: converted } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .not('converted_at', 'is', null)

  return (
    <ReferralPageClient
      referralCode={referralCode}
      referralCount={referralCount ?? 0}
      converted={converted ?? 0}
      creditsEarned={profile?.referral_credits ?? 0}
    />
  )
}
