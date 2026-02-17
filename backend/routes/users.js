const express = require('express');
const sql = require('mssql');
const config = require('../dbconfig');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
        SELECT
            felhasznalo_id AS id,
            nev,
            email,
            szerep
        FROM Felhasznalok
        ORDER BY felhasznalo_id
    `);

    pool.close();

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Szerver hiba'
    });
  }
});

module.exports = router;
