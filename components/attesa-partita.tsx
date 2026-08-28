import * as React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Fondo } from '@/components/schermata';
import { BottoneVetro, BottonePieno } from '@/components/ui/vetro';
import { Emblema } from '@/components/emblema';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * L'anticamera di una partita: si prepara, si preme «avvia», si aspetta l'altro.
 *
 * ⚠️ **L'attesa dell'altro ha un suo schermo e non un bottone disabilitato.**
 * Un bottone spento non dice *perché* è spento, e in un gioco che comincia
 * quando premono in due la domanda è esattamente quella: *sto aspettando io o
 * sta aspettando lui?* Qui la risposta è scritta.
 */
export function Attesa({
  titolo,
  testo,
  azione,
  onAzione,
  onEsci,
  onAnnulla,
  attesa = false,
}: {
  titolo: string;
  testo: string;
  /** L'etichetta del bottone, se in questo momento c'è qualcosa da premere. */
  azione?: string;
  onAzione?: () => void;
  onEsci: () => void;
  /**
   * Annulla **la partita**, non solo la schermata.
   *
   * 🔑 Serve perché senza, una partita in attesa non si può togliere di mezzo
   * da nessuna parte: il database ne ammette **una viva per gioco**, quindi
   * quella rimasta appesa impedisce di cominciarne un'altra — per sempre, e
   * senza dire perché. Uscire con «indietro» lascia la partita dov'è: è la cosa
   * giusta se stai solo sbirciando, ed è una trappola se è l'unico modo di
   * uscire che esiste.
   */
  onAnnulla?: () => void;
  /** Vero mentre si aspetta l'altra persona: mostra la rotella al posto sua. */
  attesa?: boolean;
}) {
  const { c } = useTema();
  return (
    <View className="flex-1">
      <Fondo />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center gap-5 px-10">
          <Emblema size={92} color={c.accento} />
          <Text className="text-center font-serif-bold text-3xl text-foreground">{titolo}</Text>
          <Text className="text-center text-base text-muted-foreground">{testo}</Text>
          {attesa && <ActivityIndicator color={c.accento} />}
          {/*
            ⚠️ **`BottonePieno` e non `BottoneVetro variante="accento"`**, ed è la
            correzione di un difetto riferito dall'utente: *«il pulsante avvia
            partita sembra disattivato»*.

            La causa: sul vetro **nativo** di iOS 26 il bottone accento è vetro
            tinto di rosa al 28% con il testo **bianco**. Sopra lo sfondo chiaro
            dell'app quel 28% non basta a fare da fondo, e resta bianco su quasi
            bianco — che è esattamente l'aspetto che l'occhio ha imparato a
            leggere come *spento*. Nella libreria l'unica variazione di opacità
            significa «disabilitato», quindi qualunque cosa sbiadita viene
            interpretata così.

            🔑 La lezione è più generale del bottone: **un'azione primaria non
            può dipendere da un materiale che decide il sistema.** Il vetro
            tinto rende benissimo sopra una foto o una mappa e sparisce sopra il
            bianco; `BottonePieno` porta il proprio colore e non può sbiadire.
          */}
          {!!azione && (
            <BottonePieno testo={azione} onPress={onAzione} style={{ minWidth: 240 }} />
          )}
        </View>
        <View className="gap-2 px-8 pb-8">
          {/* ⚠️ Annullare è **secondario e scritto per esteso**: «indietro» lo si
              preme distrattamente, e se la stessa gesto buttasse via la partita
              che l'altro sta aspettando di iniziare sarebbe una perdita causata
              dall'interfaccia, non dall'utente. */}
          {!!onAnnulla && (
            <BottoneVetro altezza={46} variante="pericolo" onPress={onAnnulla}>
              <Text>{t.gioco.annulla}</Text>
            </BottoneVetro>
          )}
          <BottoneVetro altezza={46} onPress={onEsci}>
            <Text>{t.gioco.indietro}</Text>
          </BottoneVetro>
        </View>
      </SafeAreaView>
    </View>
  );
}
