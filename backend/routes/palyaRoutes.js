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

// ===== TULAJ SAJAT PALYAI =====
router.get("/owner/:tulaj_id", async (req, res) => {
  try {
    const tulajId = parseInt(req.params.tulaj_id, 10);
    if (!tulajId) {
      return res.status(400).json({ error: "Ervenytelen tulajdonos ID" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("tulaj_id", sql.Int, tulajId)
      .query(`
        SELECT p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.leiras,
               p.kep_url, p.nyitas, p.zaras, p.letrehozva,
               COUNT(f.foglalas_id) AS foglalasok_szama
        FROM Palya p
        LEFT JOIN Foglalas f ON f.palya_id = p.palya_id
        WHERE p.tulaj_id = @tulaj_id
        GROUP BY p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.leiras, p.kep_url, p.nyitas, p.zaras, p.letrehozva
        ORDER BY p.letrehozva DESC
      `);

    return res.json(result.recordset);
  } catch (error) {
    console.error("Tulaj palyainak lekerese hiba:", error);
    return res.status(500).json({ error: "Tulaj palyainak lekerese sikertelen" });
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

// ===== PALYA MODOSITASA =====
router.put("/:id", async (req, res) => {
  try {
    const palyaId = parseInt(req.params.id, 10);
    const { nev, sportag, helyszin, ar_ora, leiras, kep_url, nyitas, zaras } = req.body;

    if (!palyaId) {
      return res.status(400).json({ error: "Ervenytelen palya ID" });
    }
    if (!nev || !sportag || !helyszin || !ar_ora) {
      return res.status(400).json({ error: "Hianyzo kotelezo mezok: nev, sportag, helyszin, ar_ora" });
    }

    const nyitasFormatted = (nyitas && String(nyitas).trim()) ? String(nyitas).slice(0, 5) + ":00" : "08:00:00";
    const zarasFormatted = (zaras && String(zaras).trim()) ? String(zaras).slice(0, 5) + ":00" : "20:00:00";

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("palya_id", sql.Int, palyaId)
      .input("nev", sql.NVarChar, nev)
      .input("sportag", sql.NVarChar, sportag)
      .input("helyszin", sql.NVarChar, helyszin)
      .input("ar_ora", sql.Float, parseFloat(ar_ora) || 0)
      .input("leiras", sql.NVarChar, leiras || "")
      .input("kep_url", sql.NVarChar, kep_url || "")
      .input("nyitas", sql.NVarChar, nyitasFormatted)
      .input("zaras", sql.NVarChar, zarasFormatted)
      .query(`
        UPDATE Palya
        SET nev = @nev,
            sportag = @sportag,
            helyszin = @helyszin,
            ar_ora = @ar_ora,
            leiras = @leiras,
            kep_url = @kep_url,
            nyitas = CAST(@nyitas AS TIME),
            zaras = CAST(@zaras AS TIME)
        WHERE palya_id = @palya_id;

        SELECT @@ROWCOUNT AS affected;
      `);

    if (!result.recordset[0] || result.recordset[0].affected === 0) {
      return res.status(404).json({ error: "Palya nem talalhato" });
    }

    return res.json({ message: "Palya sikeresen modositva" });
  } catch (error) {
    console.error("Palya modositasi hiba:", error);
    return res.status(500).json({ error: "Palya modositasa sikertelen" });
  }
});

module.exports = router;
