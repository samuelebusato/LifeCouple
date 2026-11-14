# Il profilo di LifeCouple

> Il profilo del progetto ([framework](../../../Rule/regole-sviluppo-sicuro.md) §0.2, PF1), **fonte unica dei due livelli**: i cinque assi, le cose che il progetto ha, gli ambienti che usa, il comando del rilascio. Da qui, dal brain, `node Code/genera-regole-progetto.mjs Projects/LifeCouple` genera [`regole-progetto.md`](regole-progetto.md), le regole del progetto.
>
> **I cinque assi li ha scelti l'agente della sessione principale, su delega di Samuele, il 2026-11-14.** Le cose, gli ambienti e il comando del rilascio li ha letti dalle fonti la sessione del rulebook: ⬜ **da confermare da Samuele**. LifeCouple è **sospeso dal 2026-10-27** ([`History.md`](../History.md)): il profilo vale quando riparte.

```profilo
progetto: LifeCouple
dati: alto
sicurezza: alto
dove: C
per: personale
rigore: prodotto
cose: backend, database, cloud, iac, asset-sensibile, dati-personali, dati-veri, usato-da-altri
ambienti: produzione
rilascio: le build con EAS e la pubblicazione negli store, le migrazioni e le Edge Function su Supabase (docs/pubblicazione.md); la landing, che serve anche `apple-app-site-association`, con `terraform apply` e `s3 sync` (docs/deploy-landing.md)
```

## Perché questi valori

| Asse | Valore | Chi, quando e perché |
|---|---|---|
| Dati | alto | L'agente della sessione principale, su delega di Samuele, il 2026-11-14: dati personali di persone in quanto tali, cioè le coppie, gli eventi, i luoghi, le foto |
| Sicurezza | alto | Lo stesso: è su internet, e l'autorizzazione sta solo nelle policy RLS del database, cioè in uno strato solo |
| Dove gira | C | Un servizio su internet, per molti utenti |
| Per chi | personale | Il progetto è di Samuele |
| Rigore | prodotto | Chi lo usa ci tiene la propria vita di coppia, e un errore gli costa |

**Le cose che ha**, lette da [`Architecture.md`](Architecture.md):
- `backend`: tre Edge Function di Supabase (`cancella-account`, `invia-notifiche`, `abbonamento-webhook`); il resto dell'app parla direttamente col database;
- `database`: Postgres con le policy RLS, che sono il controllo di autorizzazione vero;
- `cloud`: Supabase (regione UE), RevenueCat;
- `iac`: Terraform, in `infra/`;
- `asset-sensibile`: gli account, la chiave `service_role`, il diritto alle funzioni a pagamento;
- `dati-personali`: le coppie, gli eventi, i luoghi, le foto;
- `dati-veri` (⬜ da confermare): i dati di chi userà l'app, quando sarà pubblicata;
- `usato-da-altri`: è un'app per gli utenti degli store.

Non ha `ospitato`: gira su servizi gestiti, non su un server nostro. Non ha `ai`.

**Gli ambienti**: la produzione su Supabase. ⬜ **Una prova non c'è**, e le regole generate lo dichiarano (FL1): va deciso se il test interno degli store (TestFlight, la traccia interna di Google Play: `docs/pubblicazione.md`) è la prova, e in quel caso si aggiunge `prova`.

⬜ **Il repository non ha una CI** (`.github/workflows/` non c'è): le regole generate descrivono i controlli a ogni push e il pacchetto dal tag (R1, D2, D5), che oggi mancano. È un buco dichiarato, da chiudere quando il progetto riparte.
