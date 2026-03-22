const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

router.get("/unread-count/:user_id", async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id, 10);
    if (!userId) {
      return res.status(400).json({ message: "Ervenytelen felhasznalo ID" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count
        FROM Ertesites
        WHERE cimzett_id = @user_id AND olvasott = 0
      `);

    return res.json({ count: result.recordset[0]?.count || 0 });
  } catch (error) {
    console.error("Unread notifications count hiba:", error);
    return res.status(500).json({ message: "Ertesites szam lekerese sikertelen" });
  }
});

router.get("/:user_id", async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id, 10);
    if (!userId) {
      return res.status(400).json({ message: "Ervenytelen felhasznalo ID" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
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

    return res.json(result.recordset);
  } catch (error) {
    console.error("Notifications list hiba:", error);
    return res.status(500).json({ message: "Ertesitesek lekerese sikertelen" });
  }
});

router.delete("/:user_id/:notification_id", async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id, 10);
    const notificationId = parseInt(req.params.notification_id, 10);
    if (!userId || !notificationId) {
      return res.status(400).json({ message: "Ervenytelen azonosito" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("notification_id", sql.Int, notificationId)
      .query(`
        DELETE FROM Ertesites
        WHERE ertesites_id = @notification_id
          AND cimzett_id = @user_id
      `);

    if (!result.rowsAffected || !result.rowsAffected[0]) {
      return res.status(404).json({ message: "Ertesites nem talalhato" });
    }

    return res.json({ message: "Ertesites torolve" });
  } catch (error) {
    console.error("Notification delete hiba:", error);
    return res.status(500).json({ message: "Ertesites torlese sikertelen" });
  }
});

router.delete("/:user_id", async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id, 10);
    if (!userId) {
      return res.status(400).json({ message: "Ervenytelen felhasznalo ID" });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .query(`
        DELETE FROM Ertesites
        WHERE cimzett_id = @user_id
      `);

    return res.json({ message: "Ertesitesek torolve" });
  } catch (error) {
    console.error("All notifications delete hiba:", error);
    return res.status(500).json({ message: "Ertesitesek torlese sikertelen" });
  }
});

module.exports = router;
