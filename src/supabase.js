import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dkdbhoigszixysaathcp.supabase.co';
const supabaseAnonKey = 'sb_publishable_Y3t_dzVJsU8sfo6GV1W02A_PZTVaPVj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
