import * as React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Film, Image as ImageIcon, MapPin, Sparkles } from 'lucide-react-native';
import { Emblema } from '@/components/emblema';
import { Insieme } from '@/components/insieme';
import { ServePartner } from '@/components/serve-partner';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Premibile } from '@/components/ui/premibile';
import { Comparsa } from '@/components/ui/comparsa';
import { Fondo } from '@/components/schermata';
import { SPAZIO_BARRA } from '@/components/barra-volante';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';
import { useInvito } from '@/lib/invito';
import { useRiepilogo } from '@/lib/riepilogo';
import { useTema } from '@/lib/tema';
import { cascata } from '@/lib/movimento';
import { lingua, t } from '@/lib/i18n';

/**
 * La home: il punto da cui si guarda la coppia.
 *
 * Tre stati (B-03): **non lo so** (lettura fallita), **sono solo** — con o
 * senza spazio gia' creato — e **siamo in due**. Quando si e' in due prende il
 * centro il contatore dei giorni, e sotto i riquadri delle altre funzioni.
 *
 * Ogni riquadro mostra un dato **vero o niente**: dove la funzione non e'
 * ancora stata scritta, dice cosa ci sara' invece di uno zero che sembra un
 * dato. Su una schermata che si guarda ogni giorno, un numero inventato e'
 * peggio di un vuoto onesto.
 *
 * ## I riquadri arrivano a **onda** (2026-08-27)
 *
 * Entrano uno dopo l'altro, ~45ms l'uno dall'altro, invece che tutti insieme.
 * Non e' decorazione: e' cio' che dice **in che ordine leggerli**. Cinque
 * riquadri che compaiono nello stesso fotogramma sono un muro, e l'occhio parte
 * da dove capita; cinque che arrivano in sequenza si leggono nell'ordine in cui
 * sono arrivati, che e' quello in cui sono stati messi.
 *
 * ⚠️ Succede **una volta sola**, all'apertura dell'app. Tornando qui da
 * un'altra scheda la schermata resta montata (navigatore a tab), quindi non si
 * ri-anima: un'onda a ogni ritorno diventerebbe un'attesa fra se' e il numero
 * che si e' venuti a leggere.
 */

function Riquadro({
  Icona,
  etichetta,
  valore,
  nota,
  onPress,
  largo,
  indice = 0,
}: {
  Icona: React.ComponentType<{ color?: string; size?: number }>;
  etichetta: string;
  valore: string;
  nota?: string;
  onPress?: () => void;
  largo?: boolean;
  /** Il posto nella fila: decide il ritardo dell'entrata a onda. */
  indice?: number;
}) {
  const { c, vetro } = useTema();
  return (
    <Comparsa
      visibile
      ritardo={cascata(indice)}
      scarto={18}
      scala={0.94}
      // ⚠️ La larghezza sta **qui**, non piu' sul `Pressable`: e' questa vista
      // a essere figlia del `flex-wrap`, e senza il 50% i riquadri
      // tornerebbero uno per riga. Non e' una classe perche' `Comparsa` prende
      // uno stile — il suo mestiere e' animare, non conoscere NativeWind.
      style={{ width: largo ? '100%' : '50%', padding: 6 }}
    >
      <Premibile onPress={onPress} scala={0.965}>
        {/* I riquadri della home restano **carta piena**, non vetro: sono gia' il
            contenuto principale della schermata, e un vetro sopra un fondo
            sfumato, ripetuto cinque volte, diventa nebbia. Il vetro sta sui
            comandi che galleggiano, non su cio' che si legge. */}
        <View
          className="min-h-[118px] gap-1 rounded-3xl bg-card p-4"
          style={{
            shadowColor: vetro.ombra,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.6,
            shadowRadius: 14,
            elevation: 4,
          }}
        >
          <View
            className="h-9 w-9 items-center justify-center rounded-2xl"
            style={{ backgroundColor: c.alone }}
          >
            <Icona color={c.accento} size={18} />
          </View>
          <Text className="pt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            {etichetta}
          </Text>
          <Text className="font-serif text-xl text-foreground" numberOfLines={2}>
            {valore}
          </Text>
          {!!nota && (
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {nota}
            </Text>
          )}
        </View>
      </Premibile>
    </Comparsa>
  );
}

export default function Home() {
  const router = useRouter();
  const { coppiaId, completa, insiemeDal, errore, loading, ricarica } = useCoppia();
  const { c } = useTema();
  const r = useRiepilogo(coppiaId);

  // Finche' si e' da soli si resta in ascolto: se il partner apre l'invito,
  // la conferma (D-14) dev'essere possibile anche da qui, non solo in onboarding.
  const invito = useInvito(!loading && !!coppiaId && !completa, ricarica);

  // Le schede restano montate quando si passa da una all'altra: senza questo,
  // il film appena visto o il posto appena segnato non comparirebbero qui
  // finche' non si riavvia l'app. I riquadri devono dire come stanno le cose
  // **adesso**, non com'erano all'ultimo avvio.
  const ricaricaRiepilogo = r.ricarica;
  useFocusEffect(
    React.useCallback(() => {
      ricaricaRiepilogo();
    }, [ricaricaRiepilogo])
  );

  if (loading) {
    return (
      <View className="flex-1">
        <Fondo />
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accento} />
        </SafeAreaView>
      </View>
    );
  }

  // Non sappiamo com'e' messo: si dice, e si offre di riprovare. Nessuna
  // schermata che finge uno stato che non abbiamo potuto leggere.
  if (errore) {
    return (
      <View className="flex-1">
        <Fondo />
        <SafeAreaView className="flex-1 items-center justify-center gap-4 px-8">
        <Text className="font-serif-bold text-2xl text-foreground">{t.home.titoloErrore}</Text>
        <Text className="max-w-xs text-center text-base text-muted-foreground">
          {t.home.testoErrore}
        </Text>
        <Text className="text-center text-sm text-destructive">{errore}</Text>
        <Button onPress={() => ricarica()}>
          <Text>{t.home.riprova}</Text>
        </Button>
        <Button variant="ghost" onPress={() => supabase.auth.signOut()}>
          <Text>{t.home.esci}</Text>
        </Button>
        </SafeAreaView>
      </View>
    );
  }

  const prossimo = r.prossimoEvento;
  const quandoProssimo = prossimo
    ? new Date(prossimo.inizio).toLocaleDateString(lingua, { day: 'numeric', month: 'long' })
    : null;

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        contentContainerClassName="items-center gap-4 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: SPAZIO_BARRA }}
        showsVerticalScrollIndicator={false}
      >
        {completa ? (
          <>
            {/* Il contatore dei giorni apre l'onda: e' il primo posto in cui
                l'occhio si posa, ed e' giusto che sia anche il primo ad
                arrivare. */}
            <Comparsa visibile scarto={20} scala={0.95} style={{ width: '100%' }}>
              <Insieme insiemeDal={insiemeDal} ricarica={ricarica} />
            </Comparsa>

            <View className="w-full flex-row flex-wrap">
              <Riquadro
                Icona={CalendarDays}
                etichetta={t.riepilogo.prossimo}
                valore={prossimo ? prossimo.titolo : t.riepilogo.nienteInVista}
                nota={quandoProssimo ?? undefined}
                onPress={() => router.push('/calendario')}
                largo
                indice={1}
              />
              <Riquadro
                Icona={MapPin}
                etichetta={t.riepilogo.posti}
                valore={String(r.postiVisitati)}
                nota={t.riepilogo.postiNota}
                onPress={() => router.push('/mappa')}
                indice={2}
              />
              <Riquadro
                Icona={Film}
                etichetta={t.riepilogo.ultimoFilm}
                valore={r.ultimoFilm ? r.ultimoFilm.titolo : t.riepilogo.nessunFilm}
                onPress={() => router.push('/preferiti')}
                indice={3}
              />
              <Riquadro
                Icona={Sparkles}
                etichetta={t.riepilogo.ultimaPartita}
                valore={
                  r.ultimaPartita ? `${r.ultimaPartita.punti}` : t.riepilogo.nessunaPartita
                }
                nota={r.ultimaPartita ? t.giochi[r.ultimaPartita.gioco] : undefined}
                onPress={() => router.push('/giochi')}
                indice={4}
              />
              <Riquadro
                Icona={ImageIcon}
                etichetta={t.riepilogo.galleria}
                valore={r.fotoACaso ? t.riepilogo.unRicordo : t.riepilogo.nessunaFoto}
                onPress={() => router.push('/galleria')}
                indice={5}
              />
            </View>
          </>
        ) : (
          <View className="items-center gap-6 py-10">
            <Emblema size={88} />
            <View className="items-center gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">
                {coppiaId ? t.home.titoloSolo : t.home.titoloSenzaSpazio}
              </Text>
              <Text className="max-w-xs text-center text-base text-muted-foreground">
                {coppiaId ? t.home.testoSolo : t.home.testoSenzaSpazio}
              </Text>
            </View>

            {invito.invitoApertoId ? (
              <View className="w-full items-center gap-3 rounded-2xl bg-accent p-5">
                <Text className="text-center text-base text-accent-foreground">
                  {t.onboarding.apertoInvito}
                </Text>
                <Button className="w-full" disabled={invito.attesa} onPress={invito.conferma}>
                  <Text>{invito.attesa ? t.onboarding.unisco : t.onboarding.conferma}</Text>
                </Button>
                {invito.errore && (
                  <Text className="text-center text-sm text-destructive">{invito.errore}</Text>
                )}
              </View>
            ) : (
              <ServePartner coppiaId={coppiaId} ricarica={ricarica} />
            )}

            {/* Chi e' entrato senza creare niente puo' ancora aprire un invito
                ricevuto: la strada non si chiude entrando. Dopo aver creato lo
                spazio non si mostra piu', perche' il database vieta di stare in
                due coppie (D-14) e il bottone fallirebbe. */}
            {!coppiaId && (
              <Button variant="outline" onPress={() => router.push('/onboarding?fase=unisci')}>
                <Text>{t.home.hoUnInvito}</Text>
              </Button>
            )}
          </View>
        )}

        {/* Al posto di «Esci» (2026-08-29): l'uscita è una delle quattro voci
            delle Impostazioni, non l'unica cosa che si potesse fare da qui. Di
            lì passano anche l'invito, lo scioglimento e la cancellazione
            dell'account — le ultime due obbligatorie per pubblicare.
            ⚠️ Il ramo d'errore qui sopra tiene invece il suo «Esci» diretto: se
            lo stato della coppia non si è potuto leggere, mandare l'utente in
            una schermata che quello stato lo legge di nuovo lo lascerebbe
            chiuso fuori senza vie d'uscita. */}
        <Button variant="ghost" onPress={() => router.push('/impostazioni')}>
          <Text>{t.home.impostazioni}</Text>
        </Button>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
