const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

async function adminE(adminId) {
  const id = parseInt(adminId, 10);
  if (!id) return false;

  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("admin_id", sql.Int, id)
    .query(`
      SELECT felhasznalo_id
      FROM Felhasznalok
      WHERE felhasznalo_id = @admin_id
        AND szerep = N'admin'
    `);

  return result.recordset.length > 0;
}

// ===== Ã–SSZES PÃLYA LEKÃ‰RÃ‰SE SZÅ°RÃ‰SEKKEL =====
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
    console.error("PÃ¡lya lekÃ©rÃ©si hiba:", error);
    res.status(500).json({ error: "PÃ¡lya lekÃ©rÃ©se sikertelen" });
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

// ===== EGYETLEN PÃLYA LEKÃ‰RÃ‰SE =====
// ===== ADMIN PALYAK LISTAJA (PALYA ID/FELHASZNALONEV SZURES) =====
router.get("/admin/list", async (req, res) => {
  try {
    const adminId = parseInt(req.query.admin_id, 10);
    const palyaId = parseInt(req.query.palya_id, 10);
    const username = String(req.query.username || "").trim();

    if (!adminId) {
      return res.status(400).json({ error: "Hianyzo admin_id" });
    }
    if (!(await adminE(adminId))) {
      return res.status(403).json({ error: "Nincs jogosultsag" });
    }

    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.letrehozva,
        f.felhasznalo_id AS tulaj_id, f.username, f.teljes_nev
      FROM Palya p
      JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
      WHERE 1=1
    `;

    if (palyaId) {
      query += " AND p.palya_id = @palya_id";
      request.input("palya_id", sql.Int, palyaId);
    }
    if (username) {
      query += " AND f.username LIKE @username";
      request.input("username", sql.NVarChar(50), `%${username}%`);
    }
    query += " ORDER BY p.letrehozva DESC";

    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (error) {
    console.error("Admin palya lista hiba:", error);
    return res.status(500).json({ error: "Admin palya lista lekerese sikertelen" });
  }
});

// ===== ADMIN PALYA TORLES =====
router.delete("/admin/:id", async (req, res) => {
  try {
    const adminId = parseInt(req.query.admin_id, 10);
    const palyaId = parseInt(req.params.id, 10);
    const torlesIndok = String(req.body.torles_indok || "").trim();

    if (!adminId || !palyaId) {
      return res.status(400).json({ error: "Hianyzo admin_id vagy palya_id" });
    }
    if (!torlesIndok) {
      return res.status(400).json({ error: "A torles indoka kotelezo" });
    }
    if (!(await adminE(adminId))) {
      return res.status(403).json({ error: "Nincs jogosultsag" });
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      request.input("palya_id", sql.Int, palyaId);
      request.input("admin_id", sql.Int, adminId);
      request.input("indok", sql.NVarChar(1500), torlesIndok);

      const palyaEredmeny = await request.query(`
        SELECT p.palya_id, p.nev, p.tulaj_id, f.username
        FROM Palya p
        JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
        WHERE p.palya_id = @palya_id
      `);

      if (!palyaEredmeny.recordset[0]) {
        await transaction.rollback();
        return res.status(404).json({ error: "Palya nem talalhato" });
      }

      const palya = palyaEredmeny.recordset[0];
      const tulajId = parseInt(palya.tulaj_id, 10);
      const ertesitesSzoveg = `A(z) "${palya.nev}" pályád admin által törölve lett. Indok: ${torlesIndok}`;

      await request.query(`
        DELETE FROM Bejelentesek WHERE palya_id = @palya_id;
        DELETE FROM Foglalas WHERE palya_id = @palya_id;
      `);

      const result = await request.query(`
        DELETE FROM Palya WHERE palya_id = @palya_id;
        SELECT @@ROWCOUNT AS affected;
      `);

      if (!result.recordset[0] || result.recordset[0].affected === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: "Palya nem talalhato" });
      }

      request.input("cimzett_id", sql.Int, tulajId);
      request.input("uzenet", sql.NVarChar(sql.MAX), ertesitesSzoveg);
      await request.query(`
        INSERT INTO Ertesites (kuldo_id, cimzett_id, uzenet, olvasott)
        VALUES (@admin_id, @cimzett_id, @uzenet, 0)
      `);

      await transaction.commit();
      return res.json({ message: "Palya sikeresen torolve" });
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }
  } catch (error) {
    console.error("Admin palya torles hiba:", error);
    return res.status(500).json({ error: "Admin palya torles sikertelen" });
  }
});

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
      return res.status(404).json({ error: "PÃ¡lya nem talÃ¡lhatÃ³" });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("PÃ¡lya lekÃ©rÃ©si hiba:", error);
    res.status(500).json({ error: "PÃ¡lya lekÃ©rÃ©se sikertelen" });
  }
});

// ===== ÃšJ PÃLYA LÃ‰TREHOZÃSA =====
router.post("/", async (req, res) => {
  try {
    const { tulaj_id, nev, sportag, helyszin, ar_ora, leiras, kep_url, nyitas, zaras } = req.body;
    
    console.log("POST adatok:", { tulaj_id, nev, sportag, helyszin, ar_ora });
    
    // ValidÃ¡ciÃ³
    if (!nev || !sportag || !helyszin || !ar_ora) {
      console.log("ValidÃ¡ciÃ³s hiba: hiÃ¡nyzÃ³ kÃ¶telezÅ‘ mezÅ‘");
      return res.status(400).json({ error: "HiÃ¡nyzÃ³ kÃ¶telezÅ‘ mezÅ‘k: nev, sportag, helyszin, ar_ora" });
    }

    if (!tulaj_id || tulaj_id < 1) {
      console.log("ValidÃ¡ciÃ³s hiba: invalid tulaj_id");
      return res.status(400).json({ error: "Ã‰rvÃ©nytelen felhasznÃ¡lÃ³ ID" });
    }

    // Time formÃ¡tum konverziÃ³: HH:MM -> HH:MM:SS
    let nyitas_formatted = (nyitas && nyitas.trim()) ? nyitas + ":00" : "";
    let zaras_formatted = (zaras && zaras.trim()) ? zaras + ":00" : "";
    
    console.log("IdÅ‘mezÅ‘k konverziÃ³ - nyitas:", nyitas_formatted, "zaras:", zaras_formatted);
    
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
    
    console.log("PÃ¡lya sikeresen hozzÃ¡adva, ID:", result.recordset[0].palya_id);
    res.status(201).json({
      message: "PÃ¡lya sikeresen lÃ©trehozva",
      palya_id: result.recordset[0].palya_id
    });
  } catch (error) {
    console.error("PÃ¡lya lÃ©trehozÃ¡si hiba:", error);
    res.status(500).json({ error: "PÃ¡lya lÃ©trehozÃ¡sa sikertelen: " + error.message });
  }
});

// ===== PÃLYA TÃ–RLÃ‰SE =====
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      request.input("palya_id", sql.Int, id);

      await request.query(`
        DELETE FROM Bejelentesek WHERE palya_id = @palya_id;
        DELETE FROM Foglalas WHERE palya_id = @palya_id;
      `);

      await request.query("DELETE FROM Palya WHERE palya_id = @palya_id");
      await transaction.commit();

      res.json({ message: "Palya sikeresen torolve" });
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }
  } catch (error) {
    console.error("Palya torlesi hiba:", error);
    res.status(500).json({ error: "Palya torlese sikertelen" });
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

