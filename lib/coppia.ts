import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * Stato di appaiamento dell'utente corrente.
 *
 * Due informazioni distinte, e la distinzione conta (D-25): `coppiaId` dice se
 * lo spazio esiste — ed e' cio' che decide se si entra nell'app — mentre
 * `completa` dice se il partner e' gia' dentro, e serve solo a decidere quali
 * funzioni sono utilizzabili. Chi e' da solo entra lo stesso.
 *
 * La policy `membro_select` lascia vedere entrambi i membri della propria
 * coppia, quindi il conteggio si fa con la sola chiave anonima.
 */
export function useCoppia() {
  const { session } = useAuth();
  const [coppiaId, setCoppiaId] = React.useState<string | null>(null);
  const [completa, setCompleta] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!session) {
      setCoppiaId(null);
      setCompleta(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('membro_coppia')
      .select('coppia_id, utente_id')
      .is('uscito_il', null);

    const mia = data?.find((r) => r.utente_id === session.user.id) ?? null;
    setCoppiaId(mia?.coppia_id ?? null);
    setCompleta(
      !!mia && data!.filter((r) => r.coppia_id === mia.coppia_id).length >= 2
    );
    setLoading(false);
  }, [session]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  return { coppiaId, completa, loading, ricarica };
}
