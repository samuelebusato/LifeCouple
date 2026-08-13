import * as React from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * "La tastiera e' aperta?" — con l'altezza, per chi deve farle spazio.
 *
 * Sta qui e non dentro un componente perche' serve in **due punti che devono
 * concordare**: la barra volante, che sparisce, e le schermate con una riga di
 * comando in fondo, che devono togliere lo spazio riservato alla barra proprio
 * mentre lei non c'e'. Due copie della stessa logica si sarebbero
 * desincronizzate al primo cambio, lasciando o un buco vuoto o una barra sopra
 * i tasti.
 *
 * Su iOS si ascoltano gli eventi **Will**, che arrivano prima dell'animazione:
 * cosi' l'interfaccia si sposta *insieme* alla tastiera invece che dopo. Su
 * Android esistono solo i **Did**.
 */
export function useTastiera() {
  const [altezza, setAltezza] = React.useState(0);

  React.useEffect(() => {
    const su = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const giu = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(su, (e) => setAltezza(e.endCoordinates?.height ?? 0));
    const b = Keyboard.addListener(giu, () => setAltezza(0));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  return { aperta: altezza > 0, altezza };
}
