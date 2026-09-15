# Dashboard Auto

Gestione flotta aziendale: veicoli, scadenze (assicurazione, bollo, revisione, tagliando) e dashboard di riepilogo.

Questa repository è pensata per una **demo su VPS con Docker**. Tutto gira sulla stessa macchina: interfaccia, API, SQL Server e job di reset notturno. SQL Server non è esposto su internet.

## Architettura

```
Browser  →  :9090  frontend (Nginx + UI)
                 └─ /api  →  backend Express :3001
                                  └─ SQL Server :1433  (solo rete Docker)

demo-reset     ogni notte alle 00:00  ripristina i dati demo
mailer         disattivato in questa demo (codice nel repo)
```

| Servizio | Ruolo |
|---|---|
| `frontend` | UI React (Vite). In produzione Nginx fa da reverse proxy verso il backend. |
| `backend` | API Express (`/api/...`). Connessione a SQL con `mssql`. |
| `sqlserver` | SQL Server 2022 Express. **Nessuna porta 1433 sull’host.** |
| `sqlserver-init` | All’avvio crea lo schema e carica i dati demo. |
| `demo-reset` | Ogni notte a mezzanotte (Europe/Rome) cancella le modifiche e reimposta il seed. |
| `mailer` | Job Python per le email di scadenza. **Non parte** con `docker compose up`. |

## Requisiti

- Docker e Docker Compose
- CPU **amd64** (l’immagine ufficiale SQL Server non gira in modo affidabile su ARM)
- Circa **2 GB di RAM** per SQL Server
- File `backend/.env` (vedi sotto)

## Avvio (Docker)

Dalla root del progetto:

```bash
cp backend/.env.example backend/.env
```

Apri `backend/.env` e imposta una password SA forte (maiuscole, minuscole, numeri, simbolo). `MSSQL_SA_PASSWORD` e `DB_PASSWORD` devono essere **uguali**.

Dati azienda (gitignored). Se mancano, in Docker vengono usati gli `.example`:

```bash
cp frontend/src/companyData/company.json.example frontend/src/companyData/company.json
cp frontend/src/companyData/adminemail.json.example frontend/src/companyData/adminEmail.json
```

Poi:

```bash
docker compose up --build
```

Apri **http://localhost:9090** (sulla VPS: `http://<IP>:9090`).

Il primo avvio di SQL Server può richiedere un minuto. Lo schema e i 6 veicoli demo vengono caricati da `sqlserver-init`.

### Porte

| Porta | Servizio |
|---|---|
| `9090` | Unico ingresso HTTP (UI + `/api`) |
| `3001` | Backend, **non pubblicato** sull’host |
| `1433` | SQL Server, **non pubblicato** sull’host |

In produzione metti un reverse proxy HTTPS (Caddy / Nginx) davanti a `9090` e apri sul firewall solo `22`, `80` e `443`.

## Variabili d’ambiente (`backend/.env`)

Compose imposta da solo `DB_SERVER=sqlserver`. Non usare l’IP pubblico della VPS.

| Variabile | Uso |
|---|---|
| `MSSQL_SA_PASSWORD` | Password `sa` del container SQL Server |
| `DB_USER` | Login usato dall’app (in demo: `sa`) |
| `DB_PASSWORD` | Stesso valore di `MSSQL_SA_PASSWORD` |
| `DB_NAME` | `GESTIONALE_AUTO` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Solo se riattivi il mailer |

Non usare `$`, `!` o `%` nella password SA: Docker Compose e bash le trattano come caratteri speciali. Se ti serve un `$` letterale in Compose, scrivilo `$$`.

SQL Server applica `MSSQL_SA_PASSWORD` **solo al primo avvio del volume**. Se cambi la password nel `.env` dopo, il login `sa` fallisce finché non ricrei il volume:

```bash
docker compose down -v
docker compose up -d --build
```

(`-v` cancella i dati SQL; al riavvio schema e seed demo vengono ricaricati.)

Il file `.env` non va committato.

## Dati demo

All’avvio (e ogni notte a mezzanotte) viene eseguito `setup_DB/seed-demo.sql`. Le date sono **relative a oggi**, così le scadenze restano realistiche dopo ogni reset.

| Targa | Veicolo | Azienda | In evidenza |
|---|---|---|---|
| `GT456AB` | Ferrari 296 GTB | Company 1 | RCA in scadenza, tagliando scaduto |
| `FA789CD` | Lamborghini Revuelto | Company 1 | RCA scaduta oltre tolleranza, bollo imminente |
| `GE234EF` | Porsche 911 GT3 RS | Company 2 | Tutto in regola, storico completo |
| `HB567GH` | Aston Martin DB12 | Company 1 | Bollo scaduto, revisione imminente |
| `JC890IL` | Ferrari SF90 Stradale | Company 2 | RCA in tolleranza, tagliando imminente |
| `KD123MN` | Lamborghini Huracán STO | Company 2 | Revisione scaduta, tagliando imminente |

Le modifiche fatte in giornata (nuove auto, scadenze, ecc.) vengono **cancellate a mezzanotte**.

Per un reset immediato, ricrea il job di init (schema + seed):

```bash
docker compose up sqlserver-init --force-recreate
```

## Email (disattivate in demo)

La pagina **Email** resta visibile in navbar, con una barra in alto che avvisa che non è operativa. I controlli non salvano. Il codice di salvataggio e del mailer è nel repo, ma non viene eseguito.

- Frontend: `DEMO_EMAIL_DISABLED = true` in `frontend/src/pages/Email.jsx`
- Mailer: `DEMO_EMAIL_DISABLED = True` in `backend/emailSender/mailer.py`
- Compose: il servizio `mailer` ha il profilo `mailer`, quindi `docker compose up` **non** lo avvia

Per avviare comunque il container mailer (l’invio resta bloccato dal flag Python finché non lo togli):

```bash
docker compose --profile mailer up --build
```

Dettagli sul job: `backend/emailSender/README.Docker.md`.

## File SQL

| File | Quando usarlo |
|---|---|
| `setup_DB/init-docker.sql` | Schema per SQL Server **Linux / Docker** (niente path Windows) |
| `setup_DB/seed-demo.sql` | Dati demo + reset notturno |
| `setup_DB/reset-demo.sh` | Loop a mezzanotte Europe/Rome |
| `setup_DB/CreateDatabase.sql` | Export SSMS per SQL Server **Windows** locale. Non usarlo nel container. |

## Sviluppo in locale (senza Compose)

Serve un SQL Server raggiungibile dalla macchina (istanza locale o container con porta 1433 pubblicata solo in dev).

```bash
cp backend/.env.example backend/.env
```

In `.env` imposta `DB_SERVER` (es. `localhost`), poi:

```bash
npm run setup
npm run dev
```

- UI: http://localhost:5173 (Vite fa proxy di `/api` su `localhost:3001`)
- API: http://localhost:3001

## Personalizzazione demo

- Aziende e loghi: `frontend/src/companyData/company.json` e `frontend/src/companyData/logos/`
- Email admin (se riattivi il mailer): `frontend/src/companyData/adminEmail.json`
- Seed veicoli/scadenze: `setup_DB/seed-demo.sql`

`company.json`, `adminEmail.json` e i loghi sono in `.gitignore`.
