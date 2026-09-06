#!/usr/bin/env python3
"""
confronta-stadi.py — i tre stadi si distinguono davvero?

Misura la **sagoma** di ogni `creatura-<n>-quiete.png` gia' ritagliata e dice
se le tre sono distinguibili, invece di lasciarlo al giudizio a occhio.

    python tools/confronta-stadi.py

Nessun argomento: legge assets/creatura/. Va bene anche con due sole immagini,
cosi' si puo' tarare la terza sui numeri veri delle prime due invece che a
stima.


## Perche' esiste

**D-106** e' nato da un difetto che nessuno aveva visto: gli stadi 1 e 2 erano
progettati a 1:1,5 e 1:1,8, cioe' il 20% di scarto, e sarebbero stati due
disegni quasi identici. Se ne e' accorto l'utente guardando la prima immagine —
non un controllo, non una rilettura del documento, una persona che guarda.

🔑 Quel difetto era **misurabile**, ed e' rimasto invisibile per giorni perche'
non lo misurava nessuno. Questo script e' la risposta: rende il requisito di
D-106 (*«ogni transizione dev'essere inequivocabile»*) un numero che si legge in
due secondi, invece di un giudizio che si puo' rimandare.

⚠️ **Ma non decide al posto di una persona.** Dice se le sagome sono diverse,
non se sono *belle* ne' se il personaggio e' rimasto lo stesso: quello resta il
controllo d'identita' di docs/mascotte.md §8, che si fa a occhio.


## Cosa misura, e perche' NON il riquadro

Misura la **larghezza efficace**: `area opaca / altezza`, rapportata di nuovo
all'altezza. E' la traduzione di `cerchio -> pera -> colonna` (D-106): un cerchio
sta in alto, una colonna in basso.

🔴 **La prima versione usava il riquadro (larghezza/altezza) e sbagliava di
brutto.** Sullo stadio 3 dava uno scarto del **1,9%** rispetto allo stadio 2 —
cioe' «identici» — mentre le due immagini sono lontanissime. Il motivo: **il
riquadro misurava la coda.** L'adulta ha una coda lunga che sventaglia via dal
corpo, e quella allarga il riquadro senza allargare l'animale.

Con la larghezza efficace lo stesso confronto da' **19,8%**, e il primo
confronto passa da 18,2% a 23,8% — numeri che concordano con quello che si
vede. 🔑 *Un'area e' insensibile a un'appendice sottile; un riquadro no.* Il che
e' esattamente quello che serve su un animale che ha una coda.

⚠️ **E la lezione e' piu' grossa dello strumento**: la metrica sbagliata non
avrebbe prodotto un errore innocuo. Avrebbe fatto **rifare un'immagine giusta**,
perche' diceva «troppo simile» di due disegni evidentemente diversi. E' B-53
un'altra volta: *una misura che non concorda con cio' che si vede non e' un
dato, e' un secondo difetto da diagnosticare.*

Non misura il rapporto testa/corpo, che richiederebbe di sapere dove finisce la
testa — cioe' un giudizio, non una misura.

**La soglia e' un avviso, non un verdetto**, e il perche' e' importante. Alla
prima esecuzione vera (2026-09-06) gli stadi 1 e 2 hanno dato 0,86 e 0,71, cioe'
**18,2%** — sotto la soglia del 20% che avevo scelto — mentre le due immagini
sono in realta' distinguibilissime. 🔑 **Il difetto era nella metrica, non nei
disegni**: il rapporto d'aspetto non vede il **ciuccio** ne' il **cappellino**,
che a colpo d'occhio fanno la maggior parte del lavoro.

⚠️ Quindi questo script **segnala e non boccia**, e dichiara sempre cosa non
sta guardando. *Uno strumento che da' falsi allarmi insegna a ignorarlo, ed e'
peggio che non averlo* — la stessa lezione di B-53, dove due correzioni furono
consegnate sulla base di una misura che non concordava con cio' che si vedeva.
"""

import os
import sys

import numpy as np
from PIL import Image

CARTELLA = os.path.join("assets", "creatura")
NOMI = {1: "cucciolo (cerchio)", 2: "giovane (pera)", 3: "adulta (colonna)"}

# Sotto questo scarto vale la pena guardare due volte. NON e' una bocciatura:
# la sagoma e' un segnale su tre, gli altri due sono il marcatore d'eta' e la
# posa, che questo script non vede.
SCARTO_ATTENZIONE = 0.15


# ⟳ Soglia RITIRATA il 2026-09-06 con D-112. Serviva alla dissolvenza
# incrociata, che e' stata abbandonata: il modello sa o tenere la composizione o
# cambiare l'espressione, non tutt'e due, e nessun prompt lo sposta (79% e
# 84% dopo allineamento; due tentativi identici fra loro al 99,96%).
#
# Il numero resta STAMPATO perche' e' informativo — dice quanto "salta" il
# cambio d'umore, e quindi quanta schiacciata serve a mascherarlo — ma non e'
# piu' un requisito e non boccia niente.
SOVRAPPOSIZIONE_MINIMA = 0.95


def maschera(percorso):
    a = np.array(Image.open(percorso).convert("RGBA"))
    return a[:, :, 3] > 128


def sovrapposizione(m1, m2):
    """Intersezione su unione: 1,0 = sagome identiche, 0 = nessun contatto."""
    unione = np.logical_or(m1, m2).sum()
    if unione == 0:
        return 0.0
    return float(np.logical_and(m1, m2).sum()) / float(unione)


def sagoma(percorso):
    """Riquadro, area, e larghezza EFFICACE rapportata all'altezza."""
    a = np.array(Image.open(percorso).convert("RGBA"))
    # >128 e non >0: la frangia semitrasparente del ritaglio non fa parte
    # della sagoma, e contarla gonfierebbe la misura di qualche pixel.
    op = a[:, :, 3] > 128
    ys, xs = np.where(op)
    if len(ys) == 0:
        return None
    larghezza = xs.max() - xs.min() + 1
    altezza = ys.max() - ys.min() + 1
    area = int(op.sum())
    # area/altezza = quanto sarebbe larga la sagoma se fosse un rettangolo
    # della stessa area e altezza. Una coda sottile pesa quasi nulla.
    return larghezza, altezza, area, (area / altezza) / altezza


def main():
    trovati = {}
    for n in (1, 2, 3):
        p = os.path.join(CARTELLA, "creatura-{}-quiete.png".format(n))
        if os.path.isfile(p):
            trovati[n] = sagoma(p)

    if not trovati:
        print("nessun creatura-<n>-quiete.png in {}".format(CARTELLA))
        return 1

    print("SAGOME  (la colonna che conta e' l'ultima: il riquadro e' solo indicativo,")
    print("         perche' su un animale con la coda misura la coda)")
    for n, (w, h, area, eff) in sorted(trovati.items()):
        print("  stadio {}  {:<20} {:>4}x{:<5}  riquadro {:.2f}   LARGHEZZA EFFICACE {:.3f}".format(
            n, NOMI[n], w, h, w / h, eff))

    print()
    print("SCARTI FRA STADI CONSECUTIVI (sotto il {:.0%} vale la pena guardare)".format(
        SCARTO_ATTENZIONE))
    for a, b in ((1, 2), (2, 3)):
        if a not in trovati or b not in trovati:
            print("  {} -> {}: manca uno dei due, non valutabile".format(a, b))
            continue
        ra, rb = trovati[a][3], trovati[b][3]
        scarto = abs(ra - rb) / max(ra, rb)
        nota = "ok" if scarto >= SCARTO_ATTENZIONE else "da guardare due volte"
        print("  {} -> {}: {:.3f} -> {:.3f}   scarto {:>5.1%}   {}".format(
            a, b, ra, rb, scarto, nota))

    if 3 not in trovati and 2 in trovati:
        r2 = trovati[2][3]
        print()
        print("  Per lo stadio 3, partendo da {:.3f}: <= {:.3f} per uno scarto del 20%".format(
            r2, r2 * 0.80))

    # -------------------------------------------------------------------------
    # Gli UMORI: la domanda opposta. Gli stadi devono DIFFERIRE, gli umori dello
    # stesso stadio devono COINCIDERE — e' il requisito su cui si regge la
    # dissolvenza incrociata di D-103.
    # -------------------------------------------------------------------------
    umori = []
    for n in (1, 2, 3):
        base = os.path.join(CARTELLA, "creatura-{}-quiete.png".format(n))
        if not os.path.isfile(base):
            continue
        mq = maschera(base)
        for u in ("festa", "sonno"):
            p = os.path.join(CARTELLA, "creatura-{}-{}.png".format(n, u))
            if os.path.isfile(p):
                umori.append((n, u, sovrapposizione(mq, maschera(p))))

    if umori:
        print()
        print("SOVRAPPOSIZIONE DEGLI UMORI COL PROPRIO `quiete` (informativa, D-112)")
        print("  NON e' piu' un requisito: la dissolvenza incrociata e' stata")
        print("  abbandonata. Il numero dice quanto salta il cambio d'umore, cioe'")
        print("  quanta schiacciata serve a mascherarlo.")
        for n, u, iou in umori:
            print("  stadio {} · quiete -> {:<6} {:>5.1%}".format(n, u, iou))

        # festa <-> sonno: i due umori nascono dallo stesso tipo di passaggio,
        # quindi dovrebbero cadere nella stessa composizione. E' la transizione
        # su cui la schiacciata serve MENO, se l'ipotesi regge.
        for n in (1, 2, 3):
            pf = os.path.join(CARTELLA, "creatura-{}-festa.png".format(n))
            ps = os.path.join(CARTELLA, "creatura-{}-sonno.png".format(n))
            if os.path.isfile(pf) and os.path.isfile(ps):
                print("  stadio {} · festa  -> sonno  {:>5.1%}".format(
                    n, sovrapposizione(maschera(pf), maschera(ps))))

    print()
    print("  ATTENZIONE A COSA QUESTO NUMERO NON VEDE. La sagoma e' un segnale")
    print("  su tre: gli altri due sono il MARCATORE D'ETA' (ciuccio, cappellino,")
    print("  baffi) e la POSA, che a colpo d'occhio pesano di piu'. Uno scarto")
    print("  basso qui non vuol dire che due stadi si confondano davvero.")
    print()
    print("  E NON e' il controllo d'identita': lentiggini, ciuffo, macchie sopra")
    print("  gli occhi, sasso, orecchie nude e tre quarti si guardano a occhio -")
    print("  docs/mascotte.md sezione 8.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
