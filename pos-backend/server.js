require("dotenv").config(); // ✅ load env

const express = require("express");
const cors = require("cors");
const { sql, poolPromise } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

console.log("ENV CHECK 👉", process.env.DB_SERVER);

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

app.get("/test", (req, res) => {
  res.send("TEST OK ✅");
});

// ================= DASHBOARD =================
///login page 

app.post("/api/login", async (req, res) => {
  try {
    let { username, password } = req.body;

    // ✅ validation
    username = username?.trim();
    password = password?.trim();

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and Password required"
      });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input("UserName", sql.VarChar, username)
      .query(`
        SELECT 
          UserCode,
          UserGroupCode,
          UserName,
          Password,
          ExpiryDate,
          Designation,
          Email,
          Phone
        FROM tblUserMaster
        WHERE LTRIM(RTRIM(UserName)) = @UserName
      `);

    // ❌ user not found
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    const user = result.recordset[0];

    // ✅ TRIM DB VALUES (VERY IMPORTANT for CHAR)
    const dbUsername = user.UserName?.trim();
    const dbPassword = user.Password?.trim();

    // 🔥 OPTIONAL: case-insensitive username
    if (
      dbUsername.toLowerCase() !== username.toLowerCase() ||
      dbPassword !== password
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // ✅ expiry check
    if (user.ExpiryDate && new Date(user.ExpiryDate) < new Date()) {
      return res.status(403).json({
        success: false,
        message: "Account expired"
      });
    }

    // ✅ success
    res.json({
      success: true,
      message: "Login successful",
      user: {
        userCode: user.UserCode,
        userGroupCode: user.UserGroupCode?.trim(),
        userName: dbUsername,
        designation: user.Designation?.trim(),
        email: user.Email?.trim(),
        phone: user.Phone?.trim()
      }
    });

  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
});

app.get("/kds-today", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        o.OrderId,
        o.OrderNumber,
        o.Tableno,
        o.OrderDateTime,
        o.IsTakeAway,

        d.OrderDetailId,
        d.DishName,
        d.Quantity,
        d.ModifierDescription,
        d.Remarks,
        d.isReady,
        d.isDelivered

      FROM RestaurantOrderCur o
      INNER JOIN RestaurantOrderDetailCur d 
        ON o.OrderId = d.OrderId

      WHERE 
        d.isReady = 0
        AND CAST(o.OrderDateTime AS DATE) = CAST(GETDATE() AS DATE)

      ORDER BY o.OrderDateTime ASC
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// app.post('/mark-ready', async (req, res) => {
//   const { orderId } = req.body;
//   try {
//     const pool = await poolPromise;
//     await pool.request()
//       // .input('orderId', sql.Int, orderId)
//       .input('orderId', sql.Int, parseInt(orderId))
//       .query("UPDATE RestaurantOrderDetailCur SET isReady = 1 WHERE OrderId = @orderId");

//     res.json({ success: true, message: `Order ${orderId} marked as ready` });
//   } catch (err) {
//     console.error('Database update error:', err);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// });

app.post('/mark-ready', async (req, res) => {
  console.log("Incoming body:", req.body);

  const { orderId } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('orderId', sql.UniqueIdentifier, orderId) // ✅ FIX HERE
      .query(`
        UPDATE RestaurantOrderDetailCur 
        SET isReady = 1 
        WHERE OrderId = @orderId
      `);

    console.log("Rows affected:", result.rowsAffected);

    res.json({
      success: true,
      message: `Order ${orderId} marked as ready`
    });

  } catch (err) {
    console.error('Database update error:', err); // 👈 check this log
    res.status(500).json({
      success: false,
      message: err.message // 👈 show real error
    });
  }
});
// ================= PORT =================

const PORT = process.env.PORT || 3000;

// const PORT = 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});