const sql = require("mssql");

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,

    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = sql.connect(config);

module.exports = {
    sql,
    poolPromise
};