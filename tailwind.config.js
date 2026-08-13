/** @type {import('tailwindcss').Config} */
module.exports = {
  // Solo le cartelle con componenti nostri: tenere stretto il glob accorcia i build
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
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
        // Raggi ampi: il vetro ha bisogno di angoli morbidi, altrimenti il
        // bordo luminoso spezza invece di accompagnare.
        xl: '16px',
        '2xl': '22px',
        '3xl': '28px',
        '4xl': '34px',
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
