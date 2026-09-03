import * as React from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { CartaVetro, TondoVetro, BottonePieno, BottoneVetro } from '@/components/ui/vetro';
import { Premibile } from '@/components/ui/premibile';
import { Comparsa } from '@/components/ui/comparsa';
import { PunteggioFinale } from '@/components/punteggio-finale';
import { Attesa } from '@/components/attesa-partita';
import { PreparazioneCarte } from '@/components/preparazione-carte';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';
import { usePartita } from '@/lib/partita';
import { OBBLIGHI, VERITA, rendi, type Voce } from '@/lib/parole';
import { useCarte, pescaCarta } from '@/lib/carte';
import { useTema } from '@/lib/tema';
import { tatto } from '@/lib/movimento';
import { t, lingua } from '@/lib/i18n';

/**
 * Ciò che il round salva: che tipo di carta è, e quale.
 *
 * ⚠️ **Due sorgenti, due campi diversi** (D-19): `chiave` è una voce del banco
 * comune (immutabile, bilingue, vive nel codice), `cartaId` è una riga scritta
 * dalla coppia (vive in `domanda`). Non è un campo solo con due significati
 * perché **non sono la stessa cosa**: la prima non può sparire, la seconda sì —
 * e leggerle allo stesso modo nasconderebbe proprio quella differenza.
 */
type Carta = { tipo: 'obbligo' | 'verita'; chiave?: string; cartaId?: string };

/**
 * Una carta del tipo scelto, che nella partita non sia già uscita.
 *
 * ⚠️ **La stessa regola di B-33**, con una ragione in più: qui una carta che
 * torna non è solo ripetitiva, è *già stata fatta* — e rifarla non è un round,
 * è un vuoto. Con trenta carte per tipo e dieci round non può capitare, ma il
 * modo in cui un caso impossibile fallisce va deciso, non scoperto.
 */
function pesca(tipo: Carta['tipo'], usate: Set<string>): string {
  const banco = tipo === 'obbligo' ? OBBLIGHI : VERITA;
  const disponibili = banco.filter((v) => !usate.has(v[0]));
  const da = disponibili.length > 0 ? disponibili : banco;
  return da[Math.floor(Math.random() * da.length)][0];
}

/**
 * **Obbligo o verità.** A turno uno sceglie, legge la carta, e la fa o la passa.
 *
 * ## 🔴 Perché questo gioco NON usa il sigillo, e gli altri tre sì
 *
 * Quiz, telepatia e disegno esistono perché c'è **qualcosa da nascondere fino
 * al momento giusto**: la risposta vera, la scelta dell'altro, la parola. Da lì
 * viene tutto il congegno di D-12 — `invio_sigillato`, `round_segreto`,
 * `rivela_telepatia` — e la ragione per cui l'autorizzazione sta nel database e
 * non nell'app.
 *
 * Qui non c'è niente da nascondere: **la carta deve leggerla anche l'altro**, o
 * non c'è nessuno davanti a cui farla. Un invio sigillato proteggerebbe un
 * segreto che il gioco non ha, e in cambio pretenderebbe due invii dove agisce
 * una persona sola. Quindi la carta sta in chiaro in `partita_round.opzioni`,
 * come le quattro opzioni della telepatia — che sono in chiaro per lo stesso
 * identico motivo.
 *
 * ⚠️ Va detto perché la documentazione dice un'altra cosa: `History.md`
 * classifica «obbligo o verità» fra i tre giochi del sigillo. Quella riga
 * guardava all'**infrastruttura di turni e stato condiviso** (partita, round,
 * pronti, punteggio), che infatti è la stessa. Il sigillo no.
 *
 * ## 🔑 Il pass non fa perdere nessuno (D-13, sciolta il 2026-09-02)
 *
 * D-13 diceva due cose diverse: nel titolo *«il pass non fa perdere»*, nel
 * corpo teneva la proposta *«chi passa di più perde»*. Vale il titolo, e la
 * ragione non è formale: una meccanica che conta i rifiuti **di ciascuno** è una
 * graduatoria fra le due persone, cioè l'unica cosa che P-03 vieta — e che D-83,
 * il giorno prima, aveva appena tolto dagli altri giochi.
 *
 * Quindi il punteggio è **della coppia**, come Intesa, Sintonia e Conoscenza:
 * quante carte avete portato a termine in dieci. Passare costa il punto del
 * round, e **non lascia niente addosso a chi ha passato**. Il testo del pop-up
 * lo dice con parole sue: *nessun punto, e nessun problema*.
 *
 * ## Chi crea il round
 *
 * Lo crea **chi ha il turno**, non chi ha creato la partita: è chi sceglie
 * obbligo o verità, quindi è l'unico che sa cosa scriverci. È la stessa forma
 * del disegno (crea chi disegna) e per la stessa ragione — il round lo scrive
 * uno solo, e quale dei due lo dice `disegnatoreDi`, che entrambi i telefoni
 * calcolano uguale (B-30).
 */
export default function GiocoObbligo() {
  const router = useRouter();
  const { c } = useTema();
  const { coppiaId } = useCoppia();
  const p = usePartita('obbligo_verita');
  const { apri, partita, round, io } = p;

  const [membri, setMembri] = React.useState<string[]>([]);
  const [creando, setCreando] = React.useState(false);
  const [erroreCarta, setErroreCarta] = React.useState<string | null>(null);
  /** L'esito dell'ultimo round è già stato letto e congedato (B-39). */
  const [finaleLetto, setFinaleLetto] = React.useState(false);

  /** Il modo arriva dalla rotta e serve **solo a creare**: vedi `apri`. */
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  React.useEffect(() => {
    apri(coppiaId, modo === 'personalizzata' ? 'personalizzata' : 'ufficiale');
  }, [coppiaId, apri, modo]);

  /** Gli obblighi e le verità scritti dai due (D-19). */
  const set = useCarte(coppiaId, partita?.id ?? null, 'obbligo_verita');

  /** L'elenco dei membri, non «l'altro»: il turno non dipende da chi guarda (B-30). */
  React.useEffect(() => {
    if (!coppiaId) return;
    supabase
      .from('membro_coppia')
      .select('utente_id')
      .eq('coppia_id', coppiaId)
      .is('uscito_il', null)
      .then(({ data }) => setMembri((data ?? []).map((m) => m.utente_id)));
  }, [coppiaId]);

  const numeroRound = (partita?.round_corrente ?? 0) + 1;
  const roundVivo = round && round.numero === numeroRound && round.esito === 'in_corso' ? round : null;
  const soggetto = p.disegnatoreDi(numeroRound, membri);
  const ioSonoSoggetto = !!io && soggetto === io;

  /**
   * Il round è chiuso e il suo esito non è ancora stato congedato.
   *
   * ⚠️ Si guarda `round_corrente` e non `finito_il`: `round_corrente` arriva
   * dalla RPC che ha chiuso il round, `finito_il` dal realtime, e nell'istante
   * fra i due un guardiano che si fidasse del secondo lascerebbe passare due
   * volte. Stessa nota di `telepatia.tsx`.
   */
  const concluso = !!round && round.esito !== 'in_corso' && round.numero === partita?.round_corrente;
  /** Hanno premuto «continua» tutti e due: il pop-up ha finito il suo lavoro. */
  const siProsegue = concluso && p.entrambiProntiRound && partita?.stato === 'in_corso';
  const mostraEsito = concluso && !siProsegue;

  /**
   * ⚠️ **La carta a schermo non è «quella dell'ultimo round»**, ed è la
   * distinzione che qui vale una schermata giusta o sbagliata.
   *
   * `round` resta il round appena chiuso finché il successivo non nasce. Se il
   * titolo leggesse da lì, nel momento fra «continua» e la carta nuova la
   * schermata direbbe **«Obbligo»** sopra due bottoni che chiedono di scegliere
   * fra obbligo e verità — cioè risponderebbe alla domanda che sta facendo.
   *
   * Quindi: la carta del round vivo, oppure quella appena chiusa **finché il
   * pop-up è a schermo** (dietro il velo deve restare visibile ciò di cui il
   * pop-up sta parlando), e niente in tutti gli altri casi.
   */
  const cartaMostrata = roundVivo ?? (mostraEsito ? round : null);
  const carta = (cartaMostrata?.opzioni as Carta | null) ?? null;
  const voce: Voce | null = React.useMemo(() => {
    if (!carta) return null;
    // Scritta dalla coppia: si rende com'è, senza cercare una traduzione che
    // nessuno ha scritto. La `Voce` con la stessa stringa nei due posti tiene
    // `rendi` uguale per tutti e due i giochi.
    if (carta.cartaId) {
      const propria = set.carte.find((x) => x.id === carta.cartaId);
      return propria ? [propria.testo, propria.testo] : null;
    }
    const banco = carta.tipo === 'obbligo' ? OBBLIGHI : VERITA;
    return banco.find((v) => v[0] === carta.chiave) ?? null;
  }, [carta, set.carte]);

  React.useEffect(() => {
    setErroreCarta(null);
    setFinaleLetto(false);
  }, [round?.id]);

  /* --- chi ha il turno sceglie, e scegliendo crea il round ------------------ */
  async function scegliTipo(tipo: Carta['tipo']) {
    if (!partita || creando || roundVivo) return;
    setCreando(true);
    setErroreCarta(null);
    tatto('scelta');
    const passati = await supabase
      .from('partita_round')
      .select('opzioni')
      .eq('partita_id', partita.id);
    /**
     * 🔑 **Il set della coppia si pesca per tipo**, e la ragione è la stessa per
     * cui ognuno ne scrive cinque e cinque: chi ha il turno sceglie *obbligo* o
     * *verità*, quindi le due colonne si consumano in modo imprevedibile. Con un
     * mucchio solo, il gioco finirebbe per costringere alla scelta che avanza.
     */
    const opzioni: Carta | null = p.personalizzata
      ? (() => {
          const usateId = new Set(
            (passati.data ?? [])
              .map((r) => (r.opzioni as Carta | null)?.cartaId)
              .filter((k): k is string => !!k)
          );
          const scelta = pescaCarta(set.carte, usateId, tipo);
          return scelta ? { tipo, cartaId: scelta.id } : null;
        })()
      : (() => {
          const usate = new Set(
            (passati.data ?? [])
              .map((r) => (r.opzioni as Carta | null)?.chiave)
              .filter((k): k is string => !!k)
          );
          return { tipo, chiave: pesca(tipo, usate) };
        })();

    if (!opzioni) {
      setCreando(false);
      return setErroreCarta(t.gioco.cartaNonSalvata);
    }

    const { data, error } = await supabase
      .from('partita_round')
      .insert({ partita_id: partita.id, numero: numeroRound, opzioni })
      .select('*')
      .single();
    setCreando(false);
    // ⚠️ Se il round non arriva al database si **dice** (B-35): una scrittura di
    // cui non si guarda l'esito è una scrittura che si spera sia avvenuta, e qui
    // il costo è l'altro telefono fermo su «sta scegliendo» per sempre.
    if (error || !data) return setErroreCarta(t.gioco.sceltaNonInviata);
    p.setRound(data);
  }

  /* --- e poi la fa, o la passa --------------------------------------------- */
  async function decidi(fatta: boolean) {
    if (!roundVivo) return;
    tatto(fatta ? 'fatto' : 'scelta');
    await p.chiudi(roundVivo.id, fatta ? 'vinto' : 'perso', fatta ? 1 : 0);
  }

  /* --- schermate ----------------------------------------------------------- */
  /** La X dentro il gioco: esci (la partita resta) o annulla (B-48, vedi disegno.tsx). */
  function chiediUscita() {
    Alert.alert(t.gioco.uscireTitolo, t.gioco.uscireNota, [
      { text: t.gioco.resta, style: 'cancel' },
      { text: t.gioco.esciLasciando, onPress: () => router.back() },
      {
        text: t.gioco.annulla,
        style: 'destructive',
        onPress: async () => {
          await p.abbandona();
          router.back();
        },
      },
    ]);
  }

  if (!partita || p.caricando) {
    return (
      <Attesa titolo={t.giochi.obbligo_verita} testo={t.gioco.preparo} onEsci={() => router.back()} />
    );
  }

  if (partita.stato === 'conclusa' && finaleLetto) {
    return (
      <PunteggioFinale
        titolo={t.giochi.obbligo_verita}
        punti={partita.punti}
        totali={partita.round_totali}
        etichetta={t.gioco.coraggio}
        onChiudi={async () => {
          await p.abbandona();
          router.back();
        }}
      />
    );
  }

  if (partita.stato === 'attesa' && p.personalizzata) {
    return (
      <PreparazioneCarte
        gioco="obbligo_verita"
        titolo={t.giochi.obbligo_verita}
        carte={set.carte}
        io={io}
        altro={membri.find((u) => u !== io) ?? null}
        scrivi={set.scrivi}
        cancella={set.cancella}
        errore={set.errore}
        caricando={set.caricando}
        ioSonoPronto={p.ioSonoPronto}
        onPronto={p.premiAvvia}
        onEsci={() => router.back()}
        onAnnulla={async () => {
          await p.abbandona();
          router.back();
        }}
      />
    );
  }

  if (partita.stato === 'attesa') {
    return (
      <Attesa
        titolo={t.giochi.obbligo_verita}
        testo={p.ioSonoPronto ? t.gioco.attendoAltro : t.gioco.pronti}
        onEsci={() => router.back()}
        onAnnulla={async () => {
          await p.abbandona();
          router.back();
        }}
        azione={p.ioSonoPronto ? undefined : t.gioco.avvia}
        onAzione={p.premiAvvia}
        spiegazione={t.hubGiochi.comeSiGioca.obbligo_verita}
        attesa={p.ioSonoPronto}
      />
    );
  }

  const tinta = carta?.tipo === 'obbligo' ? c.accento : c.ambra;

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-start justify-between px-6 pb-4 pt-1">
          <View className="flex-1 gap-1">
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.gioco.round(numeroRound, partita.round_totali)}
            </Text>
            {/* La pillola del ruolo, come nel quiz: chi tocca si legge **prima**
                della carta, perché la stessa carta significa due cose opposte a
                seconda di chi la sta guardando. */}
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: ioSonoSoggetto ? c.accento : c.ambra,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 5,
                marginTop: 2,
                marginBottom: 4,
              }}
            >
              <Text
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: c.suAccento }}
              >
                {ioSonoSoggetto ? t.gioco.tuoTurno : t.gioco.turnoAltro}
              </Text>
            </View>
            <Text className="font-serif-bold text-3xl text-foreground">
              {carta
                ? carta.tipo === 'obbligo'
                  ? t.gioco.obbligo
                  : t.gioco.verita
                : t.gioco.scegliCarta}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {roundVivo
                ? ioSonoSoggetto
                  ? t.gioco.tuaCarta
                  : t.gioco.aspettaEsito
                : ioSonoSoggetto
                  ? t.gioco.scegliCartaNota
                  : t.gioco.staScegliendo}
            </Text>
          </View>
          <TondoVetro lato={40} tinto={false} onPress={chiediUscita}>
            <X color={c.tenue} size={18} />
          </TondoVetro>
        </View>

        <View className="flex-1 justify-center gap-4 px-6">
          {cartaMostrata && voce ? (
            /* --- la carta, uguale su tutti e due i telefoni ------------------ */
            <Comparsa visibile scarto={12}>
              <CartaVetro raggio={28} fondo="pieno">
                <View className="items-center gap-4 px-7 py-9" style={{ borderRadius: 28 }}>
                  <Text
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: tinta }}
                  >
                    {carta?.tipo === 'obbligo' ? t.gioco.obbligo : t.gioco.verita}
                  </Text>
                  <Text className="text-center font-serif text-2xl text-foreground">
                    {rendi(voce, lingua)}
                  </Text>
                </View>
              </CartaVetro>
            </Comparsa>
          ) : ioSonoSoggetto ? (
            /* --- la scelta, e il round nasce da qui -------------------------- */
            <>
              {(
                [
                  ['obbligo', t.gioco.obbligo, t.gioco.obbligoNota, c.accento],
                  ['verita', t.gioco.verita, t.gioco.veritaNota, c.ambra],
                ] as const
              ).map(([tipo, titolo, nota, colore], i) => (
                <Comparsa key={tipo} visibile ritardo={i * 70} scarto={10}>
                  <Premibile onPress={() => scegliTipo(tipo)} disabled={creando} aptico={false} scala={0.97}>
                    {/* `fondo="pieno"` per la stessa ragione del quiz: col vetro
                        nativo iOS decide lui quando disegnarlo, e una carta da
                        premere che a volte non si vede è un comando invisibile
                        (B-15, preso in flagrante il 2026-09-01). */}
                    <CartaVetro raggio={26} fondo="pieno">
                      <View
                        className="gap-1 px-6 py-6"
                        style={{ borderRadius: 26, borderWidth: 2, borderColor: colore }}
                      >
                        <Text className="font-serif-bold text-2xl" style={{ color: colore }}>
                          {titolo}
                        </Text>
                        <Text className="text-sm text-muted-foreground">{nota}</Text>
                      </View>
                    </CartaVetro>
                  </Premibile>
                </Comparsa>
              ))}
            </>
          ) : (
            /* --- l'altro sta scegliendo -------------------------------------- */
            <View className="items-center gap-3">
              <ActivityIndicator color={c.accento} />
            </View>
          )}
        </View>

        {/* --- i due comandi, solo a chi ha il turno ------------------------- */}
        <View className="gap-3 px-6 pb-6" style={{ minHeight: 40 }}>
          {!!roundVivo && ioSonoSoggetto && (
            <View className="flex-row gap-3">
              <BottoneVetro altezza={54} style={{ flex: 1 }} onPress={() => decidi(false)}>
                <Text>{t.gioco.passo}</Text>
              </BottoneVetro>
              <BottonePieno
                style={{ flex: 1 }}
                altezza={54}
                testo={t.gioco.fatta}
                onPress={() => decidi(true)}
              />
            </View>
          )}
          {!!(erroreCarta || p.errore) && (
            <Text className="text-center text-sm text-destructive">{erroreCarta ?? p.errore}</Text>
          )}
        </View>
      </SafeAreaView>

      {/* --- il pop-up dell'esito (0027: si prosegue in due) ----------------- */}
      {mostraEsito && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              alignItems: 'center',
              justifyContent: 'center',
              padding: 28,
              backgroundColor: 'rgba(20,10,18,0.30)',
            },
          ]}
        >
          <Comparsa visibile scarto={14}>
            <CartaVetro raggio={28} fondo="pieno">
              <View className="items-center gap-3 px-7 py-7" style={{ minWidth: 250 }}>
                <Text
                  className="text-center font-serif-bold text-3xl"
                  style={{ color: round?.esito === 'vinto' ? c.accento : c.tenue }}
                >
                  {round?.esito === 'vinto' ? t.gioco.esitoFatta : t.gioco.esitoPassata}
                </Text>
                {/* 🔑 La riga che rende visibile D-13: passare non lascia niente
                    addosso a nessuno. Senza, il pop-up del pass sarebbe una
                    schermata muta dopo un rifiuto — cioè il posto esatto in cui
                    un'app di coppia non deve tacere. */}
                {round?.esito !== 'vinto' && (
                  <Text className="text-center text-base text-muted-foreground">
                    {t.gioco.passataNota}
                  </Text>
                )}
                {partita.stato === 'conclusa' ? (
                  <BottonePieno
                    testo={t.gioco.continua}
                    onPress={() => setFinaleLetto(true)}
                    style={{ minWidth: 200 }}
                  />
                ) : p.ioSonoProntoRound ? (
                  <View className="items-center gap-2 pt-1">
                    <ActivityIndicator color={c.accento} />
                    <Text className="text-center text-sm text-muted-foreground">
                      {t.gioco.attendoContinua}
                    </Text>
                  </View>
                ) : (
                  <BottonePieno
                    testo={t.gioco.continua}
                    onPress={p.segnaProntoRound}
                    style={{ minWidth: 200 }}
                  />
                )}
              </View>
            </CartaVetro>
          </Comparsa>
        </View>
      )}
    </View>
  );
}
