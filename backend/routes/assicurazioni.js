const express = require("express");
const { sql, poolPromise } = require("../db");
const {
    emptyToNull,
    toIntOrNull,
    toDecimalOrNull,
    vehicleExists,
} = require("../lib/helpers");

const router = express.Router();

function readAssicurazioneBody(body) {
    return {
        Id_veicolo: toIntOrNull(body.Id_veicolo),
        Compagnia: emptyToNull(body.Compagnia),
        nome: emptyToNull(body.nome),
        Numero_polizza: emptyToNull(body.Numero_polizza),
        ClasseDiMerito: emptyToNull(body.ClasseDiMerito),
        Data_ultimo_pagamento: emptyToNull(body.Data_ultimo_pagamento),
        Data_scadenza: emptyToNull(body.Data_scadenza),
        Periodo_di_tolleranza: toIntOrNull(body.Periodo_di_tolleranza),
        Importo: toDecimalOrNull(body.Importo),
        note: emptyToNull(body.note ?? body.Note),
    };
}

function bindAssicurazione(request, row) {
    return request
        .input("Id_veicolo", sql.Int, row.Id_veicolo)
        .input("Compagnia", sql.NVarChar(50), row.Compagnia)
        .input("nome", sql.NVarChar(50), row.nome)
        .input("Numero_polizza", sql.NVarChar(50), row.Numero_polizza)
        .input("ClasseDiMerito", sql.NVarChar(50), row.ClasseDiMerito)
        .input("Data_ultimo_pagamento", sql.DateTime, row.Data_ultimo_pagamento)
        .input("Data_scadenza", sql.DateTime, row.Data_scadenza)
        .input("Periodo_di_tolleranza", sql.Int, row.Periodo_di_tolleranza)
        .input("Importo", sql.Decimal(10, 2), row.Importo)
        .input("note", sql.NVarChar(sql.MAX), row.note);
}

async function listAssicurazioni(req, res) {
    try {
        const idVeicolo = toIntOrNull(req.query.id_veicolo);
        const pool = await poolPromise;
        const request = pool.request();

        let sqlText = `
            SELECT *
            FROM Assicurazioni
        `;
        if (idVeicolo != null) {
            request.input("Id_veicolo", sql.Int, idVeicolo);
            sqlText += ` WHERE Id_veicolo = @Id_veicolo`;
        }
        sqlText += ` ORDER BY Data_scadenza DESC, Id DESC`;

        const result = await request.query(sqlText);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero delle assicurazioni",
        });
    }
}

async function getAssicurazione(req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                SELECT *
                FROM Assicurazioni
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Assicurazione non trovata" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero dell'assicurazione",
        });
    }
}

async function addAssicurazione(req, res) {
    try {
        const row = readAssicurazioneBody(req.body);

        if (row.Id_veicolo == null) {
            return res.status(400).json({
                error: "Id_veicolo è obbligatorio",
            });
        }

        if (row.Data_scadenza == null) {
            return res.status(400).json({
                error: "Data_scadenza è obbligatoria",
            });
        }

        if (!(await vehicleExists(row.Id_veicolo))) {
            return res.status(400).json({ error: "Veicolo non trovato" });
        }

        const pool = await poolPromise;
        const result = await bindAssicurazione(pool.request(), row).query(`
            INSERT INTO Assicurazioni
            (Id_veicolo, Compagnia, nome, Numero_polizza, ClasseDiMerito, Data_ultimo_pagamento, Data_scadenza, Periodo_di_tolleranza, Importo, note)
            OUTPUT INSERTED.*
            VALUES (@Id_veicolo, @Compagnia, @nome, @Numero_polizza, @ClasseDiMerito, @Data_ultimo_pagamento, @Data_scadenza, @Periodo_di_tolleranza, @Importo, @note)
        `);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'aggiunta dell'assicurazione" });
    }
}

async function updateAssicurazione(req, res) {
    try {
        const id = req.params.id;
        const row = readAssicurazioneBody(req.body);

        if (row.Id_veicolo == null) {
            return res.status(400).json({
                error: "Id_veicolo è obbligatorio",
            });
        }

        if (row.Data_scadenza == null) {
            return res.status(400).json({
                error: "Data_scadenza è obbligatoria",
            });
        }

        const pool = await poolPromise;

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Assicurazioni WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Assicurazione non trovata" });
        }

        if (!(await vehicleExists(row.Id_veicolo))) {
            return res.status(400).json({ error: "Veicolo non trovato" });
        }

        await bindAssicurazione(pool.request().input("Id", sql.Int, id), row).query(`
            UPDATE Assicurazioni
            SET
                Id_veicolo = @Id_veicolo,
                Compagnia = @Compagnia,
                nome = @nome,
                Numero_polizza = @Numero_polizza,
                ClasseDiMerito = @ClasseDiMerito,
                Data_ultimo_pagamento = @Data_ultimo_pagamento,
                Data_scadenza = @Data_scadenza,
                Periodo_di_tolleranza = @Periodo_di_tolleranza,
                Importo = @Importo,
                note = @note
            WHERE Id = @Id
        `);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'aggiornamento dell'assicurazione" });
    }
}

async function deleteAssicurazione(req, res) {
    try {
        const id = req.params.id;
        const pool = await poolPromise;

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Assicurazioni WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Assicurazione non trovata" });
        }

        await pool.request()
            .input("Id", sql.Int, id)
            .query(`DELETE FROM Assicurazioni WHERE Id = @Id`);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'eliminazione dell'assicurazione" });
    }
}

router.get("/", listAssicurazioni);
router.get("/:id", getAssicurazione);
router.post("/", addAssicurazione);
router.put("/:id", updateAssicurazione);
router.delete("/:id", deleteAssicurazione);

module.exports = router;
