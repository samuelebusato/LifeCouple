/**
 * Fotografie per l'account demo del revisore.
 *
 * ⚠️ NON sono fotografie: sono quattro illustrazioni generate qui, a piena
 * risoluzione. La ragione per cui esistono e' che il revisore apre una galleria
 * condivisa, e una galleria vuota — o piena di riquadri da 1 pixel — si legge
 * come un'app incompleta (App Store Review Guideline 2.1).
 *
 * 🔑 Restano meglio le foto vere caricate dall'app: questo e' il ripiego che
 * regge da solo, non il risultato migliore possibile.
 *
 * 🔑 E sono *illustrazioni*, non sfumature: quattro rettangoli sfumati
 * riempiono la galleria ma continuano a leggersi come segnaposto, che e'
 * esattamente il problema da cui si parte. Un orizzonte con un sole sopra si
 * legge come una cosa voluta.
 *
 * Perche' PNG e non JPEG: il bucket «foto» accetta image/png (migrazione 0009),
 * e un PNG si scrive con zlib, che sta nella libreria standard. Un JPEG
 * richiederebbe un encoder — cioe' una dipendenza — per un guadagno nullo.
 */

import { deflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
// Importato invece che dato per globale. ⚠️ `npm run lint` lo accetterebbe
// anche nudo — ma `npx eslint <file>`, che e' come lo si chiama quando si
// controlla un file solo, lo segnala come `no-undef`. Importarlo toglie la
// divergenza invece di doverla ricordare.
import { Buffer } from 'node:buffer';

// --- PNG: il minimo che serve, scritto a mano -------------------------------

const TABELLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABELLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function blocco(tipo, dati) {
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dati]);
  const testa = Buffer.alloc(4);
  testa.writeUInt32BE(dati.length, 0);
  const coda = Buffer.alloc(4);
  coda.writeUInt32BE(crc32(corpo), 0);
  return Buffer.concat([testa, corpo, coda]);
}

/** Codifica RGB a 8 bit, senza interlacciamento, filtro 0 su ogni riga. */
function png(larghezza, altezza, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(larghezza, 0);
  ihdr.writeUInt32BE(altezza, 4);
  ihdr[8] = 8; // bit per canale
  ihdr[9] = 2; // colore vero (RGB)

  // Ogni riga va preceduta dal byte di filtro. Righe intere, non pixel: e' il
  // formato a volerlo, e sbagliarlo produce un file che si apre storto invece
  // di non aprirsi — il tipo di errore che si nota tardi.
  const passo = larghezza * 3;
  const grezzo = Buffer.alloc((passo + 1) * altezza);
  for (let y = 0; y < altezza; y++) {
    grezzo[y * (passo + 1)] = 0;
    rgb.copy(grezzo, y * (passo + 1) + 1, y * passo, (y + 1) * passo);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    blocco('IHDR', ihdr),
    blocco('IDAT', deflateSync(grezzo, { level: 9 })),
    blocco('IEND', Buffer.alloc(0)),
  ]);
}

// --- Una tela su cui disegnare ----------------------------------------------

/** Generatore deterministico: le stesse quattro immagini a ogni esecuzione. */
function caso(seme) {
  let s = seme >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const morbido = (b, x) => {
  // Transizione liscia fra 0 e 1 fra i due bordi: e' cio' che tiene i contorni
  // dei dischi senza scalini, e uno scalino su un cerchio grande si vede.
  const t = Math.min(1, Math.max(0, (x - b[0]) / (b[1] - b[0])));
  return t * t * (3 - 2 * t);
};

class Tela {
  constructor(larghezza, altezza) {
    this.w = larghezza;
    this.h = altezza;
    this.p = new Float32Array(larghezza * altezza * 3);
  }

  /** Sfumatura verticale, dal colore in alto a quello in basso. */
  cielo(alto, basso) {
    for (let y = 0; y < this.h; y++) {
      // Non lineare: il colore dell'orizzonte occupa piu' spazio in basso, come
      // accade davvero al tramonto.
      const t = Math.pow(y / (this.h - 1), 1.6);
      for (let x = 0; x < this.w; x++) {
        const i = (y * this.w + x) * 3;
        this.p[i] = alto[0] + (basso[0] - alto[0]) * t;
        this.p[i + 1] = alto[1] + (basso[1] - alto[1]) * t;
        this.p[i + 2] = alto[2] + (basso[2] - alto[2]) * t;
      }
    }
  }

  fondi(x, y, colore, alfa) {
    if (alfa <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    const a = alfa > 1 ? 1 : alfa;
    this.p[i] += (colore[0] - this.p[i]) * a;
    this.p[i + 1] += (colore[1] - this.p[i + 1]) * a;
    this.p[i + 2] += (colore[2] - this.p[i + 2]) * a;
  }

  /** Disco pieno con bordo morbido. */
  disco(cx, cy, r, colore, alfa = 1) {
    const x0 = Math.max(0, (cx - r - 2) | 0);
    const x1 = Math.min(this.w - 1, (cx + r + 2) | 0);
    const y0 = Math.max(0, (cy - r - 2) | 0);
    const y1 = Math.min(this.h - 1, (cy + r + 2) | 0);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - cx, y - cy);
        this.fondi(x, y, colore, alfa * (1 - morbido([r - 1.5, r + 1.5], d)));
      }
    }
  }

  /**
   * Falce: il disco pieno meno un secondo disco spostato.
   * 🔑 Si disegna per sottrazione di *copertura*, non ricoprendo con un colore
   * di cielo scelto a mano: il cielo e' una sfumatura, quindi un colore fisso
   * lascia un disco scuro visibile sopra la luna invece di una falce.
   */
  falce(cx, cy, r, scartoX, scartoY, rMorso, colore) {
    const x0 = Math.max(0, (cx - r - 2) | 0);
    const x1 = Math.min(this.w - 1, (cx + r + 2) | 0);
    const y0 = Math.max(0, (cy - r - 2) | 0);
    const y1 = Math.min(this.h - 1, (cy + r + 2) | 0);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dentro = 1 - morbido([r - 1.5, r + 1.5], Math.hypot(x - cx, y - cy));
        const morso = 1 - morbido([rMorso - 1.5, rMorso + 1.5], Math.hypot(x - cx - scartoX, y - cy - scartoY));
        this.fondi(x, y, colore, dentro * (1 - morso));
      }
    }
  }

  /** Alone: cade con il quadrato della distanza. E' cio' che da' luce a un sole. */
  alone(cx, cy, r, colore, forza) {
    const x0 = Math.max(0, (cx - r * 3) | 0);
    const x1 = Math.min(this.w - 1, (cx + r * 3) | 0);
    const y0 = Math.max(0, (cy - r * 3) | 0);
    const y1 = Math.min(this.h - 1, (cy + r * 3) | 0);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - cx, y - cy) / r;
        this.fondi(x, y, colore, forza * Math.exp(-d * d * 0.7));
      }
    }
  }

  /** Silhouette: tutto cio' che sta sotto il profilo, per ogni colonna. */
  profilo(altezzaDi, colore) {
    for (let x = 0; x < this.w; x++) {
      const yh = altezzaDi(x);
      for (let y = Math.max(0, yh | 0); y < this.h; y++) {
        this.fondi(x, y, colore, y < yh + 1 ? 1 - (yh - Math.floor(yh)) : 1);
      }
    }
  }

  rettangolo(x0, y0, larghezza, altezza, colore) {
    for (let y = Math.max(0, y0 | 0); y < Math.min(this.h, y0 + altezza); y++)
      for (let x = Math.max(0, x0 | 0); x < Math.min(this.w, x0 + larghezza); x++)
        this.fondi(x, y, colore, 1);
  }

  /** Riflesso verticale sull'acqua: ricopia il cielo sfocandolo e schiarendolo. */
  riflesso(yOrizzonte, forza) {
    for (let y = yOrizzonte; y < this.h; y++) {
      const src = Math.max(0, (yOrizzonte - (y - yOrizzonte) * 0.85) | 0);
      const f = forza * (1 - (y - yOrizzonte) / (this.h - yOrizzonte)) * 0.9;
      for (let x = 0; x < this.w; x++) {
        const i = (y * this.w + x) * 3;
        const j = (src * this.w + x) * 3;
        this.p[i] += (this.p[j] - this.p[i]) * f;
        this.p[i + 1] += (this.p[j + 1] - this.p[i + 1]) * f;
        this.p[i + 2] += (this.p[j + 2] - this.p[i + 2]) * f;
      }
    }
  }

  /**
   * Quantizza a 8 bit con un disturbo di mezzo livello. Senza, una sfumatura
   * liscia mostra le bande — e una banda si legge come un difetto di
   * compressione, non come una scelta.
   */
  versa() {
    const rgb = Buffer.alloc(this.w * this.h * 3);
    const r = caso(7);
    for (let i = 0; i < rgb.length; i++) {
      const v = this.p[i] + (r() - 0.5) * 1.6;
      rgb[i] = v < 0 ? 0 : v > 255 ? 255 : v | 0;
    }
    return rgb;
  }
}

// --- Le quattro scene, nell'ordine degli eventi di `semina-demo.mjs` --------

/** «La prima cena insieme» — il tramonto caldo, con le colline e il mare. */
function cena(t) {
  const yo = t.h * 0.62;
  t.cielo([38, 16, 44], [246, 168, 92]);
  t.alone(t.w * 0.5, yo, t.h * 0.3, [255, 214, 150], 0.55);
  t.disco(t.w * 0.5, yo - t.h * 0.05, t.h * 0.075, [255, 233, 190]);
  t.riflesso(yo | 0, 0.55);
  t.profilo((x) => yo + Math.sin(x / t.w * 3.1) * t.h * 0.012, [58, 24, 40]);
  t.profilo(
    (x) => t.h * 0.84 + Math.sin(x / t.w * 5.4 + 1.2) * t.h * 0.02,
    [30, 12, 24]
  );
}

/** «Weekend a Bologna» — i portici, il cotto, e le due torri. */
function bologna(t) {
  const yo = t.h * 0.72;
  t.cielo([120, 48, 62], [244, 196, 138]);
  t.alone(t.w * 0.26, yo - t.h * 0.06, t.h * 0.26, [255, 206, 150], 0.5);
  t.disco(t.w * 0.26, yo - t.h * 0.08, t.h * 0.06, [255, 236, 200]);

  const tetti = [30, 12, 20];
  // I tetti: un profilo a gradini, cosi' la citta' si legge come citta'.
  const r = caso(31);
  const gradini = [];
  for (let x = 0; x < t.w; ) {
    const largo = 40 + r() * 90;
    gradini.push([x, largo, yo + (0.02 + r() * 0.07) * t.h]);
    x += largo;
  }
  t.profilo((x) => {
    for (const [gx, gl, gy] of gradini) if (x >= gx && x < gx + gl) return gy;
    return yo + t.h * 0.05;
  }, tetti);

  // Le due torri, una piu' alta e una che pende: sono il segno della citta'.
  // ⚠️ Entrambe scendono sotto il tetto piu' alto (yo + 0.09h): una torre che
  // finisce sopra la linea dei tetti galleggia, e si vede subito.
  const piede = yo + t.h * 0.12;
  t.rettangolo(t.w * 0.62, yo - t.h * 0.2, t.w * 0.035, piede - (yo - t.h * 0.2), tetti);
  for (let k = 0; k < t.h * 0.3; k++)
    t.rettangolo(t.w * 0.7 + k * 0.045, piede - k, t.w * 0.028, 2, tetti);
}

/** «Cinema, poi gelato» — la sera blu, la luna e le stelle. */
function cinema(t) {
  t.cielo([10, 14, 46], [104, 64, 124]);
  const r = caso(97);
  for (let i = 0; i < 160; i++) {
    const x = r() * t.w;
    const y = r() * t.h * 0.66;
    const b = 0.3 + r() * 0.7;
    t.disco(x, y, 1 + r() * 1.8, [255, 250, 235], b * (1 - y / t.h));
  }
  const lx = t.w * 0.68;
  const ly = t.h * 0.2;
  const lr = t.h * 0.07;
  t.alone(lx, ly, lr * 2.4, [190, 190, 240], 0.28);
  t.falce(lx, ly, lr, lr * 0.5, -lr * 0.28, lr * 0.95, [246, 244, 226]);
  t.alone(t.w * 0.4, t.h * 0.92, t.h * 0.3, [228, 37, 158], 0.3);
  t.profilo(
    (x) => t.h * 0.82 + Math.sin(x / t.w * 4.2 + 0.7) * t.h * 0.03,
    [8, 10, 30]
  );
}

/** «Compleanno di lei» — il rosa dell'app, e i palloncini che salgono. */
function compleanno(t) {
  t.cielo([228, 37, 158], [255, 212, 170]);
  const r = caso(53);
  const colori = [
    [255, 244, 236],
    [255, 190, 120],
    [186, 60, 160],
    [255, 140, 170],
  ];
  for (let i = 0; i < 11; i++) {
    const x = t.w * (0.08 + r() * 0.84);
    const y = t.h * (0.1 + r() * 0.62);
    const rr = t.h * (0.026 + r() * 0.03);
    const c = colori[(r() * colori.length) | 0];
    // Il filo, prima del palloncino: cosi' resta dietro.
    for (let k = 0; k < t.h * 0.14; k++)
      t.fondi((x + Math.sin(k / 26) * 7) | 0, (y + rr + k) | 0, [140, 30, 96], 0.5);
    t.disco(x, y, rr, c);
    t.disco(x - rr * 0.3, y - rr * 0.35, rr * 0.26, [255, 255, 255], 0.45);
  }
  t.profilo(
    (x) => t.h * 0.88 + Math.sin(x / t.w * 3.6 + 2.1) * t.h * 0.015,
    [116, 22, 80]
  );
}

const SCENE = [cena, bologna, cinema, compleanno];

export const QUANTE = SCENE.length;

/** PNG verticale, proporzione da telefono. */
export function fotoDemo(indice, larghezza = 1080, altezza = 1440) {
  const t = new Tela(larghezza, altezza);
  SCENE[indice % SCENE.length](t);
  return png(larghezza, altezza, t.versa());
}

// Eseguito a mano (`node tools/foto-demo.mjs`) scrive i file su disco, cosi' si
// guardano prima di seminarli. Verificare guardando, non fidandosi.
// ⚠️ Il confronto passa da pathToFileURL: su Windows `process.argv[1]` e' un
// percorso con le barre rovesce e non combacia mai con un `file://` scritto a mano.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { writeFileSync } = await import('node:fs');
  for (let i = 0; i < QUANTE; i++) {
    const buf = fotoDemo(i);
    writeFileSync(`foto-demo-${i + 1}.png`, buf);
    console.log(`✅ foto-demo-${i + 1}.png — ${(buf.length / 1024).toFixed(0)} KB`);
  }
}
