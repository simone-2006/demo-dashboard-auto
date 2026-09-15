const express = require("express");
const { sql, poolPromise } = require("../db");
const {
    emptyToNull,
    toIntOrNull,
    toDecimalOrNull,
    vehicleExists,
} = require("../lib/helpers");

const router = express.Router();

function readTagliandoBody(body) {
    return {
        Id_veicolo: toIntOrNull(body.Id_veicolo ?? body.Id_Veicolo),
        nome: emptyToNull(body.nome ?? body.Nome),
        Data_tagliando: emptyToNull(body.Data_tagliando ?? body.data_tagliando),
        data_scadenza: emptyToNull(body.data_scadenza ?? body.Data_scadenza),
        scadenza_km: emptyToNull(body.scadenza_km ?? body.Scadenza_km),
        note: emptyToNull(body.note ?? body.Note),
        importo: toDecimalOrNull(body.importo ?? body.Importo),
    };
}

function bindTagliando(request, row) {
    return request
        .input("Id_veicolo", sql.Int, row.Id_veicolo)
        .input("nome", sql.NVarChar(50), row.nome)
        .input("Data_tagliando", sql.DateTime, row.Data_tagliando)
        .input("data_scadenza", sql.DateTime, row.data_scadenza)
        .input("scadenza_km", sql.NVarChar(50), row.scadenza_km)
        .input("note", sql.NVarChar(sql.MAX), row.note)
        .input("importo", sql.Decimal(10, 2), row.importo);
}

function missingRequiredFields(row) {
    if (row.Id_veicolo == null) return "Id_veicolo è obbligatorio";
    return null;
}

async function listTagliandi(req, res) {
    try {
        const idVeicolo = toIntOrNull(req.query.id_veicolo ?? req.query.Id_veicolo ?? req.query.Id_Veicolo);
        const pool = await poolPromise;
        const request = pool.request();

        let sqlText = `
            SELECT *
            FROM Tagliando
        `;
        if (idVeicolo != null) {
            request.input("Id_veicolo", sql.Int, idVeicolo);
            sqlText += ` WHERE Id_veicolo = @Id_veicolo`;
        }
        sqlText += ` ORDER BY data_scadenza DESC, Id DESC`;

        const result = await request.query(sqlText);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero dei tagliandi",
        });
    }
}

async function getTagliando(req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                SELECT *
                FROM Tagliando
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Tagliando non trovato" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero del tagliando",
        });
    }
}

async function addTagliando(req, res) {
    try {
        const row = readTagliandoBody(req.body);
        const missing = missingRequiredFields(row);
        if (missing) {
            return res.status(400).json({ error: missing });
        }

        if (!(await vehicleExists(row.Id_veicolo))) {
            return res.status(400).json({ error: "Veicolo non trovato" });
        }

        const pool = await poolPromise;
        const result = await bindTagliando(pool.request(), row).query(`
            INSERT INTO Tagliando
                (Id_veicolo, nome, Data_tagliando, data_scadenza, scadenza_km, note, importo)
            OUTPUT INSERTED.*
            VALUES (@Id_veicolo, @nome, @Data_tagliando, @data_scadenza, @scadenza_km, @note, @importo)
        `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'aggiunta del tagliando" });
    }
}

async function updateTagliando(req, res) {
    try {
        const id = req.params.id;
        const row = readTagliandoBody(req.body);
        const missing = missingRequiredFields(row);
        if (missing) {
            return res.status(400).json({ error: missing });
        }

        const pool = await poolPromise;

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Tagliando WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Tagliando non trovato" });
        }

        if (!(await vehicleExists(row.Id_veicolo))) {
            return res.status(400).json({ error: "Veicolo non trovato" });
        }

        await bindTagliando(pool.request().input("Id", sql.Int, id), row).query(`
            UPDATE Tagliando
            SET Id_veicolo = @Id_veicolo,
                nome = @nome,
                Data_tagliando = @Data_tagliando,
                data_scadenza = @data_scadenza,
                scadenza_km = @scadenza_km,
                note = @note,
                importo = @importo
            WHERE Id = @Id
        `);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante l'aggiornamento del tagliando",
        });
    }
}

async function deleteTagliando(req, res) {
    try {
        const id = req.params.id;
        const pool = await poolPromise;

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Tagliando WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Tagliando non trovato" });
        }

        await pool.request()
            .input("Id", sql.Int, id)
            .query(`DELETE FROM Tagliando WHERE Id = @Id`);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'eliminazione del tagliando" });
    }
}

router.get("/", listTagliandi);
router.get("/:id", getTagliando);
router.post("/", addTagliando);
router.put("/:id", updateTagliando);
router.delete("/:id", deleteTagliando);

module.exports = router;
