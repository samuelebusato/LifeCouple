import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Emblema } from '@/components/emblema';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Fondo } from '@/components/schermata';
import { useTema } from '@/lib/tema';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { useInvito } from '@/lib/invito';
import {
  useIngressoRimandato,
  paywallIngressoGiaVisto,
  segnaPaywallIngressoVisto,
  invitoInAttesa,
  dimenticaInvitoInAttesa,
} from '@/lib/preferenze';
import { t } from '@/lib/i18n';

type Fase = 'scelta' | 'invita' | 'unisci' | 'attesa-conferma';

export default function Onboarding() {
  const router = useRouter();
  const { session } = useAuth();
  const { ricarica } = useCoppia();
  const { rimanda } = useIngressoRimandato(session?.user.id);
  // Si puo' arrivare qui dall'app, gia' puntati al ramo giusto: chi ha
  // rimandato la scelta e poi riceve un invito non deve rifare il giro.
  const { fase: faseIniziale } = useLocalSearchParams<{ fase?: string }>();
  const [fase, setFase] = React.useState<Fase>(faseIniziale === 'unisci' ? 'unisci' : 'scelta');
  const tema = useTema();
  const [errore, setErrore] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);
  const [tokenIncollato, setTokenIncollato] = React.useState('');

  /**
   * **Il token lasciato da un link toccato prima di avere un account.**
   *
   * `app/invito/[token].tsx` non apre nulla: mette il token da parte e manda
   * qui. Questo effetto lo raccoglie — *dopo* che c'è una sessione, che è la
   * condizione che mancava nel momento del tocco.
   *
   * 🔑 **Riempie il campo e porta al ramo «unisci»; non apre l'invito da sé.**
   * Aprirlo in automatico sarebbe più rapido di un tocco e sbagliato: chi
   * arriva qui deve **vedere** che sta per unirsi a qualcuno, e avere modo di
   * fermarsi. *Un link non è un consenso.*
   *
   * ⚠️ **Si dimentica subito, prima ancora di usarlo.** Un token che restasse
   * in memoria tornerebbe a ogni avvio dell'onboarding — e chi l'ha già usato
   * si vedrebbe riproporre un invito scaduto senza capire da dove esca.
   */
  React.useEffect(() => {
    let vivo = true;
    (async () => {
      const inAttesa = await invitoInAttesa();
      if (!vivo || !inAttesa) return;
      await dimenticaInvitoInAttesa();
      if (!vivo) return;
      setTokenIncollato(inAttesa);
      setFase('unisci');
    })();
    return () => {
      vivo = false;
    };
  }, []);

  /**
   * **L'unica uscita dall'onboarding.**
   *
   * Prima le tre strade facevano `router.replace('/home')` ciascuna per conto
   * suo. Ora passano di qui, perche' la regola sul paywall e' una sola e
   * tenerla in tre punti significa che prima o poi due diranno cose diverse.
   *
   * 🔑 **Il paywall si mostra UNA volta per persona su questo telefono.**
   * L'onboarding si puo' riattraversare — chi rimanda la scelta e poi riceve
   * un invito ci ripassa — e vederlo due volte in dieci minuti e' il modo piu'
   * rapido di farsi disinstallare.
   *
   * ⚠️ E non si mostra a chi ha gia' «Insieme»: capita a chi reinstalla, o al
   * partner di chi ha pagato. Vendergli cio' che ha gia' e' il difetto
   * peggiore di questa schermata, perche' fa dubitare dell'acquisto fatto.
   *
   * ⚠️ **`push` dopo `replace`, e con un tick di distanza**: il paywall e' una
   * schermata che si CHIUDE, quindi deve stare *sopra* la casa e non al suo
   * posto — altrimenti chiuderlo non avrebbe dove tornare. Il tick lascia
   * finire il `replace` prima di impilarci sopra.
   */
  const vaiAllApp = React.useCallback(async () => {
    const utenteId = session?.user?.id;
    const daMostrare = !(await paywallIngressoGiaVisto(utenteId));

    router.replace('/home');
    if (!daMostrare) return;
    await segnaPaywallIngressoVisto(utenteId);

    // Chi ha gia' il diritto non vede niente. Se la domanda fallisce si tace:
    // un paywall in meno non fa danno, uno di troppo a un abbonato si'.
    //
    // 🔴 **B-81 — qui viveva la seconda residenza di B-75, e la `0047` non
    //    l'aveva raggiunta.** Questo blocco chiedeva `coppia_ha_insieme(cid)`,
    //    e per farlo doveva prima **trovare una coppia**: senza, saltava il
    //    controllo e mostrava il paywall lo stesso.
    //
    // ⚠️ *Cioe' proponeva di comprare «Insieme» a chi lo aveva gia' comprato*,
    //    per il solo fatto di non avere ancora un partner — che e' il caso che
    //    **D-124 dichiara legittimo** e che il paywall stesso spiega con
    //    l'avviso di B-74. La schermata diceva «puoi abbonarti gia' ora», e
    //    all'ingresso dopo chiedeva di abbonarsi di nuovo.
    //
    // 🔑 **`ho_insieme()` risponde per la PERSONA** — diritto proprio oppure
    //    proiezione dal partner — quindi non serve piu' nemmeno cercare la
    //    coppia: due interrogazioni diventano una, e quella che resta fa la
    //    domanda giusta.
    const { data: haInsieme, error } = await supabase.rpc('ho_insieme');
    if (error || haInsieme === true) return;

    setTimeout(() => router.push('/paywall'), 0);
  }, [router, session?.user?.id]);

  const invito = useInvito(fase === 'invita', async () => {
    await ricarica();
    await vaiAllApp();
  });

  function estraiToken(s: string) {
    const t = s.trim();
    const m = t.match(/invito\/([a-f0-9]+)/i);
    return m ? m[1] : t;
  }

  async function creaCoppiaEInvita() {
    setErrore(null);
    setAttesa(true);
    const { error: e1 } = await supabase.rpc('crea_coppia');
    if (e1 && !/gia/.test(e1.message)) {
      setAttesa(false);
      return setErrore(e1.message);
    }
    await invito.creaLink();
    setAttesa(false);
    setFase('invita');
  }

  /** Entra da solo: lo spazio esiste gia', il partner si invita quando si vuole (D-25). */
  async function entraComunque() {
    await ricarica();
    await vaiAllApp();
  }

  /**
   * Entra **senza** creare niente. La schermata di scelta resta — chi ha un
   * invito deve poterlo aprire — ma smette di essere un cancello: si guarda
   * l'app, e lo spazio nasce al primo gesto che lo richiede. La scelta viene
   * ricordata, altrimenti si ripresenterebbe a ogni avvio.
   */
  async function rimandaLaScelta() {
    await rimanda();
    await vaiAllApp();
  }

  async function apriInvito() {
    setErrore(null);
    setAttesa(true);
    const { error } = await supabase.rpc('apri_invito', { p_token: estraiToken(tokenIncollato) });
    setAttesa(false);
    if (error) return setErrore(error.message);
    setFase('attesa-conferma');
  }

  // ramo unisci: dopo aver aperto, aspetta la conferma dell'altro (diventa membro)
  React.useEffect(() => {
    if (fase !== 'attesa-conferma') return;
    const id = setInterval(ricarica, 3000);
    return () => clearInterval(id);
  }, [fase, ricarica]);

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1">
      <View className="flex-1 justify-center px-8">
        {fase === 'scelta' && (
          <View className="items-center gap-8">
            <Emblema size={80} />
            <View className="items-center gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">{t.onboarding.titolo}</Text>
              <Text className="max-w-xs text-center text-base text-muted-foreground">
                {t.onboarding.sottotitolo}
              </Text>
            </View>
            <View className="w-full gap-3">
              <Button size="lg" disabled={attesa} onPress={creaCoppiaEInvita}>
                <Text>{attesa ? t.onboarding.attesa : t.onboarding.crea}</Text>
              </Button>
              <Button variant="outline" size="lg" onPress={() => setFase('unisci')}>
                <Text>{t.onboarding.unisciti}</Text>
              </Button>
              <Button variant="ghost" size="lg" onPress={rimandaLaScelta}>
                <Text>{t.onboarding.entraEDecidoDopo}</Text>
              </Button>
            </View>
            {errore && <Text className="text-center text-sm text-destructive">{errore}</Text>}
          </View>
        )}

        {fase === 'invita' && (
          <View className="items-center gap-6">
            <Emblema size={80} />
            <View className="items-center gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">
                {t.onboarding.titoloInvita}
              </Text>
              <Text className="max-w-xs text-center text-base text-muted-foreground">
                {t.onboarding.sottotitoloInvita}
              </Text>
            </View>

            <View className="w-full gap-3">
              <Button size="lg" onPress={() => invito.condividi()}>
                <Text>{t.onboarding.condividi}</Text>
              </Button>
              <Button variant="outline" size="lg" onPress={entraComunque}>
                <Text>{t.onboarding.piuTardi}</Text>
              </Button>
            </View>

            {invito.invitoApertoId ? (
              <View className="w-full items-center gap-3 rounded-2xl bg-accent p-5">
                <Text className="text-center text-base text-accent-foreground">
                  {t.onboarding.apertoInvito}
                </Text>
                <Button className="w-full" disabled={invito.attesa} onPress={invito.conferma}>
                  <Text>{invito.attesa ? t.onboarding.unisco : t.onboarding.conferma}</Text>
                </Button>
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color={tema.c.accento} />
                <Text className="text-sm text-muted-foreground">
                  {t.onboarding.inAttesaApertura}
                </Text>
              </View>
            )}
            {(errore || invito.errore) && (
              <Text className="text-center text-sm text-destructive">{errore ?? invito.errore}</Text>
            )}
          </View>
        )}

        {fase === 'unisci' && (
          <View className="gap-6">
            <View className="gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">
                {t.onboarding.titoloUnisci}
              </Text>
              <Text className="text-base text-muted-foreground">
                {t.onboarding.sottotitoloUnisci}
              </Text>
            </View>
            <Input
              value={tokenIncollato}
              onChangeText={setTokenIncollato}
              placeholder={t.onboarding.placeholderIncolla}
              autoCapitalize="none"
              autoFocus
            />
            {errore && <Text className="text-sm text-destructive">{errore}</Text>}
            <Button
              size="lg"
              disabled={attesa || tokenIncollato.trim().length < 6}
              onPress={apriInvito}
            >
              <Text>{attesa ? t.onboarding.apro : t.onboarding.apri}</Text>
            </Button>
            <Button variant="ghost" onPress={() => setFase('scelta')}>
              <Text>{t.onboarding.indietro}</Text>
            </Button>
          </View>
        )}

        {fase === 'attesa-conferma' && (
          <View className="items-center gap-4">
            <ActivityIndicator color={tema.c.accento} />
            <Text className="font-serif text-xl text-foreground">
              {t.onboarding.titoloAttesaConferma}
            </Text>
            <Text className="max-w-xs text-center text-base text-muted-foreground">
              {t.onboarding.testoAttesaConferma}
            </Text>
          </View>
        )}
      </View>
      </SafeAreaView>
    </View>
  );
}
