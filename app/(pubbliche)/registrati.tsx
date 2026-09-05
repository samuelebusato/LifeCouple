import * as React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Fondo } from '@/components/schermata';
import { supabase } from '@/lib/supabase';
import { SceltaData } from '@/components/scelta-data';
import { anniCompiuti, ETA_MINIMA, salvaDataNascita } from '@/lib/compleanni';
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
  const [nascita, setNascita] = React.useState<string | null>(null);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [avviso, setAvviso] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);

  async function crea() {
    setErrore(null);
    setAvviso(null);
    if (password.length < MINIMO) return setErrore(t.registrati.troppoCorta);
    if (password !== conferma) return setErrore(t.registrati.nonCoincidono);

    // 🔑 **L'età si controlla PRIMA di creare l'account**, non dopo. Un utente
    // creato e poi respinto lascerebbe una riga in `auth.users` che nessuno
    // cancella, e la persona con un account che esiste e non funziona.
    //
    // ⚠️ Questo chiude un buco che era aperto da sempre: l'informativa dichiara
    // il servizio riservato ai maggiori di 14 anni (art. 8 GDPR) e **non c'era
    // nessun modo di verificarlo**. Resta una dichiarazione — chiunque può
    // scrivere una data falsa — ma la differenza fra «non chiediamo» e
    // «chiediamo e rifiutiamo» è quella fra una promessa e un controllo.
    if (!nascita) return setErrore(t.registrati.nascitaMancante);
    const anni = anniCompiuti(nascita);
    if (anni === null) return setErrore(t.registrati.nascitaNonValida);
    if (anni < ETA_MINIMA) return setErrore(t.registrati.troppoGiovane(ETA_MINIMA));

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

    // ⚠️ Si salva **dopo** che la sessione esiste: la policy della 0032 vuole
    // `utente_id = auth.uid()`, e prima del login non c'è nessun `auth.uid()`.
    // Se questa scrittura fallisce non si blocca la registrazione — l'account
    // è già valido — ma la data si potrà rimettere dalle impostazioni.
    if (data.session.user?.id) await salvaDataNascita(data.session.user.id, nascita);

    router.replace('/');
  }

  const puoCreare =
    email.trim().length > 4 && password.length > 0 && conferma.length > 0 && !!nascita;

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

            {/* La data di nascita: serve al compleanno sul calendario e alla
                soglia dei 14 anni. La nota lo dice **prima**, perché un dato
                chiesto senza motivo è un dato che si dà malvolentieri. */}
            <View className="gap-2">
              <SceltaData
                valore={nascita}
                onCambia={setNascita}
                etichetta={t.registrati.nascita}
                massimo={new Date()}
              />
              <Text className="text-xs text-muted-foreground">{t.registrati.nascitaNota}</Text>
            </View>

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
