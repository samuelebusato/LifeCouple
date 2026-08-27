/** @type {import('tailwindcss').Config} */
module.exports = {
  // Solo le cartelle con componenti nostri: tenere stretto il glob accorcia i build
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // ⚠️ `class` e non il predefinito `media`, ed e' la correzione di **B-02**.
  //
  // Con `media`, NativeWind lega il tema scuro a `prefers-color-scheme` e
  // **rifiuta** ogni tentativo di impostarlo a mano: Expo, che riflette
  // `userInterfaceStyle` chiamando `Appearance.setColorScheme`, si prendeva un
  // "Cannot manually set color scheme" a ogni render sul web. Con `class` la
  // modalita' non e' piu' una media query e la chiamata di Expo e' lecita.
  //
  // Non riapre la modalita' notte (D-39): la classe `dark` non viene messa da
  // nessuno, e in `global.css` non esistono piu' token scuri da applicare.
  darkMode: 'class',
  theme: {
    extend: {
      // Fraunces resta anche in "Quarzo rosa": un serif con contrasto alto e'
      // cio' che distingue un'interfaccia premium da una di sistema. Il corpo
      // resta sul font di sistema, piu' leggibile su schermo piccolo.
      fontFamily: {
        serif: ['Fraunces_600SemiBold'],
        'serif-bold': ['Fraunces_700Bold'],
      },
      borderRadius: {
        // Angoli **dolci** (chiesti il 2026-08-13 sera): raggi ancora piu'
        // ampi, da superellisse — il vetro e le carte devono sembrare sassi
        // levigati, non schede smussate.
        xl: '20px',
        '2xl': '26px',
        '3xl': '32px',
        '4xl': '40px',
      },
      // Token in variabili CSS (global.css): la palette si cambia in un punto solo,
      // e i componenti in stile shadcn/RNR li trovano coi nomi che si aspettano.
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // La scala del rosa, disponibile come `bg-rosa-100`, `text-rosa-700`...
        // Serve dove un solo `primary` non basta: velature, fondi di sezione,
        // gradienti. Si inverte da sola nel tema scuro (vedi global.css).
        rosa: {
          50: 'hsl(var(--rosa-50))',
          100: 'hsl(var(--rosa-100))',
          200: 'hsl(var(--rosa-200))',
          300: 'hsl(var(--rosa-300))',
          400: 'hsl(var(--rosa-400))',
          500: 'hsl(var(--rosa-500))',
          600: 'hsl(var(--rosa-600))',
          700: 'hsl(var(--rosa-700))',
          800: 'hsl(var(--rosa-800))',
          900: 'hsl(var(--rosa-900))',
        },
      },
    },
  },
  plugins: [],
};
