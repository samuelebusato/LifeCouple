import * as React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

export default function Accedi() {
  const router = useRouter();
  const [fase, setFase] = React.useState<'email' | 'codice'>('email');
  const [email, setEmail] = React.useState('');
  const [codice, setCodice] = React.useState('');
  const [errore, setErrore] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);

  async function inviaCodice() {
    setErrore(null);
    setAttesa(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setAttesa(false);
    if (error) return setErrore(error.message);
    setFase('codice');
  }

  async function verifica() {
    setErrore(null);
    setAttesa(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codice.trim(),
      type: 'email',
    });
    setAttesa(false);
    if (error) return setErrore(error.message);
    // il cambio di sessione fa reindirizzare il gate in app/index
    router.replace('/');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-8"
      >
        {fase === 'email' ? (
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
            {errore && <Text className="text-sm text-destructive">{errore}</Text>}
            <Button size="lg" disabled={attesa || email.trim().length < 5} onPress={inviaCodice}>
              <Text>{attesa ? t.accedi.invio : t.accedi.mandaCodice}</Text>
            </Button>
          </View>
        ) : (
          <View className="gap-6">
            <View className="gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">{t.accedi.titoloCodice}</Text>
              <Text className="text-base text-muted-foreground">
                {t.accedi.sottotitoloCodice(email)}
              </Text>
            </View>
            <Input
              value={codice}
              onChangeText={(v) => setCodice(v.replace(/[^0-9]/g, ''))}
              placeholder={t.accedi.placeholderCodice}
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
              className="text-center text-2xl tracking-[6px]"
            />
            {errore && <Text className="text-sm text-destructive">{errore}</Text>}
            <Button size="lg" disabled={attesa || codice.trim().length < 6} onPress={verifica}>
              <Text>{attesa ? t.accedi.verifico : t.accedi.entra}</Text>
            </Button>
            <Button variant="ghost" onPress={() => setFase('email')}>
              <Text>{t.accedi.cambiaEmail}</Text>
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
