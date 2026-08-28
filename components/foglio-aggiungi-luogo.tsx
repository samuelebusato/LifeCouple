import * as React from 'react';
import { View, Modal, Pressable, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { CartaVetro, NienteSotto } from '@/components/ui/vetro';
import { CercaLuogo } from '@/components/cerca-luogo';
import { creaLuogo } from '@/lib/preferiti';
import type { StatoCoppia } from '@/lib/coppia';
import { useTema } from '@/lib/tema';
import { t } from '@/lib/i18n';

/**
 * **L'unico modo di aggiungere un posto**: si cerca, si sceglie, e nasce.
 *
 * ## Perche' esiste (2026-08-28)
 *
 * Un posto si poteva aggiungere da **due** schermate, e le due strade non erano
 * la stessa cosa:
 *
 * - da **Liste**: si cercava un posto vero e nasceva completo — identita'
 *   Google, copertina, genere;
 * - dalla **mappa**: si prendeva la posizione attuale, si scriveva un nome a
 *   mano («Come lo chiamate?») e nasceva **piu' povero**, senza copertina
 *   (B-19).
 *
 * L'utente ha chiesto di normalizzarle sulla prima. Non e' solo una
 * semplificazione dell'interfaccia: **due schermate che creano la stessa entita'
 * in due modi diversi divergono al primo ritocco**, e la differenza si scopre
 * settimane dopo guardando una lista in cui alcune schede hanno la foto e altre
 * no. Da qui in avanti la schermata e' **una**, e la funzione che scrive nel
 * database (\`creaLuogo\`) e' **una**.
 *
 * ⚠️ **Cosa si perde, e va detto**: non si puo' piu' segnare un punto che su
 * Google non esiste — la panchina, il posto senza nome, «casa della nonna». Non
 * e' un effetto collaterale trascurabile, e' il prezzo della normalizzazione.
 * E' pero' coerente con D-37, che aveva gia' deciso che *un luogo si sceglie fra
 * quelli veri*: la mappa era rimasta l'ultima porta da cui si poteva inventarlo.
 *
 * ## L'errore tiene il foglio aperto
 *
 * La versione di Liste chiudeva il foglio e mostrava l'errore **dietro**, nella
 * schermata sotto. Qui resta dov'e' successo: chi ha appena scelto un posto sta
 * guardando questo foglio, e un messaggio che compare altrove dopo che il foglio
 * e' sparito e' un messaggio che non si legge.
 */
export function FoglioAggiungiLuogo({
  visibile,
  onChiudi,
  coppiaId,
  ricaricaCoppia,
  onAggiunto,
  listaId = null,
}: {
  visibile: boolean;
  onChiudi: () => void;
  coppiaId: string | null;
  ricaricaCoppia: () => Promise<StatoCoppia>;
  /**
   * La wishlist in cui mettere il posto (0024). Senza, la riga nasce fuori da
   * ogni lista e **non compare dove l'hai aggiunta** - vedi la nota in
   * `creaLuogo`.
   */
  listaId?: string | null;
  /** Chi ha una lista da rinfrescare la rinfresca qui (la mappa, i suoi pin). */
  onAggiunto?: (luogoId?: string) => void | Promise<void>;
}) {
  const { c } = useTema();
  const [errore, setErrore] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);

  // Riaprire il foglio non deve mostrare l'errore della volta scorsa.
  React.useEffect(() => {
    if (visibile) {
      setErrore(null);
      setAttesa(false);
    }
  }, [visibile]);

  return (
    <Modal visible={visibile} transparent animationType="slide" onRequestClose={onChiudi}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(20,8,14,0.4)' }}
      >
        {/* ⚠️ Questo e' un `Modal` grezzo, non il `Foglio` di
            `components/foglio.tsx`: la velatura scura qui sopra va dichiarata a
            mano, o il vetro la sfoca e si legge «in ombra» — il difetto D-60.
            Dichiarandola qui, tutto cio' che sta dentro si adegua da solo,
            carta e campo di ricerca compresi. */}
        <NienteSotto>
          <CartaVetro raggio={32} style={{ margin: 8 }}>
          <SafeAreaView edges={['bottom']}>
            <View className="gap-4 p-6">
              <View className="flex-row items-center justify-between">
                <Text className="font-serif-bold text-2xl text-foreground">
                  {t.preferiti.cercaRistorante}
                </Text>
                <Pressable onPress={onChiudi} hitSlop={8} accessibilityRole="button">
                  <X color={c.tenue} size={20} />
                </Pressable>
              </View>

              <CercaLuogo
                autoFocus
                placeholder={t.preferiti.placeholder.luogo}
                onScegli={async (trovato) => {
                  setErrore(null);
                  setAttesa(true);
                  const esito = await creaLuogo(coppiaId, trovato, ricaricaCoppia, listaId);
                  setAttesa(false);
                  if (esito.errore) return setErrore(esito.errore);
                  await onAggiunto?.(esito.luogoId);
                  onChiudi();
                }}
              />

              {attesa && (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color={c.accento} size="small" />
                  <Text className="text-sm text-muted-foreground">{t.onboarding.attesa}</Text>
                </View>
              )}
              {!!errore && <Text className="text-sm text-destructive">{errore}</Text>}
              </View>
            </SafeAreaView>
          </CartaVetro>
        </NienteSotto>
      </KeyboardAvoidingView>
    </Modal>
  );
}
