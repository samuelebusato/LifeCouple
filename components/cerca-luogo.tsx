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
 */
export function CercaLuogo({
  onScegli,
  placeholder,
  autoFocus,
  soloRistoranti = false,
}: {
  onScegli: (l: Trovato) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Solo ristoranti veri: e' il vincolo dei preferiti (D-37). */
  soloRistoranti?: boolean;
}) {
  const { c } = useTema();
  const { query, setQuery, risultati, cercando, errore, pulisci } =
    useRicercaLuoghi(soloRistoranti);

  return (
    <View className="gap-2">
      <Vetro raggio={22}>
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

      {(risultati.length > 0 || !!errore) && (
        <Vetro raggio={22}>
          <View className="p-1">
            {!!errore && (
              <Text className="px-3 py-3 text-sm text-destructive">{errore}</Text>
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
