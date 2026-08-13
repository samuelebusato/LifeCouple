import { Tabs } from 'expo-router';
import { CalendarDays, Heart, Image, Map, Sparkles, Star } from 'lucide-react-native';
import { BarraVolante } from '@/components/barra-volante';
import { t } from '@/lib/i18n';

/**
 * La barra delle funzioni: sei sezioni pari fra loro, raggiungibili sempre.
 *
 * Sostituisce il "Indietro" che ogni schermata doveva portarsi dietro. Le
 * sezioni ci sono tutte fin da ora anche quando dentro non c'e' ancora niente:
 * **una sezione vuota e dichiarata e' onesta, una sezione nascosta no** — chi
 * usa l'app sa cosa ci sara', e noi sappiamo cosa manca. L'ordine di
 * implementazione resta quello di D-11.
 *
 * Il disegno della barra sta in `components/barra-volante.tsx`: qui restano
 * solo le rotte, le icone e i titoli. La barra di sistema e' sostituita per
 * intero perche' non sa fare ne' il vetro ne' lo stacco dal bordo.
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BarraVolante {...props} />}
      screenOptions={{
        headerShown: false,
        // Le schermate devono poter scorrere **sotto** la pillola: e' cio' che
        // le da' qualcosa da sfocare. Sfondo trasparente su tutta la catena.
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.tab.spazio,
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: t.tab.calendario,
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="giochi"
        options={{
          title: t.tab.giochi,
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mappa"
        options={{
          title: t.tab.mappa,
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="preferiti"
        options={{
          title: t.tab.preferiti,
          tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="galleria"
        options={{
          title: t.tab.galleria,
          tabBarIcon: ({ color, size }) => <Image color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
