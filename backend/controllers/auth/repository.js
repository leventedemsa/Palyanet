const { sql, poolPromise } = require("../../db");

// Ellenőrzi, hogy az email vagy a felhasználónév már létezik-e
const keresFelhasznaloEmailVagyUsernameAlapjan = async (email, username) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("email", sql.NVarChar(200), email)
    .input("username", sql.NVarChar(50), username)
    .query(`
      SELECT felhasznalo_id
      FROM Felhasznalok
      WHERE email = @email OR username = @username
    `);

  return result.recordset[0] || null;
};

// Új felhasználót hoz létre az adatbázisban
const felhasznaloLetrehozasa = async ({
  username,
  teljes_nev,
  email,
  jelszo_hash,
  szerep,
}) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("username", sql.NVarChar(50), username)
    .input("teljes_nev", sql.NVarChar(150), teljes_nev)
    .input("email", sql.NVarChar(200), email)
    .input("jelszo_hash", sql.NVarChar(300), jelszo_hash)
    .input("szerep", sql.NVarChar(50), szerep)
    .query(`
      INSERT INTO Felhasznalok (username, teljes_nev, email, jelszo_hash, szerep)
      OUTPUT
        INSERTED.felhasznalo_id,
        INSERTED.username,
        INSERTED.teljes_nev,
        INSERTED.email,
        INSERTED.szerep,
        INSERTED.profil_kep_url,
        INSERTED.letrehozva
      VALUES (@username, @teljes_nev, @email, @jelszo_hash, @szerep)
    `);

  return result.recordset[0];
};

// Bejelentkezéshez szükséges felhasználót keresi ki email vagy username alapján
const keresFelhasznaloBelepeshez = async (identifier) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("identifier", sql.NVarChar(200), identifier)
    .query(`
      SELECT
        felhasznalo_id,
        username,
        teljes_nev,
        email,
        jelszo_hash,
        szerep,
        profil_kep_url,
        aktiv
      FROM Felhasznalok
      WHERE email = @identifier OR username = @identifier
    `);

  return result.recordset[0] || null;
};

module.exports = {
  keresFelhasznaloEmailVagyUsernameAlapjan,
  felhasznaloLetrehozasa,
  keresFelhasznaloBelepeshez,
};
