import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { CartaVetro, TondoVetro } from '@/components/ui/vetro';
import { Premibile } from '@/components/ui/premibile';
import { Comparsa } from '@/components/ui/comparsa';
import { PunteggioFinale } from '@/components/punteggio-finale';
import { Attesa } from '@/components/attesa-partita';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';
import { usePartita, PAUSA_FRA_ROUND } from '@/lib/partita';
import { TEMI_TELEPATIA, rendi, type Voce } from '@/lib/parole';
import { useTema } from '@/lib/tema';
import { tatto } from '@/lib/movimento';
import { t, lingua } from '@/lib/i18n';

/** Ciò che il round salva: il tema e le quattro opzioni, come chiavi. */
type Opzioni = { tema: string; scelte: string[] };

/**
 * Quattro voci pescate da un tema, senza ripetizioni.
 *
 * 🔴 **E il tema non si ripete nella partita** (B-33). Prima si pescava a caso
 * fra i 25 temi a ogni round, senza memoria: su una partita da **10** round la
 * probabilità di vedere almeno una categoria due volte è circa l'**84%** — cioè
 * praticamente sempre. Non era un caso raro sfuggito alla prova: era il
 * comportamento normale, e il calcolo si poteva fare prima di scrivere il
 * codice.
 *
 * `usati` arriva dai round già giocati di **questa** partita, letti dal
 * database e non tenuti in memoria: chi crea i round è sempre lo stesso
 * telefono, ma può aver chiuso e riaperto la schermata.
 */
function pescaOpzioni(usati: Set<string>): Opzioni {
  // Se i temi finissero si ricomincia da tutti: ripetere è meglio che non avere
  // un round. Con 25 temi e 10 round non può succedere — ma il modo in cui un
  // caso impossibile fallisce va deciso, non scoperto.
  const disponibili = TEMI_TELEPATIA.filter((x) => !usati.has(x.titolo[0]));
  const banco = disponibili.length > 0 ? disponibili : TEMI_TELEPATIA;
  const tema = banco[Math.floor(Math.random() * banco.length)];
  const rimaste = [...tema.voci];
  const scelte: string[] = [];
  for (let i = 0; i < 4 && rimaste.length > 0; i++) {
    const k = Math.floor(Math.random() * rimaste.length);
    scelte.push(rimaste[k][0]);
    rimaste.splice(k, 1);
  }
  return { tema: tema.titolo[0], scelte };
}

/**
 * **Telepatia.** Le stesse quattro opzioni a tutti e due, nello stesso momento:
 * si vince quando pensate la stessa cosa.
 *
 * ## 🔑 Perché qui il sigillo di D-12 serve davvero
 *
 * Nel disegno non c'è niente da nascondere fra i due: uno sa la parola, l'altro
 * la cerca, e il gioco è quello. Qui invece **vedere la scelta dell'altro prima
 * di aver scelto non è barare: è non giocare**. Il gioco *è* scegliere al buio.
 *
 * Per questo le scelte passano da `invio_sigillato`, la cui policy dice che
 * l'altro non legge mai — e il confronto lo fa `rivela_telepatia`, che
 * restituisce **niente** finché mancano scelte. Non «la tua sì e la sua no»:
 * niente, perché rispondere a metà direbbe *quando* l'altro ha scelto, e anche
 * quello è un pezzo d'informazione che il gioco non deve dare.
 *
 * ## Perché si interroga a intervalli invece di ascoltare
 *
 * `invio_sigillato` non sta nella pubblicazione realtime, e non ci starebbe
 * bene: la sua RLS nasconde la riga dell'altro, quindi l'evento non arriverebbe
 * comunque a chi aspetta. La domanda ripetuta a `rivela_telepatia` è la strada
 * onesta — e costa poco, perché dura solo i secondi fra la prima scelta e la
 * seconda.
 */
export default function GiocoTelepatia() {
  const router = useRouter();
  const { c } = useTema();
  const { coppiaId } = useCoppia();
  const p = usePartita('telepatia');
  const { apri, partita, round, io } = p;

  const [miaScelta, setMiaScelta] = React.useState<string | null>(null);
  const [esito, setEsito] = React.useState<{ mia: string; sua: string } | null>(null);
  /** La scelta non è arrivata al database: si può — e si deve — ripremere. */
  const [erroreScelta, setErroreScelta] = React.useState<string | null>(null);

  React.useEffect(() => {
    apri(coppiaId);
  }, [coppiaId, apri]);

  const numeroRound = (partita?.round_corrente ?? 0) + 1;
  const roundVivo = round && round.numero === numeroRound && round.esito === 'in_corso' ? round : null;
  /** Chi ha creato la partita apre i round: uno solo, sempre lo stesso. */
  const ioApro = !!io && partita?.creata_da === io;

  /**
   * 🔴 **Le opzioni vengono da `round`, non da `roundVivo`** (B-34).
   *
   * `roundVivo` diventa `null` nell'istante in cui il round si chiude — è la
   * sua definizione. Leggendo le opzioni da lì, **le quattro carte sparivano
   * insieme al round**: nei tre secondi della rivelazione restava una
   * schermata vuota col titolo `…`, e la scelta del partner non si poteva
   * vedere perché non c'era più nessuna carta su cui vederla.
   *
   * 🔑 Il round finito **è** il momento per cui si gioca. `roundVivo` continua
   * a servire, ma per una cosa sola: dire se si può ancora premere.
   */
  const opzioni = (round?.opzioni as Opzioni | null) ?? null;
  const tema = React.useMemo(
    () => TEMI_TELEPATIA.find((x) => x.titolo[0] === opzioni?.tema) ?? null,
    [opzioni]
  );
  const voci: Voce[] = React.useMemo(() => {
    if (!tema || !opzioni) return [];
    return opzioni.scelte
      .map((k) => tema.voci.find((v) => v[0] === k))
      .filter((v): v is Voce => !!v);
  }, [tema, opzioni]);

  /* --- chi apre crea il round ---------------------------------------------- */
  React.useEffect(() => {
    if (partita?.stato !== 'in_corso' || !ioApro) return;
    if (round && round.numero === numeroRound) return;
    let vivo = true;
    // Come nel disegno: chiuso un round si resta sull'esito il tempo di
    // leggerlo, e qui l'esito è il momento in cui si scopre cosa ha scelto
    // l'altro — cioè tutto il gioco.
    const attesa = round?.finito_il ? PAUSA_FRA_ROUND : 0;
    const avvio = setTimeout(async () => {
      const passati = await supabase
        .from('partita_round')
        .select('opzioni')
        .eq('partita_id', partita.id);
      const usati = new Set(
        (passati.data ?? [])
          .map((r) => (r.opzioni as Opzioni | null)?.tema)
          .filter((k): k is string => !!k)
      );
      const { data, error } = await supabase
        .from('partita_round')
        .insert({ partita_id: partita.id, numero: numeroRound, opzioni: pescaOpzioni(usati) })
        .select('*')
        .single();
      if (!vivo || error || !data) return;
      p.setRound(data);
    }, attesa);
    return () => {
      vivo = false;
      clearTimeout(avvio);
    };
  }, [partita?.stato, partita?.id, ioApro, round, numeroRound, p]);

  /* --- si sceglie ---------------------------------------------------------- */
  /**
   * ⚠️ **Se la scelta non arriva al database, si torna indietro** (B-35).
   *
   * Prima l'esito dell'`insert` non si guardava. Una scelta che non si scrive
   * lascia la schermata dicendo «hai scelto» mentre il database non ha niente:
   * `rivela_telepatia` non arriverà **mai** a due righe, il partner aspetta
   * all'infinito, e il guardiano `if (miaScelta) return` impedisce pure di
   * riprovare. È la partita che si blocca, senza un messaggio.
   *
   * 🔑 È la forma di B-23 spostata di un livello: lì un permesso mancante non
   * falliva, qui un fallimento c'era e nessuno lo leggeva. *Una scrittura di
   * cui non si guarda l'esito è una scrittura che si spera sia avvenuta.*
   */
  async function scegli(chiave: string) {
    if (!roundVivo || miaScelta) return;
    setMiaScelta(chiave);
    tatto('scelta');
    const { error } = await supabase.from('invio_sigillato').insert({
      partita_id: roundVivo.partita_id,
      round: roundVivo.numero,
      natura: 'scelta',
      contenuto: { chiave },
    });
    if (error) {
      setMiaScelta(null);
      setErroreScelta(t.gioco.sceltaNonInviata);
    }
  }

  /* --- si aspetta l'altro, e si confronta ---------------------------------- */
  React.useEffect(() => {
    if (!roundVivo || !miaScelta || esito || !io) return;
    let vivo = true;
    const chiedi = async () => {
      const { data } = await supabase.rpc('rivela_telepatia', {
        p_partita: roundVivo.partita_id,
        p_round: roundVivo.numero,
      });
      if (!vivo || !data || data.length < 2) return;
      const mia = data.find((r) => r.utente_id === io)?.scelta ?? miaScelta;
      const sua = data.find((r) => r.utente_id !== io)?.scelta ?? '';
      setEsito({ mia, sua });
      const coincide = mia === sua;
      if (coincide) tatto('fatto');
      // ⚠️ Chiude **solo chi apre i round**: la funzione regge due chiamate (la
      // seconda trova il round non più `in_corso` e torna senza fare nulla), ma
      // spedire una scrittura che si sa inutile è comunque rumore.
      if (ioApro) await p.chiudi(roundVivo.id, coincide ? 'vinto' : 'perso', coincide ? 1 : 0);
    };
    chiedi();
    const id = setInterval(chiedi, 1200);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [roundVivo, miaScelta, esito, io, ioApro, p]);

  /* --- cambio round -------------------------------------------------------- */
  /**
   * 🔴 **Si azzera quando arriva il round NUOVO, non quando finisce il vecchio**
   * (B-34) — ed è il difetto per cui «non si vedeva se si aveva indovinato».
   *
   * La dipendenza era `numeroRound`, cioè `partita.round_corrente + 1`. Ma
   * `round_corrente` lo scrive `chiudi_round` **nello stesso istante** in cui
   * il round si chiude: `setEsito(...)` e `setEsito(null)` finivano nello
   * stesso giro di render. L'esito veniva calcolato correttamente, scritto, e
   * cancellato prima di comparire — poi la schermata restava tre secondi
   * **vuota** (la pausa fra i round) e ripartiva. Da fuori si legge come
   * «l'animazione è troppo veloce»: non lo era, non c'era proprio.
   *
   * 🔑 `round?.id` cambia solo quando il round successivo viene **inserito**,
   * cioè dopo la pausa. La chiusura del round in corso è un `update` sulla
   * stessa riga e lascia l'id dov'è — che è esattamente la distinzione che
   * serve: *l'esito appartiene al round che l'ha prodotto, e vive finché vive
   * lui.*
   */
  React.useEffect(() => {
    setMiaScelta(null);
    setEsito(null);
    setErroreScelta(null);
  }, [round?.id]);

  /* --- schermate ----------------------------------------------------------- */
  if (!partita || p.caricando) {
    return <Attesa titolo={t.giochi.telepatia} testo={t.gioco.preparo} onEsci={() => router.back()} />;
  }

  if (partita.stato === 'conclusa') {
    return (
      <PunteggioFinale
        titolo={t.giochi.telepatia}
        punti={partita.punti}
        totali={partita.round_totali}
        etichetta={t.gioco.sintonia}
        onChiudi={async () => {
          await p.abbandona();
          router.back();
        }}
      />
    );
  }

  if (partita.stato === 'attesa') {
    return (
      <Attesa
        titolo={t.giochi.telepatia}
        testo={p.ioSonoPronto ? t.gioco.attendoAltro : t.gioco.pronti}
        onEsci={() => router.back()}
        onAnnulla={async () => {
          await p.abbandona();
          router.back();
        }}
        azione={p.ioSonoPronto ? undefined : t.gioco.avvia}
        onAzione={p.premiAvvia}
        attesa={p.ioSonoPronto}
      />
    );
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-start justify-between px-6 pb-4 pt-1">
          <View className="flex-1 gap-1">
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.gioco.round(numeroRound, partita.round_totali)}
            </Text>
            <Text className="font-serif-bold text-3xl text-foreground">
              {tema ? rendi(tema.titolo, lingua) : '…'}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {miaScelta ? t.gioco.haiScelto : t.gioco.sceglieteInsieme}
            </Text>
          </View>
          <TondoVetro lato={40} tinto={false} onPress={() => router.back()}>
            <X color={c.tenue} size={18} />
          </TondoVetro>
        </View>

        <View className="flex-1 justify-center gap-3 px-6">
          {voci.map((v, i) => {
            const mia = miaScelta === v[0];
            const sua = esito?.sua === v[0];
            return (
              <Comparsa key={v[0]} visibile ritardo={i * 60} scarto={10}>
                {/* ⚠️ Anche `!roundVivo`: durante la rivelazione le carte
                    restano **visibili** (è il punto di B-34) ma non si premono
                    più. Prima bastava `miaScelta` perché a round finito le
                    carte sparivano del tutto. */}
                <Premibile
                  onPress={() => scegli(v[0])}
                  disabled={!!miaScelta || !roundVivo}
                  aptico={false}
                  scala={0.97}
                >
                  <CartaVetro raggio={26} fondo={mia ? 'pieno' : 'sicuro'}>
                    <View
                      className="flex-row items-center justify-between px-6"
                      style={{
                        height: 78,
                        borderRadius: 26,
                        borderWidth: mia || sua ? 2 : 0,
                        borderColor: mia ? c.accento : sua ? c.ambra : 'transparent',
                        opacity: miaScelta && !mia && !sua ? 0.45 : 1,
                      }}
                    >
                      <Text
                        className="flex-1 font-serif text-xl"
                        style={{ color: mia ? c.accento : c.testo }}
                        numberOfLines={2}
                      >
                        {rendi(v, lingua)}
                      </Text>
                      {/* Chi ha scelto cosa si vede **solo dopo** la rivelazione:
                          prima non c'è niente da mostrare, ed è il punto. */}
                      {/* Un pallino, non una scritta: la frase per esteso sta
                          nel riquadro dell'esito, e ripeterla qui su ogni riga
                          sarebbe la stessa informazione detta due volte. */}
                      {!!esito && sua && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: c.ambra,
                          }}
                        />
                      )}
                    </View>
                  </CartaVetro>
                </Premibile>
              </Comparsa>
            );
          })}
        </View>

        <View className="px-6 pb-6" style={{ minHeight: 84 }}>
          <Comparsa visibile={!!esito} scarto={12}>
            {!!esito && (
              <CartaVetro raggio={22} fondo="sicuro">
                <View className="items-center gap-1 px-4 py-4">
                  <Text
                    className="font-serif-bold text-2xl"
                    style={{ color: esito.mia === esito.sua ? c.accento : c.tenue }}
                  >
                    {esito.mia === esito.sua ? t.gioco.coincidete : t.gioco.diverso}
                  </Text>
                  {esito.mia !== esito.sua && (
                    <Text className="text-sm text-muted-foreground">
                      {t.gioco.haSceltoLui(
                        rendi(
                          tema?.voci.find((v) => v[0] === esito.sua) ?? [esito.sua, esito.sua],
                          lingua
                        )
                      )}
                    </Text>
                  )}
                </View>
              </CartaVetro>
            )}
          </Comparsa>

          {!!(erroreScelta || p.errore) && (
            <Text className="pt-2 text-center text-sm text-destructive">
              {erroreScelta ?? p.errore}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
