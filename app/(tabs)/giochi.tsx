import { Sparkles } from 'lucide-react-native';
import { SezioneInArrivo } from '@/components/sezione-in-arrivo';
import { t } from '@/lib/i18n';

/**
 * I tre giochi (D-12/D-13/D-19) sono l'unica funzione che **da soli non
 * esiste**: senza l'altra persona non c'e' partita. Quando arriveranno, questa
 * schermata mostrera' <ServePartner /> finche' la coppia non e' completa,
 * secondo la regola di D-28.
 */
export default function Giochi() {
  return (
    <SezioneInArrivo
      Icona={Sparkles}
      titolo={t.sezioni.giochiTitolo}
      testo={t.sezioni.giochiTesto}
      manca={t.sezioni.giochiManca}
    />
  );
}
