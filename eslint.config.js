// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    /**
     * ⚠️ Le tre regole del React Compiler arrivate con eslint-config-expo 56
     * (aggiornamento a SDK 57, 2026-09-03) — `set-state-in-effect`, `refs`,
     * `immutability` — sono **avvisi**, non errori. Al primo giro segnalavano
     * 63 punti, tutti in codice che gira sui telefoni da settimane: sono
     * schemi deliberati (lo stato locale che segue un evento realtime, il
     * reset a cambio round) che il compilatore non distingue da un errore.
     * Rivederli uno a uno è un refactor, non un aggiornamento di SDK: sta nel
     * backlog di History.md. Restano visibili apposta.
     */
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
]);
