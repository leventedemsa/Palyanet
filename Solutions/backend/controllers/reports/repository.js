const { sql, poolPromise } = require("../../db");

// Ellenőrzi, hogy a megadott felhasználó admin szerepkörű-e.
const adminEllenorzes = async (felhasznaloAzonosito) => {
    const pool = await poolPromise;
    const eredmeny = await pool.request().input("felhasznalo_id", sql.Int, felhasznaloAzonosito).query(`
      SELECT felhasznalo_id
      FROM Felhasznalok
      WHERE felhasznalo_id = @felhasznalo_id
        AND szerep = N'admin'
    `);

    return eredmeny.recordset[0] || null;
};

// Lekéri a felhasználót azonosító alapján.
const felhasznaloLekerese = async (felhasznaloAzonosito) => {
    const pool = await poolPromise;
    const eredmeny = await pool.request().input("felhasznalo_id", sql.Int, felhasznaloAzonosito).query(`
      SELECT felhasznalo_id, tiltva
      FROM Felhasznalok
      WHERE felhasznalo_id = @felhasznalo_id
    `);

    return eredmeny.recordset[0] || null;
};

// Lekéri a pályát azonosító alapján.
const palyaLekerese = async (palyaAzonosito) => {
    const pool = await poolPromise;
    const eredmeny = await pool.request().input("palya_id", sql.Int, palyaAzonosito).query(`
      SELECT palya_id, tulaj_id
      FROM Palya
      WHERE palya_id = @palya_id
    `);

    return eredmeny.recordset[0] || null;
};

// Létrehozza az új bejelentést, majd visszaadja az új bejelentés azonosítóját.
const bejelentesLetrehozasa = async ({ kuldoFelhasznaloAzonosito, bejelentettFelhasznaloAzonosito, palyaAzonosito, szoveg }) => {
    const pool = await poolPromise;
    const eredmeny = await pool
        .request()
        .input("kuldo_felhasznalo_id", sql.Int, kuldoFelhasznaloAzonosito)
        .input("bejelentett_felhasznalo_id", sql.Int, bejelentettFelhasznaloAzonosito)
        .input("palya_id", sql.Int, palyaAzonosito)
        .input("szoveg", sql.NVarChar(1500), szoveg).query(`
      INSERT INTO Bejelentesek
        (kuldo_felhasznalo_id, bejelentett_felhasznalo_id, palya_id, szoveg, statusz)
      VALUES
        (@kuldo_felhasznalo_id, @bejelentett_felhasznalo_id, @palya_id, @szoveg, N'pending');

      SELECT CAST(SCOPE_IDENTITY() AS INT) AS bejelentes_id;
    `);

    return eredmeny.recordset[0]?.bejelentes_id || null;
};

// Létrehoz egy új értesítést.
const ertesitesLetrehozasa = async ({ kuldoAzonosito, cimzettAzonosito, uzenet }) => {
    const pool = await poolPromise;
    await pool
        .request()
        .input("kuldo_id", sql.Int, kuldoAzonosito)
        .input("cimzett_id", sql.Int, cimzettAzonosito)
        .input("uzenet", sql.NVarChar(sql.MAX), uzenet).query(`
      INSERT INTO Ertesites (kuldo_id, cimzett_id, uzenet, olvasott)
      VALUES (@kuldo_id, @cimzett_id, @uzenet, 0)
    `);
};

// Lekéri az admin felhasználók azonosítóit.
const adminokLekerese = async () => {
    const pool = await poolPromise;
    const eredmeny = await pool.request().query(`
      SELECT felhasznalo_id
      FROM Felhasznalok
      WHERE szerep = N'admin'
    `);

    return eredmeny.recordset;
};

// Lekéri az összes bejelentést admin nézethez.
const bejelentesekListazasa = async () => {
    const pool = await poolPromise;
    const eredmeny = await pool.request().query(`
      SELECT
        b.bejelentes_id,
        b.kuldo_felhasznalo_id,
        b.bejelentett_felhasznalo_id,
        b.palya_id,
        b.szoveg,
        b.statusz,
        b.admin_id,
        b.admin_megjegyzes,
        b.letrehozva,
        b.eldontve,
        k.username AS kuldo_username,
        k.teljes_nev AS kuldo_teljes_nev,
        k.email AS kuldo_email,
        j.username AS bejelentett_username,
        j.teljes_nev AS bejelentett_teljes_nev,
        j.email AS bejelentett_email,
        p.nev AS palya_nev,
        ISNULL(p.felfuggesztve, 0) AS palya_felfuggesztve
      FROM Bejelentesek b
      JOIN Felhasznalok k ON b.kuldo_felhasznalo_id = k.felhasznalo_id
      JOIN Felhasznalok j ON b.bejelentett_felhasznalo_id = j.felhasznalo_id
      JOIN Palya p ON b.palya_id = p.palya_id
      ORDER BY CASE WHEN b.statusz = N'pending' THEN 0 ELSE 1 END, b.letrehozva DESC
    `);

    return eredmeny.recordset;
};

// Lekéri az adott bejelentést részletes nézethez.
const bejelentesReszletekLekerese = async (bejelentesAzonosito) => {
    const pool = await poolPromise;
    const eredmeny = await pool.request().input("bejelentes_id", sql.Int, bejelentesAzonosito).query(`
      SELECT TOP 1
        b.bejelentes_id,
        b.kuldo_felhasznalo_id,
        b.bejelentett_felhasznalo_id,
        b.palya_id,
        b.szoveg,
        b.statusz,
        b.admin_id,
        b.admin_megjegyzes,
        b.letrehozva,
        b.eldontve,
        k.username AS kuldo_username,
        k.teljes_nev AS kuldo_teljes_nev,
        k.email AS kuldo_email,
        j.username AS bejelentett_username,
        j.teljes_nev AS bejelentett_teljes_nev,
        j.email AS bejelentett_email,
        p.nev AS palya_nev,
        p.helyszin AS palya_helyszin,
        p.sportag AS palya_sportag,
        ISNULL(p.felfuggesztve, 0) AS palya_felfuggesztve
      FROM Bejelentesek b
      JOIN Felhasznalok k ON b.kuldo_felhasznalo_id = k.felhasznalo_id
      JOIN Felhasznalok j ON b.bejelentett_felhasznalo_id = j.felhasznalo_id
      JOIN Palya p ON b.palya_id = p.palya_id
      WHERE b.bejelentes_id = @bejelentes_id
    `);

    return eredmeny.recordset[0] || null;
};

// Lekéri az adott bejelentést.
const bejelentesLekerese = async (bejelentesAzonosito) => {
    const pool = await poolPromise;
    const eredmeny = await pool.request().input("bejelentes_id", sql.Int, bejelentesAzonosito).query(`
      SELECT bejelentes_id, statusz, kuldo_felhasznalo_id, bejelentett_felhasznalo_id, palya_id
      FROM Bejelentesek
      WHERE bejelentes_id = @bejelentes_id
    `);

    return eredmeny.recordset[0] || null;
};

// Felhasználó tiltása.
const felhasznaloTiltasa = async (felhasznaloAzonosito) => {
    const pool = await poolPromise;
    await pool
        .request()
        .input("felhasznalo_id", sql.Int, felhasznaloAzonosito)
        .query(`
      UPDATE Felhasznalok
      SET tiltva = 1
      WHERE felhasznalo_id = @felhasznalo_id
    `);
};

// Pálya felfüggesztése.
const palyaFelfuggesztese = async ({ palyaAzonosito, adminAzonosito, indok }) => {
    const pool = await poolPromise;
    await pool
        .request()
        .input("palya_id", sql.Int, palyaAzonosito)
        .input("admin_id", sql.Int, adminAzonosito)
        .input("indok", sql.NVarChar(1500), indok || null)
        .query(`
      UPDATE Palya
      SET felfuggesztve = 1,
          felfuggesztes_indok = @indok,
          felfuggesztve_admin_id = @admin_id,
          felfuggesztve_datum = SYSDATETIME()
      WHERE palya_id = @palya_id
    `);
};

// Frissíti a bejelentés státuszát admin döntés után.
const bejelentesStatuszFrissites = async ({ bejelentesAzonosito, statusz, adminAzonosito, adminMegjegyzes }) => {
    const pool = await poolPromise;
    await pool
        .request()
        .input("bejelentes_id", sql.Int, bejelentesAzonosito)
        .input("statusz", sql.NVarChar(50), statusz)
        .input("admin_id", sql.Int, adminAzonosito)
        .input("admin_megjegyzes", sql.NVarChar(1500), adminMegjegyzes || null).query(`
      UPDATE Bejelentesek
      SET statusz = @statusz,
          admin_id = @admin_id,
          admin_megjegyzes = @admin_megjegyzes,
          eldontve = SYSDATETIME()
      WHERE bejelentes_id = @bejelentes_id
    `);
};

module.exports = {
    adminEllenorzes,
    felhasznaloLekerese,
    palyaLekerese,
    bejelentesLetrehozasa,
    ertesitesLetrehozasa,
    adminokLekerese,
    bejelentesekListazasa,
    bejelentesReszletekLekerese,
    bejelentesLekerese,
    felhasznaloTiltasa,
    palyaFelfuggesztese,
    bejelentesStatuszFrissites,
};
