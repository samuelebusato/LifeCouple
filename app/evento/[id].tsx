import * as React from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { ImagePlus, MapPin, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aspetto } from '@/components/riga-evento';
import { useAuth } from '@/lib/auth';
import { useEventoDettaglio } from '@/lib/evento-dettaglio';
import { caricaFoto, indirizziFirmati, scegliFoto } from '@/lib/foto';
import type { TipoEvento } from '@/lib/eventi';
import { lingua, t } from '@/lib/i18n';

/**
 * La pagina di un evento: **il centro del modello** (0008).
 *
 * Calendario, mappa e recap sono tre strade che portano qui — nel tempo, nello
 * spazio, in elenco — e qui c'e' tutto quello che di quel momento e' rimasto:
 * quando, dove, le foto, le parole che ci si e' scritti sopra.
 */
export default function PaginaEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { evento, luogo, commenti, foto, loading, errore, ricarica, commenta, cancellaCommento } =
    useEventoDettaglio(id);

  const [testo, setTesto] = React.useState('');
  const [url, setUrl] = React.useState<Record<string, string>>({});
  const [caricando, setCaricando] = React.useState(false);
  const [attesa, setAttesa] = React.useState(false);
  const [erroreForm, setErroreForm] = React.useState<string | null>(null);

  // Gli indirizzi delle foto sono firmati e scadono: si chiedono ogni volta che
  // l'elenco cambia, non si conservano.
  const chiavi = foto.map((f) => f.chiave_storage).join(',');
  React.useEffect(() => {
    if (!chiavi) return setUrl({});
    indirizziFirmati(chiavi.split(',')).then(setUrl);
  }, [chiavi]);

  async function aggiungiFoto() {
    if (!evento) return;
    setErroreForm(null);
    const scelta = await scegliFoto();
    if (scelta.negato) return setErroreForm(t.galleria.permessoNegato);
    if (scelta.immagini.length === 0) return;
    setCaricando(true);
    const r = await caricaFoto(evento.coppia_id, scelta.immagini, {
      eventoId: evento.id,
      luogoId: evento.luogo_id,
    });
    setCaricando(false);
    if (r.errore) setErroreForm(r.errore);
    await ricarica();
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#bf5333" />
      </SafeAreaView>
    );
  }

  if (!evento) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <Text className="font-serif text-xl text-foreground">{t.evento.sparito}</Text>
        {!!errore && <Text className="text-sm text-destructive">{errore}</Text>}
        <Button variant="ghost" onPress={() => router.back()}>
          <Text>{t.calendario.chiudi}</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const { Icona, colore } = aspetto(evento);
  const da = new Date(evento.inizio);
  const perEsteso = (d: Date) =>
    d.toLocaleDateString(lingua, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const quando = evento.fine
    ? `${perEsteso(da)} → ${perEsteso(new Date(evento.fine))}`
    : evento.tutto_il_giorno
      ? `${perEsteso(da)} · ${t.calendario.tuttoIlGiorno}`
      : `${perEsteso(da)} · ${da.toLocaleTimeString(lingua, { hour: '2-digit', minute: '2-digit' })}`;

  async function invia() {
    setErroreForm(null);
    setAttesa(true);
    const err = await commenta(testo);
    setAttesa(false);
    if (err) return setErroreForm(err);
    setTesto('');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-base text-muted-foreground">{t.calendario.chiudi}</Text>
        </Pressable>
        <Icona color={colore} size={22} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="gap-5 px-6 pb-32" keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-xs uppercase tracking-wide" style={{ color: colore }}>
              {t.calendario.tipi[(evento.tipo as TipoEvento) ?? 'impegno']}
            </Text>
            <Text className="font-serif-bold text-3xl text-foreground">{evento.titolo}</Text>
            <Text className="text-base text-muted-foreground">{quando}</Text>
            {!!evento.nota && <Text className="text-base text-foreground">{evento.nota}</Text>}
            {!!evento.categoria && (
              <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                {evento.categoria}
              </Text>
            )}
            {/* Solo l'autore modifica (D-21). Il foglio di modifica e' quello
                del calendario: uno solo, invece di due che divergono. */}
            {evento.autore_id === session?.user.id && (
              <Button
                variant="outline"
                onPress={() => router.replace({ pathname: '/calendario', params: { modifica: evento.id } })}
              >
                <Text>{t.calendario.modifica}</Text>
              </Button>
            )}
          </View>

          {/* IL POSTO — porta alla mappa, che e' la stessa cosa vista nello spazio */}
          <View className="gap-2">
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.evento.dove}
            </Text>
            {luogo ? (
              <Pressable
                className="flex-row items-center gap-3 rounded-2xl bg-card p-4"
                onPress={() => router.push('/mappa')}
              >
                <MapPin color="#bf5333" size={20} />
                <Text className="flex-1 font-serif text-lg text-foreground">{luogo.nome}</Text>
              </Pressable>
            ) : (
              <Text className="text-sm text-muted-foreground">{t.evento.nessunLuogo}</Text>
            )}
          </View>

          {/* LE FOTO — il collegamento c'e' gia' nel database; manca lo spazio
              dove metterle, e finche' manca si dice invece di fingere. */}
          <View className="gap-2">
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.evento.foto}
            </Text>
            <View className="flex-row flex-wrap">
              {foto.map((f) => (
                <View key={f.id} className="w-1/3 p-1">
                  <View className="aspect-square overflow-hidden rounded-2xl bg-card">
                    {url[f.chiave_storage] ? (
                      <Image
                        source={{ uri: url[f.chiave_storage] }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <ActivityIndicator color="#bf5333" />
                    )}
                  </View>
                </View>
              ))}
            </View>
            {Platform.OS !== 'web' && (
              <Button variant="outline" disabled={caricando} onPress={aggiungiFoto}>
                <ImagePlus color="#8a7563" size={18} />
                <Text>{caricando ? t.onboarding.attesa : t.evento.aggiungiFoto}</Text>
              </Button>
            )}
          </View>

          {/* LE PAROLE — questo funziona da subito */}
          <View className="gap-2">
            <Text className="text-xs uppercase tracking-wide text-muted-foreground">
              {t.evento.commenti}
            </Text>

            {commenti.length === 0 && (
              <Text className="text-sm text-muted-foreground">{t.evento.nessunCommento}</Text>
            )}

            {commenti.map((c) => (
              <View key={c.id} className="gap-1 rounded-2xl bg-card p-4">
                <Text className="text-base text-foreground">{c.testo}</Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-muted-foreground">
                    {c.autore_id === session?.user.id ? t.calendario.daTe : t.calendario.dalPartner}
                    {' · '}
                    {new Date(c.creato_il).toLocaleDateString(lingua, {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  {c.autore_id === session?.user.id && (
                    <Pressable onPress={() => cancellaCommento(c.id)} hitSlop={8}>
                      <Trash2 color="#b3261e" size={16} />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}

            {erroreForm && <Text className="text-sm text-destructive">{erroreForm}</Text>}

            <View className="flex-row gap-2">
              <Input
                className="flex-1"
                value={testo}
                onChangeText={setTesto}
                placeholder={t.evento.scrivi}
                onSubmitEditing={invia}
                returnKeyType="send"
              />
              <Button disabled={attesa || testo.trim().length === 0} onPress={invia}>
                <Text>{t.evento.invia}</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
