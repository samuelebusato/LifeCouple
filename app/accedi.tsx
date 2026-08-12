import * as React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

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
              <Text className="font-serif-bold text-3xl text-foreground">Entra</Text>
              <Text className="text-base text-muted-foreground">
                Ti mandiamo un codice via email. Niente password da ricordare.
              </Text>
            </View>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="la-tua@email.it"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
            />
            {errore && <Text className="text-sm text-destructive">{errore}</Text>}
            <Button size="lg" disabled={attesa || email.trim().length < 5} onPress={inviaCodice}>
              <Text>{attesa ? 'Invio…' : 'Mandami il codice'}</Text>
            </Button>
          </View>
        ) : (
          <View className="gap-6">
            <View className="gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">Il codice</Text>
              <Text className="text-base text-muted-foreground">
                L'abbiamo mandato a {email}. Controlla la posta.
              </Text>
            </View>
            <Input
              value={codice}
              onChangeText={setCodice}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              className="text-center tracking-[8px]"
            />
            {errore && <Text className="text-sm text-destructive">{errore}</Text>}
            <Button size="lg" disabled={attesa || codice.trim().length < 6} onPress={verifica}>
              <Text>{attesa ? 'Verifico…' : 'Entra'}</Text>
            </Button>
            <Button variant="ghost" onPress={() => setFase('email')}>
              <Text>Cambia email</Text>
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
