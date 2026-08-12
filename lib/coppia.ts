import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * Stato di appaiamento dell'utente corrente: e' in una coppia attiva?
 * E' cio' che decide, dopo il login, se mostrare l'onboarding o l'app.
 */
export function useCoppia() {
  const { session } = useAuth();
  const [coppiaId, setCoppiaId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const ricarica = React.useCallback(async () => {
    if (!session) {
      setCoppiaId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('membro_coppia')
      .select('coppia_id')
      .is('uscito_il', null)
      .limit(1);
    setCoppiaId(data?.[0]?.coppia_id ?? null);
    setLoading(false);
  }, [session]);

  React.useEffect(() => {
    ricarica();
  }, [ricarica]);

  return { coppiaId, loading, ricarica };
}
