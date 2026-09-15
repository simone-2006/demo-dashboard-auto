const express = require("express");
const { sql, poolPromise } = require("../db");
const {
    emptyToNull,
    toIntOrNull,
    toDecimalOrNull,
    vehicleExists,
} = require("../lib/helpers");

const router = express.Router();

function readBolloBody(body) {
    return {
        Id_veicolo: toIntOrNull(body.Id_veicolo),
        nome: emptyToNull(body.nome),
        inizio_validita: emptyToNull(body.inizio_validita),
        fine_validita: emptyToNull(body.fine_validita),
        scadenza: emptyToNull(body.scadenza),
        importo: toDecimalOrNull(body.importo ?? body.Importo),
        note: emptyToNull(body.note ?? body.Note),
    };
}

function bindBollo(request, row) {
    return request
        .input("Id_veicolo", sql.Int, row.Id_veicolo)
        .input("nome", sql.VarChar(50), row.nome)
        .input("inizio_validita", sql.DateTime, row.inizio_validita)
        .input("fine_validita", sql.DateTime, row.fine_validita)
        .input("scadenza", sql.DateTime, row.scadenza)
        .input("importo", sql.Decimal(10, 2), row.importo)
        .input("note", sql.NVarChar(sql.MAX), row.note);
}

async function listBolli(req, res) {
    try {
        const idVeicolo = toIntOrNull(req.query.id_veicolo);
        const pool = await poolPromise;
        const request = pool.request();

        let sqlText = `
            SELECT *
            FROM Bolli
        `;
        if (idVeicolo != null) {
            request.input("Id_veicolo", sql.Int, idVeicolo);
            sqlText += ` WHERE Id_veicolo = @Id_veicolo`;
        }
        sqlText += ` ORDER BY scadenza DESC, Id DESC`;

        const result = await request.query(sqlText);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero dei bolli",
        });
    }
}

async function addBollo(req, res) {
    try {
        const row = readBolloBody(req.body);

        if (row.Id_veicolo == null) {
            return res.status(400).json({
                error: "Id_veicolo è obbligatorio",
            });
        }

        if (row.scadenza == null) {
            return res.status(400).json({
                error: "scadenza è obbligatoria",
            });
        }

        if (!(await vehicleExists(row.Id_veicolo))) {
            return res.status(400).json({ error: "Veicolo non trovato" });
        }

        const pool = await poolPromise;
        const result = await bindBollo(pool.request(), row).query(`
            INSERT INTO Bolli
                (Id_veicolo, nome, inizio_validita, fine_validita, scadenza, importo, note)
            OUTPUT INSERTED.*
            VALUES (@Id_veicolo, @nome, @inizio_validita, @fine_validita, @scadenza, @importo, @note)
        `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'aggiunta del bollo" });
    }
}

async function deleteBollo(req, res) {
    try {
        const id = req.params.id;
        const pool = await poolPromise;

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Bolli WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Bollo non trovato" });
        }

        await pool.request()
            .input("Id", sql.Int, id)
            .query(`DELETE FROM Bolli WHERE Id = @Id`);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'eliminazione del bollo" });
    }
}

async function getBollo(req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                SELECT *
                FROM Bolli
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Bollo non trovato" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero del bollo",
        });
    }
}

async function updateBollo(req, res) {
    try {
        const id = req.params.id;
        const row = readBolloBody(req.body);
        const pool = await poolPromise;

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Bolli WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Bollo non trovato" });
        }

        if (row.Id_veicolo == null) {
            return res.status(400).json({ error: "Id_veicolo è obbligatorio" });
        }

        if (row.scadenza == null) {
            return res.status(400).json({ error: "scadenza è obbligatoria" });
        }

        if (!(await vehicleExists(row.Id_veicolo))) {
            return res.status(400).json({ error: "Veicolo non trovato" });
        }

        await bindBollo(pool.request().input("Id", sql.Int, id), row).query(`
            UPDATE Bolli
            SET Id_veicolo = @Id_veicolo,
                nome = @nome,
                inizio_validita = @inizio_validita,
                fine_validita = @fine_validita,
                scadenza = @scadenza,
                importo = @importo,
                note = @note
            WHERE Id = @Id
        `);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante l'aggiornamento del bollo",
        });
    }
}

router.get("/", listBolli);
router.get("/:id", getBollo);
router.post("/", addBollo);
router.put("/:id", updateBollo);
router.delete("/:id", deleteBollo);

module.exports = router;
