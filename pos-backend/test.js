const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function test() {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query(`
      SELECT TOP 1
    CASE
        WHEN DENSE_RANK() OVER (
            PARTITION BY o.OrderNumber
            ORDER BY d.CreatedOn
        ) = 1 THEN 'GREEN'
        ELSE 'RED'
    END AS colour
FROM RestaurantOrderCur o
INNER JOIN RestaurantOrderDetailCur d
    ON o.OrderId = d.OrderId
    `);
    console.log("TEST RESULT:", result.recordset);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
