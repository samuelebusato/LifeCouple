import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from '@/lib/database.types';

// Chiavi in .env (EXPO_PUBLIC_* finisce nel bundle: qui va SOLO la anon key,
// che e' pubblica per costruzione — l'autorizzazione vera sta nelle policy RLS.
// La service_role key non deve mai avvicinarsi a questo repo).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Config Supabase mancante: copia .env.example in .env e valorizza le chiavi.'
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    // AsyncStorage non esiste sul web: li' supabase-js usa localStorage da solo
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
