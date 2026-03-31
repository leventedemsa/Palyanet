const { sql, poolPromise } = require("../../db");

const getPalyaById = async (palyaId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("palya_id", sql.Int, palyaId)
    .query(`
      SELECT p.*,
             CONVERT(VARCHAR(8), p.nyitas, 108) AS nyitas_str,
             CONVERT(VARCHAR(8), p.zaras, 108) AS zaras_str,
             f.email as tulaj_email, f.teljes_nev as tulaj_nev, f.felhasznalo_id as tulaj_id
      FROM Palya p
      JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
      WHERE p.palya_id = @palya_id
    `);

  return result.recordset[0] || null;
};

const getRenterById = async (berloId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("berlo_id", sql.Int, berloId)
    .query(`
      SELECT felhasznalo_id, username, teljes_nev, email, szerep, tiltva
      FROM Felhasznalok
      WHERE felhasznalo_id = @berlo_id
    `);

  return result.recordset[0] || null;
};

const createBookingRecord = async ({ palyaId, berloId, kezdes, vege, ar }) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("palya_id", sql.Int, palyaId)
    .input("berlo_id", sql.Int, berloId)
    .input("kezdes", sql.DateTime2, new Date(kezdes))
    .input("vege", sql.DateTime2, new Date(vege))
    .input("statusz", sql.NVarChar(50), "pending")
    .input("ar", sql.Int, ar)
    .input("fizetes_statusz", sql.NVarChar(50), "pending")
    .query(`
      INSERT INTO Foglalas (palya_id, berlo_id, kezdes, vege, statusz, ar, fizetes_statusz)
      VALUES (@palya_id, @berlo_id, @kezdes, @vege, @statusz, @ar, @fizetes_statusz);

      SELECT *
      FROM Foglalas
      WHERE foglalas_id = CAST(SCOPE_IDENTITY() AS INT);
    `);

  return result.recordset[0] || null;
};

const createNotification = async ({ kuldoId, cimzettId, uzenet }) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("kuldo_id", sql.Int, kuldoId)
    .input("cimzett_id", sql.Int, cimzettId)
    .input("uzenet", sql.NVarChar("MAX"), uzenet)
    .query(`
      INSERT INTO Ertesites (kuldo_id, cimzett_id, uzenet, olvasott)
      VALUES (@kuldo_id, @cimzett_id, @uzenet, 0)
    `);
};

const logBejegyzesLetrehozasa = async ({ felhasznalo_id, esemeny_tipus }) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("felhasznalo_id", sql.Int, felhasznalo_id)
    .input("esemeny_tipus", sql.NVarChar(100), esemeny_tipus)
    .query(`
      INSERT INTO Log (felhasznalo_id, esemeny_tipus)
      VALUES (@felhasznalo_id, @esemeny_tipus)
    `);
};

const getBookingsForOwner = async (tulajId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("tulaj_id", sql.Int, tulajId)
    .query(`
      SELECT
        f.foglalas_id,
        f.palya_id,
        f.berlo_id,
        f.kezdes,
        f.vege,
        f.statusz,
        f.ar,
        f.fizetes_statusz,
        f.letrehozva,
        p.nev as palya_nev,
        p.sportag,
        p.helyszin,
        p.kep_url,
        b.username,
        b.teljes_nev,
        b.email,
        b.profil_kep_url
      FROM Foglalas f
      JOIN Palya p ON f.palya_id = p.palya_id
      JOIN Felhasznalok b ON f.berlo_id = b.felhasznalo_id
      WHERE p.tulaj_id = @tulaj_id
      ORDER BY f.letrehozva DESC
    `);

  return result.recordset;
};

const getBookingsForRenter = async (berloId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("berlo_id", sql.Int, berloId)
    .query(`
      SELECT
        f.foglalas_id,
        f.palya_id,
        f.berlo_id,
        f.kezdes,
        f.vege,
        f.statusz,
        f.ar,
        f.fizetes_statusz,
        f.letrehozva,
        p.nev as palya_nev,
        p.sportag,
        p.helyszin,
        p.kep_url,
        p.tulaj_id,
        o.username as tulaj_username,
        o.teljes_nev as tulaj_nev,
        o.profil_kep_url as tulaj_profilkep
      FROM Foglalas f
      JOIN Palya p ON f.palya_id = p.palya_id
      JOIN Felhasznalok o ON p.tulaj_id = o.felhasznalo_id
      WHERE f.berlo_id = @berlo_id
      ORDER BY f.letrehozva DESC
    `);

  return result.recordset;
};

const getBookingById = async (foglalasId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("foglalas_id", sql.Int, foglalasId)
    .query(`
      SELECT f.*, p.nev as palya_nev, b.teljes_nev as berlo_nev, b.email as berlo_email, p.tulaj_id
      FROM Foglalas f
      JOIN Palya p ON f.palya_id = p.palya_id
      JOIN Felhasznalok b ON f.berlo_id = b.felhasznalo_id
      WHERE f.foglalas_id = @foglalas_id
    `);

  return result.recordset[0] || null;
};

const updateBookingStatus = async (foglalasId, statusz) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("foglalas_id", sql.Int, foglalasId)
    .input("statusz", sql.NVarChar(50), statusz)
    .query(`
      UPDATE Foglalas
      SET statusz = @statusz
      WHERE foglalas_id = @foglalas_id
    `);
};

const getPendingBookingCount = async (tulajId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("tulaj_id", sql.Int, tulajId)
    .query(`
      SELECT COUNT(*) as pending_count
      FROM Foglalas f
      JOIN Palya p ON f.palya_id = p.palya_id
      WHERE p.tulaj_id = @tulaj_id AND f.statusz = 'pending'
    `);

  return result.recordset[0] || { pending_count: 0 };
};

module.exports = {
  getPalyaById,
  getRenterById,
  createBookingRecord,
  createNotification,
  logBejegyzesLetrehozasa,
  getBookingsForOwner,
  getBookingsForRenter,
  getBookingById,
  updateBookingStatus,
  getPendingBookingCount,
};
