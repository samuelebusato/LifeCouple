import * as React from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Star, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useCoppia } from '@/lib/coppia';
import { usePreferiti, type Elemento, type TipoElemento } from '@/lib/preferiti';
import { t } from '@/lib/i18n';

const TIPI: TipoElemento[] = ['film', 'ristorante'];

/** Cinque stelle: toccabili quando sono le proprie, ferme quando sono dell'altro. */
function Stelle({
  voto,
  onVoto,
}: {
  voto: number;
  onVoto?: (v: number) => void;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onVoto} onPress={() => onVoto?.(n)} hitSlop={4}>
          <Star
            color="#bf5333"
            fill={n <= voto ? '#bf5333' : 'transparent'}
            size={onVoto ? 24 : 16}
          />
        </Pressable>
      ))}
    </View>
  );
}

function Scheda({
  e,
  mioId,
  onFatto,
  onRecensisci,
  onElimina,
}: {
  e: Elemento;
  mioId: string | undefined;
  onFatto: (fatto: boolean) => void;
  onRecensisci: (voto: number, testo: string) => void;
  onElimina: () => void;
}) {
  const mia = e.recensioni.find((r) => r.autore_id === mioId) ?? null;
  const altrui = e.recensioni.filter((r) => r.autore_id !== mioId);
  const [apertaRecensione, setAperta] = React.useState(false);
  const [voto, setVoto] = React.useState(mia?.voto ?? 0);
  const [testo, setTesto] = React.useState(mia?.testo ?? '');

  const fatto = e.stato === 'fatto';

  return (
    <View className="w-full gap-3 rounded-2xl bg-card p-4">
      <View className="flex-row items-start gap-3">
        <Pressable onPress={() => onFatto(!fatto)} hitSlop={6} className="pt-1">
          <View
            className={cn(
              'h-6 w-6 items-center justify-center rounded-full border',
              fatto ? 'border-primary bg-primary' : 'border-muted-foreground'
            )}
          >
            {fatto && <Check color="#fdfaf5" size={16} />}
          </View>
        </Pressable>

        <View className="flex-1">
          <Text className={cn('font-serif text-xl text-foreground', fatto && 'line-through')}>
            {e.titolo}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {fatto ? t.preferiti.fatto : t.preferiti.daFare}
          </Text>
        </View>

        {e.autore_id === mioId && (
          <Pressable onPress={onElimina} hitSlop={8}>
            <Trash2 color="#b3261e" size={18} />
          </Pressable>
        )}
      </View>

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
                <Button
                  className="flex-1"
                  disabled={voto === 0}
                  onPress={() => {
                    onRecensisci(voto, testo);
                    setAperta(false);
                  }}
                >
                  <Text>{t.calendario.salva}</Text>
                </Button>
                <Button variant="ghost" onPress={() => setAperta(false)}>
                  <Text>{t.calendario.annulla}</Text>
                </Button>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function Preferiti() {
  const { session } = useAuth();
  const { coppiaId, ricarica: ricaricaCoppia } = useCoppia();
  const { elementi, loading, errore, aggiungi, segnaFatto, recensisci, elimina } =
    usePreferiti(coppiaId);

  const [tipo, setTipo] = React.useState<TipoElemento>('film');
  const [nuovo, setNuovo] = React.useState('');
  const [attesa, setAttesa] = React.useState(false);
  const [erroreForm, setErroreForm] = React.useState<string | null>(null);

  const suoi = elementi.filter((e) => e.tipo === tipo);
  const daFare = suoi.filter((e) => e.stato !== 'fatto');
  const fatti = suoi.filter((e) => e.stato === 'fatto');

  async function salva() {
    if (nuovo.trim().length === 0) return;
    setErroreForm(null);
    setAttesa(true);
    const err = await aggiungi(tipo, nuovo, ricaricaCoppia);
    setAttesa(false);
    if (err) return setErroreForm(err);
    setNuovo('');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row gap-2 px-6 pb-2 pt-3">
        {TIPI.map((x) => (
          <Pressable
            key={x}
            onPress={() => setTipo(x)}
            className={cn(
              'flex-1 items-center rounded-full py-2',
              tipo === x ? 'bg-primary' : 'bg-card'
            )}
          >
            <Text
              className={cn(
                'text-sm',
                tipo === x ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {t.preferiti.tipi[x]}
            </Text>
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#bf5333" />
          </View>
        ) : (
          <ScrollView contentContainerClassName="gap-3 px-6 pb-40" keyboardShouldPersistTaps="handled">
            {errore && <Text className="text-sm text-destructive">{errore}</Text>}

            {suoi.length === 0 && (
              <View className="items-center gap-2 py-10">
                <Text className="font-serif text-lg text-foreground">
                  {t.preferiti.vuoto[tipo]}
                </Text>
              </View>
            )}

            {daFare.length > 0 && (
              <Text className="pt-2 text-xs uppercase tracking-wide text-muted-foreground">
                {t.preferiti.daFare}
              </Text>
            )}
            {daFare.map((e) => (
              <Scheda
                key={e.id}
                e={e}
                mioId={session?.user.id}
                onFatto={(f) => segnaFatto(e.id, f)}
                onRecensisci={(v, txt) => recensisci(e, v, txt)}
                onElimina={() => elimina(e.id)}
              />
            ))}

            {fatti.length > 0 && (
              <Text className="pt-4 text-xs uppercase tracking-wide text-muted-foreground">
                {t.preferiti.fatti}
              </Text>
            )}
            {fatti.map((e) => (
              <Scheda
                key={e.id}
                e={e}
                mioId={session?.user.id}
                onFatto={(f) => segnaFatto(e.id, f)}
                onRecensisci={(v, txt) => recensisci(e, v, txt)}
                onElimina={() => elimina(e.id)}
              />
            ))}
          </ScrollView>
        )}

        <View className="absolute inset-x-0 bottom-0 gap-2 bg-background px-6 pb-24 pt-3">
          {erroreForm && <Text className="text-sm text-destructive">{erroreForm}</Text>}
          <View className="flex-row gap-2">
            <Input
              className="flex-1"
              value={nuovo}
              onChangeText={setNuovo}
              placeholder={t.preferiti.placeholder[tipo]}
              onSubmitEditing={salva}
              returnKeyType="done"
            />
            <Button disabled={attesa || nuovo.trim().length === 0} onPress={salva}>
              <Text>{t.calendario.aggiungi}</Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
