const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const palyaUploadsDir = path.join(__dirname, "..", "uploads", "palya");
if (!fs.existsSync(palyaUploadsDir)) {
  fs.mkdirSync(palyaUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, palyaUploadsDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext && [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "palya-" + unique + safeExt);
  },
});

const imageFileFilter = (_req, file, cb) => {
  if (!file || !file.mimetype) {
    return cb(new Error("Érvénytelen fájl"));
  }
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  return cb(new Error("Csak kep fajlok tolthetők fel"));
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});

router.post("/upload-images", upload.array("images", 8), async (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({ error: "Nincs feltöltött kép" });
    }

    const urls = files.map((file) => "/uploads/palya/" + file.filename);
    return res.status(201).json({ message: "Képek sikeresen feltöltve", urls });
  } catch (error) {
    console.error("Pályakép-feltöltési hiba:", error);
    return res.status(500).json({ error: "Képfeltöltés sikertelen" });
  }
});

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

// ===== ÖSSZES PÁLYA LEKÉRÉSE SZŰRÉSEKKEL =====
router.get("/", async (req, res) => {
  try {
    const { sportag, helyszin, maxar, datum } = req.query;
    
    const pool = await poolPromise;
    let query = `
      SELECT p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.leiras, 
             p.kep_url, p.nyitas, p.zaras, p.letrehozva,
             ISNULL(p.felfuggesztve, 0) AS felfuggesztve,
             f.username, f.teljes_nev, f.profil_kep_url
      FROM Palya p
      JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
      WHERE ISNULL(p.felfuggesztve, 0) = 0
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

// ===== TULAJ SAJÁT PÁLYÁI =====
router.get("/owner/:tulaj_id", async (req, res) => {
  try {
    const tulajId = parseInt(req.params.tulaj_id, 10);
    if (!tulajId) {
      return res.status(400).json({ error: "Érvénytelen tulajdonos ID" });
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
    console.error("Tulaj pályáinak lekérési hiba:", error);
    return res.status(500).json({ error: "Tulaj pályáinak lekérése sikertelen" });
  }
});

// ===== EGYETLEN PÁLYA LEKÉRÉSE =====
// ===== ADMIN PÁLYÁK LISTÁJA (PÁLYA ID/FELHASZNÁLÓNÉV SZŰRÉS) =====
router.get("/admin/list", async (req, res) => {
  try {
    const adminId = parseInt(req.query.admin_id, 10);
    const palyaId = parseInt(req.query.palya_id, 10);
    const username = String(req.query.username || "").trim();

    if (!adminId) {
      return res.status(400).json({ error: "Hiányzó admin_id" });
    }
    if (!(await adminE(adminId))) {
      return res.status(403).json({ error: "Nincs jogosultság" });
    }

    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.letrehozva,
        ISNULL(p.felfuggesztve, 0) AS felfuggesztve,
        p.felfuggesztes_indok,
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
    console.error("Admin pályalista hiba:", error);
    return res.status(500).json({ error: "Admin pályalista lekérése sikertelen" });
  }
});

// ===== ADMIN PALYA TORLES =====
router.delete("/admin/:id", async (req, res) => {
  try {
    const adminId = parseInt(req.query.admin_id, 10);
    const palyaId = parseInt(req.params.id, 10);
    const torlesIndok = String(req.body.torles_indok || "").trim();

    if (!adminId || !palyaId) {
      return res.status(400).json({ error: "Hiányzó admin_id vagy palya_id" });
    }
    if (!torlesIndok) {
      return res.status(400).json({ error: "A törlés indoka kötelező" });
    }
    if (!(await adminE(adminId))) {
      return res.status(403).json({ error: "Nincs jogosultság" });
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
        return res.status(404).json({ error: "Pálya nem található" });
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
        return res.status(404).json({ error: "Pálya nem található" });
      }

      request.input("cimzett_id", sql.Int, tulajId);
      request.input("uzenet", sql.NVarChar(sql.MAX), ertesitesSzoveg);
      await request.query(`
        INSERT INTO Ertesites (kuldo_id, cimzett_id, uzenet, olvasott)
        VALUES (@admin_id, @cimzett_id, @uzenet, 0)
      `);

      request.input("esemeny_tipus", sql.NVarChar(100), "palya_torolve");
      await request.query(`
        INSERT INTO Log (felhasznalo_id, esemeny_tipus)
        VALUES (@admin_id, @esemeny_tipus)
      `);

      await transaction.commit();
      return res.json({ message: "Pálya sikeresen törölve" });
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }
  } catch (error) {
    console.error("Admin pálya törlési hiba:", error);
    return res.status(500).json({ error: "Admin pálya törlése sikertelen" });
  }
});

// Admin pálya felfüggesztés/feldolgozás.
router.patch("/admin/:id/suspension", async (req, res) => {
  try {
    const adminId = parseInt(req.body && req.body.admin_id, 10);
    const palyaId = parseInt(req.params.id, 10);
    const felfuggesztve = Boolean(req.body && req.body.felfuggesztve);
    const indok = String((req.body && req.body.indok) || "").trim();

    if (!adminId || !palyaId) {
      return res.status(400).json({ error: "Hiányzó admin_id vagy palya_id" });
    }
    if (!(await adminE(adminId))) {
      return res.status(403).json({ error: "Nincs jogosultság" });
    }
    if (felfuggesztve && !indok) {
      return res.status(400).json({ error: "A felfüggesztés indoka kötelező" });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input("palya_id", sql.Int, palyaId);
    request.input("admin_id", sql.Int, adminId);
    request.input("indok", sql.NVarChar(1500), indok || null);
    request.input("felfuggesztve", sql.Bit, felfuggesztve ? 1 : 0);

    const result = await request.query(`
      UPDATE Palya
      SET
        felfuggesztve = @felfuggesztve,
        felfuggesztes_indok = CASE WHEN @felfuggesztve = 1 THEN @indok ELSE NULL END,
        felfuggesztve_admin_id = CASE WHEN @felfuggesztve = 1 THEN @admin_id ELSE NULL END,
        felfuggesztve_datum = CASE WHEN @felfuggesztve = 1 THEN SYSDATETIME() ELSE NULL END
      WHERE palya_id = @palya_id;
      SELECT @@ROWCOUNT AS affected;
    `);

    if (!result.recordset[0] || result.recordset[0].affected === 0) {
      return res.status(404).json({ error: "Pálya nem található" });
    }

    request.input(
      "esemeny_tipus",
      sql.NVarChar(100),
      felfuggesztve ? "palya_felfuggesztve" : "palya_felfuggesztes_feloldva"
    );
    await request.query(`
      INSERT INTO Log (felhasznalo_id, esemeny_tipus)
      VALUES (@admin_id, @esemeny_tipus)
    `);

    return res.json({
      message: felfuggesztve ? "Pálya felfüggesztve" : "Pálya felfüggesztése feloldva",
    });
  } catch (error) {
    console.error("Admin pálya felfüggesztési hiba:", error);
    return res.status(500).json({ error: "Pálya felfüggesztés frissítése sikertelen" });
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
    
    await pool
      .request()
      .input("felhasznalo_id", sql.Int, tulaj_id)
      .input("esemeny_tipus", sql.NVarChar(100), "palya_letrehozva")
      .query(`
        INSERT INTO Log (felhasznalo_id, esemeny_tipus)
        VALUES (@felhasznalo_id, @esemeny_tipus)
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
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      request.input("palya_id", sql.Int, id);

      const palyaResult = await request.query(`
        SELECT tulaj_id
        FROM Palya
        WHERE palya_id = @palya_id;
      `);

      if (!palyaResult.recordset[0]) {
        await transaction.rollback();
        return res.status(404).json({ error: "Pálya nem található" });
      }

      const tulajId = parseInt(palyaResult.recordset[0].tulaj_id, 10);

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
        return res.status(404).json({ error: "Pálya nem található" });
      }

      request.input("felhasznalo_id", sql.Int, tulajId);
      request.input("esemeny_tipus", sql.NVarChar(100), "palya_torolve");
      await request.query(`
        INSERT INTO Log (felhasznalo_id, esemeny_tipus)
        VALUES (@felhasznalo_id, @esemeny_tipus)
      `);

      await transaction.commit();

      return res.json({ message: "Pálya sikeresen törölve" });
    } catch (innerError) {
      await transaction.rollback();
      throw innerError;
    }
  } catch (error) {
    console.error("Pálya törlési hiba:", error);
    res.status(500).json({ error: "Pálya törlése sikertelen" });
  }
});

// ===== PÁLYA MÓDOSÍTÁSA =====
router.put("/:id", async (req, res) => {
  try {
    const palyaId = parseInt(req.params.id, 10);
    const { nev, sportag, helyszin, ar_ora, leiras, kep_url, nyitas, zaras } = req.body;

    if (!palyaId) {
      return res.status(400).json({ error: "Érvénytelen pálya ID" });
    }
    if (!nev || !sportag || !helyszin || !ar_ora) {
      return res.status(400).json({ error: "Hiányzó kötelező mezők: nev, sportag, helyszin, ar_ora" });
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
      return res.status(404).json({ error: "Pálya nem található" });
    }

    return res.json({ message: "Pálya sikeresen módosítva" });
  } catch (error) {
    console.error("Pálya módosítási hiba:", error);
    return res.status(500).json({ error: "Pálya módosítása sikertelen" });
  }
});

module.exports = router;
