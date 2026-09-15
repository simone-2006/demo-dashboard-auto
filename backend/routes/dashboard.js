const express = require("express");
const { poolPromise } = require("../db");

const router = express.Router();

async function countLatestAssicurazioniScadute(pool) {
    const result = await pool.request().query(`
        SELECT COUNT(*) AS count
        FROM (
            SELECT
                a.Data_scadenza,
                a.Periodo_di_tolleranza,
                ROW_NUMBER() OVER (
                    PARTITION BY a.Id_veicolo
                    ORDER BY a.Data_scadenza DESC, a.Id DESC
                ) AS rn
            FROM Assicurazioni a
            WHERE a.Data_scadenza IS NOT NULL
        ) latest
        WHERE latest.rn = 1
          AND CAST(latest.Data_scadenza AS DATE) < CAST(GETDATE() AS DATE)
          AND DATEDIFF(
                DAY,
                CAST(latest.Data_scadenza AS DATE),
                CAST(GETDATE() AS DATE)
              ) > ISNULL(latest.Periodo_di_tolleranza, 0)
    `);
    return result.recordset[0]?.count ?? 0;
}

async function countLatestBolliScaduti(pool) {
    const result = await pool.request().query(`
        SELECT COUNT(*) AS count
        FROM (
            SELECT
                b.scadenza,
                ROW_NUMBER() OVER (
                    PARTITION BY b.Id_veicolo
                    ORDER BY b.scadenza DESC, b.Id DESC
                ) AS rn
            FROM Bolli b
            WHERE b.scadenza IS NOT NULL
        ) latest
        WHERE latest.rn = 1
          AND CAST(latest.scadenza AS DATE) < CAST(GETDATE() AS DATE)
    `);
    return result.recordset[0]?.count ?? 0;
}

async function countLatestRevisioniScadute(pool) {
    const result = await pool.request().query(`
        SELECT COUNT(*) AS count
        FROM (
            SELECT
                r.Data_scadenza,
                ROW_NUMBER() OVER (
                    PARTITION BY r.Id_Veicolo
                    ORDER BY r.Data_scadenza DESC, r.Id DESC
                ) AS rn
            FROM Revisioni r
            WHERE r.Data_scadenza IS NOT NULL
        ) latest
        WHERE latest.rn = 1
          AND CAST(latest.Data_scadenza AS DATE) < CAST(GETDATE() AS DATE)
    `);
    return result.recordset[0]?.count ?? 0;
}

async function countLatestTagliandiScaduti(pool) {
    const result = await pool.request().query(`
        SELECT COUNT(*) AS count
        FROM (
            SELECT
                t.data_scadenza,
                ROW_NUMBER() OVER (
                    PARTITION BY t.Id_veicolo
                    ORDER BY t.data_scadenza DESC, t.Id DESC
                ) AS rn
            FROM Tagliando t
            WHERE t.data_scadenza IS NOT NULL
        ) latest
        WHERE latest.rn = 1
          AND CAST(latest.data_scadenza AS DATE) < CAST(GETDATE() AS DATE)
    `);
    return result.recordset[0]?.count ?? 0;
}



async function getScaduteNumber(_req, res) {
    try {
        const pool = await poolPromise;
        const [assicurazioni, bolli, revisioni, tagliandi] = await Promise.all([
            countLatestAssicurazioniScadute(pool),
            countLatestBolliScaduti(pool),
            countLatestRevisioniScadute(pool),
            countLatestTagliandiScaduti(pool)
        ]);
        res.json({ count: assicurazioni + bolli + revisioni + tagliandi });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero delle scadenze scadute",
        });
    }
}

router.get("/scadute", getScaduteNumber);

async function listLatestScadenze(_req, res) {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
        SELECT
            vehicleId,
            Brand,
            Modello,
            Targa,
            EmailAssegnatario,
            tipo,
            scadenza,
            Periodo_di_tolleranza,
            Assegnazione
        FROM (
            SELECT
                v.Id AS vehicleId,
                v.Brand,
                v.Modello,
                v.Targa,
                v.EmailAssegnatario,
                N'Assicurazione' AS tipo,
                CAST(latest.Data_scadenza AS DATETIME) AS scadenza,
                latest.Periodo_di_tolleranza AS Periodo_di_tolleranza,
                v.Assegnazione
            FROM (
                SELECT
                    a.Id_veicolo,
                    a.Data_scadenza,
                    a.Periodo_di_tolleranza,
                    ROW_NUMBER() OVER (
                        PARTITION BY a.Id_veicolo
                        ORDER BY a.Data_scadenza DESC, a.Id DESC
                    ) AS rn
                FROM Assicurazioni a
                WHERE a.Data_scadenza IS NOT NULL
            ) latest
            INNER JOIN Veicoli v ON v.Id = latest.Id_veicolo
            WHERE latest.rn = 1

            UNION ALL

            SELECT
                v.Id AS vehicleId,
                v.Brand,
                v.Modello,
                v.Targa,
                v.EmailAssegnatario,
                N'Bollo' AS tipo,
                CAST(latest.scadenza AS DATETIME) AS scadenza,
                CAST(NULL AS INT) AS Periodo_di_tolleranza,
                v.Assegnazione
            FROM (
                SELECT
                    b.Id_veicolo,
                    b.scadenza,
                    ROW_NUMBER() OVER (
                        PARTITION BY b.Id_veicolo
                        ORDER BY b.scadenza DESC, b.Id DESC
                    ) AS rn
                FROM Bolli b
                WHERE b.scadenza IS NOT NULL
            ) latest
            INNER JOIN Veicoli v ON v.Id = latest.Id_veicolo
            WHERE latest.rn = 1

            UNION ALL

            SELECT
                v.Id AS vehicleId,
                v.Brand,
                v.Modello,
                v.Targa,
                v.EmailAssegnatario,
                N'Revisione' AS tipo,
                CAST(latest.Data_scadenza AS DATETIME) AS scadenza,
                CAST(NULL AS INT) AS Periodo_di_tolleranza,
                v.Assegnazione
            FROM (
                SELECT
                    r.Id_Veicolo,
                    r.Data_scadenza,
                    ROW_NUMBER() OVER (
                        PARTITION BY r.Id_Veicolo
                        ORDER BY r.Data_scadenza DESC, r.Id DESC
                    ) AS rn
                FROM Revisioni r
                WHERE r.Data_scadenza IS NOT NULL
            ) latest
            INNER JOIN Veicoli v ON v.Id = latest.Id_Veicolo
            WHERE latest.rn = 1

            UNION ALL

            SELECT
                v.Id AS vehicleId,
                v.Brand,
                v.Modello,
                v.Targa,
                v.EmailAssegnatario,
                N'Tagliando' AS tipo,
                CAST(latest.data_scadenza AS DATETIME) AS scadenza,
                CAST(NULL AS INT) AS Periodo_di_tolleranza,
                v.Assegnazione
            FROM (
                SELECT
                    t.Id_veicolo,
                    t.data_scadenza,
                    ROW_NUMBER() OVER (
                        PARTITION BY t.Id_veicolo
                        ORDER BY t.data_scadenza DESC, t.Id DESC
                    ) AS rn
                FROM Tagliando t
                WHERE t.data_scadenza IS NOT NULL
            ) latest
            INNER JOIN Veicoli v ON v.Id = latest.Id_veicolo
            WHERE latest.rn = 1
        ) scadenze
        WHERE scadenze.scadenza IS NOT NULL
        ORDER BY scadenza ASC;
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Errore durante il recupero delle scadenze",
        });
    }
}

router.get("/scadenze", listLatestScadenze);

module.exports = router;
