# Deploy della landing — S3 + CloudFront

Come si pubblica e si aggiorna `landing/`. L'infrastruttura è **codice**, in
[`infra/`](../infra/): non si creano risorse dalla console, si modifica il
Terraform e si applica. Disegno e alternative scartate in `History.md` **D-125**.

## Dove sta

| | |
|---|---|
| Account AWS | `790304250429` — lo **stesso** di HeleoX. ⚠️ `fr-busato` sta su un altro account (`219712358948`): non confonderli |
| Regione | `eu-west-1` |
| Bucket | `lifecouple-landing-790304250429` (privato: legge solo CloudFront, via OAC) |
| Distribuzione | `E24HEU9QRSMF0N` |
| URL | <https://d2ehd6ideoltsh.cloudfront.net> — nessun dominio, per ora |
| Stato Terraform | `s3://heliox-terraform-state-790304250429/lifecouple/terraform.tfstate` |

🔑 **Lo stato è separato da quello di HeleoX**: stesso bucket, **chiave diversa**.
Un `terraform apply` qui non pianifica la piattaforma di HeleoX, e un errore là
dentro non può spegnere queste pagine.

## Aggiornare i file (il caso normale)

Dalla cartella `landing/`, tre comandi. **Servono tutti e tre**, e il terzo è
quello che si dimentica.

```bash
aws s3 sync . s3://lifecouple-landing-790304250429 --delete --cache-control "public, max-age=86400"
```

```bash
aws s3 cp . s3://lifecouple-landing-790304250429 --recursive --exclude "*" --include "*.html" --cache-control "no-cache" --content-type "text/html; charset=utf-8"
```

```bash
aws cloudfront create-invalidation --distribution-id E24HEU9QRSMF0N --paths "/*"
```

Perché sono tre e non uno:

- gli **HTML vanno `no-cache`**: un documento legale corretto deve vedersi
  subito, non fra ventiquattr'ore. Gli altri file tengono la cache di un giorno;
- l'**invalidazione** serve perché CloudFront ha già una copia. `/*` conta come
  un solo percorso, e ce ne sono 1.000 gratuiti al mese.

⚠️ **Se aggiungi o sostituisci un font**, il `Content-Type` va imposto a mano:
`mimetypes` non conosce `.woff2`, quindi `aws s3 sync` lo caricherebbe come
`binary/octet-stream`.

```bash
aws s3 cp fonts/ s3://lifecouple-landing-790304250429/fonts/ --recursive --exclude "*" --include "*.woff2" --content-type "font/woff2" --cache-control "public, max-age=86400"
```

## 🔴 La regola che riguarda i documenti legali

Le pagine `privacy-policy.html` e `cookie-policy.html` sono **generate** da
`docs/legal/en/*.md` tramite `tools/genera-legale.mjs`, insieme a
`lib/legale/testi.ts` che l'app rende a schermo. Quindi chi tocca un documento
legale deve fare **tre** cose, non due:

1. `node tools/genera-legale.mjs` — rigenera i tre derivati;
2. `npm run test:legale` — verifica che siano tutti e tre allineati;
3. **i comandi di deploy qui sopra** — altrimenti resta online una versione
   *diversa* da quella resa nell'app.

⚠️ *Una versione pubblicata che contraddice quella mostrata nell'app non è un
disallineamento tecnico: è la prova documentale che la trasparenza dichiarata
non c'è.* Finché il deploy è manuale, questo passo dipende dalla memoria di chi
lavora — ed è la ragione per cui l'automazione sta nel backlog (`History.md` §6).

## Modificare l'infrastruttura

```bash
terraform -chdir=infra init
```

```bash
terraform -chdir=infra plan
```

Si legge il piano, e **solo dopo**:

```bash
terraform -chdir=infra apply
```

Cose da sapere prima di toccarlo:

- **La CSP è stretta** (`default-src 'none'`) perché la pagina lo consente: zero
  JavaScript, zero risorse esterne. 🔑 Se un domani la landing avesse bisogno di
  uno script o di una risorsa di terzi, **la pagina si rompe in silenzio** finché
  non si allarga la CSP: è voluto. In particolare `font-src 'self'` fa **bloccare
  dal browser** qualunque `<link>` a `fonts.googleapis.com` reintrodotto per
  distrazione — la promessa della cookie policy non dipende dalla memoria.
- **Il 404 è un 404 vero**, non il fallback SPA del modulo di HeleoX. Dipende da
  `s3:ListBucket` nella bucket policy: toglierlo trasforma ogni URL inesistente
  in un 403 mascherato.
- Aggiungere un **dominio**: `aliases` sulla distribuzione più un certificato ACM
  **in `us-east-1`** (vincolo di CloudFront), e i record DNS dal registrar —
  nell'account non ci sono hosted zone Route 53. 🔴 Prima però vanno fatti i
  controlli sul nome ([`pubblicazione.md`](pubblicazione.md) §7).

## Costi

CloudFront ha 1 TB al mese sempre gratuito, S3 sono centesimi per mezzo megabyte,
niente Route 53 e niente ACM: **sotto i 0,10 €/mese**.
