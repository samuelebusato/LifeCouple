import * as React from 'react';
import { View, Linking } from 'react-native';
import { Text } from '@/components/ui/text';

/**
 * Un renderer markdown **minimo**, per i soli documenti legali.
 *
 * ## Perché non una libreria
 *
 * `react-native-markdown-display` avrebbe fatto il lavoro, ma il progetto è
 * appena uscito dall'aggiornamento a SDK 57 — che ha rotto `expo-calendar` in un
 * modo che né `tsc` né il bundle vedevano (**B-49**) — e aggiungere una
 * dipendenza non mantenuta per due schermate significa legarle al prossimo
 * aggiornamento. Il markdown che questi documenti usano è un sottoinsieme
 * piccolo e **noto**, perché lo scriviamo noi.
 *
 * ## 🔑 Le tabelle sono il motivo vero per cui questo file esiste
 *
 * I tre documenti contengono ~45 righe di tabella (dati/finalità/base giuridica/
 * conservazione). Una tabella markdown resa a colonne su uno schermo da 375 px
 * produce quattro colonne da 90 px: **illeggibile**, ed è testo che l'utente ha
 * il diritto di capire, non solo di ricevere. Qui ogni riga diventa un blocchetto
 * con le intestazioni come etichette, uno sotto l'altro.
 *
 * ⚠️ *Un'informativa che tecnicamente è stata resa ma che nessuno riesce a
 * leggere non soddisfa l'art. 12 GDPR, che chiede forma «concisa, trasparente,
 * intelligibile e facilmente accessibile».* L'impaginazione qui è sostanza.
 *
 * ## Cosa capisce
 *
 * Titoli `#`/`##`/`###`, paragrafi, `**grassetto**`, `*corsivo*`, `` `codice` ``,
 * `[testo](url)`, elenchi puntati e numerati, citazioni `>`, righe `---`, tabelle.
 * Tutto il resto passa come testo semplice: **non si rompe niente**, al massimo
 * un simbolo resta visibile — che è il modo giusto di fallire per un documento
 * legale, invece di far sparire una riga.
 */

type Blocco =
  | { tipo: 'titolo'; livello: 1 | 2 | 3; testo: string }
  | { tipo: 'paragrafo'; testo: string }
  | { tipo: 'citazione'; testo: string }
  | { tipo: 'elenco'; voci: string[]; numerato: boolean }
  | { tipo: 'riga' }
  | { tipo: 'tabella'; intestazioni: string[]; righe: string[][] };

/* ------------------------------------------------------------------ *
 *  Analisi: da testo a blocchi
 * ------------------------------------------------------------------ */

function celle(riga: string): string[] {
  return riga
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/** Una riga tipo `|---|:--:|` non è dati: è il separatore di intestazione. */
function eSeparatore(riga: string): boolean {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(riga) && riga.includes('-');
}

export function analizza(testo: string): Blocco[] {
  const righe = testo.replace(/\r\n/g, '\n').split('\n');
  const blocchi: Blocco[] = [];
  let i = 0;

  while (i < righe.length) {
    const riga = righe[i];

    if (!riga.trim()) {
      i++;
      continue;
    }

    /* riga orizzontale */
    if (/^-{3,}$/.test(riga.trim())) {
      blocchi.push({ tipo: 'riga' });
      i++;
      continue;
    }

    /* titolo */
    const t = riga.match(/^(#{1,6})\s+(.*)$/);
    if (t) {
      const livello = Math.min(t[1].length, 3) as 1 | 2 | 3;
      blocchi.push({ tipo: 'titolo', livello, testo: t[2].trim() });
      i++;
      continue;
    }

    /* tabella: la riga corrente e la successiva devono essere una coppia
       intestazione + separatore, altrimenti è un paragrafo che comincia per «|» */
    if (riga.trim().startsWith('|') && i + 1 < righe.length && eSeparatore(righe[i + 1])) {
      const intestazioni = celle(riga);
      i += 2;
      const dati: string[][] = [];
      while (i < righe.length && righe[i].trim().startsWith('|')) {
        dati.push(celle(righe[i]));
        i++;
      }
      blocchi.push({ tipo: 'tabella', intestazioni, righe: dati });
      continue;
    }

    /* elenco (puntato o numerato): si raccoglie finché le righe continuano */
    const puntato = /^\s*[-*]\s+/.test(riga);
    const numerato = /^\s*\d+\.\s+/.test(riga);
    if (puntato || numerato) {
      const voci: string[] = [];
      while (i < righe.length) {
        const r = righe[i];
        const m = numerato ? r.match(/^\s*\d+\.\s+(.*)$/) : r.match(/^\s*[-*]\s+(.*)$/);
        if (!m) break;
        voci.push(m[1].trim());
        i++;
      }
      blocchi.push({ tipo: 'elenco', voci, numerato });
      continue;
    }

    /* citazione */
    if (riga.trim().startsWith('>')) {
      const parti: string[] = [];
      while (i < righe.length && righe[i].trim().startsWith('>')) {
        parti.push(righe[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocchi.push({ tipo: 'citazione', testo: parti.join(' ').trim() });
      continue;
    }

    /* paragrafo: righe consecutive non vuote che non aprono altro */
    const parti: string[] = [];
    while (i < righe.length) {
      const r = righe[i];
      if (
        !r.trim() ||
        /^(#{1,6})\s/.test(r) ||
        r.trim().startsWith('|') ||
        r.trim().startsWith('>') ||
        /^\s*[-*]\s+/.test(r) ||
        /^\s*\d+\.\s+/.test(r) ||
        /^-{3,}$/.test(r.trim())
      ) {
        break;
      }
      parti.push(r.trim());
      i++;
    }
    if (parti.length) blocchi.push({ tipo: 'paragrafo', testo: parti.join(' ') });
  }

  return blocchi;
}

/* ------------------------------------------------------------------ *
 *  Resa in linea: grassetto, corsivo, codice, collegamenti
 * ------------------------------------------------------------------ */

/**
 * ⚠️ L'ordine delle alternative conta: `[testo](url)` va cercato **prima** del
 * corsivo, altrimenti un `*` dentro un'etichetta spezza il collegamento a metà.
 */
const IN_LINEA = String.raw`(\[[^\]\n]+\]\([^)\s]+\))|(\*\*[^*\n]+\*\*)|(\x60[^\x60\n]+\x60)|(\*[^*\n]+\*)`;

function inLinea(testo: string, chiave: string): React.ReactNode[] {
  const nodi: React.ReactNode[] = [];
  let ultimo = 0;
  let n = 0;
  let m: RegExpExecArray | null;

  // 🔴 **Una regex nuova a ogni chiamata, non una condivisa.** Con il flag `g`
  // l'oggetto porta `lastIndex` con sé: essendo `inLinea` ricorsiva, la chiamata
  // annidata lo azzererebbe **sotto** il ciclo di quella esterna, che
  // riprenderebbe da capo e duplicherebbe pezzi di testo. È lo stato nascosto
  // delle regex globali, e qui costerebbe un documento legale sbagliato.
  const re = new RegExp(IN_LINEA, 'g');
  while ((m = re.exec(testo)) !== null) {
    if (m.index > ultimo) nodi.push(testo.slice(ultimo, m.index));
    const pezzo = m[0];
    const k = `${chiave}-${n++}`;

    if (pezzo.startsWith('[')) {
      const l = pezzo.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)!;
      const url = l[2];
      // Un collegamento a un altro documento (`privacy-policy.md`) non è
      // apribile: si mostra il testo senza fingere che sia premibile.
      const esterno = /^(https?:|mailto:|tel:)/.test(url);
      nodi.push(
        esterno ? (
          <Text
            key={k}
            className="text-base text-primary underline"
            onPress={() => Linking.openURL(url).catch(() => {})}>
            {l[1]}
          </Text>
        ) : (
          <Text key={k} className="text-base text-foreground">
            {l[1]}
          </Text>
        )
      );
    } else if (pezzo.startsWith('**')) {
      // ⚠️ **Ricorsivo, e non è pedanteria**: il grassetto contiene spesso altro
      // markup — `**Version `app-1.0` — last updated…**` è la prima riga di due
      // documenti su due. Senza ricorsione i backtick restavano stampati a
      // schermo, cioè un documento legale che mostra la sua stessa sintassi.
      nodi.push(
        <Text key={k} className="text-base font-semibold text-foreground">
          {inLinea(pezzo.slice(2, -2), `${k}-b`)}
        </Text>
      );
    } else if (pezzo.startsWith('`')) {
      nodi.push(
        <Text key={k} className="text-sm text-muted-foreground">
          {pezzo.slice(1, -1)}
        </Text>
      );
    } else {
      nodi.push(
        <Text key={k} className="text-base italic text-foreground">
          {inLinea(pezzo.slice(1, -1), `${k}-i`)}
        </Text>
      );
    }
    ultimo = m.index + pezzo.length;
  }

  if (ultimo < testo.length) nodi.push(testo.slice(ultimo));
  return nodi;
}

/* ------------------------------------------------------------------ *
 *  Resa dei blocchi
 * ------------------------------------------------------------------ */

function Tabella({ intestazioni, righe }: { intestazioni: string[]; righe: string[][] }) {
  return (
    <View className="gap-3">
      {righe.map((riga, r) => (
        <View key={`r-${r}`} className="gap-2 rounded-2xl border border-border bg-card/60 p-4">
          {riga.map((cella, c) => {
            if (!cella) return null;
            const etichetta = intestazioni[c]?.replace(/\*/g, '').trim();
            return (
              <View key={`c-${c}`} className="gap-0.5">
                {/* Un'intestazione vuota esiste davvero in questi documenti (la
                    prima colonna della tabella «cosa legge dal dispositivo»):
                    in quel caso la cella è il titolo del blocchetto, non un
                    valore senza nome. */}
                {etichetta ? (
                  <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                    {etichetta}
                  </Text>
                ) : null}
                <Text className="text-base text-foreground">{inLinea(cella, `t-${r}-${c}`)}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function Markdown({ testo }: { testo: string }) {
  const blocchi = React.useMemo(() => analizza(testo), [testo]);

  return (
    <View className="gap-4">
      {blocchi.map((b, i) => {
        switch (b.tipo) {
          case 'titolo':
            return (
              <Text
                key={i}
                className={
                  b.livello === 1
                    ? 'mt-2 font-serif-bold text-2xl text-foreground'
                    : b.livello === 2
                      ? 'mt-4 font-serif-bold text-xl text-foreground'
                      : 'mt-2 text-base font-semibold text-foreground'
                }>
                {b.testo.replace(/\*/g, '')}
              </Text>
            );

          case 'paragrafo':
            return (
              <Text key={i} className="text-base leading-6 text-foreground">
                {inLinea(b.testo, `p-${i}`)}
              </Text>
            );

          case 'citazione':
            return (
              <View key={i} className="border-l-2 border-border pl-3">
                <Text className="text-base leading-6 text-muted-foreground">
                  {inLinea(b.testo, `q-${i}`)}
                </Text>
              </View>
            );

          case 'elenco':
            return (
              <View key={i} className="gap-2 pl-1">
                {b.voci.map((v, j) => (
                  <View key={j} className="flex-row gap-2">
                    <Text className="text-base text-muted-foreground">
                      {b.numerato ? `${j + 1}.` : '•'}
                    </Text>
                    <Text className="flex-1 text-base leading-6 text-foreground">
                      {inLinea(v, `l-${i}-${j}`)}
                    </Text>
                  </View>
                ))}
              </View>
            );

          case 'riga':
            return <View key={i} className="h-px bg-border" />;

          case 'tabella':
            return <Tabella key={i} intestazioni={b.intestazioni} righe={b.righe} />;
        }
      })}
    </View>
  );
}
