import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import type { StatoCoppia } from '@/lib/coppia';
import { assicuraCoppia, useInvito } from '@/lib/invito';
import { t } from '@/lib/i18n';

/**
 * Cartellino da mostrare al posto di una funzione che ha bisogno di due
 * persone, quando il partner non e' ancora entrato (D-25).
 *
 * Da usare dentro calendario, mappa, foto, liste e giochi man mano che
 * arrivano: la funzione non si nasconde e non si disabilita in silenzio,
 * dice cosa manca e offre il gesto per rimediare.
 *
 * Il gesto funziona **sempre**: se lo spazio della coppia non esiste ancora
 * (si puo' entrare senza crearlo) viene creato qui, prima dell'invito.
 */
export function ServePartner({
  coppiaId,
  ricarica,
}: {
  coppiaId: string | null;
  ricarica: () => Promise<StatoCoppia>;
}) {
  const invito = useInvito(false);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [attesa, setAttesa] = React.useState(false);

  async function invita() {
    setErrore(null);
    setAttesa(true);
    const esito = await assicuraCoppia(coppiaId, ricarica);
    if (!esito.coppiaId) {
      setAttesa(false);
      return setErrore(esito.errore);
    }
    const l = await invito.creaLink();
    setAttesa(false);
    if (l) await invito.condividi(l);
  }

  return (
    <View className="w-full items-center gap-3 rounded-2xl bg-accent p-5">
      <Text className="text-center text-base font-medium text-accent-foreground">
        {t.coppia.servePartner}
      </Text>
      <Text className="text-center text-sm text-accent-foreground/80">
        {t.coppia.servePartnerNota}
      </Text>
      <Button className="w-full" disabled={attesa || invito.attesa} onPress={invita}>
        <Text>{attesa || invito.attesa ? t.onboarding.attesa : t.coppia.invita}</Text>
      </Button>
      {invito.link && (
        <Text selectable className="text-center text-xs text-accent-foreground/80">
          {invito.link}
        </Text>
      )}
      {(errore || invito.errore) && (
        <Text className="text-center text-sm text-destructive">{errore ?? invito.errore}</Text>
      )}
    </View>
  );
}
