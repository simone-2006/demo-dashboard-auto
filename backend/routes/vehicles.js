const express = require("express");
const { sql, poolPromise } = require("../db");
const { emptyToNull, toBit } = require("../lib/helpers");

const router = express.Router();

function readVehicleBody(body) {
    const TelepassSINO = toBit(body.TelepassSINO);
    return {
        Brand: emptyToNull(body.Brand),
        Modello: emptyToNull(body.Modello),
        Immatricolazione: emptyToNull(body.Immatricolazione),
        ProprietaLeasing: emptyToNull(body.ProprietaLeasing),
        Contratto: emptyToNull(body.Contratto),
        TelepassSINO,
        TelepassNumero: TelepassSINO ? emptyToNull(body.TelepassNumero) : null,
        SecondaChiave: emptyToNull(body.SecondaChiave),
        Assegnazione: emptyToNull(body.Assegnazione),
        EmailAssegnatario: emptyToNull(body.EmailAssegnatario),
        Targa: emptyToNull(body.Targa),
        Azienda: emptyToNull(body.Azienda),
        Note: emptyToNull(body.Note),
    };
}

async function getVehiclesNumber(_req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COUNT(*) AS count
            FROM Veicoli
        `);
        res.json({ count: result.recordset[0]?.count ?? 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero del numero di veicoli",
        });
    }
}

async function listVehicles(_req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT *
            FROM Veicoli
            order by id
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero dei veicoli",
        });
    }
}

async function getVehicle(req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                SELECT *
                FROM Veicoli
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Veicolo non trovato" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero dei veicoli",
        });
    }
}

async function addVehicle(req, res) {
    try {
        const vehicle = readVehicleBody(req.body);

        if (!vehicle.Brand || !vehicle.Modello || !vehicle.Targa) {
            return res.status(400).json({
                error: "Brand, modello e targa sono obbligatori",
            });
        }

        const pool = await poolPromise;
        const now = new Date();

        await pool.request()
            .input("Brand", sql.NVarChar(50), vehicle.Brand)
            .input("Modello", sql.NVarChar(100), vehicle.Modello)
            .input("Immatricolazione", sql.DateTime2, vehicle.Immatricolazione)
            .input("ProprietaLeasing", sql.NVarChar(50), vehicle.ProprietaLeasing)
            .input("Contratto", sql.NVarChar(sql.MAX), vehicle.Contratto)
            .input("TelepassSINO", sql.Bit, vehicle.TelepassSINO)
            .input("TelepassNumero", sql.NVarChar(50), vehicle.TelepassNumero)
            .input("SecondaChiave", sql.NVarChar(50), vehicle.SecondaChiave)
            .input("Assegnazione", sql.NVarChar(50), vehicle.Assegnazione)
            .input("EmailAssegnatario", sql.NVarChar(255), vehicle.EmailAssegnatario)
            .input("Targa", sql.NVarChar(10), vehicle.Targa)
            .input("Azienda", sql.NVarChar(100), vehicle.Azienda)
            .input("Note", sql.NVarChar(sql.MAX), vehicle.Note)
            .input("CreatedAt", sql.DateTime2, now)
            .input("UpdatedAt", sql.DateTime2, now)
            .query(`
                INSERT INTO Veicoli
                (Brand, Modello, Immatricolazione, ProprietaLeasing, Contratto, TelepassSINO, TelepassNumero, SecondaChiave, Assegnazione, EmailAssegnatario, Targa, Azienda, Note, CreatedAt, UpdatedAt)
                VALUES (@Brand, @Modello, @Immatricolazione, @ProprietaLeasing, @Contratto, @TelepassSINO, @TelepassNumero, @SecondaChiave, @Assegnazione, @EmailAssegnatario, @Targa, @Azienda, @Note, @CreatedAt, @UpdatedAt)
            `);

        res.status(201).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'aggiunta del veicolo" });
    }
}

async function updateVehicle(req, res) {
    try {
        const id = req.params.id;
        const vehicle = readVehicleBody(req.body);

        if (!vehicle.Brand || !vehicle.Modello || !vehicle.Targa) {
            return res.status(400).json({
                error: "Brand, modello e targa sono obbligatori",
            });
        }

        const pool = await poolPromise;
        const now = new Date();

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Veicoli WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Veicolo non trovato" });
        }

        await pool.request()
            .input("Id", sql.Int, id)
            .input("Brand", sql.NVarChar(50), vehicle.Brand)
            .input("Modello", sql.NVarChar(100), vehicle.Modello)
            .input("Immatricolazione", sql.DateTime2, vehicle.Immatricolazione)
            .input("ProprietaLeasing", sql.NVarChar(50), vehicle.ProprietaLeasing)
            .input("Contratto", sql.NVarChar(sql.MAX), vehicle.Contratto)
            .input("TelepassSINO", sql.Bit, vehicle.TelepassSINO)
            .input("TelepassNumero", sql.NVarChar(50), vehicle.TelepassNumero)
            .input("SecondaChiave", sql.NVarChar(50), vehicle.SecondaChiave)
            .input("Assegnazione", sql.NVarChar(50), vehicle.Assegnazione)
            .input("EmailAssegnatario", sql.NVarChar(255), vehicle.EmailAssegnatario)
            .input("Targa", sql.NVarChar(10), vehicle.Targa)
            .input("Azienda", sql.NVarChar(100), vehicle.Azienda)
            .input("Note", sql.NVarChar(sql.MAX), vehicle.Note)
            .input("UpdatedAt", sql.DateTime2, now)
            .query(`
                UPDATE Veicoli
                SET
                    Brand = @Brand,
                    Modello = @Modello,
                    Immatricolazione = @Immatricolazione,
                    ProprietaLeasing = @ProprietaLeasing,
                    Contratto = @Contratto,
                    TelepassSINO = @TelepassSINO,
                    TelepassNumero = @TelepassNumero,
                    SecondaChiave = @SecondaChiave,
                    Assegnazione = @Assegnazione,
                    EmailAssegnatario = @EmailAssegnatario,
                    Targa = @Targa,
                    Azienda = @Azienda,
                    Note = @Note,
                    UpdatedAt = @UpdatedAt
                WHERE Id = @Id
            `);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'aggiornamento del veicolo" });
    }
}

async function deleteVehicle(req, res) {
    try {
        const id = req.params.id;
        const pool = await poolPromise;

        const existing = await pool.request()
            .input("Id", sql.Int, id)
            .query(`SELECT Id FROM Veicoli WHERE Id = @Id`);

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: "Veicolo non trovato" });
        }

        await pool.request()
            .input("Id", sql.Int, id)
            .query(`DELETE FROM Veicoli WHERE Id = @Id`);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante l'eliminazione del veicolo" });
    }
}

router.get("/", listVehicles);
router.get("/count", getVehiclesNumber);
router.get("/:id", getVehicle);
router.post("/", addVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

function registerLegacyAliases(app) {
    app.get("/api/getVeicoli", listVehicles);
    app.get("/api/getVeicoli/:id", getVehicle);
    app.post("/api/addVeicoli", addVehicle);
    app.put("/api/updateVeicoli/:id", updateVehicle);
    app.delete("/api/deleteVeicoli/:id", deleteVehicle);
}

module.exports = router;
module.exports.registerLegacyAliases = registerLegacyAliases;
