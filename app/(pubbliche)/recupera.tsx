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

const MINIMO = 8;

/**
 * **Recupero della password**, in due passi: codice via email, poi password
 * nuova.
 *
 * ## 🔑 Perché il codice e non il link «reimposta password»
 *
 * La strada canonica di Supabase è `resetPasswordForEmail`, che manda un
 * **link**: aprendolo il token arriva nel frammento dell'URL, l'app deve
 * intercettare il deep link, estrarlo e chiamare `setSession`. Funziona, ma
 * introduce un percorso d'ingresso nuovo — link esterno → sessione — che va
 * provato su due sistemi operativi e che qui **nessuno potrebbe provare oggi**.
 *
 * Il codice a sei cifre fa la stessa cosa con un meccanismo **già in uso e già
 * funzionante nel progetto** (era l'intero accesso fino al 2026-08-29): niente
 * deep link, niente token nell'URL, niente da intercettare.
 *
 * ⚠️ **E non è una seconda porta d'ingresso.** Col solo codice non si entra da
 * nessuna parte: `verifyOtp` apre una sessione che questa schermata usa
 * **immediatamente** per imporre una password nuova. Chi arriva qui esce con
 * una password, o non esce.
 */
export default function Recupera() {
  const router = useRouter();
  const [fase, setFase] = React.useState<'email' | 'codice'>('email');
  const [email, setEmail] = React.useState('');
  const [codice, setCodice] = React.useState('');
  const [nuova, setNuova] = React.useState('');
  const [errore, setErrore] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);

  async function mandaCodice() {
    setErrore(null);
    setAttesa(true);
    // ⚠️ `shouldCreateUser: false`, ed è la riga che conta: senza, chi sbaglia a
    // digitare l'email si **crea un account nuovo** credendo di recuperare il
    // suo, e poi si trova dentro uno spazio vuoto senza capire perché.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setAttesa(false);
    if (error) return setErrore(error.message);
    setFase('codice');
  }

  async function impostaPassword() {
    setErrore(null);
    if (nuova.length < MINIMO) return setErrore(t.registrati.troppoCorta);

    setAttesa(true);
    const verifica = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codice.trim(),
      type: 'email',
    });
    if (verifica.error) {
      setAttesa(false);
      return setErrore(verifica.error.message);
    }

    // La sessione è aperta: adesso — e solo adesso — si può cambiare la
    // password. Se questo fallisse, l'utente resterebbe dentro con la vecchia,
    // quindi l'errore si mostra invece di mandarlo avanti in silenzio.
    const cambio = await supabase.auth.updateUser({ password: nuova });
    setAttesa(false);
    if (cambio.error) return setErrore(cambio.error.message);

    router.replace('/');
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center px-8"
        >
          {fase === 'email' ? (
            <View className="gap-6">
              <View className="gap-2">
                <Text className="font-serif-bold text-3xl text-foreground">
                  {t.recupera.titolo}
                </Text>
                <Text className="text-base text-muted-foreground">{t.recupera.sottotitolo}</Text>
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
              <Button size="lg" disabled={attesa || email.trim().length < 5} onPress={mandaCodice}>
                <Text>{attesa ? t.recupera.invio : t.recupera.mandaCodice}</Text>
              </Button>
              <Button variant="ghost" onPress={() => router.back()}>
                <Text>{t.recupera.tornaIndietro}</Text>
              </Button>
            </View>
          ) : (
            <View className="gap-6">
              <View className="gap-2">
                <Text className="font-serif-bold text-3xl text-foreground">
                  {t.recupera.titoloCodice}
                </Text>
                <Text className="text-base text-muted-foreground">
                  {t.recupera.sottotitoloCodice(email)}
                </Text>
              </View>
              <Input
                value={codice}
                onChangeText={(v) => setCodice(v.replace(/[^0-9]/g, ''))}
                placeholder={t.recupera.placeholderCodice}
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
                className="text-center text-2xl tracking-[6px]"
              />
              <View className="gap-2">
                <Input
                  value={nuova}
                  onChangeText={setNuova}
                  placeholder={t.recupera.placeholderNuova}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
                <Text className="text-xs text-muted-foreground">{t.registrati.requisito}</Text>
              </View>
              {errore && <Text className="text-sm text-destructive">{errore}</Text>}
              <Button
                size="lg"
                disabled={attesa || codice.trim().length < 6 || nuova.length === 0}
                onPress={impostaPassword}
              >
                <Text>{attesa ? t.recupera.verifico : t.recupera.imposta}</Text>
              </Button>
              <Button variant="ghost" onPress={() => setFase('email')}>
                <Text>{t.recupera.tornaIndietro}</Text>
              </Button>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
