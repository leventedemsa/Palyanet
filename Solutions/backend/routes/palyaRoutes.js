const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const palyaFeltoltesiKonyvtar = path.join(__dirname, "..", "uploads", "palya");
if (!fs.existsSync(palyaFeltoltesiKonyvtar)) {
  fs.mkdirSync(palyaFeltoltesiKonyvtar, { recursive: true });
}

const tarolo = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, palyaFeltoltesiKonyvtar);
  },
  filename: function (_req, file, cb) {
    const kiterjesztes = path.extname(file.originalname || "").toLowerCase();
    const biztonsagosKiterjesztes =
      kiterjesztes && [".jpg", ".jpeg", ".png", ".webp"].includes(kiterjesztes)
        ? kiterjesztes
        : ".jpg";
    const egyediAzonosito = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "palya-" + egyediAzonosito + biztonsagosKiterjesztes);
  },
});

const kepFajlSzuro = (_req, file, cb) => {
  if (!file || !file.mimetype) {
    return cb(new Error("Érvénytelen fájl"));
  }
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  return cb(new Error("Csak kep fajlok tolthetők fel"));
};

const feltolto = multer({
  storage: tarolo,
  fileFilter: kepFajlSzuro,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});

// Pályaképek feltöltése.
router.post("/upload-images", feltolto.array("images", 8), async (req, res) => {
  try {
    const fajlok = Array.isArray(req.files) ? req.files : [];
    if (!fajlok.length) {
      return res.status(400).json({ error: "Nincs feltöltött kép" });
    }

    const urlLista = fajlok.map((fajl) => "/uploads/palya/" + fajl.filename);
    return res.status(201).json({ message: "Képek sikeresen feltöltve", urls: urlLista });
  } catch (hiba) {
    console.error("Pályakép-feltöltési hiba:", hiba);
    return res.status(500).json({ error: "Képfeltöltés sikertelen" });
  }
});

// Ellenőrzi, hogy az adott felhasználó admin jogosultságú-e.
async function adminJogosultsagEllenorzes(adminAzonosito) {
  const feldolgozottAdminAzonosito = parseInt(adminAzonosito, 10);
  if (!feldolgozottAdminAzonosito) return false;

  const kapcsolat = await poolPromise;
  const lekerdezesEredmenye = await kapcsolat
    .request()
    .input("admin_id", sql.Int, feldolgozottAdminAzonosito)
    .query(`
      SELECT felhasznalo_id
      FROM Felhasznalok
      WHERE felhasznalo_id = @admin_id
        AND szerep = N'admin'
    `);

  return lekerdezesEredmenye.recordset.length > 0;
}

// ===== ÖSSZES PÁLYA LEKÉRÉSE SZŰRÉSEKKEL =====
router.get("/", async (req, res) => {
  try {
    const { sportag, helyszin, maxar } = req.query;
    
    const kapcsolat = await poolPromise;
    let lekerdezes = `
      SELECT p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.leiras, 
             p.kep_url, p.nyitas, p.zaras, p.letrehozva,
             ISNULL(p.felfuggesztve, 0) AS felfuggesztve,
             f.username, f.teljes_nev, f.profil_kep_url, f.email
      FROM Palya p
      JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
      WHERE ISNULL(p.felfuggesztve, 0) = 0
    `;
    
    if (sportag) {
      lekerdezes += ` AND p.sportag = @sportag`;
    }
    if (helyszin) {
      lekerdezes += ` AND p.helyszin LIKE @helyszin`;
    }
    if (maxar) {
      lekerdezes += ` AND p.ar_ora <= @maxar`;
    }
    
    lekerdezes += ` ORDER BY p.letrehozva DESC`;
    
    const lekeres = kapcsolat.request();
    if (sportag) lekeres.input("sportag", sql.NVarChar, sportag);
    if (helyszin) lekeres.input("helyszin", sql.NVarChar, `%${helyszin}%`);
    if (maxar) lekeres.input("maxar", sql.Int, parseInt(maxar, 10));
    
    const lekerdezesEredmenye = await lekeres.query(lekerdezes);
    res.json(lekerdezesEredmenye.recordset);
  } catch (hiba) {
    console.error("Pálya lekérési hiba:", hiba);
    res.status(500).json({ error: "Pálya lekérése sikertelen" });
  }
});

// ===== TULAJ SAJÁT PÁLYÁI =====
router.get("/owner/:tulaj_id", async (req, res) => {
  try {
    const tulajdonosAzonosito = parseInt(req.params.tulaj_id, 10);
    if (!tulajdonosAzonosito) {
      return res.status(400).json({ error: "Érvénytelen tulajdonos ID" });
    }

    const kapcsolat = await poolPromise;
    const lekerdezesEredmenye = await kapcsolat
      .request()
      .input("tulaj_id", sql.Int, tulajdonosAzonosito)
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

    return res.json(lekerdezesEredmenye.recordset);
  } catch (hiba) {
    console.error("Tulaj pályáinak lekérési hiba:", hiba);
    return res.status(500).json({ error: "Tulaj pályáinak lekérése sikertelen" });
  }
});

// ===== EGYETLEN PÁLYA LEKÉRÉSE =====
// ===== ADMIN PÁLYÁK LISTÁJA (PÁLYA ID/FELHASZNÁLÓNÉV SZŰRÉS) =====
router.get("/admin/list", async (req, res) => {
  try {
    const adminAzonosito = parseInt(req.query.admin_id, 10);
    const palyaAzonosito = parseInt(req.query.palya_id, 10);
    const felhasznalonev = String(req.query.username || "").trim();

    if (!adminAzonosito) {
      return res.status(400).json({ error: "Hiányzó admin_id" });
    }
    if (!(await adminJogosultsagEllenorzes(adminAzonosito))) {
      return res.status(403).json({ error: "Nincs jogosultság" });
    }

    const kapcsolat = await poolPromise;
    const lekeres = kapcsolat.request();
    let lekerdezes = `
      SELECT
        p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.letrehozva,
        ISNULL(p.felfuggesztve, 0) AS felfuggesztve,
        p.felfuggesztes_indok,
        f.felhasznalo_id AS tulaj_id, f.username, f.teljes_nev, f.email
      FROM Palya p
      JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
      WHERE 1=1
    `;

    if (palyaAzonosito) {
      lekerdezes += " AND p.palya_id = @palya_id";
      lekeres.input("palya_id", sql.Int, palyaAzonosito);
    }
    if (felhasznalonev) {
      lekerdezes += " AND f.username LIKE @username";
      lekeres.input("username", sql.NVarChar(50), `%${felhasznalonev}%`);
    }
    lekerdezes += " ORDER BY p.letrehozva DESC";

    const lekerdezesEredmenye = await lekeres.query(lekerdezes);
    return res.json(lekerdezesEredmenye.recordset);
  } catch (hiba) {
    console.error("Admin pályalista hiba:", hiba);
    return res.status(500).json({ error: "Admin pályalista lekérése sikertelen" });
  }
});

// ===== ADMIN PALYA TORLES =====
router.delete("/admin/:id", async (req, res) => {
  try {
    const adminAzonosito = parseInt(req.query.admin_id, 10);
    const palyaAzonosito = parseInt(req.params.id, 10);
    const torlesIndoklas = String(req.body.torles_indok || "").trim();

    if (!adminAzonosito || !palyaAzonosito) {
      return res.status(400).json({ error: "Hiányzó admin_id vagy palya_id" });
    }
    if (!torlesIndoklas) {
      return res.status(400).json({ error: "A törlés indoka kötelező" });
    }
    if (!(await adminJogosultsagEllenorzes(adminAzonosito))) {
      return res.status(403).json({ error: "Nincs jogosultság" });
    }

    const kapcsolat = await poolPromise;
    const tranzakcio = new sql.Transaction(kapcsolat);
    await tranzakcio.begin();

    try {
      const lekeres = new sql.Request(tranzakcio);
      lekeres.input("palya_id", sql.Int, palyaAzonosito);
      lekeres.input("admin_id", sql.Int, adminAzonosito);
      lekeres.input("indok", sql.NVarChar(1500), torlesIndoklas);

      const palyaEredmeny = await lekeres.query(`
        SELECT p.palya_id, p.nev, p.tulaj_id, f.username
        FROM Palya p
        JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
        WHERE p.palya_id = @palya_id
      `);

      if (!palyaEredmeny.recordset[0]) {
        await tranzakcio.rollback();
        return res.status(404).json({ error: "Pálya nem található" });
      }

      const talaltPalya = palyaEredmeny.recordset[0];
      const tulajdonosAzonosito = parseInt(talaltPalya.tulaj_id, 10);
      const ertesitesSzoveg = `A(z) "${talaltPalya.nev}" pályád admin által törölve lett. Indok: ${torlesIndoklas}`;

      await lekeres.query(`
        DELETE FROM Bejelentesek WHERE palya_id = @palya_id;
        DELETE FROM Foglalas WHERE palya_id = @palya_id;
      `);

      const torlesEredmenye = await lekeres.query(`
        DELETE FROM Palya WHERE palya_id = @palya_id;
        SELECT @@ROWCOUNT AS affected;
      `);

      if (!torlesEredmenye.recordset[0] || torlesEredmenye.recordset[0].affected === 0) {
        await tranzakcio.rollback();
        return res.status(404).json({ error: "Pálya nem található" });
      }

      lekeres.input("cimzett_id", sql.Int, tulajdonosAzonosito);
      lekeres.input("uzenet", sql.NVarChar(sql.MAX), ertesitesSzoveg);
      await lekeres.query(`
        INSERT INTO Ertesites (kuldo_id, cimzett_id, uzenet, olvasott)
        VALUES (@admin_id, @cimzett_id, @uzenet, 0)
      `);

      lekeres.input("esemeny_tipus", sql.NVarChar(100), "palya_torolve");
      await lekeres.query(`
        INSERT INTO Log (felhasznalo_id, esemeny_tipus)
        VALUES (@admin_id, @esemeny_tipus)
      `);

      await tranzakcio.commit();
      return res.json({ message: "Pálya sikeresen törölve" });
    } catch (belsoHiba) {
      await tranzakcio.rollback();
      throw belsoHiba;
    }
  } catch (hiba) {
    console.error("Admin pálya törlési hiba:", hiba);
    return res.status(500).json({ error: "Admin pálya törlése sikertelen" });
  }
});

// Admin pálya felfüggesztés/feldolgozás.
router.patch("/admin/:id/suspension", async (req, res) => {
  try {
    const adminAzonosito = parseInt(req.body && req.body.admin_id, 10);
    const palyaAzonosito = parseInt(req.params.id, 10);
    const felfuggesztve = Boolean(req.body && req.body.felfuggesztve);
    const indoklas = String((req.body && req.body.indok) || "").trim();

    if (!adminAzonosito || !palyaAzonosito) {
      return res.status(400).json({ error: "Hiányzó admin_id vagy palya_id" });
    }
    if (!(await adminJogosultsagEllenorzes(adminAzonosito))) {
      return res.status(403).json({ error: "Nincs jogosultság" });
    }
    if (felfuggesztve && !indoklas) {
      return res.status(400).json({ error: "A felfüggesztés indoka kötelező" });
    }

    const kapcsolat = await poolPromise;
    const lekeres = kapcsolat.request();
    lekeres.input("palya_id", sql.Int, palyaAzonosito);
    lekeres.input("admin_id", sql.Int, adminAzonosito);
    lekeres.input("indok", sql.NVarChar(1500), indoklas || null);
    lekeres.input("felfuggesztve", sql.Bit, felfuggesztve ? 1 : 0);

    const frissitesEredmenye = await lekeres.query(`
      UPDATE Palya
      SET
        felfuggesztve = @felfuggesztve,
        felfuggesztes_indok = CASE WHEN @felfuggesztve = 1 THEN @indok ELSE NULL END,
        felfuggesztve_admin_id = CASE WHEN @felfuggesztve = 1 THEN @admin_id ELSE NULL END,
        felfuggesztve_datum = CASE WHEN @felfuggesztve = 1 THEN SYSDATETIME() ELSE NULL END
      WHERE palya_id = @palya_id;
      SELECT @@ROWCOUNT AS affected;
    `);

    if (!frissitesEredmenye.recordset[0] || frissitesEredmenye.recordset[0].affected === 0) {
      return res.status(404).json({ error: "Pálya nem található" });
    }

    lekeres.input(
      "esemeny_tipus",
      sql.NVarChar(100),
      felfuggesztve ? "palya_felfuggesztve" : "palya_felfuggesztes_feloldva"
    );
    await lekeres.query(`
      INSERT INTO Log (felhasznalo_id, esemeny_tipus)
      VALUES (@admin_id, @esemeny_tipus)
    `);

    return res.json({
      message: felfuggesztve ? "Pálya felfüggesztve" : "Pálya felfüggesztése feloldva",
    });
  } catch (hiba) {
    console.error("Admin pálya felfüggesztési hiba:", hiba);
    return res.status(500).json({ error: "Pálya felfüggesztés frissítése sikertelen" });
  }
});

// Egy adott pálya részletes lekérése.
router.get("/:id", async (req, res) => {
  try {
    const palyaAzonosito = req.params.id;
    const kapcsolat = await poolPromise;
    
    const lekerdezesEredmenye = await kapcsolat
      .request()
      .input("palya_id", sql.Int, palyaAzonosito)
      .query(`
        SELECT p.palya_id, p.nev, p.sportag, p.helyszin, p.ar_ora, p.leiras, 
               p.kep_url, p.nyitas, p.zaras, p.letrehozva,
               f.username, f.teljes_nev, f.profil_kep_url, f.email
        FROM Palya p
        JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
        WHERE p.palya_id = @palya_id
      `);
    
    if (lekerdezesEredmenye.recordset.length === 0) {
      return res.status(404).json({ error: "Pálya nem található" });
    }
    
    res.json(lekerdezesEredmenye.recordset[0]);
  } catch (hiba) {
    console.error("Pálya lekérési hiba:", hiba);
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
    let nyitasFormazott = (nyitas && nyitas.trim()) ? nyitas + ":00" : "";
    let zarasFormazott = (zaras && zaras.trim()) ? zaras + ":00" : "";
    
    console.log("Időmezők konverzió - nyitas:", nyitasFormazott, "zaras:", zarasFormazott);
    
    const kapcsolat = await poolPromise;
    
    const lekerdezesEredmenye = await kapcsolat
      .request()
      .input("tulaj_id", sql.Int, tulaj_id)
      .input("nev", sql.NVarChar, nev)
      .input("sportag", sql.NVarChar, sportag)
      .input("helyszin", sql.NVarChar, helyszin)
      .input("ar_ora", sql.Float, parseFloat(ar_ora) || 0)
      .input("leiras", sql.NVarChar, leiras || "")
      .input("kep_url", sql.NVarChar, kep_url || "")
      .input("nyitas", sql.NVarChar, nyitasFormazott || "")
      .input("zaras", sql.NVarChar, zarasFormazott || "")
      .query(`
        INSERT INTO Palya (tulaj_id, nev, sportag, helyszin, ar_ora, leiras, kep_url, nyitas, zaras, letrehozva)
        VALUES (@tulaj_id, @nev, @sportag, @helyszin, @ar_ora, @leiras, @kep_url, 
                CAST(@nyitas AS TIME), CAST(@zaras AS TIME), GETDATE());
        SELECT SCOPE_IDENTITY() AS palya_id;
      `);
    
    await kapcsolat
      .request()
      .input("felhasznalo_id", sql.Int, tulaj_id)
      .input("esemeny_tipus", sql.NVarChar(100), "palya_letrehozva")
      .query(`
        INSERT INTO Log (felhasznalo_id, esemeny_tipus)
        VALUES (@felhasznalo_id, @esemeny_tipus)
      `);

    console.log("Pálya sikeresen hozzáadva, ID:", lekerdezesEredmenye.recordset[0].palya_id);
    res.status(201).json({
      message: "Pálya sikeresen létrehozva",
      palya_id: lekerdezesEredmenye.recordset[0].palya_id
    });
  } catch (hiba) {
    console.error("Pálya létrehozási hiba:", hiba);
    res.status(500).json({ error: "Pálya létrehozása sikertelen: " + hiba.message });
  }
});

// ===== PÁLYA TÖRLÉSE =====
router.delete("/:id", async (req, res) => {
  try {
    const palyaAzonosito = req.params.id;
    const kapcsolat = await poolPromise;
    const tranzakcio = new sql.Transaction(kapcsolat);
    await tranzakcio.begin();

    try {
      const lekeres = new sql.Request(tranzakcio);
      lekeres.input("palya_id", sql.Int, palyaAzonosito);

      const palyaEredmenye = await lekeres.query(`
        SELECT tulaj_id
        FROM Palya
        WHERE palya_id = @palya_id;
      `);

      if (!palyaEredmenye.recordset[0]) {
        await tranzakcio.rollback();
        return res.status(404).json({ error: "Pálya nem található" });
      }

      const tulajdonosAzonosito = parseInt(palyaEredmenye.recordset[0].tulaj_id, 10);

      await lekeres.query(`
        DELETE FROM Bejelentesek WHERE palya_id = @palya_id;
        DELETE FROM Foglalas WHERE palya_id = @palya_id;
      `);

      const torlesEredmenye = await lekeres.query(`
        DELETE FROM Palya WHERE palya_id = @palya_id;
        SELECT @@ROWCOUNT AS affected;
      `);

      if (!torlesEredmenye.recordset[0] || torlesEredmenye.recordset[0].affected === 0) {
        await tranzakcio.rollback();
        return res.status(404).json({ error: "Pálya nem található" });
      }

      lekeres.input("felhasznalo_id", sql.Int, tulajdonosAzonosito);
      lekeres.input("esemeny_tipus", sql.NVarChar(100), "palya_torolve");
      await lekeres.query(`
        INSERT INTO Log (felhasznalo_id, esemeny_tipus)
        VALUES (@felhasznalo_id, @esemeny_tipus)
      `);

      await tranzakcio.commit();

      return res.json({ message: "Pálya sikeresen törölve" });
    } catch (belsoHiba) {
      await tranzakcio.rollback();
      throw belsoHiba;
    }
  } catch (hiba) {
    console.error("Pálya törlési hiba:", hiba);
    res.status(500).json({ error: "Pálya törlése sikertelen" });
  }
});

// ===== PÁLYA MÓDOSÍTÁSA =====
router.put("/:id", async (req, res) => {
  try {
    const palyaAzonosito = parseInt(req.params.id, 10);
    const { nev, sportag, helyszin, ar_ora, leiras, kep_url, nyitas, zaras } = req.body;

    if (!palyaAzonosito) {
      return res.status(400).json({ error: "Érvénytelen pálya ID" });
    }
    if (!nev || !sportag || !helyszin || !ar_ora) {
      return res.status(400).json({ error: "Hiányzó kötelező mezők: nev, sportag, helyszin, ar_ora" });
    }

    const nyitasFormazott = (nyitas && String(nyitas).trim()) ? String(nyitas).slice(0, 5) + ":00" : "08:00:00";
    const zarasFormazott = (zaras && String(zaras).trim()) ? String(zaras).slice(0, 5) + ":00" : "20:00:00";

    const kapcsolat = await poolPromise;
    const frissitesEredmenye = await kapcsolat
      .request()
      .input("palya_id", sql.Int, palyaAzonosito)
      .input("nev", sql.NVarChar, nev)
      .input("sportag", sql.NVarChar, sportag)
      .input("helyszin", sql.NVarChar, helyszin)
      .input("ar_ora", sql.Float, parseFloat(ar_ora) || 0)
      .input("leiras", sql.NVarChar, leiras || "")
      .input("kep_url", sql.NVarChar, kep_url || "")
      .input("nyitas", sql.NVarChar, nyitasFormazott)
      .input("zaras", sql.NVarChar, zarasFormazott)
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

    if (!frissitesEredmenye.recordset[0] || frissitesEredmenye.recordset[0].affected === 0) {
      return res.status(404).json({ error: "Pálya nem található" });
    }

    return res.json({ message: "Pálya sikeresen módosítva" });
  } catch (hiba) {
    console.error("Pálya módosítási hiba:", hiba);
    return res.status(500).json({ error: "Pálya módosítása sikertelen" });
  }
});

module.exports = router;
