const { sql, poolPromise } = require("../db");

function emptyToNull(value) {
    if (value == null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    return value;
}

function toBit(value) {
    return value === true || value === 1 || value === "1" || value === "si" || value === "true";
}

function toIntOrNull(value) {
    if (value == null || value === "") return null;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
}

function toDecimalOrNull(value) {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
    return Number.isFinite(n) ? n : null;
}

async function vehicleExists(vehicleId) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("Id", sql.Int, vehicleId)
        .query(`SELECT Id FROM Veicoli WHERE Id = @Id`);
    return result.recordset.length > 0;
}

module.exports = {
    emptyToNull,
    toBit,
    toIntOrNull,
    toDecimalOrNull,
    vehicleExists,
};
