import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Eksik ortam değişkeni: EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlı olmalı (.env).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
