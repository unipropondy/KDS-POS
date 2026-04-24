const sql = require("mssql");
require("dotenv").config();

// ✅ Config using ENV variables (Railway friendly)
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  requestTimeout: 120000,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// ✅ SINGLE GLOBAL CONNECTION POOL
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ SQL Connected");
    return pool;
  })
  .catch(err => {
    console.error("❌ DB Connection Failed:", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise
};