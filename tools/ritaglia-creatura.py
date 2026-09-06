#!/usr/bin/env python3
"""
ritaglia-creatura.py — dal PNG generato all'asset dell'app.

Prende le immagini della creatura come escono dal modello (sticker su fondo
lavanda piatto) e produce i file che l'app importa: PNG con alpha, 768x768,
fondo tolto, **bordo bianco fustellato conservato**.

    python tools/ritaglia-creatura.py assets/mascotte/grezze/*.png
    python tools/ritaglia-creatura.py --dentro assets/mascotte/grezze

Le decisioni collegate stanno in History.md: D-95 (la lontra e' la creatura),
D-102 (tre umori), D-103 (strada raster). Il formato di uscita e' in
docs/mascotte.md §2bis; l'ordine di produzione in §5bis.


## Perche' Python e non uno script Node come tests/*.mjs

Il progetto scrive gli script in .mjs, e questo diverge. La ragione: Pillow e
numpy sono **gia' installati** sulla macchina, mentre in Node servirebbe
`sharp` — un pacchetto con binari nativi, da aggiornare a ogni SDK e da
reinstallare a ogni cambio di piattaforma. Aggiungere una dipendenza nativa al
progetto per un lavoro d'asset **una tantum su nove file** e' un costo
permanente per un beneficio che finisce oggi.

⚠️ Questo script non e' parte dell'app: non viene importato, non finisce nel
bundle, non gira in CI. E' un attrezzo, e sta in tools/ per quello.


## 🔑 Perche' un riempimento dai bordi e non una sostituzione di colore

La strada ovvia e' "rendi trasparente tutto cio' che e' lavanda". **Non
funziona**, e i numeri sono stati misurati il 2026-09-06, non stimati.
Distanze euclidee in RGB dal lavanda (#A98CF0), su un massimo di 442:

    sasso  77   rosa 103   crema 125   bianco 144   oro 190   navy 232

Il **sasso di fiume** (#9AA3A8) e' di gran lunga il colore piu' vicino al
fondo, ed e' un tratto d'identita' del personaggio (docs/mascotte.md §1) che
sta al centro dell'immagine. Ora si guardi la frangia antialiasata fra il
lavanda e il bordo bianco:

    un pixel di frangia al 50% dista  72  ->  finestra utile 72..77 = 5 unita
    un pixel di frangia al 70% dista 101  ->  finestra INESISTENTE (101 > 77)

🔴 Cioe': per togliere la meta' piu' chiara della frangia bisognerebbe centrare
una finestra di **5 unita' su 442**, e per toglierla tutta non c'e' nessuna
tolleranza che funzioni — il sasso cede prima. Una sostituzione di colore non
e' "meno precisa" qui: e' **impossibile**.

Il riempimento dai bordi risolve la cosa cambiando la domanda: 🔑 **uno sfondo
non e' definito dal suo colore, e' definito dalla connessione.** Il lavanda del
fondo tocca il bordo dell'immagine; il sasso e' chiuso dentro il contorno navy
e non lo tocca. Quindi si puo' usare una tolleranza **alta** — che serve per
prendere tutta la frangia — senza nessun rischio per il sasso, perche' non e'
raggiungibile.

⚠️ E' la seconda volta che una regola scritta per lo stile ripaga altrove: il
fondo **piatto** era imposto perche' "appena si accenna un gradiente lo stile
sticker si sfalda" (docs/mascotte.md §6), e si scopre che e' anche cio' che
rende il riempimento prevedibile. Un fondo sfumato fermerebbe il riempimento a
meta' strada.

## Il bordo bianco e' il budget di tolleranza

L'utente ha deciso il 2026-09-06 che il **bordo bianco fustellato resta**. E'
spesso, quindi mangiargli 1-2 pixel col ritaglio non si vede — ed e' proprio
quel margine che permette di essere aggressivi sulla frangia invece di
lasciare un alone lavanda. Il bordo paga il ritaglio.
"""

import argparse
import glob
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Il fondo dei prompt (docs/mascotte.md §1). E' una lettura a occhio
# dell'immagine di riferimento, non il colore del file sorgente: se un giorno
# si avesse l'originale, va corretto qui e nei prompt insieme.
LAVANDA = (0xA9, 0x8C, 0xF0)

# Tolleranza del riempimento. Alta di proposito: la connessione protegge il
# sasso (vedi sopra), quindi qui si puo' essere generosi per prendere tutta la
# frangia antialiasata fra il lavanda e il bordo bianco.
SOGLIA = 90

# Ammorbidimento del taglio. Un riempimento produce un bordo netto al pixel,
# che dopo il rimpicciolimento diventa una scaletta visibile. 0.8 basta a
# toglierla senza sfocare il disegno: agisce **solo** sull'alpha, mai sui
# colori.
SFUMA = 0.8

LATO = 768  # docs/mascotte.md §2bis

# Sentinella per marcare il fondo: dev'essere un colore che nell'immagine non
# esiste. Il magenta pieno non e' in tavolozza e non e' ottenibile dalle
# sfumature dello sticker.
SENTINELLA = (0xFF, 0x00, 0xFF)


def ritaglia(percorso_in: str, cartella_out: str) -> bool:
    """Ritaglia un'immagine. Restituisce False se il risultato e' sospetto."""
    nome = os.path.basename(percorso_in)
    img = Image.open(percorso_in).convert("RGB")

    # Il riempimento parte dai **quattro** angoli, non da uno. Se il modello
    # avesse lasciato una leggera disomogeneita' nel fondo — cosa che i prompt
    # vietano ma che capita — partire da un angolo solo si fermerebbe a meta'.
    # Quattro semi coprono il caso senza costare niente.
    lavoro = img.copy()
    larghezza, altezza = lavoro.size
    angoli = [(0, 0), (larghezza - 1, 0), (0, altezza - 1), (larghezza - 1, altezza - 1)]
    for angolo in angoli:
        ImageDraw.floodfill(lavoro, angolo, SENTINELLA, thresh=SOGLIA)

    pixel = np.array(lavoro)
    fondo = np.all(pixel == np.array(SENTINELLA, dtype=pixel.dtype), axis=-1)

    quota = float(fondo.mean())

    alpha = Image.fromarray(np.where(fondo, 0, 255).astype(np.uint8), mode="L")
    alpha = alpha.filter(ImageFilter.GaussianBlur(SFUMA))

    # ⚠️ I colori vengono dall'immagine ORIGINALE, non da `lavoro`: quella ha
    # il magenta al posto del fondo, e i pixel semitrasparenti del bordo ne
    # porterebbero dentro il colore.
    fuori = img.copy()
    fuori.putalpha(alpha)
    fuori = fuori.resize((LATO, LATO), Image.LANCZOS)

    os.makedirs(cartella_out, exist_ok=True)
    destinazione = os.path.join(cartella_out, os.path.splitext(nome)[0] + ".png")
    fuori.save(destinazione, "PNG")

    # 🔑 Il controllo che vale: lo script dice quanto ha tolto. Uno sticker
    # centrato con margine generoso (i prompt lo chiedono) lascia fra il 25% e
    # l'80% di fondo. Fuori da quella forbice **qualcosa e' andato storto**, e
    # una riga di esito e' l'unico modo per accorgersene senza aprire i file
    # uno per uno.
    esito = 0.25 <= quota <= 0.80
    # ⚠️ Uscita in ASCII puro, senza emoji e senza accenti. Su una console
    # Windows a cp1252 un carattere fuori tavolozza fa fallire la stampa e lo
    # script muore DOPO aver scritto i file — cioe' nel modo peggiore, perche'
    # sembra rotto mentre il lavoro e' fatto. E' la stessa ragione per cui i
    # commenti delle migrazioni scrivono "perche'" e non "perché".
    marchio = "  ok    " if esito else "  ATTENTO "
    print(f"{marchio}{nome:<32} fondo tolto: {quota:6.1%}  ->  {destinazione}")
    if not esito:
        if quota < 0.25:
            print("          il fondo non e' stato riconosciuto: e' davvero piatto e lavanda?")
        else:
            print("          tolto troppo: il riempimento e' entrato nel personaggio.")
    return esito


def main() -> int:
    ap = argparse.ArgumentParser(description="Ritaglia le immagini della creatura.")
    ap.add_argument("file", nargs="*", help="i PNG generati, col fondo lavanda")
    ap.add_argument("--dentro", help="una cartella, invece di elencare i file")
    ap.add_argument(
        "--verso",
        default=os.path.join("assets", "creatura"),
        help="dove scrivere (default: assets/creatura)",
    )
    args = ap.parse_args()

    percorsi = list(args.file)
    if args.dentro:
        for est in ("*.png", "*.jpg", "*.jpeg", "*.webp"):
            percorsi += sorted(glob.glob(os.path.join(args.dentro, est)))
    # Su Windows la shell non espande i jolly: lo facciamo qui, o `*.png`
    # arriverebbe come stringa letterale e lo script direbbe "file non trovato"
    # su un file che esiste.
    espansi = []
    for p in percorsi:
        espansi += sorted(glob.glob(p)) if any(c in p for c in "*?[") else [p]

    if not espansi:
        ap.error("nessun file da ritagliare")

    tutti_ok = True
    for p in espansi:
        if not os.path.isfile(p):
            print(f"  ATTENTO {p}: non esiste")
            tutti_ok = False
            continue
        tutti_ok &= ritaglia(p, args.verso)

    print()
    print("  Il ritaglio NON e' il controllo d'identita': lentiggini, ciuffo,")
    print("  macchie sopra gli occhi, sasso e orecchie NUDE (D-105) vanno")
    print("  guardati a occhio, uno per uno - docs/mascotte.md sezione 8.")
    return 0 if tutti_ok else 1


if __name__ == "__main__":
    sys.exit(main())
