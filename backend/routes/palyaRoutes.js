const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ===== ÖSSZES PÁLYA LEKÉRÉSE SZŰRÉSEKKEL =====
router.get("/", async (req, res) => {
  try {
    const { sportag, helyszin, maxar, datum } = req.query;
    
    const pool = await poolPromise;
    let query = `
      SELECT p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.leiras, 
             p.kep_url, p.nyitas, p.zaras, p.letrehozva,
             f.username, f.teljes_nev, f.profil_kep_url
      FROM Palya p
      JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
      WHERE 1=1
    `;
    
    if (sportag) {
      query += ` AND p.sportag = @sportag`;
    }
    if (helyszin) {
      query += ` AND p.helyszin LIKE @helyszin`;
    }
    if (maxar) {
      query += ` AND p.ar_ora <= @maxar`;
    }
    
    query += ` ORDER BY p.letrehozva DESC`;
    
    const request = pool.request();
    if (sportag) request.input("sportag", sql.NVarChar, sportag);
    if (helyszin) request.input("helyszin", sql.NVarChar, `%${helyszin}%`);
    if (maxar) request.input("maxar", sql.Int, parseInt(maxar));
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Pálya lekérési hiba:", error);
    res.status(500).json({ error: "Pálya lekérése sikertelen" });
  }
});

// ===== EGYETLEN PÁLYA LEKÉRÉSE =====
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .input("palya_id", sql.Int, id)
      .query(`
        SELECT p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.leiras, 
               p.kep_url, p.nyitas, p.zaras, p.letrehozva,
               f.username, f.teljes_nev, f.profil_kep_url
        FROM Palya p
        JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
        WHERE p.palya_id = @palya_id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Pálya nem található" });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Pálya lekérési hiba:", error);
    res.status(500).json({ error: "Pálya lekérése sikertelen" });
  }
});

// ===== ÚJ PÁLYA LÉTREHOZÁSA =====
router.post("/", async (req, res) => {
  try {
    const { tulaj_id, nev, sportag, helyszin, ar_ora, leiras, kep_url, nyitas, zaras } = req.body;
    
    console.log("POST adatok:", { tulaj_id, nev, sportag, helyszin, ar_ora });
    
    // Validáció
    if (!nev || !sportag || !helyszin || !ar_ora) {
      console.log("Validációs hiba: hiányzó kötelező mező");
      return res.status(400).json({ error: "Hiányzó kötelező mezők: nev, sportag, helyszin, ar_ora" });
    }

    if (!tulaj_id || tulaj_id < 1) {
      console.log("Validációs hiba: invalid tulaj_id");
      return res.status(400).json({ error: "Érvénytelen felhasználó ID" });
    }

    // Time formátum konverzió: HH:MM -> HH:MM:SS
    let nyitas_formatted = (nyitas && nyitas.trim()) ? nyitas + ":00" : "";
    let zaras_formatted = (zaras && zaras.trim()) ? zaras + ":00" : "";
    
    console.log("Időmezők konverzió - nyitas:", nyitas_formatted, "zaras:", zaras_formatted);
    
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .input("tulaj_id", sql.Int, tulaj_id)
      .input("nev", sql.NVarChar, nev)
      .input("sportag", sql.NVarChar, sportag)
      .input("helyszin", sql.NVarChar, helyszin)
      .input("ar_ora", sql.Float, parseFloat(ar_ora) || 0)
      .input("leiras", sql.NVarChar, leiras || "")
      .input("kep_url", sql.NVarChar, kep_url || "")
      .input("nyitas", sql.NVarChar, nyitas_formatted || "")
      .input("zaras", sql.NVarChar, zaras_formatted || "")
      .query(`
        INSERT INTO Palya (tulaj_id, nev, sportag, helyszin, ar_ora, leiras, kep_url, nyitas, zaras, letrehozva)
        VALUES (@tulaj_id, @nev, @sportag, @helyszin, @ar_ora, @leiras, @kep_url, 
                CAST(@nyitas AS TIME), CAST(@zaras AS TIME), GETDATE());
        SELECT SCOPE_IDENTITY() AS palya_id;
      `);
    
    console.log("Pálya sikeresen hozzáadva, ID:", result.recordset[0].palya_id);
    res.status(201).json({
      message: "Pálya sikeresen létrehozva",
      palya_id: result.recordset[0].palya_id
    });
  } catch (error) {
    console.error("Pálya létrehozási hiba:", error);
    res.status(500).json({ error: "Pálya létrehozása sikertelen: " + error.message });
  }
});

// ===== PÁLYA TÖRLÉSE =====
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool
      .request()
      .input("palya_id", sql.Int, id)
      .query("DELETE FROM Palya WHERE palya_id = @palya_id");
    
    res.json({ message: "Pálya sikeresen törölve" });
  } catch (error) {
    console.error("Pálya törlési hiba:", error);
    res.status(500).json({ error: "Pálya törlése sikertelen" });
  }
});

module.exports = router;
