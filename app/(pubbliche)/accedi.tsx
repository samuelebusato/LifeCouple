import * as React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Fondo } from '@/components/schermata';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

/**
 * **Accesso** con email e password.
 *
 * ## Perché non è più il codice via email (2026-08-29)
 *
 * Fino a oggi l'accesso era `signInWithOtp` con `shouldCreateUser: true`:
 * registrarsi ed entrare erano **lo stesso gesto**, e non c'era password. Era
 * più sicuro — una password che non esiste non si ruba e non si riusa altrove —
 * ma aveva un costo che si è visto scrivendo il piano di pubblicazione: **il
 * revisore di Apple non può ricevere il nostro codice**. Un'app che senza
 * partner non fa niente (D-25) va consegnata alla revisione con un account già
 * appaiato, e a quell'account bisogna poter entrare.
 *
 * ⚠️ **Il codice via email non è sparito**: è diventato il modo di **recuperare
 * la password** (`recupera.tsx`). Non è una seconda strada per entrare — con il
 * solo codice non si accede a niente, si imposta una password nuova.
 */
export default function Accedi() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errore, setErrore] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);

  async function entra() {
    setErrore(null);
    setAttesa(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setAttesa(false);
    if (error) return setErrore(error.message);
    // Il cambio di sessione fa reindirizzare il gate in app/index.
    router.replace('/');
  }

  const puoEntrare = email.trim().length > 4 && password.length > 0;

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center px-8"
        >
          <View className="gap-6">
            <View className="gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">{t.accedi.titolo}</Text>
              <Text className="text-base text-muted-foreground">{t.accedi.sottotitolo}</Text>
            </View>

            <Input
              value={email}
              onChangeText={setEmail}
              placeholder={t.accedi.placeholderEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
            />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={t.accedi.placeholderPassword}
              secureTextEntry
              autoCapitalize="none"
              // ⚠️ `current-password` e non `password`: è ciò che dice al
              // portachiavi del telefono di **proporre** la password salvata
              // invece di offrirsi di salvarne una nuova.
              autoComplete="current-password"
              onSubmitEditing={puoEntrare ? entra : undefined}
              returnKeyType="go"
            />

            {errore && <Text className="text-sm text-destructive">{errore}</Text>}

            <Button size="lg" disabled={attesa || !puoEntrare} onPress={entra}>
              <Text>{attesa ? t.accedi.verifico : t.accedi.entra}</Text>
            </Button>

            <Button variant="ghost" onPress={() => router.push('/recupera')}>
              <Text>{t.accedi.passwordDimenticata}</Text>
            </Button>
            <Button variant="ghost" onPress={() => router.replace('/registrati')}>
              <Text>{t.accedi.nonHaiAccount}</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
