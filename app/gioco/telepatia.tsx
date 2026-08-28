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

/** Quattro voci pescate da un tema, senza ripetizioni. */
function pescaOpzioni(): Opzioni {
  const tema = TEMI_TELEPATIA[Math.floor(Math.random() * TEMI_TELEPATIA.length)];
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

  React.useEffect(() => {
    apri(coppiaId);
  }, [coppiaId, apri]);

  const numeroRound = (partita?.round_corrente ?? 0) + 1;
  const roundVivo = round && round.numero === numeroRound && round.esito === 'in_corso' ? round : null;
  /** Chi ha creato la partita apre i round: uno solo, sempre lo stesso. */
  const ioApro = !!io && partita?.creata_da === io;

  const opzioni = (roundVivo?.opzioni as Opzioni | null) ?? null;
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
      const { data, error } = await supabase
        .from('partita_round')
        .insert({ partita_id: partita.id, numero: numeroRound, opzioni: pescaOpzioni() })
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
  async function scegli(chiave: string) {
    if (!roundVivo || miaScelta) return;
    setMiaScelta(chiave);
    tatto('scelta');
    await supabase.from('invio_sigillato').insert({
      partita_id: roundVivo.partita_id,
      round: roundVivo.numero,
      natura: 'scelta',
      contenuto: { chiave },
    });
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
  React.useEffect(() => {
    setMiaScelta(null);
    setEsito(null);
  }, [numeroRound]);

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
                <Premibile
                  onPress={() => scegli(v[0])}
                  disabled={!!miaScelta}
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

          {!!p.errore && (
            <Text className="pt-2 text-center text-sm text-destructive">{p.errore}</Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
