const express = require("express");
const { sql, poolPromise } = require("../db");
const {
    emptyToNull,
    toIntOrNull,
    toDecimalOrNull,
    vehicleExists,
} = require("../lib/helpers");

const router = express.Router();

function readRevisioneBody(body) {
    return {
        Id_Veicolo: toIntOrNull(body.Id_Veicolo ?? body.Id_veicolo),
        nome: emptyToNull(body.nome ?? body.Nome),
        Data_revisione: emptyToNull(body.Data_revisione),
        Data_scadenza: emptyToNull(body.Data_scadenza),
        Esito: emptyToNull(body.Esito ?? body.esito),
        Importo: toDecimalOrNull(body.Importo ?? body.importo),
        Centro_revisione: emptyToNull(body.Centro_revisione ?? body.centro_revisione),
        Note: emptyToNull(body.Note ?? body.note),
    };
}

function bindRevisione(request, row) {
    return request
        .input("Id_Veicolo", sql.Int, row.Id_Veicolo)
        .input("nome", sql.VarChar(50), row.nome)
        .input("Data_revisione", sql.Date, row.Data_revisione)
        .input("Data_scadenza", sql.Date, row.Data_scadenza)
        .input("Esito", sql.VarChar(20), row.Esito)
        .input("Importo", sql.Decimal(10, 2), row.Importo)
        .input("Centro_revisione", sql.VarChar(150), row.Centro_revisione)
        .input("Note", sql.VarChar(500), row.Note);
}

function missingRequiredFields(row) {
    if (row.Id_Veicolo == null) return "Id_Veicolo è obbligatorio";
    if (row.Data_scadenza == null) return "Data_scadenza è obbligatoria";
    return null;
}

async function listRevisioni(req, res) {
    try {
        const idVeicolo = toIntOrNull(req.query.id_veicolo ?? req.query.Id_Veicolo);
        const pool = await poolPromise;
        const request = pool.request();

        let sqlText = `
            SELECT *
            FROM Revisioni
        `;
        if (idVeicolo != null) {
            request.input("Id_Veicolo", sql.Int, idVeicolo);
            sqlText += ` WHERE Id_Veicolo = @Id_Veicolo`;
        }
        sqlText += ` ORDER BY Data_scadenza DESC, Id DESC`;

        const result = await request.query(sqlText);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero delle revisioni",
        });
    }
}

async function getRevisione(req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                SELECT *
                FROM Revisioni
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Revisione non trovata" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero della revisione",
        });
    }
}

async function addRevisione(req, res) {
    try {
        const row = readRevisioneBody(req.body);
        const missing = missingRequiredFields(row);
        if (missing) {
            return res.status(400).json({ error: missing });
        }

        if (!(await vehicleExists(row.Id_Veicolo))) {
            return res.status(400).json({ error: "Veicolo non trovato" });
        }

        const pool = await poolPromise;
        const result = await bindRevisione(pool.request(), row).query(`
            INSERT INTO Revisioni
                (Id_Veicolo, nome, Data_revisione, Data_scadenza, Esito, Importo, Centro_revisione, Note)
            OUTPUT INSERTED.*
            VALUES (@Id_Veicolo, @nome, @Data_revisione, @Data_scadenza, @Esito, @Importo, @Centro_revisione, @Note)
        `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'aggiunta della revisione" });
    }
}

async function updateRevisione(req, res) {
    try {
        const id = req.params.id;
        const row = readRevisioneBody(req.body);
        const missing = missingRequiredFields(row);
        if (missing) {
            return res.status(400).json({ error: missing });
        }

        const pool = await poolPromise;

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Revisioni WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Revisione non trovata" });
        }

        if (!(await vehicleExists(row.Id_Veicolo))) {
            return res.status(400).json({ error: "Veicolo non trovato" });
        }

        await bindRevisione(pool.request().input("Id", sql.Int, id), row).query(`
            UPDATE Revisioni
            SET Id_Veicolo = @Id_Veicolo,
                nome = @nome,
                Data_revisione = @Data_revisione,
                Data_scadenza = @Data_scadenza,
                Esito = @Esito,
                Importo = @Importo,
                Centro_revisione = @Centro_revisione,
                Note = @Note
            WHERE Id = @Id
        `);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante l'aggiornamento della revisione",
        });
    }
}

async function deleteRevisione(req, res) {
    try {
        const id = req.params.id;
        const pool = await poolPromise;

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Revisioni WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Revisione non trovata" });
        }

        await pool.request()
            .input("Id", sql.Int, id)
            .query(`DELETE FROM Revisioni WHERE Id = @Id`);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'eliminazione della revisione" });
    }
}

router.get("/", listRevisioni);
router.get("/:id", getRevisione);
router.post("/", addRevisione);
router.put("/:id", updateRevisione);
router.delete("/:id", deleteRevisione);

module.exports = router;
