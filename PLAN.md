La pagina oggi è solo UI: gli slider vivono nello state React, **Salva** non fa nulla, e le email admin arrivano da un JSON locale. Il backend (Express + SQL Server) non ha ancora un endpoint per queste impostazioni.

## Cosa salvare

Otto numeri globali (giorni di preavviso, `0–90`):


| Destinatario | Assicurazione | Bollo | Revisione | Tagliando |
| ------------ | ------------- | ----- | --------- | --------- |
| `admin`      | 30            | 30    | 30        | 30        |
| `owner`      | 15            | 15    | 15        | 15        |


Le email dei proprietari sono già sul server (`Veicoli.EmailAssegnatario`). Le email admin restano in `adminEmail.json` (è già in `.gitignore`, come `company.json`): è config di deploy, non un valore che cambia da questa schermata.

L’invio vero delle mail è un secondo pezzo: qui il piano copre solo **leggere e salvare i giorni**.

---

## Approccio consigliato

Una tabella SQL piccola, **upsert per destinatario**, API come le altre (`/api/...` + `frontend/src/api/...`).

**Perché non le alternative**

- Un JSON blob in una sola riga: più semplice da scrivere, più scomodo da validare e da usare in una query sulle scadenze.
- Otto colonne fisse: va bene finché i tipi restano quattro; ogni nuovo avviso diventa una migration.
- File sul server: non è coerente col resto (tutto il resto è su SQL Server).

---

## 1. Tabella SQL

```sql
CREATE TABLE ImpostazioniEmail (
    Destinatario NVARCHAR(20) NOT NULL,  -- 'admin' | 'owner'
    TipoAvviso   NVARCHAR(20) NOT NULL,  -- 'assicurazione' | 'bollo' | 'revisione' | 'tagliando'
    Giorni       INT NOT NULL,
    UpdatedAt    DATETIME NOT NULL,
    CONSTRAINT PK_ImpostazioniEmail PRIMARY KEY (Destinatario, TipoAvviso),
    CONSTRAINT CK_ImpostazioniEmail_Destinatario
        CHECK (Destinatario IN (N'admin', N'owner')),
    CONSTRAINT CK_ImpostazioniEmail_Tipo
        CHECK (TipoAvviso IN (N'assicurazione', N'bollo', N'revisione', N'tagliando')),
    CONSTRAINT CK_ImpostazioniEmail_Giorni
        CHECK (Giorni >= 0 AND Giorni <= 90)
);

INSERT INTO ImpostazioniEmail (Destinatario, TipoAvviso, Giorni, UpdatedAt)
VALUES
    (N'admin', N'assicurazione', 30, GETDATE()),
    (N'admin', N'bollo',         30, GETDATE()),
    (N'admin', N'revisione',     30, GETDATE()),
    (N'admin', N'tagliando',     30, GETDATE()),
    (N'owner', N'assicurazione', 15, GETDATE()),
    (N'owner', N'bollo',         15, GETDATE()),
    (N'owner', N'revisione',     15, GETDATE()),
    (N'owner', N'tagliando',     15, GETDATE());
```

La PK `(Destinatario, TipoAvviso)` rende il save un `MERGE`/`UPDATE` semplice, senza duplicati.

---

## 2. API backend

Nuovo file `backend/routes/emailSettings.js`, montato in `server.js` su `/api/email-settings`.

Contratto JSON (allineato allo state attuale):

```json
{
  "admin": { "assicurazione": 30, "bollo": 30, "revisione": 30, "tagliando": 30 },
  "owner": { "assicurazione": 15, "bollo": 15, "revisione": 15, "tagliando": 15 }
}
```


| Metodo | Path                        | Ruolo                                  |
| ------ | --------------------------- | -------------------------------------- |
| `GET`  | `/api/email-settings`       | Legge tutto, per il mount della pagina |
| `PUT`  | `/api/email-settings/admin` | Salva la card admin                    |
| `PUT`  | `/api/email-settings/owner` | Salva la card owner                    |


Due PUT distinti perché hai già due pulsanti **Salva**. Un unico PUT globale andrebbe bene solo se unissi i pulsanti.

Validazione lato server (non fidarti dello slider):

- body deve contenere esattamente i 4 tipi
- ogni valore è intero tra 0 e 90
- destinatario solo `admin` | `owner`
- `400` se manca/è fuori range, `500` come nelle altre route

Il save è un `MERGE` sulle 4 righe di quel destinatario, così funziona anche se la tabella è vuota.

---

## 3. Client API

Nuovo `frontend/src/api/emailSettings.js`, stesso helper `requestJson` di `assicurazioni.js`:

- `getEmailSettings()` → `GET /api/email-settings`
- `updateEmailSettings(destinatario, values)` → `PUT /api/email-settings/${destinatario}`

Il proxy Vite `/api` → `localhost:3001` c’è già, non serve toccare `vite.config.js`.

---

## 4. Collegare `Email.jsx`

1. All’avvio: `useEffect` che chiama `getEmailSettings()` e riempie `adminAlert` / `ownerAlert` (stesso schema di `EditCar.jsx`: `loading`, `loadError`, flag `cancelled`).
2. Default 30/15 restano come fallback se il GET fallisce o la tabella è vuota.
3. Ogni **Salva** chiama `updateEmailSettings("admin" | "owner", …)` con `saving` + messaggio di errore/successo. `Button` ha già `disabled`.
4. Opzionale ma utile: stato “sporco” per card, così il pulsante è attivo solo se hai mosso uno slider.

Le email admin restano importate da JSON: in questa fase non le sposti sul server.

C’è anche un refuso nella seconda card: il titolo è ancora «Avviso ad amministratori», dovrebbe essere qualcosa come «Avviso ai proprietari».

---

## 5. Ordine di lavoro

1. Creare la tabella (a mano in SSMS / Azure Data Studio).
2. Route backend + mount in `server.js`.
3. `frontend/src/api/emailSettings.js`.
4. Load + save in `Email.jsx`.
5. (Dopo, se ti serve) job di invio.

---

## Fase 2 (non serve per far funzionare “Salva”)

Un job giornaliero sul backend che:

1. legge `ImpostazioniEmail`
2. riusa la query scadenze di `dashboard.js`
3. per ogni scadenza, se `DATEDIFF(DAY, oggi, scadenza) === giorni` (o `<=` se vuoi anche i giorni intermedi)
4. manda mail agli admin (JSON) o a `EmailAssegnatario`
5. Registra l’invio in una tabella `EmailInviate (VeicoloId, TipoAvviso, Destinatario, DataInvio)` per non duplicare

Oggi nel `package.json` del backend non c’è nodemailer né un cron: è un pezzo a parte.

---

## Cosa verificare tu

- Apri `/email`: gli slider riflettono i valori a DB, non i 30/15 hardcoded.
- Salva solo la card admin: owner non cambia.
- Ricarica la pagina: i valori restano.
- Prova `0, 1, 90`; un valore fuori range dal network tab deve tornare `400`.
- Le email admin in testa alla card restano quelle del JSON.

Se vuoi che lo implementi, passa in Agent mode e partiamo dalla tabella + API.