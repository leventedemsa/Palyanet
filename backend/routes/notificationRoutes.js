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

module.exports = router;
