# Mailer scadenze

Job Python: legge le scadenze dal backend e invia le email. In ascolto, parte ogni giorno alle **08:00 Europe/Rome**.

In questa demo l’invio è **disattivato**:

- flag `DEMO_EMAIL_DISABLED = True` in `mailer.py`
- il servizio Compose `mailer` non parte con `docker compose up` (profilo `mailer`)

La pagina Email in UI resta visibile ma non operativa. Documentazione completa: [README.md](../../README.md) in root.

## Avvio del container (invio comunque bloccato dal flag)

Dalla root del progetto:

```bash
docker compose --profile mailer up --build
```

Esecuzione immediata (senza aspettare le 8:00):

```bash
docker compose --profile mailer run --rm mailer python mailer.py
```

## Solo mailer

Se il backend gira già sulla macchina host (`localhost:3001`):

```bash
cd backend/emailSender
docker compose up --build
```

## Configurazione

- SMTP: `backend/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
- Destinatari admin: `frontend/src/companyData/adminEmail.json` (montato nel container)
- API backend: nello stack Compose è `http://backend:3001` (non usare `localhost` dal container)
