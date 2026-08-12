import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useInvito } from '@/lib/invito';
import { t } from '@/lib/i18n';

/**
 * Cartellino da mostrare al posto di una funzione che ha bisogno di due
 * persone, quando il partner non e' ancora entrato (D-25).
 *
 * Da usare dentro calendario, mappa, foto, liste e giochi man mano che
 * arrivano: la funzione non si nasconde e non si disabilita in silenzio,
 * dice cosa manca e offre il gesto per rimediare.
 */
export function ServePartner() {
  const invito = useInvito(false);

  async function invita() {
    const l = await invito.creaLink();
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
      <Button className="w-full" disabled={invito.attesa} onPress={invita}>
        <Text>{invito.attesa ? t.onboarding.attesa : t.coppia.invita}</Text>
      </Button>
      {invito.errore && <Text className="text-center text-sm text-destructive">{invito.errore}</Text>}
    </View>
  );
}
