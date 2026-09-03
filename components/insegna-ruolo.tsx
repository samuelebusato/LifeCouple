import * as React from 'react';
import { View } from 'react-native';
import { PenLine, MessageCircleQuestionMark } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Comparsa } from '@/components/ui/comparsa';
import { pastelli, type Pastello } from '@/lib/tema';
import { t } from '@/lib/i18n';

/** I due ruoli del quiz: chi dà la risposta vera, e chi prova a indovinarla. */
export type Ruolo = 'rispondi' | 'indovina';

/**
 * La tinta di un ruolo. Si esporta perché la didascalia sopra le carte, nel
 * quiz, usa lo stesso colore dell'insegna: il ruolo deve avere **un** colore,
 * non due che si somigliano.
 *
 * Sono i pastelli del calendario, per la stessa ragione di `lib/giochi.ts`:
 * fondo tenue e testo scuro della stessa famiglia si leggono sempre, mentre il
 * bianco sull'ambra piena — che la pillola precedente usava — stava sotto il
 * minimo di contrasto anche per un titolo. Il rosa è quello della carta del
 * quiz nell'hub; l'ambra è la tinta con cui, nelle carte, si segna la scelta
 * dell'altro. La coppia rosa/ambra è la stessa che la pillola aveva insegnato
 * a chi ha già giocato: cambia la grandezza, non il codice.
 */
export function pastelloRuolo(ruolo: Ruolo): Pastello {
  return ruolo === 'rispondi' ? pastelli.romantico : pastelli.speciale;
}

/**
 * **L'insegna del ruolo** (D-91, 2026-09-03): il blocco in testa a un round
 * del quiz che dice, grande, chi sta dando la risposta vera e chi indovina.
 *
 * ## Perché sostituisce la pillola, e non la ingrandisce
 *
 * La pillola del 2026-09-01 era un ovale con dodici punti di maiuscolo e una
 * riga grigia sotto la domanda. Dopo due giorni di partite vere l'utente ha
 * chiesto che fosse *molto* più evidente a chi tocca rispondere e a chi
 * inserire la risposta corretta. Una pillola più grande avrebbe risposto a
 * metà: diceva il **mio** ruolo, e la domanda che si fanno in due davanti allo
 * stesso schermo è *«chi dei due sta dando quella giusta?»* — cioè il ruolo
 * di **entrambi**.
 *
 * Quindi l'insegna dice il ruolo in quattro modi che si sommano, non in uno
 * più grande: la **tinta** (tutto il blocco cambia colore col ruolo), l'**icona**
 * (la penna di chi scrive la propria risposta, il fumetto col punto di domanda
 * di chi la cerca), il **titolo** a corpo grande, e i **due cartellini** in
 * fondo che nominano l'uno accanto all'altro *tu* e *il partner*. Il proprio
 * è pieno, quello dell'altro è bianco: si capisce quale dei due sono io senza
 * leggere.
 *
 * ⚠️ Non usa il vetro: sta sopra lo sfondo chiaro della schermata, dove il
 * vetro mostra il bianco che ha sotto (`components/carta-gioco.tsx`), e deve
 * essere la cosa **più** visibile della testata, non la più raffinata.
 *
 * ⚠️ La nota è testo che cambia col momento — «è la tua risposta vera» prima,
 * «hai risposto, aspettiamo» dopo — mentre il titolo e la tinta restano: il
 * ruolo non sparisce quando si è agito, perché è ciò che serve a leggere
 * l'attesa (*sto aspettando che indovini, non che risponda*).
 */
export function InsegnaRuolo({ ruolo, nota }: { ruolo: Ruolo; nota: string }) {
  const p = pastelloRuolo(ruolo);
  const rispondo = ruolo === 'rispondi';
  const Icona = rispondo ? PenLine : MessageCircleQuestionMark;

  return (
    <Comparsa visibile scarto={10} scala={0.97}>
      <View
        style={{
          borderRadius: 24,
          backgroundColor: p.fondo,
          borderWidth: 1.5,
          borderColor: p.barra,
          paddingHorizontal: 14,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              shadowColor: p.testo,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.16,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Icona color={p.testo} size={28} strokeWidth={2.25} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              className="font-serif-bold text-2xl"
              style={{ color: p.testo, lineHeight: 30 }}
              numberOfLines={2}
            >
              {rispondo ? t.gioco.insegnaRispondi : t.gioco.insegnaIndovina}
            </Text>
            <Text className="text-sm" style={{ color: p.testo, opacity: 0.86, lineHeight: 19 }}>
              {nota}
            </Text>
          </View>
        </View>

        {/* I due cartellini: a misura del testo e a capo se non ci stanno,
            perché «Partner: risposta vera» in inglese non entra in metà
            schermo, e tagliarlo con i puntini toglierebbe proprio la parola
            che distingue i due ruoli. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Cartellino
            p={p}
            pieno
            testo={rispondo ? t.gioco.chipTuRispondi : t.gioco.chipTuIndovini}
          />
          <Cartellino
            p={p}
            testo={rispondo ? t.gioco.chipPartnerIndovina : t.gioco.chipPartnerRisponde}
          />
        </View>
      </View>
    </Comparsa>
  );
}

function Cartellino({ p, testo, pieno = false }: { p: Pastello; testo: string; pieno?: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: pieno ? p.testo : '#ffffff',
        borderWidth: 1,
        borderColor: pieno ? p.testo : p.barra,
      }}
    >
      <Text
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: pieno ? '#ffffff' : p.testo }}
      >
        {testo}
      </Text>
    </View>
  );
}
