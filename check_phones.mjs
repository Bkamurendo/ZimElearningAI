import { createClient } from '@supabase/supabase-js'; 
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, plan, phone').eq('plan', 'free').not('trial_ends_at', 'is', null);
  console.log('Total Trial Users:', data?.length);
  const withPhone = data?.filter(u => u.phone);
  console.log('Trial Users WITH phone:', withPhone?.length);
  const withoutPhone = data?.filter(u => !u.phone);
  console.log('Trial Users WITHOUT phone:', withoutPhone?.length);
}
test();
