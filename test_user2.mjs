import { createClient } from '@supabase/supabase-js'; 
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', 'aa9a0a51-e7ce-441b-8158-c907433b21c8').single();
  console.log('Profile:', data);
}
test();
