import '@/global.css';

import * as React from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { AuthProvider, useAuth } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

/**
 * Guardia di sessione, viva su **tutte** le schermate (B-03).
 *
 * Il gate di `app/index.tsx` decide dove entrare, ma vale una volta sola:
 * se la sessione cade mentre si e' altrove — uscita volontaria, token
 * scaduto, refresh fallito — nessuno riporta indietro. Il sintomo era che
 * "Esci" sembrava non fare niente: l'uscita avveniva davvero, ma la schermata
 * restava sotto gli occhi e continuava a parlare di uno spazio che ormai non
 * era piu' leggibile.
 */
function GuardiaSessione() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    if (loading || session) return;
    // Sulle schermate pubbliche si e' gia' dove si deve essere; su `/` decide
    // il gate, che sa distinguere anche i casi che qui non si vedono.
    const primo = (segments as string[])[0];
    const radice = primo === undefined;
    const pubblica = primo === 'benvenuto' || primo === 'accedi';
    if (!radice && !pubblica) router.replace('/benvenuto');
  }, [session, loading, segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, Fraunces_700Bold });

  React.useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <GuardiaSessione />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
      {Platform.OS !== 'web' && <StatusBar style="auto" />}
    </AuthProvider>
  );
}
