import * as React from 'react';
import { View, Image, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CalendarDays,
  Check,
  ChevronRight,
  ImagePlus,
  MapPin,
  Star,
  Trash2,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { BottoneVetro, CartaVetro } from '@/components/ui/vetro';
import { useTema } from '@/lib/tema';
import type { Elemento } from '@/lib/preferiti';
import type { Evento } from '@/lib/eventi';
import { chiediConferma } from '@/lib/conferma';
import { t } from '@/lib/i18n';

/**
 * La scheda di un film o di un luogo.
 *
 * ⚠️ Estratta da `app/(tabs)/preferiti.tsx` il 2026-08-27, quando l'elenco dei
 * luoghi si e' spostato dentro la mappa (D-51). Da allora la stessa scheda
 * serve **due schermate**, e lasciarla dentro una delle due avrebbe voluto dire
 * o importare un file di rotta da un componente — che si porta dietro tutto il
 * suo albero — o riscriverla, cioe' averne due che divergono alla prima
 * modifica.
 */

/** Cinque stelle: toccabili quando sono le proprie, ferme quando sono dell'altro. */
function Stelle({ voto, onVoto }: { voto: number; onVoto?: (v: number) => void }) {
  const { c } = useTema();
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onVoto} onPress={() => onVoto?.(n)} hitSlop={4}>
          <Star
            color={c.accento}
            fill={n <= voto ? c.accento : 'transparent'}
            size={onVoto ? 24 : 16}
          />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * La scheda di un film o di un ristorante, con la **copertina in testa**.
 *
 * La copertina e' una riga di `foto` legata all'elemento (0011): eredita cosi'
 * bucket privato, indirizzi firmati, tetto di 1 GB e "ciascuno cancella le
 * proprie", che una colonna con un indirizzo avrebbe scavalcato tutti.
 *
 * Senza copertina non resta un buco: una fascia sfumata col titolo. *Perche' non
 * lasciare la scheda piatta*: in un elenco misto, una scheda con foto e una
 * senza sembrerebbero due componenti diversi. La fascia costa nulla e tiene il
 * ritmo dell'elenco.
 */
export function Scheda({
  e,
  mioId,
  copertina,
  eventi = [],
  onFatto,
  onRecensisci,
  onElimina,
  onCopertina,
  onPosto,
  soloLettura = false,
  onEvento,
  onApri,
  foto,
  onFoto,
}: {
  e: Elemento;
  mioId: string | undefined;
  copertina?: string;
  /** Le serate legate a questo ristorante (0012): toccarle apre l'evento. */
  eventi?: Evento[];
  onFatto: (fatto: boolean) => void;
  onRecensisci: (voto: number, testo: string) => void;
  onElimina: () => void;
  onCopertina: () => void;
  onPosto?: () => void;
  /**
   * **Sola visualizzazione** (D-71): niente spunta, niente cestino, niente
   * copertina da cambiare.
   *
   * Serve all'elenco dei luoghi dentro la mappa, che dal 2026-08-28 è un
   * **registro** e non un elenco su cui si agisce: quei posti sono legati a
   * serate, e cancellarne uno da lì toglierebbe il posto **anche all'evento**
   * che lo cita. Si modificano dalla wishlist, dove sono nati.
   */
  soloLettura?: boolean;
  onEvento?: (id: string) => void;
  /** Toccando la testa: apre l'elenco completo delle serate di questo posto. */
  onApri?: () => void;
  /** Le foto delle serate in questo posto: diventano una striscia sotto il nome. */
  foto?: string[];
  onFoto?: (indice: number) => void;
}) {
  const { c } = useTema();
  const mia = e.recensioni.find((r) => r.autore_id === mioId) ?? null;
  const altrui = e.recensioni.filter((r) => r.autore_id !== mioId);
  const [apertaRecensione, setAperta] = React.useState(false);
  const [voto, setVoto] = React.useState(mia?.voto ?? 0);
  const [testo, setTesto] = React.useState(mia?.testo ?? '');

  const fatto = e.stato === 'fatto';

  return (
    <CartaVetro raggio={26}>
      <View style={{ borderRadius: 26, overflow: 'hidden' }}>
        {/* --- la testa: copertina o fascia ---------------------------------
            Toccarla apre l'elenco delle serate passate qui (richiesta del
            2026-08-27). Le pillole piu' sotto restano: portano **a un evento
            preciso**, questa porta **a tutti**. */}
        <Pressable
          onPress={onApri}
          disabled={!onApri}
          style={{ height: copertina ? 180 : 92, width: '100%' }}
        >
          {copertina ? (
            <Image
              source={{ uri: copertina }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#ffd9e5', '#ffeef4']}
              style={{ flex: 1 }}
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0)', copertina ? 'rgba(20,6,12,0.80)' : 'rgba(20,6,12,0.30)']}
            locations={[0.3, 1]}
            style={{ position: 'absolute', inset: 0 }}
          />
          <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between gap-3 p-4">
            <View className="flex-1">
              <Text
                // Niente riga barrata su cio' che e' fatto (richiesta
                // dell'utente, 2026-08-27): sbarrare un ristorante dove si e'
                // stati lo racconta come una voce cancellata da una lista di
                // cose da fare, mentre e' l'opposto — e' un ricordo. Che sia
                // fatto lo dicono gia' la spunta e la data.
                className="font-serif-bold text-2xl"
                style={{ color: copertina ? '#ffffff' : c.testo }}
                numberOfLines={2}
              >
                {e.titolo}
              </Text>
              <Text
                className="text-xs"
                style={{ color: copertina ? 'rgba(255,255,255,0.78)' : c.tenue }}
              >
                {fatto ? t.preferiti.fatto : t.preferiti.daFare}
              </Text>
            </View>

            {/* Spuntare "fatto" e' il gesto piu' frequente: sta sull'immagine,
                grande, invece che in un angolo della scheda. */}
            {/* ⚠️ In sola lettura la spunta **sparisce** invece di restare
                inerte: un tondo che non risponde al dito si legge come
                un'app rotta, non come «qui non si tocca» — è la lezione di
                `premibile.tsx`, e B-22 ha mostrato quanto costa ignorarla. */}
            {!soloLettura && (
              <Pressable onPress={() => onFatto(!fatto)} hitSlop={8}>
                <View
                  className="h-9 w-9 items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: fatto ? c.accento : 'rgba(255,255,255,0.22)',
                    borderColor: fatto ? c.accento : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {fatto && <Check color={c.suAccento} size={18} />}
                </View>
              </Pressable>
            )}
          </View>
        </Pressable>

        {/* --- il corpo ----------------------------------------------------- */}
        <View className="gap-3 p-4">
          {!soloLettura && (
          <View className="flex-row items-center justify-between">
            {Platform.OS !== 'web' ? (
              <Pressable onPress={onCopertina} hitSlop={6} className="flex-row items-center gap-1.5">
                <ImagePlus color={c.tenue} size={14} />
                <Text className="text-xs text-muted-foreground">
                  {copertina ? t.preferiti.cambiaCopertina : t.preferiti.aggiungiCopertina}
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
            {e.autore_id === mioId && (
              /* La conferma sta nel componente che possiede il cestino (D-94),
                 e **dice due cose diverse**: un posto se ne va anche dalla
                 mappa, una voce di lista no. Una nota sola sarebbe stata falsa
                 per metà dei casi. */
              <Pressable
                onPress={() =>
                  chiediConferma({
                    titolo:
                      e.tipo === 'luogo'
                        ? t.conferma.luogoTitolo(e.titolo)
                        : t.conferma.voceTitolo(e.titolo),
                    nota: e.tipo === 'luogo' ? t.conferma.luogoNota : t.conferma.voceNota,
                    onConferma: onElimina,
                  })
                }
                hitSlop={8}
              >
                <Trash2 color={c.pericolo} size={16} />
              </Pressable>
            )}
          </View>
          )}

          {/* Il posto del ristorante (0012): e' cio' che lo porta sulla mappa.
              Lo aggancia solo chi l'ha aggiunto (policy solo-autore). */}
          {e.tipo === 'luogo' && (
            <View className="gap-2">
              {e.luogo ? (
                <View className="flex-row items-center gap-1.5">
                  <MapPin color="#d98e2b" size={14} />
                  <Text className="text-xs text-muted-foreground">{e.luogo.nome}</Text>
                </View>
              ) : e.autore_id === mioId && onPosto ? (
                <Pressable onPress={onPosto} hitSlop={6} className="flex-row items-center gap-1.5">
                  <MapPin color={c.tenue} size={14} />
                  <Text className="text-xs text-primary">{t.preferiti.aggiungiPosto}</Text>
                </Pressable>
              ) : null}

              {/* Le foto delle serate passate qui. Sono la prova visibile che
                  «al luogo sono associate tutte le immagini dei suoi eventi»:
                  senza, quel legame esisterebbe solo nel database. */}
              {!!foto && foto.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  // Altezza dichiarata: una lista orizzontale dentro una colonna
                  // che non la dichiara si prende spazio che non le spetta.
                  style={{ height: 62, flexGrow: 0 }}
                  contentContainerStyle={{ gap: 6, alignItems: 'center' }}
                >
                  {foto.slice(0, 6).map((u, i) => (
                    <Pressable key={u} onPress={() => onFoto?.(i)}>
                      <View
                        style={{ width: 54, height: 54, borderRadius: 12, overflow: 'hidden' }}
                      >
                        <Image
                          source={{ uri: u }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                    </Pressable>
                  ))}
                  {foto.length > 6 && (
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: c.alone,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: c.accento }}>
                        +{foto.length - 6}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}

              {/* Le serate.
                  ⚠️ Una **riga esplicita**, non solo il tocco sulla testa della
                  scheda: quello e' un bersaglio invisibile, e chi tocca il corpo
                  della scheda — cioe' la meta' piu' grande — non ottiene niente
                  e conclude che non funziona. Con la riga il gesto e' dichiarato,
                  e dice anche **quante** sono prima di aprirle. */}
              {eventi.length > 0 && (
                <Pressable
                  onPress={onApri}
                  className="flex-row items-center gap-2 rounded-2xl px-3 py-2.5"
                  style={{ backgroundColor: c.alone }}
                >
                  <CalendarDays color={c.accento} size={14} />
                  <Text className="flex-1 text-sm font-medium" style={{ color: c.accento }}>
                    {t.preferiti.serateQui(eventi.length)}
                  </Text>
                  <ChevronRight color={c.accento} size={16} />
                </Pressable>
              )}
            </View>
          )}

          {/* Le recensioni compaiono quando la cosa e' stata fatta: prima non c'e'
              niente da recensire, e chiederlo sarebbe rumore. */}
          {fatto && (
            <View className="gap-2 border-t border-border/40 pt-3">
              {altrui.map((r) => (
                <View key={r.id} className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <Stelle voto={r.voto} />
                    <Text className="text-xs text-muted-foreground">{t.preferiti.delPartner}</Text>
                  </View>
                  {!!r.testo && <Text className="text-sm text-muted-foreground">{r.testo}</Text>}
                </View>
              ))}

              {mia && !apertaRecensione ? (
                <Pressable onPress={() => setAperta(true)} className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <Stelle voto={mia.voto} />
                    <Text className="text-xs text-muted-foreground">{t.preferiti.tua}</Text>
                  </View>
                  {!!mia.testo && <Text className="text-sm text-muted-foreground">{mia.testo}</Text>}
                </Pressable>
              ) : !apertaRecensione ? (
                <Pressable onPress={() => setAperta(true)}>
                  <Text className="text-sm text-primary">{t.preferiti.recensisci}</Text>
                </Pressable>
              ) : (
                <View className="gap-2">
                  <Stelle voto={voto} onVoto={setVoto} />
                  <Input
                    value={testo}
                    onChangeText={setTesto}
                    placeholder={t.preferiti.placeholderRecensione}
                  />
                  <View className="flex-row gap-2">
                    <BottoneVetro
                      style={{ flex: 1 }}
                      altezza={46}
                      variante="accento"
                      disabled={voto === 0}
                      onPress={() => {
                        onRecensisci(voto, testo);
                        setAperta(false);
                      }}
                    >
                      <Text>{t.calendario.salva}</Text>
                    </BottoneVetro>
                    <BottoneVetro altezza={46} onPress={() => setAperta(false)}>
                      <Text>{t.calendario.annulla}</Text>
                    </BottoneVetro>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </CartaVetro>
  );
}
