const { sql, poolPromise } = require("../../db");

const getProfilePictureByUserId = async (userId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT profil_kep_url FROM Felhasznalok WHERE felhasznalo_id = @userId
    `);

  return result.recordset[0]?.profil_kep_url || null;
};

const setProfilePictureByUserId = async (userId, picUrl) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("picUrl", sql.NVarChar(500), picUrl)
    .query(`
      UPDATE Felhasznalok
      SET profil_kep_url = @picUrl
      WHERE felhasznalo_id = @userId
    `);
};

const clearProfilePictureByUserId = async (userId) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      UPDATE Felhasznalok
      SET profil_kep_url = NULL
      WHERE felhasznalo_id = @userId
    `);
};

const getUserProfileById = async (userId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT
        felhasznalo_id,
        username,
        teljes_nev,
        email,
        szerep,
        profil_kep_url,
        letrehozva
      FROM Felhasznalok AS f
      WHERE felhasznalo_id = @userId
    `);

  return result.recordset[0] || null;
};

const findConflictingUser = async (userId, username, email) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("username", sql.NVarChar(50), username)
    .input("email", sql.NVarChar(200), email)
    .query(`
      SELECT felhasznalo_id
      FROM Felhasznalok
      WHERE (username = @username OR email = @email)
        AND felhasznalo_id <> @userId
    `);

  return result.recordset[0] || null;
};

const updateUserProfileData = async (userId, username, teljesNev, email) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("username", sql.NVarChar(50), username)
    .input("teljes_nev", sql.NVarChar(150), teljesNev)
    .input("email", sql.NVarChar(200), email)
    .query(`
      UPDATE Felhasznalok
      SET
        username = @username,
        teljes_nev = @teljes_nev,
        email = @email
      WHERE felhasznalo_id = @userId;

      SELECT
        felhasznalo_id,
        username,
        teljes_nev,
        email,
        szerep,
        profil_kep_url,
        letrehozva
      FROM Felhasznalok AS f
      WHERE felhasznalo_id = @userId;
    `);

  return result.recordset[0] || null;
};

const getUserPasswordHash = async (userId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT felhasznalo_id, jelszo_hash
      FROM Felhasznalok
      WHERE felhasznalo_id = @userId
    `);

  return result.recordset[0] || null;
};

const updateUserPasswordHash = async (userId, newHash) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("newHash", sql.NVarChar(300), newHash)
    .query(`
      UPDATE Felhasznalok
      SET jelszo_hash = @newHash
      WHERE felhasznalo_id = @userId
    `);
};

module.exports = {
  getProfilePictureByUserId,
  setProfilePictureByUserId,
  clearProfilePictureByUserId,
  getUserProfileById,
  findConflictingUser,
  updateUserProfileData,
  getUserPasswordHash,
  updateUserPasswordHash,
};
