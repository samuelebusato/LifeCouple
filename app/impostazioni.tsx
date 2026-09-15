import * as React from 'react';
import { Alert, View, ScrollView, TextInput, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { Premibile } from '@/components/ui/premibile';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Fondo } from '@/components/schermata';
import { CartaVetro, TondoVetro } from '@/components/ui/vetro';
import { Comparsa } from '@/components/ui/comparsa';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { useInvito } from '@/lib/invito';
import { SceltaInsiemeDal, dataLunga } from '@/components/insieme';
import { useCondivisionePosizione, usePosizioni } from '@/lib/posizione';
import { SceltaData } from '@/components/scelta-data';
import { anniCompiuti, ETA_MINIMA, salvaDataNascita, useCompleanni } from '@/lib/compleanni';
import { esportaMieiDati } from '@/lib/esporta';
import { useTema } from '@/lib/tema';
import {
  registraDispositivo,
  usePreferenzeNotifiche,
  type TipoNotifica,
} from '@/lib/notifiche';
import { t } from '@/lib/i18n';
// ⚠️ `apriPaywall` NON si importa qui, di proposito (B-71): apre il paywall
// ospitato da RevenueCat, che è una seconda porta per la stessa vendita e non
// porta le frasi del recesso. Si usa `router.push('/paywall')`, come i muri.
import { useInsieme, apriGestioneAbbonamento, ripristinaAcquisti } from '@/lib/acquisti';

/**
 * **Impostazioni**: invito, scioglimento, cancellazione dell'account, uscita.
 *
 * ## Perché nasce (2026-08-29)
 *
 * Non è una schermata di comodità: due delle quattro voci sono **obbligatorie
 * per pubblicare**. Apple richiede che un'app che permette di creare un account
 * permetta di cancellarlo **dall'app**; Google chiede lo stesso nel modulo Data
 * safety. Fino a oggi `app/` aveva 17 schermate e nessuna di impostazioni, e
 * `sciogli_coppia()` esisteva nel database dal 2026-08-12 **senza interfaccia**.
 *
 * ## 🔑 Le tre voci sono ordinate per gravità, e separate a vista
 *
 * «Esci», «sciogli» e «cancella» si assomigliano in una lista di bottoni e
 * hanno conseguenze incomparabili: la prima non tocca niente, la seconda toglie
 * l'accesso ai ricordi dell'altro, la terza distrugge i propri. Stanno in
 * sezioni diverse, e le due irreversibili chiedono una conferma che **dice cosa
 * succede** invece di chiedere «sei sicuro?» — che non aggiunge niente a ciò
 * che chi preme già sa.
 *
 * ⚠️ E la più grave delle due chiede **di scrivere una parola**: non per
 * cerimonia, ma perché è l'unico attrito che un dito che scorre non supera per
 * inerzia.
 */
export default function Impostazioni() {
  const router = useRouter();
  const { c } = useTema();
  const { session } = useAuth();
  const { coppiaId, completa, insiemeDal, ricarica } = useCoppia();

  const invito = useInvito(!!coppiaId && !completa, ricarica);

  const [chiede, setChiede] = React.useState<null | 'sciogli' | 'cancella'>(null);
  const [parola, setParola] = React.useState('');
  const [attesa, setAttesa] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [esporto, setEsporto] = React.useState(false);
  const [esitoExport, setEsitoExport] = React.useState<string | null>(null);
  const [cambiaData, setCambiaData] = React.useState(false);

  // --- La data di nascita (0032) -------------------------------------------
  const { compleanni, ricarica: ricaricaCompleanni } = useCompleanni();
  const miaNascita = compleanni.find((c) => c.mia)?.data ?? null;
  const [nuovaNascita, setNuovaNascita] = React.useState<string | null>(null);
  const [cambiaNascita, setCambiaNascita] = React.useState(false);

  async function salvaNascita() {
    if (!session || !nuovaNascita) return;
    const anni = anniCompiuti(nuovaNascita);
    if (anni === null) return setErrore(t.registrati.nascitaNonValida);
    if (anni < ETA_MINIMA) return setErrore(t.registrati.troppoGiovane(ETA_MINIMA));
    const err = await salvaDataNascita(session.user.id, nuovaNascita);
    if (err) return setErrore(err);
    // Si rilegge invece di fidarsi (B-23): la torta sul calendario dipende da
    // questo dato, e una data non salvata lascerebbe il compleanno invisibile.
    await ricaricaCompleanni();
    setCambiaNascita(false);
  }

  // --- La posizione condivisa (D-100) --------------------------------------
  const { condivido, imposta: impostaCondivisione } = useCondivisionePosizione(session?.user.id);
  const { pubblica, smettiDiCondividere } = usePosizioni(coppiaId, false);

  /**
   * Accende o spegne la condivisione.
   *
   * 🔴 Spegnendo si **cancella** la riga, non si alza un flag, e non parte
   * nessuna notifica: per il partner il risultato dev'essere indistinguibile da
   * un telefono scarico (migrazione 0031).
   *
   * ⚠️ Se l'accensione fallisce si **torna indietro**: un interruttore acceso su
   * una condivisione mai partita direbbe il falso su chi ti vede, ed è il
   * difetto peggiore che questa funzione possa avere (B-52).
   */
  const cambiaCondivisione = React.useCallback(
    async (valore: boolean) => {
      if (!valore) {
        await impostaCondivisione(false);
        await smettiDiCondividere();
        return;
      }
      await impostaCondivisione(true);
      const err = await pubblica();
      if (err) {
        await impostaCondivisione(false);
        Alert.alert(
          t.mappa.condivisioneNonRiuscitaTitolo,
          err === 'permesso-negato' ? t.mappa.condivisionePermesso : t.mappa.condivisioneErrore
        );
      }
    },
    [impostaCondivisione, pubblica, smettiDiCondividere]
  );

  /* --- Le notifiche ---------------------------------------------------
   * Il permesso si chiede QUI e non all'avvio, ed è una scelta.
   * ⚠️ iOS mostra il dialogo **una volta sola**: negato una volta, l'unica
   * strada resta le impostazioni di sistema. Chiederlo all'apertura, prima
   * che esista qualcosa da notificare, è il modo più efficace di perdere la
   * possibilità di chiederlo quando serve. Qui la persona sta già leggendo
   * cosa riceverà. */
  /* --- Insieme (l'abbonamento) ----------------------------------------
   * 🔑 `useInsieme` legge il DATABASE, non l'SDK: e' il cancello vero
   * (0041 + docs/threat-model.md §4-ter). Cio' che RevenueCat sa serve solo
   * a decidere quale pulsante disegnare.
   */
  const { insieme, ricarica: ricaricaInsieme } = useInsieme();
  const [esitoInsieme, setEsitoInsieme] = React.useState<string | null>(null);
  const [inCorso, setInCorso] = React.useState(false);

  /**
   * 🔴 **B-71 — c'erano DUE paywall, e questo apriva quello sbagliato.**
   *
   * Questa funzione chiamava `apriPaywall()`, cioè `RevenueCatUI.presentPaywall()`:
   * il paywall **ospitato da RevenueCat**, disegnato nel loro pannello. Ma i
   * muri di `components/muro.tsx` mandano a `/paywall`, cioè
   * [`app/paywall.tsx`](paywall.tsx), costruito coi componenti dell'app.
   *
   * ⚠️ **Quindi la stessa app vendeva la stessa cosa da due schermate diverse**,
   * con aspetto, testi e prezzi presi da fonti diverse — e quella di RevenueCat
   * **non è nemmeno configurata** nel loro pannello (l'onboarding del progetto
   * elenca ancora «Create your first paywall» fra i passi da fare).
   *
   * 🔑 *Il difetto non è estetico*: `app/paywall.tsx` porta le due frasi del
   * recesso sopra il pulsante e i link ai documenti legali (**B-66**, D-121).
   * Il paywall di RevenueCat no. Vendere da lì significava vendere **senza le
   * informazioni precontrattuali** che il Codice del Consumo impone — e senza
   * il testo che fa decadere il recesso.
   *
   * Ora fa esattamente ciò che fanno i muri: una porta sola.
   */
  function passaAInsieme() {
    setEsitoInsieme(null);
    router.push('/paywall');
  }

  async function ripristina() {
    setEsitoInsieme(null);
    setInCorso(true);
    const r = await ripristinaAcquisti();
    setEsitoInsieme(r.ok ? t.abbonamento.ripristinato : t.abbonamento.nonDisponibile);
    if (r.ok) await ricaricaInsieme({ insistendo: true });
    setInCorso(false);
  }

  const { preferenze, cambia } = usePreferenzeNotifiche();
  const [esitoNotifiche, setEsitoNotifiche] = React.useState<string | null>(null);

  async function accendiNotifiche(tipo: TipoNotifica, acceso: boolean) {
    setEsitoNotifiche(null);
    if (acceso) {
      // Il permesso di sistema serve prima del consenso al singolo tipo:
      // senza, l'interruttore direbbe «acceso» e non arriverebbe niente.
      const esito = await registraDispositivo();
      if (esito.stato === 'negato') return setEsitoNotifiche(t.notifiche.permessoNegato);
      if (esito.stato === 'non-supportato')
        return setEsitoNotifiche(t.notifiche.permessoNonSupportato);
    }
    const errore = await cambia(tipo, acceso);
    if (errore) setEsitoNotifiche(t.notifiche.nonRiuscito);
  }

  async function esporta() {
    setEsitoExport(null);
    setEsporto(true);
    const esito = await esportaMieiDati();
    setEsporto(false);
    setEsitoExport(
      esito.ok ? t.impostazioni.esportaFatto(esito.righe) : t.impostazioni.esportaNonRiuscita
    );
  }

  async function sciogli() {
    setErrore(null);
    setAttesa(true);
    const { error } = await supabase.rpc('sciogli_coppia');
    if (error) {
      setAttesa(false);
      return setErrore(error.message);
    }
    // ⚠️ Si rilegge invece di fidarsi (B-23): uno scioglimento che non è
    // avvenuto lascerebbe la schermata a dire che è finita mentre non lo è.
    await ricarica();
    setAttesa(false);
    setChiede(null);
    router.replace('/');
  }

  async function cancella() {
    setErrore(null);
    setAttesa(true);
    // La cancellazione passa dalla Edge Function: è l'unico punto del progetto
    // che può togliere una riga da `auth.users`, e il token dice a lei chi
    // siamo — l'id non viaggia mai nel corpo della richiesta.
    const { error } = await supabase.functions.invoke('cancella-account', { body: {} });
    if (error) {
      setAttesa(false);
      return setErrore(t.impostazioni.cancellaNonRiuscita);
    }
    // L'account non esiste più: la sessione locale va buttata, o l'app
    // continuerebbe a presentare un token che non corrisponde a nessuno.
    await supabase.auth.signOut();
    setAttesa(false);
    router.replace('/');
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-6 pb-2 pt-1">
          <Text className="font-serif-bold text-3xl text-foreground">{t.impostazioni.titolo}</Text>
          <TondoVetro lato={40} tinto={false} onPress={() => router.back()}>
            <X color={c.tenue} size={18} />
          </TondoVetro>
        </View>

        <ScrollView
          contentContainerClassName="gap-6 px-6 pb-10 pt-2"
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Account -------------------------------------------------
              ⟳ **L'esportazione è rientrata qui** (2026-09-15). Era un blocco a
              sé, senza etichetta di sezione, fra Account e Notifiche: un orfano
              che sembrava l'inizio di una sezione nuova e non lo era.
              ⚠️ *È **portabilità**, art. 20 GDPR — un diritto sul proprio
              account, quindi il posto era sempre stato questo.* */}
          <Gruppo titolo={t.impostazioni.sezioneAccount}>
            <Riga
              titolo={session?.user.email ?? '—'}
              valore={t.impostazioni.esci}
              onPress={() => supabase.auth.signOut()}
            />
            <Riga
              titolo={t.impostazioni.esportaTitolo}
              nota={t.impostazioni.esportaNota}
              valore={esporto ? t.impostazioni.esportaInCorso : null}
              onPress={esporto ? undefined : esporta}
              disabilitato={esporto}
              ultima
            />
            {!!esitoExport && <Text className="pb-3 text-sm text-foreground">{esitoExport}</Text>}
          </Gruppo>

          {/* --- Le notifiche --------------------------------------------- */}
          {/* 🔑 I due interruttori di servizio e quello promozionale stanno
              nella stessa lista ma non sono la stessa cosa: `inviti_a_tornare`
              nasce SPENTO (migrazione 0038) perché è un sollecito a usare il
              prodotto, e un consenso presunto lì non sarebbe valido. La nota
              sotto l'interruttore lo dice a chi legge, invece di lasciarlo
              dedurre dallo stato iniziale. */}
          <Gruppo titolo={t.notifiche.sezione}>
            {/* 🔑 Questa riga resta, e sembra una cortesia ma non lo è: la
                seconda metà — **«Puoi cambiare idea quando vuoi»** — è la
                revocabilità del consenso (art. 7.3 GDPR) detta in italiano
                semplice, e `inviti_a_tornare` sta proprio su consenso.
                ⚠️ *È l'unico posto dell'app dove quella frase compare.* */}
            <Text className="pt-3 text-xs leading-snug text-muted-foreground">
              {t.notifiche.nota}
            </Text>
            {(
              [
                ['luogo_del_partner', t.notifiche.luogoDelPartner, t.notifiche.luogoDelPartnerNota],
                ['ricordi', t.notifiche.ricordi, t.notifiche.ricordiNota],
                ['inviti_a_tornare', t.notifiche.invitiATornare, t.notifiche.invitiATornareNota],
                ['scioglimento', t.notifiche.scioglimento, t.notifiche.scioglimentoNota],
              ] as [TipoNotifica, string, string][]
            ).map(([tipo, titolo, nota], i, tutte) => (
              <View
                key={tipo}
                className="flex-row items-center gap-3 py-3.5"
                style={
                  i === tutte.length - 1
                    ? undefined
                    : { borderBottomWidth: 1, borderBottomColor: c.linea }
                }
              >
                <View className="flex-1 gap-0.5">
                  <Text className="text-base text-foreground">{titolo}</Text>
                  {/* ⚠️ Le note restano tutte e tre, a differenza delle altre
                      sezioni: `inviti_a_tornare` nasce SPENTO (0038) perché è
                      un sollecito promozionale. 🔑 *Toglierla a una sola farebbe
                      sembrare quella la voce «normale»* — il contrario. */}
                  <Text className="text-xs leading-snug text-muted-foreground">{nota}</Text>
                </View>
                <Switch value={preferenze[tipo]} onValueChange={(v) => accendiNotifiche(tipo, v)} />
              </View>
            ))}

            {!!esitoNotifiche && (
              <Text className="pb-3 text-sm text-foreground">{esitoNotifiche}</Text>
            )}
          </Gruppo>

          {/* --- La coppia: invito ----------------------------------------
              ⚠️ **Questa sezione tiene la sua forma interna, e non è una
              scorciatoia.** Le altre sono diventate righe compatte perché sono
              *comandi*; qui dentro ci sono un invito da generare e condividere,
              due date da scegliere e un interruttore — cioè **moduli**, che
              hanno bisogno di spazio per essere compilati. 🔑 *Il contenitore
              però è lo stesso*: quel che mancava fra una sezione e l'altra era
              il fondo, non il contenuto. */}
          <Gruppo titolo={t.impostazioni.sezioneCoppia}>
            <View className="gap-3 py-3">
            {completa ? (
              <Text className="text-sm text-muted-foreground">
                {t.impostazioni.invitaCoppiaPiena}
              </Text>
            ) : (
              <View className="gap-3">
                <Text className="font-serif text-lg text-foreground">
                  {t.impostazioni.invitaTitolo}
                </Text>
                <Text className="text-sm text-muted-foreground">{t.impostazioni.invitaNota}</Text>

                {invito.link ? (
                  <>
                    <CartaVetro raggio={18} fondo="sicuro">
                      <Text
                        className="px-4 py-3 text-xs text-muted-foreground"
                        numberOfLines={2}
                        selectable
                      >
                        {invito.link}
                      </Text>
                    </CartaVetro>
                    <Button onPress={() => invito.condividi()}>
                      <Text>{t.impostazioni.invitaCondividi}</Text>
                    </Button>
                  </>
                ) : (
                  <Button
                    disabled={invito.attesa}
                    onPress={async () => {
                      const l = await invito.creaLink();
                      if (l) await invito.condividi(l);
                    }}
                  >
                    <Text>
                      {invito.attesa ? t.impostazioni.invitaCreo : t.impostazioni.invitaCrea}
                    </Text>
                  </Button>
                )}

                {/* La conferma è il passo di D-14 che interrompe davvero
                    l'ingresso di un estraneo che ha aperto un link inoltrato.
                    Compare solo quando c'è qualcosa da confermare. */}
                <Comparsa visibile={!!invito.invitoApertoId} scarto={10}>
                  {!!invito.invitoApertoId && (
                    <CartaVetro raggio={20} fondo="sicuro">
                      <View className="gap-3 p-4">
                        <Text className="font-serif text-lg text-foreground">
                          {t.impostazioni.invitaApertoTitolo}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          {t.impostazioni.invitaApertoNota}
                        </Text>
                        <Button disabled={invito.attesa} onPress={invito.conferma}>
                          <Text>{t.impostazioni.invitaConferma}</Text>
                        </Button>
                      </View>
                    </CartaVetro>
                  )}
                </Comparsa>

                {!!invito.errore && (
                  <Text className="text-sm text-destructive">{invito.errore}</Text>
                )}
              </View>
            )}

            {/* --- La data da cui state insieme (D-29) -------------------- */}
            {/* Fino al 2026-09-05 si poteva scegliere **una volta sola**, dal
                riquadro in home, e chi sbagliava non aveva nessuna via per
                correggersi: l'unico modo era l'SQL a mano con la chiave
                `service_role` — che è come la data della coppia di prova era
                stata spostata il 2026-08-28.
                ⚠️ Sta qui e non fra le «cose senza ritorno» perché **non è
                irreversibile**: si può ricambiare quante volte si vuole, e la
                funzione sposta il segno sul calendario invece di duplicarlo.
                Compare solo con una coppia: `imposta_insieme_dal` rifiuta chi
                non ne ha, e un comando che fallisce con «non sei in una
                coppia» è peggio di un comando assente. */}
            {!!coppiaId && (
              <View className="gap-2">
                <Text className="font-serif text-lg text-foreground">
                  {t.impostazioni.insiemeTitolo}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {insiemeDal
                    ? `${t.insieme.dal(dataLunga(insiemeDal))} — ${t.impostazioni.insiemeNota}`
                    : t.impostazioni.insiemeNonImpostata}
                </Text>

                {cambiaData ? (
                  <View className="gap-3">
                    <SceltaInsiemeDal
                      iniziale={insiemeDal}
                      ricarica={ricarica}
                      etichettaSalva={t.impostazioni.insiemeSalva}
                      suFatto={() => setCambiaData(false)}
                    />
                    <Button variant="ghost" onPress={() => setCambiaData(false)}>
                      <Text>{t.impostazioni.insiemeAnnulla}</Text>
                    </Button>
                  </View>
                ) : (
                  <Button variant="outline" onPress={() => setCambiaData(true)}>
                    <Text>{t.impostazioni.insiemeCambia}</Text>
                  </Button>
                )}
              </View>
            )}

            {/* --- La data di nascita (0032) ------------------------------ */}
            {/* ⚠️ Sta nelle impostazioni e non solo alla registrazione perché
                chi si è iscritto **prima** che questa esistesse non l'ha mai
                data, e senza una via per metterla il suo compleanno non
                comparirebbe mai. È lo stesso motivo per cui la data d'inizio è
                correggibile: un dato chiesto una volta sola è un dato che chi
                sbaglia non può più aggiustare. */}
            <View className="gap-2">
              <Text className="font-serif text-lg text-foreground">
                {t.impostazioni.nascitaTitolo}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {miaNascita ? dataLunga(miaNascita) : t.impostazioni.nascitaMai}
              </Text>
              {cambiaNascita ? (
                <View className="gap-3">
                  <SceltaData
                    valore={nuovaNascita ?? miaNascita}
                    onCambia={setNuovaNascita}
                    massimo={new Date()}
                  />
                  <Button disabled={!nuovaNascita} onPress={salvaNascita}>
                    <Text>{t.impostazioni.nascitaSalva}</Text>
                  </Button>
                  <Button variant="ghost" onPress={() => setCambiaNascita(false)}>
                    <Text>{t.impostazioni.insiemeAnnulla}</Text>
                  </Button>
                </View>
              ) : (
                <Button variant="outline" onPress={() => setCambiaNascita(true)}>
                  <Text>
                    {miaNascita ? t.impostazioni.nascitaCambia : t.impostazioni.nascitaAggiungi}
                  </Text>
                </Button>
              )}
            </View>

            {/* --- Far vedere dove sei (D-100) ---------------------------- */}
            {/* Spostata qui dalla mappa il 2026-09-05, su richiesta dell'utente.
                ⚠️ D-100 chiedeva che spegnere fosse raggiungibile **in un gesto
                dalla mappa**, e questo spostamento allunga quel percorso: la
                tutela si degrada e va detto invece di far finta di niente.
                🔑 Ciò che la tiene in piedi è che **il proprio tondo compare
                sulla mappa solo se si sta condividendo** — la riga nel database
                esiste solo allora. Chi guarda la mappa sa di essere visibile
                senza doverlo chiedere a nessuna schermata: il disegno stesso è
                l'indicatore, e questo era il punto vero della regola. */}
            {!!coppiaId && (
              <View className="gap-2">
                <Text className="font-serif text-lg text-foreground">
                  {condivido ? t.mappa.condivisioneAttiva : t.mappa.condividiPosizione}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {condivido ? t.mappa.condivisioneNota : t.mappa.condivisioneInvito}
                </Text>
                <Button
                  variant={condivido ? 'outline' : 'default'}
                  onPress={() => cambiaCondivisione(!condivido)}
                >
                  <Text>{condivido ? t.mappa.spegni : t.mappa.accendi}</Text>
                </Button>
              </View>
            )}
            </View>
          </Gruppo>

          {/* --- Documenti legali ----------------------------------------- */}
          {/* Il secondo dei due punti d'ingresso richiesti: la registrazione li
              mostra una volta sola, qui restano **permanenti**. È anche l'unico
              posto in cui li ritrova chi ha creato l'account mesi fa. */}
          {/* --- Insieme --------------------------------------------------- */}
          {/* ⚠️ Lo stato mostrato viene dal DATABASE. Se un domani qualcuno lo
              sostituisse con `customerInfo.entitlements.active`, il prodotto
              diventerebbe gratis per chiunque sappia ricompilare l'app — e
              nessuna schermata cambierebbe aspetto. */}
          {/* 🔑 **Lo stato dell'abbonamento è diventato il valore della prima
              riga**, invece di una frase grigia sopra tre pulsanti. Chi apre
              questa sezione vuole sapere una cosa sola — *ce l'ho o no?* — e ora
              la legge in linea col titolo, non in una nota. */}
          <Gruppo titolo={t.abbonamento.sezione}>
            {insieme ? (
              <>
                <Riga titolo={t.abbonamento.sezione} valore={t.abbonamento.attivo} />
                {/* Il Customer Center di RevenueCat: disdetta, cambio piano,
                    rimborso. ⚠️ Apple pretende che un'app con abbonamenti dica
                    come disdire — questo lo fa senza costruirlo noi. */}
                <Riga
                  titolo={t.abbonamento.gestisci}
                  onPress={
                    inCorso
                      ? undefined
                      : async () => setEsitoInsieme(await apriGestioneAbbonamento())
                  }
                  disabilitato={inCorso}
                />
              </>
            ) : (
              <Riga
                titolo={t.abbonamento.passa}
                nota={t.abbonamento.nota}
                onPress={inCorso ? undefined : passaAInsieme}
                disabilitato={inCorso}
              />
            )}

            {/* 🔴 Obbligatorio per la revisione Apple: chi cambia telefono o
                reinstalla deve poter riavere cio' che ha pagato. */}
            <Riga
              titolo={t.abbonamento.ripristina}
              onPress={inCorso ? undefined : ripristina}
              disabilitato={inCorso}
              ultima
            />

            {!!esitoInsieme && <Text className="pb-3 text-sm text-foreground">{esitoInsieme}</Text>}
          </Gruppo>

          {/* 🔑 Due documenti, due righe. Prima erano due pulsanti «ghost» a
              tutta larghezza: la stessa forma dei comandi che *fanno* qualcosa,
              per due voci che si limitano ad **aprire una pagina**. ⚠️ *Dare a
              un link l'aspetto di un'azione è ciò che fa esitare prima di
              toccarlo.* */}
          <Gruppo titolo={t.legale.sezione}>
            <Riga titolo={t.legale.privacyTitolo} onPress={() => router.push('/legale/privacy')} />
            <Riga titolo={t.legale.cookieTitolo} onPress={() => router.push('/legale/cookie')} />
            {/* ➳ I termini, dal 2026-09-15. 🔑 *La nota sta sull'ultima riga e
                vale per il gruppo*: sono i documenti rileggibili, e ripeterla
                su ciascuna la farebbe sparire. */}
            <Riga
              titolo={t.legale.terminiTitolo}
              nota={t.legale.impostazioniNota}
              onPress={() => router.push('/legale/termini')}
              ultima
            />
          </Gruppo>

          {/* --- Cose senza ritorno ---------------------------------------
              ⚠️ **Qui le note restano, e non è un'incoerenza col resto.** Nelle
              altre sezioni sono sparite perché quasi tutte le voci si spiegano
              da sé; queste due no — e ora che sono fra le poche note della
              schermata, **si notano**. È l'effetto voluto: in una colonna dove
              ogni voce aveva la sua spiegazione, quelle che contavano sparivano
              fra le altre. */}
          <Gruppo titolo={t.impostazioni.sezionePericolo} pericolo>
            {/* Lo scioglimento esiste solo se c'è una coppia da sciogliere: un
                comando che fallirebbe con «non sei in una coppia» è peggio di
                un comando assente. */}
            {!!coppiaId && (
              <Riga
                titolo={t.impostazioni.sciogliTitolo}
                nota={t.impostazioni.sciogliNota}
                onPress={() => setChiede('sciogli')}
                pericolo
              />
            )}
            {/* 🔴 Obbligo, non cortesia: cancellare l'account NON disdice
                l'abbonamento, che vive sullo store e che noi non possiamo
                annullare al posto suo. Senza quella frase una persona
                continuerebbe a pagare per un account che non esiste piu'. */}
            <Riga
              titolo={t.impostazioni.cancellaTitolo}
              nota={
                insieme
                  ? `${t.impostazioni.cancellaNota} ${t.abbonamento.avvisoCancellazione}`
                  : t.impostazioni.cancellaNota
              }
              onPress={() => {
                setParola('');
                setChiede('cancella');
              }}
              pericolo
              ultima
            />
          </Gruppo>

          {/* --- La conferma, che dice cosa succede ----------------------- */}
          <Comparsa visibile={chiede !== null} scarto={12}>
            {chiede !== null && (
              <CartaVetro raggio={24} fondo="sicuro">
                <View className="gap-3 p-5">
                  <Text className="font-serif-bold text-xl" style={{ color: c.pericolo }}>
                    {chiede === 'sciogli'
                      ? t.impostazioni.sciogliChiedi
                      : t.impostazioni.cancellaChiedi}
                  </Text>
                  <Text className="text-sm text-foreground">
                    {chiede === 'sciogli'
                      ? t.impostazioni.sciogliSpiega
                      : t.impostazioni.cancellaSpiega}
                  </Text>

                  {chiede === 'cancella' && (
                    <>
                      {/* Obbligatorio su Apple, e giusto comunque: cancellare
                          l'account non disdice l'abbonamento, che vive nello
                          store e non qui. */}
                      <Text className="text-sm text-muted-foreground">
                        {t.impostazioni.cancellaAbbonamento}
                      </Text>
                      <Text className="text-sm text-foreground">
                        {t.impostazioni.cancellaScrivi}
                      </Text>
                      <CartaVetro raggio={16} fondo="sicuro">
                        <TextInput
                          value={parola}
                          onChangeText={setParola}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          placeholder={t.impostazioni.cancellaParola}
                          placeholderTextColor={c.tenue}
                          style={{
                            height: 46,
                            paddingHorizontal: 14,
                            fontSize: 16,
                            color: c.testo,
                          }}
                        />
                      </CartaVetro>
                    </>
                  )}

                  {!!errore && <Text className="text-sm text-destructive">{errore}</Text>}

                  {attesa ? (
                    <View className="items-center py-2">
                      <ActivityIndicator color={c.accento} />
                      <Text className="mt-2 text-sm text-muted-foreground">
                        {chiede === 'sciogli'
                          ? t.impostazioni.sciogliInCorso
                          : t.impostazioni.cancellaInCorso}
                      </Text>
                    </View>
                  ) : (
                    <View className="gap-2">
                      <Button
                        disabled={chiede === 'cancella' && parola.trim() !== t.impostazioni.cancellaParola}
                        onPress={chiede === 'sciogli' ? sciogli : cancella}
                      >
                        <Text>
                          {chiede === 'sciogli'
                            ? t.impostazioni.sciogliConferma
                            : t.impostazioni.cancellaConferma}
                        </Text>
                      </Button>
                      {/* ⚠️ L'annullamento è il bottone PIENO delle due strade
                          per un motivo: in un bivio in cui una delle due è
                          irreversibile, quella facile da premere dev'essere
                          l'altra. */}
                      <Button
                        variant="ghost"
                        onPress={() => {
                          setErrore(null);
                          setChiede(null);
                        }}
                      >
                        <Text>
                          {chiede === 'sciogli'
                            ? t.impostazioni.sciogliAnnulla
                            : t.impostazioni.cancellaAnnulla}
                        </Text>
                      </Button>
                    </View>
                  )}
                </View>
              </CartaVetro>
            )}
          </Comparsa>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Il titolino di sezione: separa a vista tre gruppi di gravità diversa. */
function Sezione({ titolo, pericolo = false }: { titolo: string; pericolo?: boolean }) {
  const { c } = useTema();
  return (
    <Text
      className="px-1 text-xs uppercase tracking-wide"
      style={{ color: pericolo ? c.pericolo : c.tenue }}
    >
      {titolo}
    </Text>
  );
}

/**
 * Una sezione: l'etichetta, e **un contenitore** per ciò che contiene.
 *
 * 🔑 **Il difetto che chiude** (2026-09-15, riferito dall'utente: *«troppo
 * confusionaria»*): questa schermata era una colonna **piatta**. Sei sezioni,
 * separate solo da un'etichetta di testo, e dentro ciascuna una sfilza di
 * `titolo + nota + pulsante a tutta larghezza`. ⚠️ *Senza un contenitore,
 * l'occhio non ha modo di sapere dove finisce un argomento e dove comincia il
 * successivo* — e l'etichetta in grigetto pesa meno del titolo della voce che
 * la segue, quindi non fa da confine.
 *
 * Il vetro c'era già (`CartaVetro`) ed era usato **solo** per il foglio di
 * conferma: qui fa il lavoro per cui esiste.
 */
function Gruppo({
  titolo,
  pericolo = false,
  children,
}: {
  titolo: string;
  pericolo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Sezione titolo={titolo} pericolo={pericolo} />
      <CartaVetro raggio={24} fondo="sicuro">
        <View className="px-4 py-1">{children}</View>
      </CartaVetro>
    </View>
  );
}

/**
 * Una voce dentro un gruppo: etichetta a sinistra, azione a destra.
 *
 * ⚠️ **Sostituisce il `titolo + nota + Button` a tutta larghezza**, che è ciò
 * che rendeva la schermata un muro: tre elementi verticali per ogni comando,
 * moltiplicati per una quindicina di comandi.
 *
 * 🔑 **La `nota` resta facoltativa, ed è il punto.** Quasi tutte le voci non ne
 * hanno bisogno — *«Esci»* si spiega da sé. Le poche che la meritano (cancellare
 * l'account, esportare i dati) la tengono, e proprio perché le altre non ce
 * l'hanno **si notano**.
 */
function Riga({
  titolo,
  nota,
  valore,
  onPress,
  pericolo = false,
  disabilitato = false,
  ultima = false,
}: {
  titolo: string;
  nota?: string | null;
  valore?: string | null;
  onPress?: () => void;
  pericolo?: boolean;
  disabilitato?: boolean;
  ultima?: boolean;
}) {
  const { c } = useTema();
  const colore = pericolo ? c.pericolo : c.testo;

  const corpo = (
    <View
      className="flex-row items-center gap-3 py-3.5"
      // La riga di separazione **fra** le voci, mai sotto l'ultima: una linea
      // che chiude un contenitore lo fa sembrare troncato.
      // 🔑 `c.linea` esiste apposta — «ancora più tenue del tenue: separatori» —
      // e inventare un'opacità su `tenue` avrebbe rifatto a mano un colore che
      // il tema già definisce.
      style={ultima ? undefined : { borderBottomWidth: 1, borderBottomColor: c.linea }}
    >
      <View className="flex-1 gap-0.5">
        <Text style={{ color: colore, opacity: disabilitato ? 0.4 : 1 }} className="text-base">
          {titolo}
        </Text>
        {!!nota && <Text className="text-xs leading-snug text-muted-foreground">{nota}</Text>}
      </View>
      {!!valore && <Text className="text-sm text-muted-foreground">{valore}</Text>}
      {!!onPress && !disabilitato && <ChevronRight size={18} color={c.tenue} />}
    </View>
  );

  if (!onPress || disabilitato) return corpo;
  return (
    <Premibile onPress={onPress} scala={0.99}>
      {corpo}
    </Premibile>
  );
}
