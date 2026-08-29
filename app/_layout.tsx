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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
    // 🔴 **La cartella dichiara, l'elenco no** (2026-08-29).
    //
    // Qui c'era `primo === 'benvenuto' || primo === 'accedi'`: un elenco
    // scritto a mano di quali schermate si possono vedere da sconnessi.
    // Aggiungendo `registrati` e `recupera` la guardia le ha rimandate
    // indietro **all'istante**, perche' non erano nell'elenco — e il sintomo
    // era una schermata che non cambiava, non un errore.
    //
    // 🔑 E' la forma di D-60 ancora una volta: *una regola che dipende dalla
    // memoria di chi scrive la prossima schermata non e' una regola*. Ora le
    // schermate pre-accesso stanno tutte in `app/(pubbliche)/`, e **essere in
    // quella cartella e' la dichiarazione**. Il gruppo fra parentesi non
    // cambia gli indirizzi — `/accedi` resta `/accedi` — cambia solo chi
    // decide: la posizione nell'albero invece di una lista da ricordare.
    const pubblica = primo === '(pubbliche)';
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
    // ⚠️ `GestureHandlerRootView` deve avvolgere **tutta** l'app, ed expo-router
    // non lo mette da solo: senza, i gesti di `react-native-gesture-handler`
    // semplicemente non arrivano — non danno errore, non fanno niente.
    //
    // Serve da quando i due gesti che devono essere fluidi (chiudere una foto
    // trascinandola giu', trascinare il selettore della barra) girano sul
    // **thread della UI** con Reanimated invece che sul ponte JavaScript.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <GuardiaSessione />
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
        />
        {Platform.OS !== 'web' && <StatusBar style="auto" />}
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
