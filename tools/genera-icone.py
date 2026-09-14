#!/usr/bin/env python3
"""Genera le icone dell'app dai tracciati dell'emblema di LifeCouple.

Sostituisce il chevron blu del template Expo, che era ancora l'icona
dichiarata in `app.json` per iOS, Android e web (voce bloccante del backlog,
aperta dal 2026-09-10). Decisione dell'utente del 2026-09-14: **l'icona e' il
cuore dell'onboarding**, cioe' l'emblema di `components/emblema.tsx`, lo stesso
che si vede in `benvenuto.tsx`, `onboarding.tsx` e `home.tsx`.

    python tools/genera-icone.py

## Da dove vengono i tracciati

⚠️ **Non sono ricopiati qui.** `tools/genera-favicon.py` li porta gia' srotolati
in cubiche di Bezier, e questo file li **importa** da li': una terza copia
dell'emblema sarebbe esattamente cio' che quel file avverte di non fare. La
fonte resta `components/emblema.tsx`; se cambia, si cambia genera-favicon.py e
si rigenera tutto.

## Le scelte, e perche'

- **Tessera piena con emblema bianco**, non line-art rosa su trasparente. Un
  tratto sottile su fondo trasparente sparisce sulla schermata di casa, chiara
  o scura che sia. E' la stessa ragione per cui la favicon della landing e' una
  tessera, scritta nel suo SVG.
- **`icon.png` e' OPACA e senza angoli arrotondati.** iOS rifiuta un'icona con
  canale alfa, e la maschera degli angoli la applica il sistema: arrotondarla
  qui darebbe un bordo doppio.
- **Il tratto e' 7, non 3 come nell'app ne' 9 come la favicon.** A 3/100 su
  un'icona da 60 pt il tratto vale ~5 px e regge, ma l'emblema perde peso in
  mezzo alle altre icone; 9 e' tarato per i 16 px del browser e qui ingrassa.
- **Android tiene l'arte al 46% della tela**, non al 66% della zona sicura: la
  maschera adattiva ritaglia, e il parallasse muove il primo piano sul fondo.
  Riempire la zona sicura fino al bordo fa toccare il taglio quando l'icona si
  inclina.
"""

import importlib.util
from pathlib import Path
from PIL import Image, ImageDraw

RADICE = Path(__file__).resolve().parent.parent
DESTINAZIONE = RADICE / 'assets' / 'images'

# I tracciati vivono in genera-favicon.py: si importano, non si ricopiano.
_spec = importlib.util.spec_from_file_location('genera_favicon', RADICE / 'tools' / 'genera-favicon.py')
_fav = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_fav)

CUORE_PIENO, CUORE_TENUE, INCONTRO = _fav.CUORE_PIENO, _fav.CUORE_TENUE, _fav.INCONTRO
ACCENTO = _fav.ACCENTO           # (228, 37, 158) — --accento di lib/tema.ts
BIANCO = (255, 255, 255)
SPESSORE = 7
SCALA = 6                        # supersampling, poi riduzione LANCZOS
VELO = 158                       # opacity .62 del secondo cuore, in alfa

# Riquadro dei tracciati nel viewBox 0 0 100 100, senza spessore.
BBOX = (16.0, 26.0, 74.0, 78.0)


def _traccia(d, segmenti, scala, dx, dy, spessore, colore):
    """Come `traccia` di genera-favicon.py, ma con una traslazione: qui
    l'emblema va centrato dentro tele di proporzioni diverse."""
    r = spessore * scala / 2
    for seg in segmenti:
        punti = list(_fav.punti_bezier(*seg)) if len(seg) == 4 else list(seg)
        p = [(x * scala + dx, y * scala + dy) for x, y in punti]
        d.line(p, fill=colore, width=max(1, int(spessore * scala)))
        for x, y in p:
            d.ellipse([x - r, y - r, x + r, y + r], fill=colore)


def emblema(lato, frazione, colore, sfondo=None, raggio=None):
    """Una tela quadrata `lato` px con l'emblema al centro, largo `frazione`
    della tela. `sfondo=None` la lascia trasparente."""
    grande = lato * SCALA
    img = Image.new('RGBA', (grande, grande), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if sfondo is not None:
        if raggio:
            d.rounded_rectangle([0, 0, grande - 1, grande - 1],
                                radius=raggio * grande / 100, fill=sfondo + (255,))
        else:
            d.rectangle([0, 0, grande - 1, grande - 1], fill=sfondo + (255,))

    # L'arte si adatta al suo riquadro vero, non al viewBox: l'emblema non
    # riempie il 100x100, e scalare il viewBox lo lascerebbe piccolo e storto.
    x0, y0, x1, y1 = BBOX
    largo, alto = (x1 - x0) + SPESSORE, (y1 - y0) + SPESSORE
    scala = grande * frazione / max(largo, alto)
    dx = (grande - (x0 + x1) * scala) / 2
    dy = (grande - (y0 + y1) * scala) / 2

    _traccia(d, CUORE_PIENO, scala, dx, dy, SPESSORE, colore + (255,))
    _traccia(d, INCONTRO, scala, dx, dy, SPESSORE, colore + (255,))

    velo = Image.new('RGBA', (grande, grande), (0, 0, 0, 0))
    _traccia(ImageDraw.Draw(velo), CUORE_TENUE, scala, dx, dy, SPESSORE, colore + (VELO,))
    img = Image.alpha_composite(img, velo)

    return img.resize((lato, lato), Image.LANCZOS)


def scrivi(img, nome, opaca=False):
    percorso = DESTINAZIONE / nome
    if opaca:
        # iOS rifiuta il canale alfa: si appiattisce su bianco, che comunque
        # non si vede perche' lo sfondo copre tutta la tela.
        fondo = Image.new('RGB', img.size, (255, 255, 255))
        fondo.paste(img, mask=img.split()[3])
        img = fondo
    img.save(percorso, optimize=True)
    print('  scritto %-34s %dx%d%s' % (nome, img.size[0], img.size[1], '  (opaca)' if opaca else ''))


if __name__ == '__main__':
    print('Icone di LifeCouple — dall\'emblema dell\'onboarding\n')

    # iOS + store: opaca, angoli al sistema.
    scrivi(emblema(1024, 0.58, BIANCO, sfondo=ACCENTO), 'icon.png', opaca=True)

    # Web: piccola, quindi tessera con angoli propri come la favicon della landing.
    scrivi(emblema(48, 0.60, BIANCO, sfondo=ACCENTO, raggio=24), 'favicon.png')

    # Android adattiva: primo piano trasparente sul fondo pieno.
    scrivi(emblema(1024, 0.46, BIANCO), 'android-icon-foreground.png')
    scrivi(emblema(1024, 0.0, BIANCO, sfondo=ACCENTO), 'android-icon-background.png')
    # Monocromatica (tema Material You): il sistema la ricolora, il colore qui
    # e' solo la forma. Bianco perche' l'alfa e' cio' che conta.
    scrivi(emblema(1024, 0.46, BIANCO), 'android-icon-monochrome.png')

    # Splash: fondo bianco o nero secondo il tema, quindi l'emblema resta
    # nell'accento — che regge su entrambi — e non diventa bianco.
    scrivi(emblema(512, 0.72, ACCENTO), 'splash-icon.png')

    print('\nFatto. Ricorda che in Expo Go l\'icona mostrata resta quella di Expo Go:')
    print('si vedono solo in una development build o in una build di store.')
