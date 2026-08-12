import * as React from 'react';
import { View, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { Emblema } from '@/components/emblema';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useCoppia } from '@/lib/coppia';

type Fase = 'scelta' | 'invita' | 'unisci' | 'attesa-conferma';

export default function Onboarding() {
  const { ricarica } = useCoppia();
  const [fase, setFase] = React.useState<Fase>('scelta');
  const [errore, setErrore] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);

  // ramo "invita": token generato + stato dell'invito (per sapere se il partner ha aperto)
  const [link, setLink] = React.useState<string | null>(null);
  const [invitoApertoId, setInvitoApertoId] = React.useState<string | null>(null);

  // ramo "unisci": campo dove incollare il link ricevuto
  const [tokenIncollato, setTokenIncollato] = React.useState('');

  function estraiToken(s: string) {
    const t = s.trim();
    const m = t.match(/invito\/([a-f0-9]+)/i);
    return m ? m[1] : t;
  }

  async function creaCoppiaEInvita() {
    setErrore(null);
    setAttesa(true);
    const { error: e1 } = await supabase.rpc('crea_coppia');
    if (e1 && !/gia/.test(e1.message)) {
      setAttesa(false);
      return setErrore(e1.message);
    }
    const { data: token, error: e2 } = await supabase.rpc('crea_invito');
    setAttesa(false);
    if (e2) return setErrore(e2.message);
    setLink(Linking.createURL(`/invito/${token}`));
    setFase('invita');
  }

  async function condividi() {
    if (!link) return;
    await Share.share({
      message: `Uniamoci su LifeCouple, il nostro diario condiviso. Apri questo link: ${link}`,
    });
  }

  // ramo invita: controlla se qualcuno ha aperto l'invito
  React.useEffect(() => {
    if (fase !== 'invita') return;
    const id = setInterval(async () => {
      const { data } = await supabase
        .from('invito')
        .select('id, stato, aperto_da')
        .eq('stato', 'aperto_in_attesa_conferma')
        .limit(1);
      if (data?.[0]) setInvitoApertoId(data[0].id);
    }, 3000);
    return () => clearInterval(id);
  }, [fase]);

  async function conferma() {
    if (!invitoApertoId) return;
    setErrore(null);
    setAttesa(true);
    const { error } = await supabase.rpc('conferma_invito', { p_invito_id: invitoApertoId });
    setAttesa(false);
    if (error) return setErrore(error.message);
    await ricarica(); // il gate reindirizza a /home
  }

  async function apriInvito() {
    setErrore(null);
    setAttesa(true);
    const { error } = await supabase.rpc('apri_invito', { p_token: estraiToken(tokenIncollato) });
    setAttesa(false);
    if (error) return setErrore(error.message);
    setFase('attesa-conferma');
  }

  // ramo unisci: dopo aver aperto, aspetta la conferma dell'altro (diventa membro)
  React.useEffect(() => {
    if (fase !== 'attesa-conferma') return;
    const id = setInterval(ricarica, 3000);
    return () => clearInterval(id);
  }, [fase, ricarica]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-8">
        {fase === 'scelta' && (
          <View className="items-center gap-8">
            <Emblema size={80} />
            <View className="items-center gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">Siete in due</Text>
              <Text className="max-w-xs text-center text-base text-muted-foreground">
                Crea il vostro spazio e invita il partner, oppure unisciti se hai
                ricevuto un invito.
              </Text>
            </View>
            <View className="w-full gap-3">
              <Button size="lg" disabled={attesa} onPress={creaCoppiaEInvita}>
                <Text>{attesa ? 'Un attimo…' : 'Crea il nostro spazio'}</Text>
              </Button>
              <Button variant="outline" size="lg" onPress={() => setFase('unisci')}>
                <Text>Ho ricevuto un invito</Text>
              </Button>
            </View>
            {errore && <Text className="text-center text-sm text-destructive">{errore}</Text>}
          </View>
        )}

        {fase === 'invita' && (
          <View className="items-center gap-6">
            <Emblema size={80} />
            <View className="items-center gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">Invita il partner</Text>
              <Text className="max-w-xs text-center text-base text-muted-foreground">
                Mandagli il link. Quando lo apre, potrai confermare qui.
              </Text>
            </View>
            <Button size="lg" className="w-full" onPress={condividi}>
              <Text>Condividi il link</Text>
            </Button>

            {invitoApertoId ? (
              <View className="w-full items-center gap-3 rounded-2xl bg-accent p-5">
                <Text className="text-center text-base text-accent-foreground">
                  Il tuo partner ha aperto l'invito.
                </Text>
                <Button className="w-full" disabled={attesa} onPress={conferma}>
                  <Text>{attesa ? 'Unisco…' : 'Confermate: siete una coppia'}</Text>
                </Button>
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="#bf5333" />
                <Text className="text-sm text-muted-foreground">In attesa che apra il link…</Text>
              </View>
            )}
            {errore && <Text className="text-center text-sm text-destructive">{errore}</Text>}
          </View>
        )}

        {fase === 'unisci' && (
          <View className="gap-6">
            <View className="gap-2">
              <Text className="font-serif-bold text-3xl text-foreground">Hai un invito</Text>
              <Text className="text-base text-muted-foreground">
                Incolla il link che ti ha mandato il partner.
              </Text>
            </View>
            <Input
              value={tokenIncollato}
              onChangeText={setTokenIncollato}
              placeholder="Incolla qui il link"
              autoCapitalize="none"
              autoFocus
            />
            {errore && <Text className="text-sm text-destructive">{errore}</Text>}
            <Button size="lg" disabled={attesa || tokenIncollato.trim().length < 6} onPress={apriInvito}>
              <Text>{attesa ? 'Apro…' : 'Apri l’invito'}</Text>
            </Button>
            <Button variant="ghost" onPress={() => setFase('scelta')}>
              <Text>Indietro</Text>
            </Button>
          </View>
        )}

        {fase === 'attesa-conferma' && (
          <View className="items-center gap-4">
            <ActivityIndicator color="#bf5333" />
            <Text className="font-serif text-xl text-foreground">Ci siamo quasi</Text>
            <Text className="max-w-xs text-center text-base text-muted-foreground">
              Hai aperto l'invito. Aspetta che il tuo partner confermi dal suo
              telefono: appena lo fa, entrate insieme.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
