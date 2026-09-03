import * as React from 'react';
import { View, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { BottoneVetro, BottonePieno, CartaVetro, TondoVetro } from '@/components/ui/vetro';
import { useTema } from '@/lib/tema';
import { CARTE_A_TESTA, mieCarte, haFinito, type Carta, type TipoCarta } from '@/lib/carte';
import type { CodiceGioco } from '@/lib/giochi';
import { chiediConferma } from '@/lib/conferma';
import { t } from '@/lib/i18n';

/**
 * **La preparazione di una partita personalizzata** (D-19): ognuno scrive le
 * proprie carte, e si comincia quando hanno finito tutti e due.
 *
 * ## Perché non è una schermata nuova nel flusso, ma l'anticamera di sempre
 *
 * Prende il posto di `Attesa` quando il modo è personalizzato, e finisce nello
 * stesso identico modo: **«Ho finito» chiama `segna_pronto`**, cioè la stessa
 * funzione del bottone «Avvia partita». La partita comincia quando la seconda
 * persona è pronta, come in tutte le altre.
 *
 * 🔑 Non è pigrizia, è la ragione per cui non c'è uno stato nuovo da inventare:
 * *«ho scritto le mie carte»* e *«sono pronto a giocare»* sono la stessa
 * affermazione detta in due momenti diversi. Un secondo meccanismo avrebbe
 * avuto una sua attesa, un suo annullamento e un suo modo di rompersi.
 *
 * ## ⚠️ Si mostrano i conteggi dell'altro, non le sue carte
 *
 * La RLS le lascia leggere entrambe (`domanda_select`) e va bene così: le
 * vedranno comunque tutte e due, una per round. Ma leggerle **in anticipo**
 * toglierebbe l'unica cosa che questa schermata sta costruendo, cioè la
 * sorpresa — e per sapere *chi si sta aspettando* basta un numero.
 */
export function PreparazioneCarte({
  gioco,
  titolo,
  carte,
  io,
  altro,
  scrivi,
  cancella,
  errore,
  caricando,
  ioSonoPronto,
  onPronto,
  onEsci,
  onAnnulla,
}: {
  gioco: CodiceGioco;
  titolo: string;
  carte: Carta[];
  io: string | null;
  /** L'altro membro della coppia. `null` finché l'elenco non è arrivato. */
  altro: string | null;
  scrivi: (testo: string, tipo: TipoCarta | null) => Promise<boolean>;
  cancella: (id: string) => Promise<void>;
  errore: string | null;
  caricando: boolean;
  ioSonoPronto: boolean;
  onPronto: () => void;
  onEsci: () => void;
  onAnnulla?: () => void;
}) {
  const { c } = useTema();
  const richieste = CARTE_A_TESTA[gioco] ?? [];
  const [bozze, setBozze] = React.useState<Record<string, string>>({});
  const [erroreLocale, setErroreLocale] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);

  const quante = richieste.reduce((n, r) => n + r.quante, 0);
  const mie = mieCarte(carte, io).length;
  const sue = altro ? mieCarte(carte, altro).length : 0;
  const finito = haFinito(carte, io, gioco);

  // 🔴 Una carta senza tipo è una **domanda** del quiz (2026-09-02, B-45): il
  // caso `null` ricadeva su `scegliCarta`, cioè «Obbligo o verità?» — la
  // scritta del round di un altro gioco, finita in testa alle domande del quiz.
  const etichetta = (tipo: TipoCarta | null) =>
    tipo === 'obbligo' ? t.gioco.obbligo : tipo === 'verita' ? t.gioco.verita : t.gioco.cartaDomanda;
  const segnaposto = (tipo: TipoCarta | null) =>
    tipo === 'obbligo'
      ? t.gioco.scriviObbligo
      : tipo === 'verita'
        ? t.gioco.scriviVerita
        : t.gioco.scriviDomanda;

  async function aggiungi(tipo: TipoCarta | null) {
    const chiave = tipo ?? 'domanda';
    const testo = (bozze[chiave] ?? '').trim();
    if (!testo || salvando) return;
    setSalvando(true);
    setErroreLocale(null);
    const fatto = await scrivi(testo, tipo);
    setSalvando(false);
    // ⚠️ Il riquadro si svuota **solo se la carta è arrivata** (B-35): svuotarlo
    // comunque farebbe sparire ciò che l'utente ha appena scritto insieme
    // all'errore che gli spiega perché riscriverlo.
    if (fatto) setBozze((b) => ({ ...b, [chiave]: '' }));
    else setErroreLocale(t.gioco.cartaNonSalvata);
  }

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-start justify-between px-6 pb-3 pt-1">
          <View className="flex-1 gap-1">
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">{titolo}</Text>
            <Text className="font-serif-bold text-3xl text-foreground">
              {gioco === 'quiz_preferenze' ? t.gioco.preparaDomande : t.gioco.preparaCarte}
            </Text>
            <Text className="text-sm text-muted-foreground">{t.gioco.preparaNota}</Text>
          </View>
          <TondoVetro lato={40} tinto={false} onPress={onEsci}>
            <X color={c.tenue} size={18} />
          </TondoVetro>
        </View>

        {/* --- chi si sta aspettando, in due righe e due numeri -------------- */}
        <View className="flex-row gap-3 px-6 pb-3">
          <View className="flex-1 rounded-2xl px-4 py-3" style={{ backgroundColor: c.alone }}>
            <Text className="text-sm text-foreground">{t.gioco.quanteTue(mie, quante)}</Text>
          </View>
          <View className="flex-1 rounded-2xl px-4 py-3" style={{ backgroundColor: c.alone }}>
            <Text className="text-sm text-muted-foreground">{t.gioco.quanteSue(sue, quante)}</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView className="flex-1" contentContainerClassName="gap-4 px-6 pb-6">
            {caricando && <ActivityIndicator color={c.accento} />}
            {richieste.map((r) => {
              const chiave = r.tipo ?? 'domanda';
              const mieDelTipo = mieCarte(carte, io, r.tipo);
              return (
                <View key={chiave} className="gap-2">
                  <Text
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: r.tipo === 'verita' ? c.ambra : c.accento }}
                  >
                    {etichetta(r.tipo)} · {mieDelTipo.length}/{r.quante}
                  </Text>

                  {mieDelTipo.map((carta) => (
                    <CartaVetro key={carta.id} raggio={20} fondo="pieno">
                      <View className="flex-row items-center gap-3 px-4 py-3" style={{ borderRadius: 20 }}>
                        <Text className="flex-1 font-serif text-base text-foreground">
                          {carta.testo}
                        </Text>
                        {/* Si può togliere solo ciò che si è scritto: la policy
                            `domanda_delete` non lascia toccare le carte dell'altro. */}
                        {/* ⚠️ Anche qui si chiede, ed è il caso più discutibile
                            dei sei: la carta è appena stata scritta e si
                            riscrive in un momento. Ma «in generale» era la
                            richiesta, e una regola con un'eccezione a
                            discrezione di chi scrive la schermata è di nuovo
                            una speranza. La nota lo dice: si può riscrivere. */}
                        <BottoneVetro
                          altezza={34}
                          onPress={() =>
                            chiediConferma({
                              titolo: t.conferma.cartaTitolo,
                              nota: t.conferma.cartaNota,
                              azione: t.conferma.togli,
                              onConferma: () => cancella(carta.id),
                            })
                          }
                        >
                          <Text className="text-xs">{t.gioco.togli}</Text>
                        </BottoneVetro>
                      </View>
                    </CartaVetro>
                  ))}

                  {mieDelTipo.length < r.quante && (
                    <View className="flex-row items-center gap-2">
                      <View
                        className="flex-1 rounded-2xl border border-border/60 px-4"
                        style={{ backgroundColor: c.alone }}
                      >
                        <TextInput
                          value={bozze[chiave] ?? ''}
                          onChangeText={(v) => setBozze((b) => ({ ...b, [chiave]: v }))}
                          placeholder={segnaposto(r.tipo)}
                          placeholderTextColor={c.tenue}
                          style={{ color: c.testo, paddingVertical: 12, fontSize: 16 }}
                          multiline
                          onSubmitEditing={() => aggiungi(r.tipo)}
                          returnKeyType="done"
                        />
                      </View>
                      <BottonePieno
                        testo={t.gioco.aggiungi}
                        altezza={46}
                        onPress={() => aggiungi(r.tipo)}
                      />
                    </View>
                  )}
                </View>
              );
            })}

            {!!(erroreLocale || errore) && (
              <Text className="text-center text-sm text-destructive">{erroreLocale ?? errore}</Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <View className="gap-2 px-6 pb-6">
          {ioSonoPronto ? (
            <View className="items-center gap-2">
              <ActivityIndicator color={c.accento} />
              <Text className="text-center text-sm text-muted-foreground">
                {t.gioco.attendoCarte}
              </Text>
            </View>
          ) : (
            /* ⚠️ Il bottone c'è **solo** quando le carte ci sono tutte, invece di
               esserci spento: un bottone disattivato non dice quante ne mancano,
               e il conteggio qui sopra sì. È la regola di `attesa-partita.tsx`
               applicata un piano più in basso. */
            finito && <BottonePieno testo={t.gioco.hoFinito} altezza={54} onPress={onPronto} />
          )}
          {!!onAnnulla && (
            <BottoneVetro altezza={46} variante="pericolo" onPress={onAnnulla}>
              <Text>{t.gioco.annulla}</Text>
            </BottoneVetro>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
