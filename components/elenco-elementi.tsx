import * as React from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarDays,
  Plus,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { CartaVetro, BottoneVetro, TondoVetro } from '@/components/ui/vetro';
import { Comparsa } from '@/components/ui/comparsa';
import { SPAZIO_BARRA, SOPRA_BARRA } from '@/components/barra-volante';
import { CercaLuogo } from '@/components/cerca-luogo';
import { FoglioAggiungiLuogo } from '@/components/foglio-aggiungi-luogo';
import { VisoreFoto } from '@/components/visore-foto';
import { Scheda } from '@/components/scheda-elemento';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';
import { caricaFoto, copertinePerElemento, fotoDegliEventiPerElemento, scegliFoto } from '@/lib/foto';
import { CercaFilm } from '@/components/cerca-film';
import { urlLocandina } from '@/lib/ricerca-film';
import { supabase } from '@/lib/supabase';
import type { Evento } from '@/lib/eventi';
import { usePreferiti, type Elemento, type TipoElemento } from '@/lib/preferiti';
import { urlFotoGoogle } from '@/lib/ricerca-luoghi';
import { useTastiera } from '@/lib/tastiera';
import { useTema } from '@/lib/tema';
import { cascata } from '@/lib/movimento';
import { lingua, t } from '@/lib/i18n';


/**
 * L'elenco di un tipo di elemento — **film** oppure **luoghi** — con le sue
 * schede, le copertine, le serate e i fogli di aggiunta.
 *
 * ⚠️ Era la schermata `app/(tabs)/preferiti.tsx`, ed era gia' generica sul
 * tipo: il tipo era uno **stato interno** scelto da un selettore in cima. Dal
 * 2026-08-27 (D-51) i luoghi vivono dentro la mappa e i film restano in Liste,
 * quindi il tipo diventa una **prop** e il selettore sparisce — chi lo usa sa
 * gia' cosa vuole mostrare.
 *
 * Il vantaggio di essere partiti da un componente gia' generico: non c'e' stato
 * niente da riscrivere, solo da spostare. Se il tipo fosse stato intrecciato
 * col resto, questo passaggio sarebbe stato una riscrittura con i suoi difetti
 * nuovi.
 *
 * ## Le schede arrivano a **onda** (2026-08-27)
 *
 * Entrano dal basso una dopo l'altra invece che tutte nello stesso fotogramma.
 * Il ritardo ha un tetto (`cascata` in `lib/movimento.ts`): con venti posti in
 * lista, senza tetto l'ultima scheda partirebbe quasi un secondo dopo la prima
 * e chi scorre subito vedrebbe righe accendersi **sotto il dito che scorre** —
 * che non si legge come cura, si legge come un'app che non sta dietro.
 *
 * ⚠️ **L'onda riparte a ogni montaggio**, ed e' voluto: nella mappa questo
 * elenco viene smontato ogni volta che si torna alla vista mappa, quindi
 * l'interruttore Mappa/Elenco *ha sempre* la sua onda. Nella scheda Liste, che
 * resta montata, succede invece una volta sola — che e' altrettanto giusto,
 * perche' li' non c'e' nessun cambio di vista da accompagnare.
 */

export function ElencoElementi({
  tipo,
  listaId = null,
}: {
  tipo: TipoElemento;
  /**
   * La wishlist di cui mostrare le voci (0022).
   *
   * ⚠️ Quando c'è, **il filtro è questo e non `tipo`**: una lista creata dalla
   * coppia può contenere insieme voci scritte a mano e film, e filtrare per
   * tipo ne mostrerebbe metà. Il `tipo` resta comunque, perché serve a decidere
   * *come si aggiunge* — un film e una voce si scrivono, un luogo si sceglie —
   * e perché ogni riga continua a disegnarsi in base al **proprio** tipo.
   */
  listaId?: string | null;
}) {
  const router = useRouter();
  const { session } = useAuth();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const {
    elementi,
    loading,
    errore,
    aggiungi,
    segnaFatto,
    recensisci,
    elimina,
    collegaPosto,
    sincronizzaVisitati,
    riparaCopertine,
    aggiungiFilm,
    riparaLocandine,
    ricarica,
  } = usePreferiti(coppiaId);
  const { c } = useTema();
  const { aperta: tastieraAperta, altezza: altezzaTastiera } = useTastiera();

  const [nuovo, setNuovo] = React.useState('');
  const [attesa, setAttesa] = React.useState(false);
  const [erroreForm, setErroreForm] = React.useState<string | null>(null);
  const [copertine, setCopertine] = React.useState<Record<string, string>>({});
  /** Il ristorante a cui si sta agganciando un posto (foglio con la ricerca). */
  const [postoPer, setPostoPer] = React.useState<Elemento | null>(null);
  /** Il foglio "cerca un ristorante vero" (D-37): niente testo libero. */
  const [cercaRist, setCercaRist] = React.useState(false);
  /** Le serate per ristorante: i legami evento→elemento (0012), in blocco. */
  const [eventiPer, setEventiPer] = React.useState<Record<string, Evento[]>>({});

  React.useEffect(() => {
    (async () => {
      if (!coppiaId) return setEventiPer({});
      // ⚠️ **Due legami, non uno.** Un evento punta al posto con `elemento_id`
      // (la scheda, da 0012) **oppure** con `luogo_id` (il posto sulla mappa,
      // da 0008). Gli eventi creati prima che il campo "dove" impostasse
      // entrambi hanno solo il secondo: filtrando per il primo risultavano
      // zero, e un posto con tre serate alle spalle non ne mostrava nessuna.
      const { data } = await supabase
        .from('evento')
        .select('*')
        .eq('coppia_id', coppiaId)
        .or('elemento_id.not.is.null,luogo_id.not.is.null')
        .order('inizio', { ascending: false });

      const perPosto = new Map<string, string>();
      for (const el of elementi) if (el.luogo_id) perPosto.set(el.luogo_id, el.id);

      const mappa: Record<string, Evento[]> = {};
      for (const e of (data ?? []) as Evento[]) {
        // `elemento_id` vince: e' il legame esplicito. `luogo_id` e' il ripiego
        // per tutto cio' che e' stato creato prima.
        const id = e.elemento_id ?? (e.luogo_id ? perPosto.get(e.luogo_id) : undefined);
        if (!id) continue;
        (mappa[id] ??= []).push(e);
      }
      setEventiPer(mappa);
    })();
  }, [coppiaId, elementi]);

  /**
   * ## ⚠️ Due elenchi di luoghi, e mostrano cose diverse (D-71)
   *
   * - **Dentro una wishlist** (`listaId` valorizzato): tutto ciò che sta in
   *   quella lista, visitato o no. È il posto dove si aggiunge e si toglie.
   * - **Dentro la mappa** (`listaId` nullo, `tipo` luogo): **solo i posti dove
   *   siete stati o che hanno una serata**. È un registro.
   *
   * 🔴 Il secondo filtro **mancava**, ed è il difetto riferito: *«l'elenco dei
   * luoghi contiene anche luoghi non ancora visitati»*. Il 2026-08-28 avevo
   * filtrato i **pin** della mappa (`useLuoghi`) e non il suo **elenco**, che
   * legge da un'altra parte — due viste della stessa cosa, una sola corretta.
   * *Quando una regola riguarda un dato, va messa dove il dato si legge; se le
   * letture sono due, i posti sono due.*
   *
   * ⚠️ Il criterio è lo stesso di `useLuoghi` e va tenuto tale: `visitato`
   * **oppure** almeno un evento, anche futuro.
   */
  const registroLuoghi = tipo === 'luogo' && listaId === null;

  const suoi = listaId
    ? elementi.filter((e) => e.lista_id === listaId)
    : elementi
        .filter((e) => e.tipo === tipo)
        .filter(
          (e) =>
            !registroLuoghi ||
            e.stato === 'fatto' ||
            (eventiPer[e.id]?.length ?? 0) > 0
        );
  const daFare = suoi.filter((e) => e.stato !== 'fatto');
  const fatti = suoi.filter((e) => e.stato === 'fatto');

  // Le copertine si chiedono in blocco per tutto l'elenco: una richiesta per
  // scheda sarebbero N attese su una schermata che si scorre.
  /**
   * Le foto delle serate, raccolte per luogo.
   *
   * ⚠️ Sono una cosa **diversa** dalle copertine: quelle sono la foto scelta a
   * mano per l'elemento, queste sono tutto cio' che avete scattato negli eventi
   * di quel posto. Servono a due cose — la copertina quando non ne avete scelta
   * una, e la striscia sotto il nome.
   */
  const [fotoLuoghi, setFotoLuoghi] = React.useState<Record<string, string[]>>({});
  /** Il luogo di cui si stanno guardando le foto a schermo pieno. */
  const [fotoAperte, setFotoAperte] = React.useState<{ id: string; da: number } | null>(null);

  const caricaCopertine = React.useCallback(async () => {
    if (elementi.length === 0) {
      setCopertine({});
      setFotoLuoghi({});
      return;
    }
    const ids = elementi.map((e) => e.id);
    const luoghiPerFoto = elementi
      .filter((e) => e.tipo === 'luogo')
      .map((e) => ({ id: e.id, luogo_id: e.luogo_id }));
    const [cop, delleSerate] = await Promise.all([
      copertinePerElemento(ids),
      fotoDegliEventiPerElemento(luoghiPerFoto),
    ]);
    setCopertine(cop);
    setFotoLuoghi(delleSerate);
  }, [elementi]);

  /**
   * All'apertura della schermata: rileggere l'elenco e fare la passata dei
   * luoghi ormai visitati.
   *
   * ⚠️ **`caricaCopertine` NON va qui**, e il motivo e' un ciclo infinito
   * ("Maximum update depth exceeded") che ci e' finito davvero:
   *
   *   `ricarica()` → nuovo array `elementi` → `caricaCopertine` cambia identita'
   *   (dipende da `elementi`) → cambia la callback del focus → l'effetto
   *   riparte → `ricarica()` → …
   *
   * Le due dipendenze qui — `ricarica` e `sincronizzaVisitati` — dipendono solo
   * da `coppiaId`, quindi sono stabili e il ciclo non si chiude.
   *
   * **La regola che ne esce**: in un effetto di focus non vanno funzioni che
   * dipendono da cio' che l'effetto stesso modifica. Le copertine reagiscono
   * agli elementi, e il posto giusto per farlo e' un effetto normale (sotto).
   */
  useFocusEffect(
    React.useCallback(() => {
      // Serve perche' i luoghi si aggiungono anche da **un'altra schermata** —
      // il form del nuovo evento — che ha la sua copia di `usePreferiti`. In un
      // navigatore a tab le schermate restano montate, quindi senza questo
      // l'elenco resterebbe quello di quando l'hai aperta la prima volta (B-09).
      ricarica();
      // I luoghi la cui serata e' ormai passata diventano "fatti" da soli
      // (0015): al momento in cui un evento diventa passato non succede niente
      // nel database, e il risultato conta solo se qualcuno lo guarda.
      sincronizzaVisitati();
    }, [ricarica, sincronizzaVisitati])
  );

  // Le copertine seguono gli elementi, e basta: nessun anello con il focus.
  React.useEffect(() => {
    caricaCopertine();
    // ⚠️ Converge: quando un luogo e' riparato non rientra piu' fra i "rotti",
    // quindi al giro successivo non parte nessuna richiesta. Se non c'e' niente
    // da riparare non ne parte nemmeno una.
    riparaCopertine();
    riparaLocandine();
  }, [caricaCopertine, riparaCopertine, riparaLocandine]);

  /** Il luogo di cui si sta guardando l'elenco completo delle serate. */
  const [serateDi, setSerateDi] = React.useState<Elemento | null>(null);

  async function salva() {
    if (nuovo.trim().length === 0) return;
    setErroreForm(null);
    setAttesa(true);
    const err = await aggiungi(tipo, nuovo, ricaricaCoppia, listaId);
    setAttesa(false);
    if (err) return setErroreForm(err);
    setNuovo('');
  }

  async function copertinaPer(elementoId: string) {
    setErroreForm(null);
    const scelta = await scegliFoto();
    if (scelta.negato) return setErroreForm(t.galleria.permessoNegato);
    if (scelta.immagini.length === 0) return;
    const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
    if (!esito.coppiaId) return setErroreForm(esito.errore);
    // Una sola immagine: la copertina e' una, e caricarne cinque per poi
    // mostrarne una sarebbe spazio consumato dal tetto senza motivo.
    const r = await caricaFoto(esito.coppiaId, [scelta.immagini[0]], { elementoId });
    if (r.errore) return setErroreForm(r.errore);
    await caricaCopertine();
  }

  // ⚠️ Non e' piu' una schermata: **niente `Fondo`, niente `SafeAreaView`**.
  // Quelli li mette chi lo ospita — la sezione Film o la mappa — che sono le
  // schermate vere. Lasciarli qui avrebbe prodotto due sfondi sovrapposti e una
  // doppia area sicura, cioe' un margine in alto che si somma a se' stesso.
  return (
    <View className="flex-1">

        {/*
         * La riga di aggiunta **non e' piu' in posizione assoluta**.
         *
         * Prima stava incollata al fondo dentro un `KeyboardAvoidingView`: un
         * figlio assoluto non partecipa al flusso, quindi il contenitore non
         * poteva spostarlo e la tastiera lo copriva per intero — si scriveva
         * alla cieca. Ora e' l'ultima riga di una colonna: quando la tastiera
         * sale, sale con lei.
         */}
        {/*
          ⚠️ **Qui c'era un `KeyboardAvoidingView`, tolto il 2026-08-28** perché
          copriva la riga di aggiunta — la seconda segnalazione di tastiera
          della giornata, dopo B-24.

          🔑 La causa: `behavior="padding"` calcola quanto padding serve **dalla
          posizione del contenitore sullo schermo**. Nella sezione Liste il
          contenitore partiva subito sotto un titolo di una riga e il conto
          tornava; dentro una lista aperta ha sopra un'intestazione più alta —
          tondo «indietro» e due righe di testo — e sottostima esattamente di
          quell'altezza. Il difetto non era nel componente: era nel fatto che il
          componente **indovina** invece di sapere.

          Ora l'altezza della tastiera si **misura** (`useTastiera`, che il
          progetto ha già perché la barra volante deve sparire) e si applica.
          Nessun conto sulle posizioni, quindi nessuna intestazione che possa
          falsarlo — stessa cura di B-24, applicata dove un foglio non c'è.
        */}
        <View className="flex-1" style={{ paddingBottom: altezzaTastiera }}>
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={c.accento} />
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerClassName="gap-3 px-5 pb-4"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              {errore && <Text className="text-sm text-destructive">{errore}</Text>}

              {suoi.length === 0 && (
                <View className="items-center gap-2 py-10">
                  <Text className="font-serif text-lg text-foreground">
                    {t.preferiti.vuoto[tipo]}
                  </Text>
                </View>
              )}

              {daFare.length > 0 && (
                <Text className="pt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {t.preferiti.daFare}
                </Text>
              )}
              {/* `n` e non `i`: dentro la scheda `i` e' gia' l'indice della
                  foto in `onFoto`, e riusarlo qui lo coprirebbe con un altro
                  significato a due righe di distanza. */}
              {daFare.map((e, n) => (
                <Comparsa key={e.id} visibile ritardo={cascata(n)} scarto={16} scala={0.97}>
                  <Scheda
                    key={e.id}
                    e={e}
                    mioId={session?.user.id}
                    // La copertina di un luogo, in ordine di precedenza:
                    //   1. quella **scelta a mano**, perche' e' una decisione;
                    //   2. l'ultima foto delle vostre **serate** li' — «se un
                    //      luogo ha immagini associate allora viene visualizzata
                    //      l'immagine»;
                    //   3. quella di **Google**, che vale finche' non ci siete
                    //      ancora stati.
                    copertina={
                      copertine[e.id] ??
                      fotoLuoghi[e.id]?.[0] ??
                      (e.foto_google ? urlFotoGoogle(e.foto_google) : undefined) ??
                      // 4. la **locandina TMDB** (0023), per i film. Ultima
                      //    perché una foto vostra vale sempre più di un poster.
                      (urlLocandina(e.locandina, 500) ?? undefined)
                    }
                    foto={fotoLuoghi[e.id]}
                    onFoto={(i) => setFotoAperte({ id: e.id, da: i })}
                    onApri={
                      e.tipo === 'luogo'
                        ? () => setSerateDi(e)
                        : undefined
                    }
                    eventi={eventiPer[e.id]}
                    soloLettura={registroLuoghi}
                    onFatto={(f) => segnaFatto(e.id, f)}
                    onRecensisci={(v, txt) => recensisci(e, v, txt)}
                    onElimina={() => elimina(e.id)}
                    onCopertina={() => copertinaPer(e.id)}
                    onPosto={() => setPostoPer(e)}
                    onEvento={(idE) => router.push({ pathname: '/evento/[id]', params: { id: idE } })}
                  />
                </Comparsa>
              ))}

              {fatti.length > 0 && (
                <Text className="pt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {t.preferiti.fatti}
                </Text>
              )}
              {/* L'onda **continua** da dove l'ha lasciata la sezione sopra:
                  due cascate che ripartono da zero si leggono come due elenchi
                  separati, e invece e' uno solo diviso in due titoli. */}
              {fatti.map((e, n) => (
                <Comparsa
                  key={e.id}
                  visibile
                  ritardo={cascata(daFare.length + n)}
                  scarto={16}
                  scala={0.97}
                >
                  <Scheda
                    key={e.id}
                    e={e}
                    mioId={session?.user.id}
                    // La copertina di un luogo, in ordine di precedenza:
                    //   1. quella **scelta a mano**, perche' e' una decisione;
                    //   2. l'ultima foto delle vostre **serate** li' — «se un
                    //      luogo ha immagini associate allora viene visualizzata
                    //      l'immagine»;
                    //   3. quella di **Google**, che vale finche' non ci siete
                    //      ancora stati.
                    copertina={
                      copertine[e.id] ??
                      fotoLuoghi[e.id]?.[0] ??
                      (e.foto_google ? urlFotoGoogle(e.foto_google) : undefined) ??
                      // 4. la **locandina TMDB** (0023), per i film. Ultima
                      //    perché una foto vostra vale sempre più di un poster.
                      (urlLocandina(e.locandina, 500) ?? undefined)
                    }
                    foto={fotoLuoghi[e.id]}
                    onFoto={(i) => setFotoAperte({ id: e.id, da: i })}
                    onApri={
                      e.tipo === 'luogo'
                        ? () => setSerateDi(e)
                        : undefined
                    }
                    eventi={eventiPer[e.id]}
                    soloLettura={registroLuoghi}
                    onFatto={(f) => segnaFatto(e.id, f)}
                    onRecensisci={(v, txt) => recensisci(e, v, txt)}
                    onElimina={() => elimina(e.id)}
                    onCopertina={() => copertinaPer(e.id)}
                    onPosto={() => setPostoPer(e)}
                    onEvento={(idE) => router.push({ pathname: '/evento/[id]', params: { id: idE } })}
                  />
                </Comparsa>
              ))}
            </ScrollView>
          )}

          {/* Lo spazio sotto serve alla barra volante — ma la barra sparisce a
              tastiera aperta, e tenerlo lascerebbe un buco sopra i tasti.
              I FILM si scrivono; i RISTORANTI si SCELGONO fra quelli veri
              (D-37): il testo libero per un posto che deve stare su una mappa
              produce solo posti che non esistono. */}
          <View
            className="gap-2 px-5 pt-2"
            // SPAZIO_BARRA intero, non ridotto: con -40 la riga di aggiunta
            // finiva sotto la pillola di vetro (feedback dal telefono).
            style={{ paddingBottom: tastieraAperta ? 10 : SPAZIO_BARRA }}
          >
            {erroreForm && <Text className="text-sm text-destructive">{erroreForm}</Text>}
            {/*
              ⚠️ **Un film si sceglie, una voce si scrive**, ed è la stessa
              distinzione già fatta per i luoghi (D-37): un film ha
              un'identità là fuori — con una locandina, un anno, e spesso un
              omonimo — mentre «prendere il passaporto» è solo ciò che ci
              scrivi. La tendina serve dove esiste qualcosa da riconoscere.
            */}
            {tipo === 'film' ? (
              <CercaFilm
                placeholder={t.film.cerca}
                onScegli={async (f) => {
                  setErroreForm(null);
                  setAttesa(true);
                  const err = await aggiungiFilm(f, listaId, ricaricaCoppia);
                  setAttesa(false);
                  if (err) setErroreForm(err);
                }}
              />
            ) : tipo !== 'luogo' ? (
              <View className="flex-row items-center gap-2">
                <Input
                  className="flex-1"
                  value={nuovo}
                  onChangeText={setNuovo}
                  placeholder={t.preferiti.placeholder.voce}
                  onSubmitEditing={salva}
                  returnKeyType="done"
                />
                <TondoVetro
                  lato={54}
                  onPress={salva}
                  disabled={attesa || nuovo.trim().length === 0}
                >
                  {attesa ? (
                    <ActivityIndicator color={c.accento} />
                  ) : (
                    <Text style={{ color: c.accento, fontSize: 26, lineHeight: 30 }}>+</Text>
                  )}
                </TondoVetro>
              </View>
            ) : null}
          </View>
        </View>

      {/* --- aggiungere un luogo: un "+" che galleggia -----------------------
          Al posto del bottone «Cerca un posto» a tutta larghezza in fondo alla
          schermata.

          Perche' e' meglio qui e non per i film: un film si **scrive**, quindi
          il campo di testo deve stare a portata di pollice ed e' giusto che
          occupi una riga stabile. Un luogo si **sceglie** fra quelli veri
          (D-37), quindi il gesto e' "apri la ricerca" — un'azione, non un
          campo. Un bottone largo quanto lo schermo per una sola azione ruba una
          riga all'elenco a ogni scorrimento; un tondo non ruba niente.

          Sta sopra la barra volante come tutti gli altri tondi dell'app
          (`SOPRA_BARRA`), cosi' non ci finisce sotto. */}
      {/*
        ⚠️ **Solo dentro una wishlist** (0024): nella mappa questo elenco mostra
        ormai *dove siete stati*, e in un registro non si aggiunge a mano — ci si
        finisce essendoci andati. Il «+» lì sarebbe l'ultima porta rimasta aperta
        verso il vecchio modello, e quelle porte, come ha mostrato D-64, non
        restano chiuse da sole: qualcuno le ricollega credendole equivalenti.
      */}
      {tipo === 'luogo' && listaId !== null && !tastieraAperta && (
        <View style={{ position: 'absolute', right: 20, bottom: SOPRA_BARRA }}>
          <TondoVetro lato={58} onPress={() => setCercaRist(true)}>
            <Plus color={c.accento} size={26} />
          </TondoVetro>
        </View>
      )}

      {/* ⚠️ Il foglio non e' piu' scritto qui: e' lo **stesso componente** che
          usa la mappa (2026-08-28). Prima erano due copie che facevano la stessa
          cosa in due modi diversi — vedi il commento in testa a
          `components/foglio-aggiungi-luogo.tsx`. */}
      <FoglioAggiungiLuogo
        visibile={cercaRist}
        onChiudi={() => setCercaRist(false)}
        coppiaId={coppiaId}
        ricaricaCoppia={ricaricaCoppia}
        listaId={listaId}
        onAggiunto={ricarica}
      />

      {/* Il foglio "aggiungi il posto": la stessa ricerca della mappa. */}
      <Modal
        visible={postoPer !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPostoPer(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}
        >
          <CartaVetro raggio={30} fondo="pieno" style={{ margin: 8 }}>
            <SafeAreaView edges={['bottom']}>
              <View className="gap-4 p-6">
                <View className="flex-row items-center justify-between">
                  <Text className="font-serif-bold text-2xl text-foreground" numberOfLines={1}>
                    {postoPer?.titolo}
                  </Text>
                  <Pressable onPress={() => setPostoPer(null)} hitSlop={8}>
                    <X color={c.tenue} size={20} />
                  </Pressable>
                </View>
                <Text className="text-sm text-muted-foreground">{t.mappa.cercaNota}</Text>
                <CercaLuogo
                  dentroUnFoglio
                  autoFocus
                  onScegli={async (trovato) => {
                    if (!postoPer) return;
                    const err = await collegaPosto(postoPer, trovato);
                    if (err)
                      setErroreForm(err === 'solo-autore' ? t.evento.soloAutore : err);
                    setPostoPer(null);
                  }}
                />
              </View>
            </SafeAreaView>
          </CartaVetro>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- le serate di un luogo -----------------------------------------
          ⚠️ **Non è un `Modal`, ed è la terza stesura di questo pannello.**

          Storia, perché non si ripeta: prima `Foglio` (non compariva), poi un
          `Modal` normale copiato dagli altri quattro di questo file (non
          compariva neanche lui). Il log sul tocco aveva già escluso metà delle
          ipotesi — `[luogo] toccato Londra — serate: 1`, quindi il gesto
          arrivava e lo stato veniva impostato. Restava solo la presentazione.

          Su iOS un `Modal` che si presenta mentre un altro è presentato, o
          mentre l'albero si sta ri-renderizzando per altro, **fallisce in
          silenzio**: non lancia, non avvisa, semplicemente non compare. Questa
          schermata ne monta cinque, e ne ri-renderizza spesso per via delle
          copertine.

          Un pannello disegnato **dentro la schermata** non ha nessuno di questi
          modi di fallire: se lo stato c'è, si vede. È lo stesso meccanismo
          dell'anteprima sulla mappa, che infatti non ha mai dato problemi.
          Costa la perdita dell'animazione di sistema — accettata volentieri. */}
      {serateDi && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            zIndex: 50,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(20,8,14,0.45)',
          }}
        >
          {/* Toccare fuori chiude. Sta sotto al pannello, e prende solo l'area
              che il pannello non copre. */}
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            onPress={() => setSerateDi(null)}
          />
          {/* ⚠️ Sopra la barra volante, non sotto.
              La barra delle funzioni la disegna il **navigatore**, non questa
              schermata: sta quindi piu' in alto di qualunque `zIndex` messo
              qui, e un pannello ancorato al fondo ci finirebbe dietro — a
              partire dal bottone "Chiudi". Con un `Modal` non succedeva, ed e'
              il prezzo dell'averlo tolto: si paga con un margine. */}
          <View
            style={{
              marginHorizontal: 8,
              marginBottom: SOPRA_BARRA,
              maxHeight: '70%',
              borderRadius: 30,
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            <SafeAreaView edges={['bottom']}>
              <View className="gap-3 p-6">
                <Text className="font-serif-bold text-2xl text-foreground">{serateDi.titolo}</Text>
                <ScrollView contentContainerClassName="gap-2" style={{ maxHeight: 380 }}>
                  {(eventiPer[serateDi.id] ?? []).length === 0 ? (
                    <Text className="py-4 text-base text-muted-foreground">
                      {t.mappa.nessunEvento}
                    </Text>
                  ) : (
                    (eventiPer[serateDi.id] ?? []).map((ev) => (
                      <Pressable
                        key={ev.id}
                        onPress={() => {
                          setSerateDi(null);
                          router.push({ pathname: '/evento/[id]', params: { id: ev.id } });
                        }}
                        className="flex-row items-center gap-3 rounded-2xl bg-muted p-3"
                      >
                        <CalendarDays color={c.accento} size={16} />
                        <View className="flex-1">
                          <Text className="font-serif text-base text-foreground">{ev.titolo}</Text>
                          <Text className="text-xs text-muted-foreground">
                            {new Date(ev.inizio).toLocaleDateString(lingua, {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
                <BottoneVetro onPress={() => setSerateDi(null)} altezza={48}>
                  <Text>{t.calendario.chiudi}</Text>
                </BottoneVetro>
              </View>
            </SafeAreaView>
          </View>
        </View>
      )}


      {/* --- le foto di un luogo, a schermo pieno ---------------------------
          Lo stesso visore della galleria e della pagina evento: sfogliare,
          ingrandire, chiudere trascinando.

          ⚠️ Qui le foto sono gia' **indirizzi firmati**, non chiavi di storage
          come altrove, perche' arrivano da `fotoDegliEventiPerElemento` che le
          firma in blocco. Il visore vuole una coppia (elenco, mappa
          chiave→indirizzo): gliela si costruisce usando l'indirizzo stesso come
          chiave. E' un adattamento di tre righe, e l'alternativa era far
          restituire le chiavi grezze e rifirmarle qui — cioe' una seconda
          chiamata di rete per non scrivere queste tre righe.

          Niente azioni: da qui le foto si guardano. Si cancellano dove vivono,
          cioe' nell'evento o nella galleria. */}
      <VisoreFoto
        foto={(fotoAperte ? (fotoLuoghi[fotoAperte.id] ?? []) : []).map((u, i) => ({
          id: `${u}-${i}`,
          chiave_storage: u,
          autore_id: '',
        }))}
        url={Object.fromEntries(
          (fotoAperte ? (fotoLuoghi[fotoAperte.id] ?? []) : []).map((u) => [u, u])
        )}
        indice={fotoAperte ? fotoAperte.da : null}
        onChiudi={() => setFotoAperte(null)}
      />
    </View>
  );
}
