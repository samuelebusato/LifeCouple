import * as React from 'react';
import { View, ScrollView, Image, ActivityIndicator, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePlus, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { assicuraCoppia } from '@/lib/invito';
import { supabase } from '@/lib/supabase';
import { caricaFoto, cancellaFoto, indirizziFirmati, scegliFoto } from '@/lib/foto';
import { t } from '@/lib/i18n';

type Scatto = { id: string; chiave_storage: string; autore_id: string; creato_il: string };

/**
 * La galleria condivisa (D-06/D-21/D-22).
 *
 * Si vede tutto in due, si cancella solo il proprio. Le immagini si aprono con
 * indirizzi **firmati e temporanei**: il bucket e' privato, e nessuna foto ha
 * un indirizzo pubblico da poter girare per sbaglio.
 */
export default function Galleria() {
  const { session } = useAuth();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const [scatti, setScatti] = React.useState<Scatto[]>([]);
  const [url, setUrl] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [attesa, setAttesa] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);

  const ricarica = React.useCallback(async () => {
    if (!coppiaId) {
      setScatti([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('foto')
      .select('id, chiave_storage, autore_id, creato_il')
      .eq('coppia_id', coppiaId)
      .order('creato_il', { ascending: false });
    setErrore(error?.message ?? null);
    const righe = (data ?? []) as Scatto[];
    setScatti(righe);
    setUrl(await indirizziFirmati(righe.map((r) => r.chiave_storage)));
    setLoading(false);
  }, [coppiaId]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  async function aggiungi() {
    setErrore(null);
    const scelta = await scegliFoto();
    if (scelta.negato) return setErrore(t.galleria.permessoNegato);
    if (scelta.immagini.length === 0) return;

    setAttesa(true);
    const esito = await assicuraCoppia(coppiaId, ricaricaCoppia);
    if (!esito.coppiaId) {
      setAttesa(false);
      return setErrore(esito.errore);
    }
    const r = await caricaFoto(esito.coppiaId, scelta.immagini);
    setAttesa(false);
    if (r.errore) setErrore(r.errore);
    await ricarica();
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
        <Text className="font-serif-bold text-2xl text-foreground">{t.tab.galleria}</Text>
        <Text className="text-xs text-muted-foreground">{t.galleria.tetto}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#bf5333" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-2 px-4 pb-32">
          {errore && <Text className="px-2 text-sm text-destructive">{errore}</Text>}

          {scatti.length === 0 && (
            <View className="items-center gap-2 py-16">
              <Text className="font-serif text-xl text-foreground">{t.galleria.vuotoTitolo}</Text>
              <Text className="max-w-xs text-center text-sm text-muted-foreground">
                {t.galleria.vuotoTesto}
              </Text>
            </View>
          )}

          <View className="flex-row flex-wrap">
            {scatti.map((s) => (
              <View key={s.id} className="w-1/3 p-1">
                <View className="aspect-square overflow-hidden rounded-2xl bg-card">
                  {url[s.chiave_storage] ? (
                    <Image
                      source={{ uri: url[s.chiave_storage] }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <ActivityIndicator color="#bf5333" />
                    </View>
                  )}
                </View>
                {/* Ciascuno cancella le proprie: la policy lo impone sia sulla
                    riga sia sul file (0009), qui si evita di offrirlo. */}
                {s.autore_id === session?.user.id && (
                  <Pressable
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5"
                    onPress={async () => {
                      await cancellaFoto(s.id, s.chiave_storage);
                      await ricarica();
                    }}
                  >
                    <Trash2 color="#b3261e" size={14} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {Platform.OS !== 'web' && (
        <Pressable
          onPress={aggiungi}
          disabled={attesa}
          className="absolute bottom-24 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
        >
          {attesa ? (
            <ActivityIndicator color="#fdfaf5" />
          ) : (
            <ImagePlus color="#fdfaf5" size={26} />
          )}
        </Pressable>
      )}

      {Platform.OS === 'web' && (
        <View className="px-6 pb-28">
          <Button variant="outline" disabled>
            <Text>{t.galleria.soloTelefono}</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
