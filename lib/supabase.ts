import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import 'expo-sqlite/localStorage/install';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
console.log("TESTING SUPABASE URL:", supabaseUrl);
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})