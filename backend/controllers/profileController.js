const { sql, poolPromise } = require("../db");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Nincs kép kiválasztva.",
      });
    }

    const userId = req.body?.userId || req.query?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "Bejelentkezés szükséges.",
      });
    }

    // For demo purposes, we'll store the file path
    // In production, consider using cloud storage like Azure Blob Storage, AWS S3, etc.
    const fileName = `profile_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../uploads");
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    
    // Move file from temp location
    fs.copyFileSync(req.file.path, filePath);
    
    // Delete temp file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.log("Temp file already deleted or not found");
    }

    // Build URL for the file
    const picUrl = `/uploads/${fileName}`;
    const fullPicUrl = `http://localhost:${process.env.PORT || 4000}${picUrl}`;

    // Update database (store relative path)
    const pool = await poolPromise;
    await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .input("picUrl", sql.NVarChar(500), picUrl)
      .query(`
        UPDATE Felhasznalok
        SET profil_kep_url = @picUrl
        WHERE felhasznalo_id = @userId
      `);

    return res.status(200).json({
      message: "Profilkép sikeresen feltöltve.",
      profil_kep_url: fullPicUrl,
    });
  } catch (error) {
    console.error("Profilkép feltöltési hiba:", error);
    return res.status(500).json({
      message: "Hiba a profilkép feltöltésekor.",
    });
  }
};

// Update profile picture (replace existing)
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Nincs kép kiválasztva.",
      });
    }

    const userId = req.body?.userId || req.query?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "Bejelentkezés szükséges.",
      });
    }

    const pool = await poolPromise;

    // Get old picture URL to delete
    const oldResult = await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .query(`
        SELECT profil_kep_url FROM Felhasznalok WHERE felhasznalo_id = @userId
      `);

    const oldPicUrl = oldResult.recordset[0]?.profil_kep_url;

    // Delete old file if it exists
    if (oldPicUrl && oldPicUrl.startsWith("/uploads/")) {
      const oldFilePath = path.join(__dirname, "../..", oldPicUrl);
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (err) {
        console.log("Could not delete old file:", err);
      }
    }

    // Save new file
    const fileName = `profile_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../uploads");
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    
    fs.copyFileSync(req.file.path, filePath);
    
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.log("Temp file already deleted or not found");
    }

    const picUrl = `/uploads/${fileName}`;    const fullPicUrl = `http://localhost:${process.env.PORT || 4000}${picUrl}`;
    // Update database
    await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .input("picUrl", sql.NVarChar(500), picUrl)
      .query(`
        UPDATE Felhasznalok
        SET profil_kep_url = @picUrl
        WHERE felhasznalo_id = @userId
      `);

    return res.status(200).json({
      message: "Profilkép sikeresen frissítve.",
      profil_kep_url: picUrl,
    });
  } catch (error) {
    console.error("Profilkép frissítési hiba:", error);
    return res.status(500).json({
      message: "Hiba a profilkép frissítésekor.",
    });
  }
};

// Delete profile picture
const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "Bejelentkezés szükséges.",
      });
    }

    const pool = await poolPromise;

    // Get current picture URL
    const result = await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .query(`
        SELECT profil_kep_url FROM Felhasznalok WHERE felhasznalo_id = @userId
      `);

    const picUrl = result.recordset[0]?.profil_kep_url;

    // Delete file if it exists
    if (picUrl && picUrl.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "../..", picUrl);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.log("Could not delete file:", err);
      }
    }

    // Update database to clear URL
    await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .query(`
        UPDATE Felhasznalok
        SET profil_kep_url = NULL
        WHERE felhasznalo_id = @userId
      `);

    return res.status(200).json({
      message: "Profilkép sikeresen törölve.",
    });
  } catch (error) {
    console.error("Profilkép törlési hiba:", error);
    return res.status(500).json({
      message: "Hiba a profilkép törlésekor.",
    });
  }
};

// Get user profile with picture
const getUserProfile = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "Bejelentkezés szükséges.",
      });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .query(`
        SELECT
          felhasznalo_id,
          username,
          teljes_nev,
          email,
          szerep,
          profil_kep_url,
          letrehozva
        FROM Felhasznalok
        AS f
        WHERE felhasznalo_id = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "Felhasználó nem található.",
      });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Profil lekérési hiba:", error);
    return res.status(500).json({
      message: "Hiba a profil lekérésekor.",
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.user?.id;
    const username = String(req.body?.username || "").trim();
    const teljesNev = String(req.body?.teljes_nev || "").trim();
    const email = String(req.body?.email || "").trim();

    if (!userId) {
      return res.status(401).json({ message: "Bejelentkezes szukseges." });
    }

    if (!username || !teljesNev || !email) {
      return res.status(400).json({ message: "Minden mezo kitoltese kotelezo." });
    }

    const pool = await poolPromise;

    const existing = await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .input("username", sql.NVarChar(50), username)
      .input("email", sql.NVarChar(200), email)
      .query(`
        SELECT felhasznalo_id
        FROM Felhasznalok
        WHERE (username = @username OR email = @email)
          AND felhasznalo_id <> @userId
      `);

    if (existing.recordset.length > 0) {
      return res.status(409).json({
        message: "A felhasznalonev vagy email mar foglalt.",
      });
    }

    const updated = await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
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

    return res.status(200).json({
      message: "Profil adatok sikeresen frissitve.",
      user: updated.recordset[0],
    });
  } catch (error) {
    console.error("Profil adatfrissitesi hiba:", error);
    return res.status(500).json({ message: "Hiba a profil adatok frissitesekor." });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId || req.user?.id;
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!userId) {
      return res.status(401).json({ message: "Bejelentkezes szukseges." });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Minden mezo kitoltese kotelezo." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Az uj jelszo legalabb 8 karakter legyen." });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .query(`
        SELECT felhasznalo_id, jelszo_hash
        FROM Felhasznalok
        WHERE felhasznalo_id = @userId
      `);

    const user = result.recordset[0];
    if (!user) {
      return res.status(404).json({ message: "Felhasznalo nem talalhato." });
    }

    const validCurrent = await bcrypt.compare(currentPassword, user.jelszo_hash);
    if (!validCurrent) {
      return res.status(400).json({ message: "A jelenlegi jelszo hibas." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool
      .request()
      .input("userId", sql.Int, parseInt(userId))
      .input("newHash", sql.NVarChar(300), newHash)
      .query(`
        UPDATE Felhasznalok
        SET jelszo_hash = @newHash
        WHERE felhasznalo_id = @userId
      `);

    return res.status(200).json({ message: "Jelszo sikeresen frissitve." });
  } catch (error) {
    console.error("Jelszocsere hiba:", error);
    return res.status(500).json({ message: "Hiba a jelszo modositasakor." });
  }
};

module.exports = {
  uploadProfilePicture,
  updateProfilePicture,
  deleteProfilePicture,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
