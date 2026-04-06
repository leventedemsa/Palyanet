const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// Olvasatlan értesítések számának lekérése.
router.get("/unread-count/:user_id", async (req, res) => {
  try {
    const felhasznaloAzonosito = parseInt(req.params.user_id, 10);
    if (!felhasznaloAzonosito) {
      return res.status(400).json({ message: "Ervenytelen felhasznalo ID" });
    }

    const kapcsolat = await poolPromise;
    const lekerdezesEredmenye = await kapcsolat
      .request()
      .input("user_id", sql.Int, felhasznaloAzonosito)
      .query(`
        SELECT COUNT(*) AS count
        FROM Ertesites
        WHERE cimzett_id = @user_id AND olvasott = 0
      `);

    return res.json({ count: lekerdezesEredmenye.recordset[0]?.count || 0 });
  } catch (hiba) {
    console.error("Unread notifications count hiba:", hiba);
    return res.status(500).json({ message: "Ertesites szam lekerese sikertelen" });
  }
});

// Felhasználó értesítéseinek listázása.
router.get("/:user_id", async (req, res) => {
  try {
    const felhasznaloAzonosito = parseInt(req.params.user_id, 10);
    if (!felhasznaloAzonosito) {
      return res.status(400).json({ message: "Ervenytelen felhasznalo ID" });
    }

    const kapcsolat = await poolPromise;
    const lekerdezesEredmenye = await kapcsolat
      .request()
      .input("user_id", sql.Int, felhasznaloAzonosito)
      .query(`
        SELECT TOP 30
          ertesites_id,
          kuldo_id,
          cimzett_id,
          uzenet,
          olvasott,
          letrehozva
        FROM Ertesites
        WHERE cimzett_id = @user_id
        ORDER BY letrehozva DESC
      `);

    return res.json(lekerdezesEredmenye.recordset);
  } catch (hiba) {
    console.error("Notifications list hiba:", hiba);
    return res.status(500).json({ message: "Ertesitesek lekerese sikertelen" });
  }
});

// Egy adott értesítés törlése.
router.delete("/:user_id/:notification_id", async (req, res) => {
  try {
    const felhasznaloAzonosito = parseInt(req.params.user_id, 10);
    const ertesitesAzonosito = parseInt(req.params.notification_id, 10);
    if (!felhasznaloAzonosito || !ertesitesAzonosito) {
      return res.status(400).json({ message: "Ervenytelen azonosito" });
    }

    const kapcsolat = await poolPromise;
    const torlesEredmenye = await kapcsolat
      .request()
      .input("user_id", sql.Int, felhasznaloAzonosito)
      .input("notification_id", sql.Int, ertesitesAzonosito)
      .query(`
        DELETE FROM Ertesites
        WHERE ertesites_id = @notification_id
          AND cimzett_id = @user_id
      `);

    if (!torlesEredmenye.rowsAffected || !torlesEredmenye.rowsAffected[0]) {
      return res.status(404).json({ message: "Ertesites nem talalhato" });
    }

    return res.json({ message: "Ertesites torolve" });
  } catch (hiba) {
    console.error("Notification delete hiba:", hiba);
    return res.status(500).json({ message: "Ertesites torlese sikertelen" });
  }
});

// Felhasználó összes értesítésének törlése.
router.delete("/:user_id", async (req, res) => {
  try {
    const felhasznaloAzonosito = parseInt(req.params.user_id, 10);
    if (!felhasznaloAzonosito) {
      return res.status(400).json({ message: "Ervenytelen felhasznalo ID" });
    }

    const kapcsolat = await poolPromise;
    await kapcsolat
      .request()
      .input("user_id", sql.Int, felhasznaloAzonosito)
      .query(`
        DELETE FROM Ertesites
        WHERE cimzett_id = @user_id
      `);

    return res.json({ message: "Ertesitesek torolve" });
  } catch (hiba) {
    console.error("All notifications delete hiba:", hiba);
    return res.status(500).json({ message: "Ertesitesek torlese sikertelen" });
  }
});

module.exports = router;
