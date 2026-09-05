import * as React from 'react';
import { Alert, View, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
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
import { esportaMieiDati } from '@/lib/esporta';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

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
          {/* --- Account ------------------------------------------------- */}
          <View className="gap-2">
            <Sezione titolo={t.impostazioni.sezioneAccount} />
            {!!session?.user.email && (
              <Text className="text-base text-foreground">{session.user.email}</Text>
            )}
            <Text className="text-sm text-muted-foreground">{t.impostazioni.esciNota}</Text>
            <Button variant="outline" onPress={() => supabase.auth.signOut()}>
              <Text>{t.impostazioni.esci}</Text>
            </Button>
          </View>

          {/* --- Portabilità: art. 20 GDPR ------------------------------- */}
          {/* ⚠️ Non è una comodità: è un diritto che l'utente può esercitare
              quando vuole, e finché stava nel backlog «dopo l'MVP» l'app non
              era distribuibile a utenti europei. */}
          <View className="gap-2">
            <Text className="font-serif text-lg text-foreground">
              {t.impostazioni.esportaTitolo}
            </Text>
            <Text className="text-sm text-muted-foreground">{t.impostazioni.esportaNota}</Text>
            <Button variant="outline" disabled={esporto} onPress={esporta}>
              <Text>{esporto ? t.impostazioni.esportaInCorso : t.impostazioni.esporta}</Text>
            </Button>
            {!!esitoExport && <Text className="text-sm text-foreground">{esitoExport}</Text>}
          </View>

          {/* --- La coppia: invito ---------------------------------------- */}
          <View className="gap-3">
            <Sezione titolo={t.impostazioni.sezioneCoppia} />

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
            {/* Fino al 2026-09-04 si poteva scegliere **una volta sola**, dal
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

            {/* --- Far vedere dove sei (D-100) ---------------------------- */}
            {/* Spostata qui dalla mappa il 2026-09-04, su richiesta dell'utente.
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

          {/* --- Cose senza ritorno --------------------------------------- */}
          <View className="gap-4">
            <Sezione titolo={t.impostazioni.sezionePericolo} pericolo />

            {/* Lo scioglimento esiste solo se c'è una coppia da sciogliere: un
                comando che fallirebbe con «non sei in una coppia» è peggio di
                un comando assente. */}
            {!!coppiaId && (
              <View className="gap-2">
                <Text className="font-serif text-lg text-foreground">
                  {t.impostazioni.sciogliTitolo}
                </Text>
                <Text className="text-sm text-muted-foreground">{t.impostazioni.sciogliNota}</Text>
                <Button variant="outline" onPress={() => setChiede('sciogli')}>
                  <Text style={{ color: c.pericolo }}>{t.impostazioni.sciogliTitolo}</Text>
                </Button>
              </View>
            )}

            <View className="gap-2">
              <Text className="font-serif text-lg text-foreground">
                {t.impostazioni.cancellaTitolo}
              </Text>
              <Text className="text-sm text-muted-foreground">{t.impostazioni.cancellaNota}</Text>
              <Button
                variant="outline"
                onPress={() => {
                  setParola('');
                  setChiede('cancella');
                }}
              >
                <Text style={{ color: c.pericolo }}>{t.impostazioni.cancellaTitolo}</Text>
              </Button>
            </View>
          </View>

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
      className="text-xs uppercase tracking-wide"
      style={{ color: pericolo ? c.pericolo : c.tenue }}
    >
      {titolo}
    </Text>
  );
}
