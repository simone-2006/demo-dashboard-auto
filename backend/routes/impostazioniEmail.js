const express = require("express");
const { poolPromise } = require("../db");
const router = express.Router();

async function getGiorniEmail(req, res) {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        const sqlText = `
            SELECT
                Destinatario,
                MAX(CASE WHEN TipoAvviso = 'assicurazione' THEN Giorni END) AS assicurazione,
                MAX(CASE WHEN TipoAvviso = 'bollo' THEN Giorni END) AS bollo,
                MAX(CASE WHEN TipoAvviso = 'revisione' THEN Giorni END) AS revisione,
                MAX(CASE WHEN TipoAvviso = 'tagliando' THEN Giorni END) AS tagliando
            FROM impostazioniemail
            GROUP BY Destinatario
        `;

        const result = await request.query(sqlText);

        const output = {};
        for (const row of result.recordset) {
            const { Destinatario, ...valori } = row;
            output[Destinatario] = valori;
        }
        res.status(200).json(output);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero delle impostazioni email",
        });
    }
}

/* Update admin row */
async function updateAdminRow(req, res) {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        // Get only the fields you want to update
        const { assicurazione, bollo, revisione, tagliando } = req.body;

        const sqlText = `
            UPDATE impostazioniemail
            SET
                Giorni = CASE 
                    WHEN TipoAvviso = 'assicurazione' THEN @assicurazione
                    WHEN TipoAvviso = 'bollo' THEN @bollo
                    WHEN TipoAvviso = 'revisione' THEN @revisione
                    WHEN TipoAvviso = 'tagliando' THEN @tagliando
                    ELSE Giorni
                END
            WHERE Destinatario = 'admin'
        `;

        request.input('assicurazione', assicurazione);
        request.input('bollo', bollo);
        request.input('revisione', revisione);
        request.input('tagliando', tagliando);

        await request.query(sqlText);

        res.status(200).json({ message: "Impostazioni email admin aggiornate con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante l'aggiornamento delle impostazioni email admin",
        });
    }
}

/* Update proprietario row */
async function updateProprietarioRow(req, res) {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        // Get only the fields you want to update
        const { assicurazione, bollo, revisione, tagliando } = req.body;

        const sqlText = `
            UPDATE impostazioniemail
            SET
                Giorni = CASE 
                    WHEN TipoAvviso = 'assicurazione' THEN @assicurazione
                    WHEN TipoAvviso = 'bollo' THEN @bollo
                    WHEN TipoAvviso = 'revisione' THEN @revisione
                    WHEN TipoAvviso = 'tagliando' THEN @tagliando
                    ELSE Giorni
                END
            WHERE Destinatario = 'owner'
        `;

        request.input('assicurazione', assicurazione);
        request.input('bollo', bollo);
        request.input('revisione', revisione);
        request.input('tagliando', tagliando);

        await request.query(sqlText);

        res.status(200).json({ message: "Impostazioni email proprietario aggiornate con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante l'aggiornamento delle impostazioni email proprietario",
        });
    }
}

function normalizeEmailStatus(value) {
    if (value === true || value === 1 || value === "1" || value === "true") return "true";
    if (value === false || value === 0 || value === "0" || value === "false") return "false";
    return null;
}

/* Attiva/disattiva email: stato e update */
async function getEmailStatus(req, res) {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        const sqlText = `
            SELECT Valore 
            FROM Config 
            WHERE Chiave = 'email-key'
        `;
        const result = await request.query(sqlText);

        const raw = result.recordset.length > 0 ? result.recordset[0].Valore : null;
        const normalized = normalizeEmailStatus(raw);
        const emailStatus = normalized === "true";
        res.status(200).json({ emailStatus, raw });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero delle impostazioni email",
        });
    }
}

/* Semplice update dello stato attivo/disattivo email */
async function updateEmailStatus(req, res) {
    try {
        const { emailStatus } = req.body;

        if (emailStatus === undefined) {
            return res.status(400).json({ error: "Parametro emailStatus mancante." });
        }

        const valore = normalizeEmailStatus(emailStatus);
        if (valore === null) {
            return res.status(400).json({ error: "Parametro emailStatus non valido." });
        }

        const pool = await poolPromise;
        const request = pool.request();
        request.input("valore", valore);

        const sqlText = `
            UPDATE Config 
            SET Valore = @valore 
            WHERE Chiave = 'email-key'
        `;
        await request.query(sqlText);

        res.status(200).json({
            message: "Stato email aggiornato con successo",
            emailStatus: valore === "true",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante l'aggiornamento dello stato email",
        });
    }
}

router.get("/emailstatus", getEmailStatus);
router.post("/emailstatus", updateEmailStatus);

router.get("/giorniemail", getGiorniEmail);
router.post("/updateadminimpostazioniemail", updateAdminRow);
router.post("/updateproprietarioimpostazioniemail", updateProprietarioRow);

module.exports = router;
