#!/usr/bin/env python3
"""Genera i PNG della favicon dai tracciati dell'emblema di LifeCouple.

I fallback raster esistono perche' non tutti i browser caricano una favicon
SVG (Safari in particolare), e iOS vuole un apple-touch-icon PNG.

⚠️ La fonte dei tracciati resta `components/emblema.tsx`. Sono ricopiati qui
come punti di controllo perche' PIL non legge SVG: se l'emblema cambia,
vanno cambiati anche qui, e si rigenera con

    python tools/genera-favicon.py

Il file `landing/immagini/favicon.svg` porta gli stessi tracciati in forma
SVG ed e' la versione principale: questi PNG sono solo il ripiego.
"""

from PIL import Image, ImageDraw

# I tre tratti dell'emblema, gia' srotolati in cubiche di Bezier assolute
# (P0, C1, C2, P3) sul viewBox 0 0 100 100 di components/emblema.tsx.
CUORE_PIENO = [
    ((42, 78), (30, 68), (16, 58), (16, 42)),
    ((16, 42), (16, 33), (23, 26), (32, 26)),
    ((32, 26), (38, 26), (42, 29), (45, 34)),
]
CUORE_TENUE = [
    ((45, 34), (48, 29), (52, 26), (58, 26)),
    ((58, 26), (67, 26), (74, 33), (74, 42)),
    ((74, 42), (74, 58), (60, 68), (48, 78)),
]
INCONTRO = [((44, 42), (50, 48)), ((50, 48), (56, 42))]  # spezzata, non curva

ACCENTO = (228, 37, 158)   # --accento, da lib/tema.ts
TRATTO = (255, 255, 255)
SPESSORE = 9               # 3 nell'app: a 16 px un tratto da 3/100 sparisce
RAGGIO = 24                # angoli della tessera
SCALA = 8                  # supersampling, poi si riduce con LANCZOS


def punti_bezier(p0, c1, c2, p3, passi=60):
    for i in range(passi + 1):
        t = i / passi
        u = 1 - t
        yield (
            u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
        )


def traccia(disegno, segmenti, k, spessore, colore):
    """Disegna una spezzata spessa con capi e giunzioni tonde.

    Un cerchio in ogni punto campionato da' `stroke-linecap: round` e
    `stroke-linejoin: round` insieme, senza calcolare le normali."""
    r = spessore * k / 2
    for seg in segmenti:
        punti = list(punti_bezier(*seg)) if len(seg) == 4 else list(seg)
        scalati = [(x * k, y * k) for x, y in punti]
        disegno.line(scalati, fill=colore, width=int(spessore * k))
        for x, y in scalati:
            disegno.ellipse([x - r, y - r, x + r, y + r], fill=colore)


def genera(lato):
    k = SCALA
    grande = lato * k
    img = Image.new('RGBA', (grande, grande), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, grande - 1, grande - 1], radius=RAGGIO * k * lato / 100,
                        fill=ACCENTO + (255,))

    scala = grande / 100  # dal viewBox 100x100 ai pixel
    traccia(d, CUORE_PIENO, scala, SPESSORE, TRATTO + (255,))
    traccia(d, INCONTRO, scala, SPESSORE, TRATTO + (255,))

    # Il secondo cuore ha opacity .62: su un livello a parte, poi composto.
    velo = Image.new('RGBA', (grande, grande), (0, 0, 0, 0))
    traccia(ImageDraw.Draw(velo), CUORE_TENUE, scala, SPESSORE, TRATTO + (158,))
    img = Image.alpha_composite(img, velo)

    return img.resize((lato, lato), Image.LANCZOS)


if __name__ == '__main__':
    for lato, nome in [(180, 'apple-touch-icon.png'), (32, 'favicon-32.png')]:
        percorso = 'landing/immagini/' + nome
        genera(lato).save(percorso, optimize=True)
        print('  scritto %s (%dx%d)' % (percorso, lato, lato))
