import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { TondoVetro } from '@/components/ui/vetro';
import { ElencoElementi } from '@/components/elenco-elementi';
import { useListe, tintaDi } from '@/lib/liste';
import { useCoppia } from '@/lib/coppia';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * **Una wishlist aperta**: il suo nome, e dentro le voci.
 *
 * ## Perché riusa `ElencoElementi` invece di avere un elenco suo
 *
 * Sarebbe stato più corto scrivere una lista semplice — titolo, spunta,
 * cestino — e per le voci scritte a mano sarebbe bastata. Ma la migrazione 0022
 * porta i **film già esistenti** dentro una lista «Film», e quei film hanno
 * copertina, recensioni di entrambi e la transizione che alimenta la creatura.
 *
 * 🔑 Un elenco nuovo e più semplice li avrebbe mostrati come righe nude: non un
 * errore visibile, non un test che fallisce — solo funzioni che **spariscono
 * dall'interfaccia** restando nel database. È la forma peggiore di regressione,
 * perché nessuno la segnala: chi non sapeva che c'erano non le cerca, e chi lo
 * sapeva pensa di ricordare male.
 *
 * Quindi il componente resta uno, e ogni riga si disegna secondo il **proprio**
 * tipo. Il costo è una prop in più là dentro; il costo dell'alternativa era
 * perdere delle funzioni senza accorgersene.
 *
 * ⚠️ **La testata è qui e non dentro `ElencoElementi`**: quel componente vive
 * anche dentro una tab, dove il titolo lo mette la schermata. Un componente che
 * disegna la propria intestazione non si può mettere due volte nella stessa
 * pagina, e non si può mettere sotto un titolo che c'è già.
 */
export default function ListaAperta() {
  const router = useRouter();
  const { c } = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coppiaId } = useCoppia();
  const { liste, loading } = useListe(coppiaId);

  const lista = liste.find((l) => l.id === id) ?? null;

  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-3 px-5 pb-1 pt-1">
          <TondoVetro lato={42} onPress={() => router.back()}>
            <ChevronLeft color={c.testo} size={22} />
          </TondoVetro>
          <View className="flex-1">
            {/*
              ⚠️ Finché sta caricando **non si scrive niente**, invece di
              mettere un titolo di ripiego. Un nome sbagliato per mezzo secondo
              è peggio di uno spazio vuoto per mezzo secondo: il primo lo si
              legge, il secondo no.
            */}
            <Text className="font-serif-bold text-3xl text-foreground" numberOfLines={1}>
              {lista?.nome ?? ''}
            </Text>
            {lista && (
              <Text className="text-sm" style={{ color: tintaDi(lista).testo, opacity: 0.85 }}>
                {lista.voci === 0
                  ? t.liste.vuota
                  : t.liste.avanzamento(lista.fatte, lista.voci)}
              </Text>
            )}
          </View>
        </View>

        {/*
          Se la lista non c'è — link vecchio, oppure cancellata dal partner
          mentre la si guardava — si dice, invece di mostrare un elenco vuoto
          che sembrerebbe una lista senza voci. Sono due fatti diversi e devono
          avere due schermate diverse.
        */}
        {!loading && !lista ? (
          <View className="flex-1 items-center justify-center gap-2 px-10">
            <Text className="text-center text-base text-muted-foreground">
              {t.liste.nessuna}
            </Text>
          </View>
        ) : (
          /* ⚠️ Il tipo viene dalla **lista**, non da questa schermata: è la
             lista a sapere se contiene film o cose scritte (0023). Deciderlo
             qui avrebbe voluto dire dedurlo dal nome, che si rompe alla prima
             rinomina. */
          <ElencoElementi tipo={lista?.tipo ?? 'voce'} listaId={id ?? null} />
        )}
      </SafeAreaView>
    </View>
  );
}
