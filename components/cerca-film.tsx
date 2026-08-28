import * as React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Film, Search, X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Vetro } from '@/components/ui/vetro';
import {
  useRicercaFilm,
  urlLocandina,
  ATTRIBUZIONE_TMDB,
  CHIAVE_TMDB_PRESENTE,
  type FilmTrovato,
} from '@/lib/ricerca-film';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * La ricerca di un film con la sua locandina — il gemello di `cerca-luogo.tsx`.
 *
 * ## Perché è un file a parte e non una prop di `CercaLuogo`
 *
 * I due si somigliano nella forma (campo, attesa, tendina, attribuzione) ma non
 * in cosa mostrano: un luogo ha un indirizzo su una riga, un film ha una
 * **locandina**, un anno e un titolo originale che a volte va detto e a volte
 * no. Fonderli avrebbe voluto dire un componente con due modalità e sei prop
 * facoltative, cioè la cosa che questo progetto evita da sempre — una funzione
 * che serve due padroni e finisce per servirne male uno.
 *
 * 🔑 **Ciò che invece è condiviso e va tenuto identico è il comportamento**: la
 * soglia delle tre lettere, l'attesa di 350 ms, l'annullamento della richiesta
 * precedente, e soprattutto **la regola che il campo non tace mai** (B-18). Se
 * un giorno cambia lì, cambia anche qui.
 */
export function CercaFilm({
  onScegli,
  placeholder,
  autoFocus,
  dentroUnFoglio,
}: {
  onScegli: (f: FilmTrovato) => void;
  placeholder?: string;
  autoFocus?: boolean;
  dentroUnFoglio?: boolean;
}) {
  const { c } = useTema();
  const fondo = dentroUnFoglio ? 'pieno' : undefined;
  const { query, setQuery, risultati, cercando, errore, pulisci } = useRicercaFilm();

  const q = query.trim();
  const corta = q.length > 0 && q.length < 3;
  const mostraPannello = risultati.length > 0 || !!errore || corta || q.length >= 3;

  /**
   * ⚠️ **Senza chiave si dice, non si tace.** È il caso che manda in confusione
   * più di tutti: il campo c'è, si scrive, e non succede niente — che è
   * indistinguibile da un guasto di rete. La frase costa una riga e toglie
   * mezz'ora di diagnosi a chi ha appena clonato il repo senza `.env`.
   */
  if (!CHIAVE_TMDB_PRESENTE) {
    return (
      <Vetro raggio={22} fondo={fondo}>
        <View className="gap-1 p-4">
          <Text className="text-sm text-foreground">{t.film.senzaChiave}</Text>
          <Text className="text-xs text-muted-foreground">{t.film.senzaChiaveNota}</Text>
        </View>
      </Vetro>
    );
  }

  return (
    <View className="gap-2">
      <Vetro raggio={22} fondo={fondo}>
        <View className="flex-row items-center gap-2 px-4" style={{ height: 52 }}>
          <Search color={c.tenue} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder ?? t.film.cerca}
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
            {!!errore && <Text className="px-3 py-3 text-sm text-destructive">{errore}</Text>}
            {!errore && corta && (
              <Text className="px-3 py-3 text-sm text-muted-foreground">{t.film.scriviAncora}</Text>
            )}
            {!errore && !corta && cercando && (
              <Text className="px-3 py-3 text-sm text-muted-foreground">{t.film.cercando}</Text>
            )}
            {!errore && !corta && !cercando && risultati.length === 0 && (
              <Text className="px-3 py-3 text-sm text-muted-foreground">
                {t.film.nessunRisultato}
              </Text>
            )}
            <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
              {risultati.map((r) => {
                const poster = urlLocandina(r.locandina, 92);
                return (
                  <Pressable
                    key={r.tmdbId}
                    onPress={() => {
                      onScegli(r);
                      pulisci();
                    }}
                    className="flex-row items-center gap-3 px-3 py-2"
                  >
                    {/* La locandina piccola nella tendina, e non solo dopo:
                        è ciò che permette di distinguere due film con lo stesso
                        titolo — che è il caso in cui la tendina serve davvero. */}
                    {poster ? (
                      <Image
                        source={{ uri: poster }}
                        style={{ width: 40, height: 60, borderRadius: 6 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 40,
                          height: 60,
                          borderRadius: 6,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: c.linea,
                        }}
                      >
                        <Film color={c.tenue} size={18} />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-base text-foreground" numberOfLines={2}>
                        {r.titolo}
                      </Text>
                      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        {/* L'anno distingue i rifacimenti, il titolo originale
                            distingue le traduzioni fantasiose. Il secondo si
                            mostra **solo se diverso**, altrimenti è la stessa
                            riga scritta due volte. */}
                        {[
                          r.anno ?? null,
                          r.titoloOriginale && r.titoloOriginale !== r.titolo
                            ? r.titoloOriginale
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            {risultati.length > 0 && (
              <Text className="px-3 pb-2 pt-1 text-[10px] text-muted-foreground">
                {ATTRIBUZIONE_TMDB}
              </Text>
            )}
          </View>
        </Vetro>
      )}
    </View>
  );
}
