import * as React from 'react';
import { View, Pressable, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { MapPin, Search, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Vetro } from '@/components/ui/vetro';
import { useRicercaLuoghi, ATTRIBUZIONE, type Trovato } from '@/lib/ricerca-luoghi';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * Il campo "cerca un posto", con i suggerimenti che compaiono mentre si scrive.
 *
 * Si usa in due punti — sulla mappa e nella scelta del luogo di un evento — e
 * per questo e' un componente e non due copie: due barre di ricerca sullo stesso
 * servizio finirebbero con due comportamenti diversi al primo ritocco.
 *
 * L'attribuzione a OpenStreetMap non e' decorativa: e' la condizione della
 * licenza ODbL con cui quei dati si possono usare. Sta sotto i risultati,
 * dove i risultati si vedono.
 *
 * ## `dentroUnFoglio` (2026-08-27, corretta il 2026-08-28)
 *
 * I due punti in cui vive **non sono lo stesso posto**, e per il vetro la
 * differenza e' tutto:
 *
 * - sulla **mappa** il campo galleggia sopra la mappa: sotto c'e' qualcosa da
 *   guardare, ed e' il caso per cui il vetro esiste;
 * - dentro il **foglio del nuovo evento** e i pannelli delle Liste, sotto non
 *   c'e' contenuto ma la **velatura scura** del modale. La sfocatura mescola
 *   quel buio e la tendina dei risultati si legge sporca — «sembra in ombra»,
 *   parole dell'utente.
 *
 * ⚠️ Qui c'era scritto: *«Non lo si puo' dedurre da qui: un componente non sa in
 * che albero e' stato montato»*. **Era falso**, e quella frase e' il motivo per
 * cui il difetto e' sopravvissuto un giorno intero: il contesto di React serve
 * esattamente a saperlo. Ora lo deduce `ContestoNienteSotto`
 * (`components/ui/vetro.tsx`) e la prop resta solo come **scavalco** per chi ha
 * un caso che il contesto non prevede.
 */
export function CercaLuogo({
  onScegli,
  placeholder,
  autoFocus,
  dentroUnFoglio,
}: {
  onScegli: (l: Trovato) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /**
   * Scavalco: normalmente non serve passarla — il vetro se ne accorge da solo.
   * Serve solo dove il contesto non arriva o va contraddetto.
   */
  dentroUnFoglio?: boolean;
  /** Solo ristoranti veri: e' il vincolo dei preferiti (D-37). */
}) {
  const { c } = useTema();
  // `undefined` e non `'niente'`: un valore esplicito **vincerebbe** sul
  // contesto, e un campo dentro un foglio che nessuno ha etichettato tornerebbe
  // a sfocare il buio.
  const fondo = dentroUnFoglio ? 'pieno' : undefined;
  const { query, setQuery, risultati, cercando, errore, pulisci } = useRicercaLuoghi();

  /**
   * ## Il campo non tace mai (2026-08-28)
   *
   * Prima la tendina compariva **solo** con dei risultati o con un errore. In
   * tutti gli altri casi non compariva niente — e "niente" e' lo stesso
   * fotogramma che si vede quando un'app e' rotta. Difetto riferito
   * dall'utente: *«scrivo ma non mi si apre la tendina con i consigli»*.
   *
   * I casi che producevano il nulla erano **tre**, e nessuno dei tre e' un
   * guasto:
   *
   * 1. **Meno di tre lettere.** La soglia sta in `useRicercaLuoghi` e serve a
   *    non pagare una chiamata a Google per ogni tasto — ma era **invisibile**:
   *    chi scrive "Bar" non ha modo di sapere che a due lettere non succede
   *    niente per scelta.
   * 2. **Sto ancora cercando.** C'era la rotella nel campo, che e' piccola e sta
   *    dove il dito la copre mentre scrive.
   * 3. **Google non ha trovato niente.** Indistinguibile da un guasto.
   *
   * 🔑 E' la lezione di `components/ui/premibile.tsx` applicata a un campo di
   * testo: **un comando che non risponde non si legge come "non c'e' ancora
   * nulla da dire", si legge come "non ha funzionato"** — e la reazione e'
   * riprovare, poi smettere. Uno stato costa una riga di testo; il dubbio costa
   * la funzione.
   */
  const q = query.trim();
  const corta = q.length > 0 && q.length < 3;
  const mostraPannello = risultati.length > 0 || !!errore || corta || q.length >= 3;

  return (
    <View className="gap-2">
      <Vetro raggio={22} fondo={fondo}>
        <View className="flex-row items-center gap-2 px-4" style={{ height: 52 }}>
          <Search color={c.tenue} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder ?? t.mappa.cerca}
            placeholderTextColor={c.tenue}
            autoFocus={autoFocus}
            autoCorrect={false}
            returnKeyType="search"
            style={{ flex: 1, fontSize: 16, color: c.testo }}
          />
          {cercando && <ActivityIndicator color={c.accento} size="small" />}
          {query.length > 0 && !cercando && (
            <Pressable onPress={pulisci} hitSlop={8}>
              <X color={c.tenue} size={17} />
            </Pressable>
          )}
        </View>
      </Vetro>

      {mostraPannello && (
        <Vetro raggio={22} fondo={fondo}>
          <View className="p-1">
            {!!errore && (
              <Text className="px-3 py-3 text-sm text-destructive">{errore}</Text>
            )}
            {/* Gli stati che prima erano il **nulla**: vedi il commento in testa. */}
            {!errore && corta && (
              <Text className="px-3 py-3 text-sm text-muted-foreground">
                {t.mappa.scriviAncora}
              </Text>
            )}
            {!errore && !corta && cercando && (
              <Text className="px-3 py-3 text-sm text-muted-foreground">{t.mappa.cercando}</Text>
            )}
            {!errore && !corta && !cercando && risultati.length === 0 && (
              <Text className="px-3 py-3 text-sm text-muted-foreground">
                {t.mappa.nessunRisultato}
              </Text>
            )}
            <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
              {risultati.map((r) => (
                <Pressable
                  key={r.chiave}
                  onPress={() => {
                    onScegli(r);
                    pulisci();
                  }}
                  className="flex-row items-start gap-3 px-3 py-3"
                >
                  <View className="pt-0.5">
                    <MapPin color={c.accento} size={16} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base text-foreground" numberOfLines={1}>
                      {r.nome}
                    </Text>
                    {!!r.dettaglio && (
                      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        {r.dettaglio}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            {risultati.length > 0 && (
              <Text className="px-3 pb-2 pt-1 text-[10px] text-muted-foreground">
                {ATTRIBUZIONE}
              </Text>
            )}
          </View>
        </Vetro>
      )}
    </View>
  );
}
