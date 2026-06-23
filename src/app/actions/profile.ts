'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveParentContact(phone: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ parent_phone: phone })
    .eq('id', user.id)

  if (error) {
    console.error('Error saving parent contact:', error)
    return { success: false, error: 'Failed to save contact' }
  }

  revalidatePath('/student/dashboard')
  return { success: true }
}
