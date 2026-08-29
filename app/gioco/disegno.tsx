import * as React from 'react';
import { View, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { X, Send } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { BottoneVetro, CartaVetro, TondoVetro } from '@/components/ui/vetro';
import { Comparsa } from '@/components/ui/comparsa';
import { TelaDisegno, type Tratto, type MessaggioTela } from '@/components/tela-disegno';
import { PunteggioFinale } from '@/components/punteggio-finale';
import { Attesa } from '@/components/attesa-partita';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';
import { usePartita, SECONDI_ROUND, PAUSA_FRA_ROUND } from '@/lib/partita';
import { PAROLE_DISEGNO, rendi, indovinata, type Voce } from '@/lib/parole';
import { useTema } from '@/lib/tema';
import { tatto } from '@/lib/movimento';
import { t, lingua } from '@/lib/i18n';

/** Un tentativo comparso in partita, con chi l'ha scritto. */
type Tentativo = { id: string; testo: string; mio: boolean; giusto: boolean };

/**
 * **Indovina il disegno.** Uno disegna la parola, l'altro prova a capirla.
 *
 * ## Chi decide cosa, e perché è importante che sia uno solo
 *
 * In una partita a due, ogni cosa decisa da entrambi è una cosa che può essere
 * decisa **in due modi diversi**. Qui le responsabilità sono divise senza
 * sovrapposizioni:
 *
 * - **chi disegna** crea il round, pesca la parola, tiene il tempo e chiude il
 *   round (indovinato o scaduto). È l'unico che conosce la parola, quindi è
 *   l'unico che può dire se un tentativo è giusto;
 * - **chi indovina** manda tentativi e basta.
 *
 * 🔑 Il tentativo si giudica **sul telefono di chi disegna**, non su quello di
 * chi tenta. Non è un dettaglio implementativo: il telefono di chi indovina
 * *non ha la parola* — la policy di `round_segreto` glielo impedisce — quindi
 * non potrebbe giudicare nemmeno volendo. La regola del gioco e il confine di
 * sicurezza qui coincidono, ed è il segno che il confine è nel punto giusto.
 *
 * ## I tratti non toccano il database
 *
 * Vanno nel canale **broadcast** e finiscono lì: non si salvano, non si
 * rileggono, non pesano sul tetto di D-22. Un disegno esiste per i sessanta
 * secondi in cui serve, e poi non è mai esistito.
 */
export default function GiocoDisegno() {
  const router = useRouter();
  const { c } = useTema();
  const { coppiaId } = useCoppia();
  const p = usePartita('indovina_disegno');
  const { apri, partita, round, io } = p;

  const [membri, setMembri] = React.useState<string[]>([]);
  const [tratti, setTratti] = React.useState<Tratto[]>([]);
  const [parziale, setParziale] = React.useState<Tratto | null>(null);
  const [tentativi, setTentativi] = React.useState<Tentativo[]>([]);
  const [testo, setTesto] = React.useState('');
  const [restano, setRestano] = React.useState(SECONDI_ROUND);
  const canale = React.useRef<RealtimeChannel | null>(null);

  React.useEffect(() => {
    apri(coppiaId);
  }, [coppiaId, apri]);

  /**
   * I membri attivi della coppia: servono a sapere a chi tocca nei round pari.
   *
   * 🔴 **L'elenco, non «l'altro»** (B-30). Qui prima si calcolava
   * `altroId = membri.find(u => u !== io)`, e quel `!== io` rendeva il valore
   * **relativo a chi guarda**: sui due telefoni valeva due persone diverse, e
   * nei round pari nessuno dei due si riconosceva disegnatore. Il turno ora lo
   * deduce `disegnatoreDi` da `creata_da`, che è uguale per entrambi.
   */
  React.useEffect(() => {
    if (!coppiaId) return;
    supabase
      .from('membro_coppia')
      .select('utente_id')
      .eq('coppia_id', coppiaId)
      .is('uscito_il', null)
      .then(({ data }) => {
        setMembri((data ?? []).map((m) => m.utente_id));
      });
  }, [coppiaId]);

  const numeroRound = (partita?.round_corrente ?? 0) + 1;
  const disegnatore = p.disegnatoreDi(numeroRound, membri);
  const ioDisegno = !!io && disegnatore === io;
  const roundVivo = round && round.numero === numeroRound && round.esito === 'in_corso' ? round : null;

  /** La parola del round: la sa **solo** chi disegna. */
  const [voce, setVoce] = React.useState<Voce | null>(null);

  /* --- il canale dei tratti, che non passa dal database -------------------- */
  React.useEffect(() => {
    if (!partita?.id) return;
    const ch = supabase.channel(`disegno:${partita.id}`, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'tela' }, ({ payload }) => {
      const m = payload as MessaggioTela;
      if (m.t === 'tratto') {
        setTratti((v) => [...v, m.p]);
        setParziale(null);
      } else if (m.t === 'parziale') setParziale(m.p);
      else if (m.t === 'pulisci') {
        setTratti([]);
        setParziale(null);
      }
    });
    ch.on('broadcast', { event: 'tentativo' }, ({ payload }) => {
      const { testo: txt, id } = payload as { testo: string; id: string };
      setTentativi((v) => [...v, { id, testo: txt, mio: false, giusto: false }]);
    });
    ch.subscribe();
    canale.current = ch;
    return () => {
      supabase.removeChannel(ch);
      canale.current = null;
    };
  }, [partita?.id]);

  /* --- chi disegna apre il round e pesca la parola ------------------------- */
  React.useEffect(() => {
    if (partita?.stato !== 'in_corso' || !ioDisegno || !io) return;
    if (round && round.numero === numeroRound) return;
    let vivo = true;
    // ⚠️ Se c'è un round appena chiuso, si lascia il tempo di **leggerne
    // l'esito**: vedi `PAUSA_FRA_ROUND`. Al primo round non c'è niente da
    // leggere e si parte subito.
    const attesa = round?.finito_il ? PAUSA_FRA_ROUND : 0;
    const avvio = setTimeout(async () => {
      // ⚠️ **Una parola non si ripete nella stessa partita** (B-33). Pescare a
      // caso su 250 voci sembra sicuro e non lo è: su cinque round la
      // probabilità di un doppione è circa il 4%, cioè una partita ogni
      // venticinque — abbastanza rara da non uscire in prova, abbastanza
      // frequente da uscire in uso.
      //
      // La fonte delle parole già uscite è `chiave_rivelata` dei round chiusi,
      // non `round_segreto`: quest'ultima **chi disegna adesso non può
      // leggerla** per i round in cui ha disegnato l'altro, ed è giusto così.
      const passati = await supabase
        .from('partita_round')
        .select('chiave_rivelata')
        .eq('partita_id', partita.id);
      const usate = new Set(
        (passati.data ?? []).map((r) => r.chiave_rivelata).filter((k): k is string => !!k)
      );
      const disponibili = PAROLE_DISEGNO.filter((v) => !usate.has(v[0]));
      // Se fossero finite si ricomincia da tutte: ripetere è meglio che non
      // avere un round. Con 250 voci e 5 round non può succedere — ma il modo
      // in cui un caso impossibile fallisce va deciso, non scoperto.
      const banco = disponibili.length > 0 ? disponibili : PAROLE_DISEGNO;
      const scelta = banco[Math.floor(Math.random() * banco.length)];

      const { data, error } = await supabase
        .from('partita_round')
        .insert({ partita_id: partita.id, numero: numeroRound, disegnatore_id: io })
        .select('*')
        .single();
      if (!vivo || error || !data) return;
      // ⚠️ **Il round parte comunque se il segreto non si scrive**, e la scelta
      // è deliberata. La parola vive già in memoria qui, quindi chi disegna
      // gioca lo stesso; ciò che si perde è solo la possibilità di
      // **ritrovarla ricaricando** la schermata. Fermarsi qui lascerebbe un
      // round creato che nessuno fa più avanzare — cioè si scambierebbe un
      // difetto piccolo con una partita bloccata.
      await supabase.from('round_segreto').insert({ round_id: data.id, chiave: scelta[0] });
      setVoce(scelta);
      setTratti([]);
      setParziale(null);
      setTentativi([]);
      p.setRound(data);
    }, attesa);
    return () => {
      vivo = false;
      clearTimeout(avvio);
    };
  }, [partita?.stato, partita?.id, ioDisegno, io, round, numeroRound, p]);

  /** Chi disegna rilegge la parola se ricarica la schermata a round aperto. */
  React.useEffect(() => {
    if (!roundVivo || !ioDisegno || voce) return;
    supabase
      .from('round_segreto')
      .select('chiave')
      .eq('round_id', roundVivo.id)
      .maybeSingle()
      .then(({ data }) => {
        const v = PAROLE_DISEGNO.find((x) => x[0] === data?.chiave);
        if (v) setVoce(v);
      });
  }, [roundVivo, ioDisegno, voce]);

  /* --- il tempo, tenuto da chi disegna ------------------------------------ */
  React.useEffect(() => {
    if (!roundVivo) return;
    const inizio = new Date(roundVivo.iniziato_il).getTime();
    const id = setInterval(() => {
      const passati = Math.floor((Date.now() - inizio) / 1000);
      const r = Math.max(0, SECONDI_ROUND - passati);
      setRestano(r);
      // ⚠️ Solo chi disegna chiude per tempo scaduto. Se lo facessero entrambi,
      // due chiamate arriverebbero insieme — la funzione le regge (il secondo
      // round non è più `in_corso` e torna senza fare nulla), ma è meglio non
      // spedire una scrittura che si sa già inutile.
      if (r === 0 && ioDisegno) {
        clearInterval(id);
        p.chiudi(roundVivo.id, 'scaduto', 0, voce?.[0]);
      }
    }, 250);
    return () => clearInterval(id);
  }, [roundVivo, ioDisegno, voce, p]);

  /* --- azioni ------------------------------------------------------------- */
  function mandaTela(m: MessaggioTela) {
    canale.current?.send({ type: 'broadcast', event: 'tela', payload: m });
  }

  function invia() {
    const txt = testo.trim();
    if (!txt || !roundVivo) return;
    const id = `${Date.now()}-${txt}`;
    setTentativi((v) => [...v, { id, testo: txt, mio: true, giusto: false }]);
    setTesto('');
    canale.current?.send({ type: 'broadcast', event: 'tentativo', payload: { testo: txt, id } });
  }

  /** Chi disegna giudica i tentativi che arrivano: è l'unico che ha la parola. */
  React.useEffect(() => {
    if (!ioDisegno || !voce || !roundVivo) return;
    const ultimo = tentativi[tentativi.length - 1];
    if (!ultimo || ultimo.mio || ultimo.giusto) return;
    if (indovinata(ultimo.testo, voce)) {
      setTentativi((v) => v.map((x) => (x.id === ultimo.id ? { ...x, giusto: true } : x)));
      tatto('fatto');
      p.chiudi(roundVivo.id, 'vinto', 1, voce[0]);
    }
  }, [tentativi, ioDisegno, voce, roundVivo, p]);

  /** Cambio di round: si ripulisce tutto ciò che apparteneva al precedente. */
  React.useEffect(() => {
    setTratti([]);
    setParziale(null);
    setTentativi([]);
    setRestano(SECONDI_ROUND);
    if (!ioDisegno) setVoce(null);
  }, [numeroRound, ioDisegno]);

  /* --- schermate ---------------------------------------------------------- */
  if (!partita || p.caricando) {
    return <Attesa titolo={t.giochi.indovina_disegno} testo={t.gioco.preparo} onEsci={() => router.back()} />;
  }

  if (partita.stato === 'conclusa') {
    return (
      <PunteggioFinale
        titolo={t.giochi.indovina_disegno}
        punti={partita.punti}
        totali={partita.round_totali}
        etichetta={t.gioco.intesa}
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
        titolo={t.giochi.indovina_disegno}
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

  const esitoRound = round && round.numero === numeroRound - 1 ? round : null;

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* --- testata: round, tempo, uscita ------------------------------ */}
          <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
            <View>
              <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.gioco.round(numeroRound, partita.round_totali)}
              </Text>
              <Text className="font-serif-bold text-2xl text-foreground">
                {ioDisegno ? t.gioco.disegnaTu : t.gioco.indovinaTu}
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View
                className="items-center justify-center rounded-full px-4 py-2"
                style={{ backgroundColor: restano <= 10 ? c.alone : c.linea }}
              >
                <Text
                  className="text-lg font-bold"
                  style={{ color: restano <= 10 ? c.pericolo : c.testo }}
                >
                  {restano}
                </Text>
              </View>
              <TondoVetro lato={40} tinto={false} onPress={() => router.back()}>
                <X color={c.tenue} size={18} />
              </TondoVetro>
            </View>
          </View>

          {/* --- la parola, solo a chi disegna ------------------------------ */}
          {ioDisegno && (
            <View className="px-5 pb-2">
              <CartaVetro raggio={20} fondo="sicuro">
                <View className="items-center gap-1 px-4 py-3">
                  <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t.gioco.tuaParola}
                  </Text>
                  <Text className="font-serif-bold text-2xl" style={{ color: c.accento }}>
                    {voce ? rendi(voce, lingua) : '…'}
                  </Text>
                </View>
              </CartaVetro>
            </View>
          )}

          {/* --- la tela ---------------------------------------------------- */}
          <View className="flex-1 px-5 pb-3">
            <TelaDisegno
              attiva={ioDisegno && !!roundVivo}
              tratti={tratti}
              parziale={parziale}
              onTratto={(tr) => {
                setTratti((v) => [...v, tr]);
                mandaTela({ t: 'tratto', p: tr });
              }}
              onParziale={(tr) => mandaTela({ t: 'parziale', p: tr })}
            />
          </View>

          {/* --- esito del round appena chiuso ------------------------------ */}
          <Comparsa visibile={!!esitoRound && !roundVivo} scarto={12}>
            {esitoRound && (
              <View className="px-5 pb-2">
                <CartaVetro raggio={20} fondo="sicuro">
                  <View className="items-center gap-1 px-4 py-3">
                    <Text className="text-base font-semibold text-foreground">
                      {esitoRound.esito === 'vinto' ? t.gioco.indovinato : t.gioco.tempoScaduto}
                    </Text>
                    {!!esitoRound.chiave_rivelata && (
                      <Text className="text-sm text-muted-foreground">
                        {t.gioco.eraParola(
                          rendi(
                            PAROLE_DISEGNO.find((x) => x[0] === esitoRound.chiave_rivelata) ?? [
                              esitoRound.chiave_rivelata,
                              esitoRound.chiave_rivelata,
                            ],
                            lingua
                          )
                        )}
                      </Text>
                    )}
                  </View>
                </CartaVetro>
              </View>
            )}
          </Comparsa>

          {/* --- i tentativi ------------------------------------------------ */}
          <View className="px-5" style={{ maxHeight: 120 }}>
            <ScrollView contentContainerClassName="gap-1 pb-2" keyboardShouldPersistTaps="handled">
              {tentativi.map((x) => (
                <Text
                  key={x.id}
                  className="text-sm"
                  style={{ color: x.giusto ? c.accento : x.mio ? c.testo : c.tenue }}
                >
                  {x.giusto ? '✓ ' : ''}
                  {x.testo}
                </Text>
              ))}
              {tentativi.length === 0 && (
                <Text className="text-sm text-muted-foreground">
                  {ioDisegno ? t.gioco.nessunTentativo : t.gioco.scriviQualcosa}
                </Text>
              )}
            </ScrollView>
          </View>

          {/* --- il campo, solo a chi indovina ------------------------------ */}
          {!ioDisegno && (
            <View className="flex-row items-center gap-2 px-5 pb-2">
              <CartaVetro raggio={22} fondo="sicuro" style={{ flex: 1 }}>
                <TextInput
                  value={testo}
                  onChangeText={setTesto}
                  placeholder={t.gioco.cosaE}
                  placeholderTextColor={c.tenue}
                  onSubmitEditing={invia}
                  returnKeyType="send"
                  autoCorrect={false}
                  editable={!!roundVivo}
                  style={{ height: 48, paddingHorizontal: 16, fontSize: 16, color: c.testo }}
                />
              </CartaVetro>
              <TondoVetro lato={48} onPress={invia} disabled={!roundVivo || !testo.trim()}>
                <Send color={c.accento} size={20} />
              </TondoVetro>
            </View>
          )}

          {/* --- chi disegna può ripulire ----------------------------------- */}
          {ioDisegno && (
            <View className="px-5 pb-2">
              <BottoneVetro
                altezza={46}
                disabled={!roundVivo}
                onPress={() => {
                  setTratti([]);
                  setParziale(null);
                  mandaTela({ t: 'pulisci' });
                }}
              >
                <Text>{t.gioco.pulisci}</Text>
              </BottoneVetro>
            </View>
          )}

          {!!p.errore && (
            <Text className="px-5 pb-2 text-center text-sm text-destructive">{p.errore}</Text>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
