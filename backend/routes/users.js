const express = require("express");
const sql = require("mssql");
const config = require("../dbconfig");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
        SELECT
            felhasznalo_id AS id,
            nev,
            email,
            szerep
        FROM Felhasznalok
        ORDER BY felhasznalo_id
    `);

    pool.close();

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Szerver hiba",
    });
  }
});

router.post("/register", async (req, res) => {
  const { nev, email } = req.body;

  if (!nev || !email) {
    return res.status(400).json({
      success: false,
      error: "A név és email kötelező!",
    });
  }

  try {
    const pool = await sql.connect(config);
    const existingUser = await pool.request().input("email", sql.NVarChar(255), email).query(`
      SELECT * FROM Felhasznalok
      WHERE email = @email
      `);

    if (existingUser.recordset.length > 0) {
      pool.close();
      return res.status(409).json({
        success: false,
        error: "Ez az email már regisztrálva van!",
      });
    }

    const result = await pool.request().input("nev", sql.NVarChar(100), nev).input("email", sql.NVarChar(255), email).query(`
        INSERT INTO Felhasznalok (nev, email)
        OUTPUT INSERTED.felhasznalo_id AS id, INSERTED.nev, INSERTED.email
        VALUES (@nev, @email)
        `);

    pool.close();

    res.status(201).json({
      success: true,
      message: "Sikeres regisztráció!",
      data: result.recordset[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Szerver hiba",
    });
  }
});
module.exports = router;
