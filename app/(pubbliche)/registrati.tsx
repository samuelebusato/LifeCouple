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

/** La soglia minima. Otto è il minimo che Supabase impone per difetto. */
const MINIMO = 8;

/**
 * **Registrazione** con email e password — la strada separata da `accedi.tsx`.
 *
 * ## Perché due schermate e non una
 *
 * Prima erano lo stesso gesto: un solo campo email, e il database decideva da sé
 * se stavi nascendo o tornando. Comodo, ma **non dice mai in che caso sei**, e
 * su un'app che custodisce ricordi la differenza fra «sto creando uno spazio» e
 * «sto rientrando nel mio» è la cosa che l'utente vuole sapere per prima.
 *
 * ⚠️ **Il requisito della password si dice prima, non dopo il rifiuto**: una
 * password respinta *dopo* averla scritta due volte è la forma più fastidiosa
 * di errore evitabile.
 */
export default function Registrati() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [conferma, setConferma] = React.useState('');
  const [errore, setErrore] = React.useState<string | null>(null);
  const [avviso, setAvviso] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);

  async function crea() {
    setErrore(null);
    setAvviso(null);
    if (password.length < MINIMO) return setErrore(t.registrati.troppoCorta);
    if (password !== conferma) return setErrore(t.registrati.nonCoincidono);

    setAttesa(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setAttesa(false);
    if (error) return setErrore(error.message);

    // 🔑 **Il caso che si dimentica sempre.** Se nel progetto Supabase è attiva
    // la conferma dell'email, `signUp` riesce ma **non apre nessuna sessione**:
    // senza questo ramo l'utente resterebbe fermo su una schermata che sembra
    // aver funzionato, senza sapere che deve aprire la posta. È la regola del
    // progetto — nessun gap silenzioso — applicata al primo minuto d'uso.
    if (!data.session) return setAvviso(t.registrati.confermaEmail(email.trim()));

    router.replace('/');
  }

  const puoCreare = email.trim().length > 4 && password.length > 0 && conferma.length > 0;

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
              <Text className="font-serif-bold text-3xl text-foreground">
                {t.registrati.titolo}
              </Text>
              <Text className="text-base text-muted-foreground">{t.registrati.sottotitolo}</Text>
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
            <View className="gap-2">
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder={t.registrati.placeholderPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <Text className="text-xs text-muted-foreground">{t.registrati.requisito}</Text>
            </View>
            <Input
              value={conferma}
              onChangeText={setConferma}
              placeholder={t.registrati.placeholderConferma}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              onSubmitEditing={puoCreare ? crea : undefined}
              returnKeyType="go"
            />

            {errore && <Text className="text-sm text-destructive">{errore}</Text>}
            {avviso && <Text className="text-sm text-foreground">{avviso}</Text>}

            <Button size="lg" disabled={attesa || !puoCreare} onPress={crea}>
              <Text>{attesa ? t.registrati.creo : t.registrati.crea}</Text>
            </Button>

            <Button variant="ghost" onPress={() => router.replace('/accedi')}>
              <Text>{t.registrati.haiGiaAccount}</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
