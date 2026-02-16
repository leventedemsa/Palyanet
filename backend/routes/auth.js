const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcrypt");
const config = require("../dbconfig");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, jelszo } = req.body;

  if (!email || !jelszo) {
    return res.status(400).json({ success: false, error: "Email és jelszó kötelező" });
  }

  try {
    const pool = await sql.connect(config);

    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`
        SELECT 
          felhasznalo_id,
          nev,
          email,
          jelszo_hash,
          szerep,
          aktiv
        FROM Felhasznalok
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      pool.close();
      return res.status(401).json({ success: false, error: "Hibás email vagy jelszó" });
    }

    const user = result.recordset[0];

    if (!user.aktiv) {
      pool.close();
      return res.status(403).json({ success: false, error: "A fiók inaktív" });
    }

    const ok = await bcrypt.compare(jelszo, user.jelszo_hash);

    if (!ok) {
      pool.close();
      return res.status(401).json({ success: false, error: "Hibás email vagy jelszó" });
    }

    pool.close();
    return res.json({
      success: true,
      user: {
        id: user.felhasznalo_id,
        nev: user.nev,
        email: user.email,
        szerep: user.szerep,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Szerver hiba" });
  }
});

module.exports = router;