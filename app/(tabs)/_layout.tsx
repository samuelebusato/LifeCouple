import { Tabs } from 'expo-router';
import { CalendarDays, Heart, Image, Map, Sparkles, Star } from 'lucide-react-native';
import { t } from '@/lib/i18n';

/**
 * La barra delle funzioni: sei sezioni pari fra loro, raggiungibili sempre.
 *
 * Sostituisce il "Indietro" che ogni schermata doveva portarsi dietro. Le
 * sezioni ci sono tutte fin da ora anche quando dentro non c'e' ancora niente:
 * **una sezione vuota e dichiarata e' onesta, una sezione nascosta no** — chi
 * usa l'app sa cosa ci sara', e noi sappiamo cosa manca. L'ordine di
 * implementazione resta quello di D-11.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#bf5333',
        tabBarInactiveTintColor: '#9a8b7d',
        tabBarLabelStyle: { fontSize: 10 },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
        },
        tabBarBackground: () => null,
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
