const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// Ellenőrzi, hogy a megadott felhasználó admin szerepkörű-e.
async function adminEllenorzes(adminId) {
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

// Admin felhasználók listázása, opcionális szűrési feltételekkel.
router.get("/admin/list", async (req, res) => {
  try {
    const adminId = parseInt(req.query.admin_id, 10);
    const userId = parseInt(req.query.user_id, 10);
    const username = String(req.query.username || "").trim();

    if (!adminId) {
      return res.status(400).json({ error: "Hianyzo admin_id" });
    }
    if (!(await adminEllenorzes(adminId))) {
      return res.status(403).json({ error: "Nincs jogosultsag" });
    }

    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT
        felhasznalo_id,
        username,
        teljes_nev,
        email,
        szerep,
        ISNULL(tiltva, 0) AS tiltva,
        letrehozva,
        utoljara_belepett
      FROM Felhasznalok
      WHERE 1=1
    `;

    if (userId) {
      query += " AND felhasznalo_id = @user_id";
      request.input("user_id", sql.Int, userId);
    }
    if (username) {
      query += " AND username LIKE @username";
      request.input("username", sql.NVarChar(50), `%${username}%`);
    }
    query += " ORDER BY letrehozva DESC";

    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (error) {
    console.error("Admin felhasznalolista hiba:", error);
    return res.status(500).json({ error: "Admin felhasznalolista lekerese sikertelen" });
  }
});

// Admin logok listázása, opcionális szűrési feltételekkel.
router.get("/admin/logs", async (req, res) => {
  try {
    const adminId = parseInt(req.query.admin_id, 10);
    const felhasznaloId = parseInt(req.query.felhasznalo_id, 10);
    const esemenyTipus = String(req.query.esemeny_tipus || "").trim();
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = !Number.isNaN(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;

    if (!adminId) {
      return res.status(400).json({ error: "Hianyzo admin_id" });
    }
    if (!(await adminEllenorzes(adminId))) {
      return res.status(403).json({ error: "Nincs jogosultsag" });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input("limit", sql.Int, limit);

    let query = `
      SELECT TOP (@limit)
        l.log_id,
        l.felhasznalo_id,
        f.username,
        f.teljes_nev,
        l.esemeny_tipus,
        l.datum
      FROM Log l
      LEFT JOIN Felhasznalok f ON f.felhasznalo_id = l.felhasznalo_id
      WHERE 1=1
    `;

    if (!Number.isNaN(felhasznaloId) && felhasznaloId > 0) {
      query += " AND l.felhasznalo_id = @felhasznalo_id";
      request.input("felhasznalo_id", sql.Int, felhasznaloId);
    }
    if (esemenyTipus) {
      query += " AND l.esemeny_tipus LIKE @esemeny_tipus";
      request.input("esemeny_tipus", sql.NVarChar(100), `%${esemenyTipus}%`);
    }

    query += " ORDER BY l.datum DESC, l.log_id DESC";

    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (error) {
    console.error("Admin loglista hiba:", error);
    return res.status(500).json({ error: "Admin loglista lekerese sikertelen" });
  }
});

// Felhasználó tiltásának beállítása vagy feloldása admin által.
router.patch("/admin/:id/ban", async (req, res) => {
  try {
    const adminId = parseInt(req.body && req.body.admin_id, 10);
    const userId = parseInt(req.params.id, 10);
    const tiltva = Boolean(req.body && req.body.tiltva);

    if (!adminId || !userId) {
      return res.status(400).json({ error: "Hianyzo admin_id vagy user_id" });
    }
    if (!(await adminEllenorzes(adminId))) {
      return res.status(403).json({ error: "Nincs jogosultsag" });
    }
    if (adminId === userId) {
      return res.status(400).json({ error: "Sajat admin fiok nem tilthato" });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input("admin_id", sql.Int, adminId);
    request.input("user_id", sql.Int, userId);
    request.input("tiltva", sql.Bit, tiltva ? 1 : 0);

    const userResult = await request.query(`
      SELECT felhasznalo_id, szerep
      FROM Felhasznalok
      WHERE felhasznalo_id = @user_id
    `);
    const user = userResult.recordset[0];
    if (!user) {
      return res.status(404).json({ error: "Felhasznalo nem talalhato" });
    }
    if (String(user.szerep || "").toLowerCase() === "admin") {
      return res.status(400).json({ error: "Admin felhasznalo tiltasa nem engedelyezett" });
    }

    const updateResult = await request.query(`
      UPDATE Felhasznalok
      SET tiltva = @tiltva
      WHERE felhasznalo_id = @user_id;

      SELECT @@ROWCOUNT AS affected;
    `);

    if (!updateResult.recordset[0] || updateResult.recordset[0].affected === 0) {
      return res.status(404).json({ error: "Felhasznalo nem talalhato" });
    }

    request.input(
      "esemeny_tipus",
      sql.NVarChar(100),
      tiltva ? "felhasznalo_tiltva" : "felhasznalo_tiltas_feloldva"
    );
    await request.query(`
      INSERT INTO Log (felhasznalo_id, esemeny_tipus)
      VALUES (@admin_id, @esemeny_tipus)
    `);

    return res.json({
      message: tiltva ? "Felhasznalo sikeresen tiltva" : "Felhasznalo tiltasa feloldva",
    });
  } catch (error) {
    console.error("Felhasznalo tiltas frissitesi hiba:", error);
    return res.status(500).json({ error: "Felhasznalo tiltas frissitese sikertelen" });
  }
});

module.exports = router;
