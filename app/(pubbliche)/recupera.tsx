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
    // ⚠️ Un codice nuovo è un codice da consumare: senza questa riga, chi torna
    // indietro e se ne fa mandare un altro salterebbe la verifica e cambierebbe
    // la password con la sessione del giro precedente.
    codiceConsumato.current = false;
    setFase('codice');
  }

  /**
   * 🔴 **Il codice è monouso, e questo schermo lo riusava** (B-59, 2026-09-07).
   *
   * `verifyOtp` **consuma** il codice: al primo tentativo lo brucia e apre la
   * sessione. Prima, ogni pressione su «Imposta» rifaceva tutto il giro — e
   * bastava che il **secondo** passo fallisse perché il primo non fosse più
   * ripetibile.
   *
   * ⚠️ Il caso che l'ha fatto emergere è quello più banale di tutti: **come
   * password nuova si scrive per sbaglio quella vecchia.** Supabase rifiuta
   * (*«New password should be different from the old password»*), si corregge,
   * si ripreme — e la risposta diventa **«Token has expired or is invalid»**.
   *
   * 🔑 *Il messaggio d'errore raccontava la storia sbagliata, e questa è la
   * parte che è costata di più.* Il codice non era scaduto: era **già stato
   * usato**. Ma le due cose arrivano dal server come la stessa frase, quindi
   * chi la legge conclude «il codice dura troppo poco» e va a cercare un
   * problema di tempo che non esiste. *Quando due cause diverse condividono un
   * messaggio, il messaggio smette di essere una diagnosi.*
   *
   * La sessione, dopo la verifica, **resta aperta**: per cambiare la password
   * non serve più il codice, serve solo `updateUser`. Quindi il codice si
   * consuma una volta sola e i tentativi successivi ripartono da lì.
   */
  const codiceConsumato = React.useRef(false);

  async function impostaPassword() {
    setErrore(null);
    if (nuova.length < MINIMO) return setErrore(t.registrati.troppoCorta);

    setAttesa(true);

    if (!codiceConsumato.current) {
      const verifica = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: codice.trim(),
        type: 'email',
      });
      if (verifica.error) {
        setAttesa(false);
        return setErrore(verifica.error.message);
      }
      // Da qui in poi il codice è bruciato: non va più rimandato al server,
      // qualunque cosa succeda sotto.
      codiceConsumato.current = true;
    }

    // La sessione è aperta: adesso — e solo adesso — si può cambiare la
    // password. Se questo fallisse, l'utente resterebbe dentro con la vecchia,
    // quindi l'errore si mostra invece di mandarlo avanti in silenzio.
    const cambio = await supabase.auth.updateUser({ password: nuova });
    setAttesa(false);
    if (cambio.error) {
      // ⚠️ Il caso «hai riscritto quella di prima» si riconosce e si dice con
      // parole nostre: il messaggio inglese di Supabase, in mezzo a una
      // schermata italiana, sembra un guasto invece di una correzione da fare.
      const uguale = /different from the old password|should be different/i.test(
        cambio.error.message
      );
      return setErrore(uguale ? t.recupera.stessaPassword : cambio.error.message);
    }

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
