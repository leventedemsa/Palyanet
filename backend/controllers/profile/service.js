const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const {
  getProfilePictureByUserId,
  setProfilePictureByUserId,
  clearProfilePictureByUserId,
  getUserProfileById,
  findConflictingUser,
  updateUserProfileData,
  getUserPasswordHash,
  updateUserPasswordHash,
} = require("./repository");

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parseUserId = (payload) => {
  const raw = payload?.body?.userId || payload?.query?.userId || payload?.user?.id;
  const userId = parseInt(raw, 10);
  return Number.isNaN(userId) ? null : userId;
};

const ensureUploadsDirectory = () => {
  const uploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const removeFileIfExists = (targetPath) => {
  try {
    if (targetPath && fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  } catch (err) {
    console.log("Could not delete file:", err);
  }
};

const moveUploadedFile = (file, userId) => {
  const uploadDir = ensureUploadsDirectory();
  const fileName = `profile_${userId}_${Date.now()}${path.extname(file.originalname)}`;
  const filePath = path.join(uploadDir, fileName);

  fs.copyFileSync(file.path, filePath);
  try {
    fs.unlinkSync(file.path);
  } catch (_) {
    console.log("Temp file already deleted or not found");
  }

  return `/uploads/${fileName}`;
};

const toStoredPath = (picUrl) => {
  if (!picUrl || !picUrl.startsWith("/uploads/")) return null;
  const relative = picUrl.replace(/^\/+/, "");
  return path.join(__dirname, "../../", relative);
};

const uploadProfilePicture = async ({ reqFile, reqBody, reqQuery, reqUser }) => {
  if (!reqFile) {
    throw httpError(400, "Nincs kép kiválasztva.");
  }

  const userId = parseUserId({ body: reqBody, query: reqQuery, user: reqUser });
  if (!userId) {
    throw httpError(401, "Bejelentkezés szükséges.");
  }

  const picUrl = moveUploadedFile(reqFile, userId);
  await setProfilePictureByUserId(userId, picUrl);

  const fullPicUrl = `http://localhost:${process.env.PORT || 4000}${picUrl}`;
  return {
    message: "Profilkép sikeresen feltöltve.",
    profil_kep_url: fullPicUrl,
  };
};

const updateProfilePicture = async ({ reqFile, reqBody, reqQuery, reqUser }) => {
  if (!reqFile) {
    throw httpError(400, "Nincs kép kiválasztva.");
  }

  const userId = parseUserId({ body: reqBody, query: reqQuery, user: reqUser });
  if (!userId) {
    throw httpError(401, "Bejelentkezés szükséges.");
  }

  const oldPicUrl = await getProfilePictureByUserId(userId);
  removeFileIfExists(toStoredPath(oldPicUrl));

  const picUrl = moveUploadedFile(reqFile, userId);
  await setProfilePictureByUserId(userId, picUrl);

  return {
    message: "Profilkép sikeresen frissítve.",
    profil_kep_url: picUrl,
  };
};

const deleteProfilePicture = async ({ reqBody, reqQuery, reqUser }) => {
  const userId = parseUserId({ body: reqBody, query: reqQuery, user: reqUser });
  if (!userId) {
    throw httpError(401, "Bejelentkezés szükséges.");
  }

  const picUrl = await getProfilePictureByUserId(userId);
  removeFileIfExists(toStoredPath(picUrl));
  await clearProfilePictureByUserId(userId);

  return {
    message: "Profilkép sikeresen törölve.",
  };
};

const getUserProfile = async ({ reqBody, reqQuery, reqUser }) => {
  const userId = parseUserId({ body: reqBody, query: reqQuery, user: reqUser });
  if (!userId) {
    throw httpError(401, "Bejelentkezés szükséges.");
  }

  const profile = await getUserProfileById(userId);
  if (!profile) {
    throw httpError(404, "Felhasználó nem található.");
  }

  return profile;
};

const updateUserProfile = async ({ reqBody, reqQuery, reqUser }) => {
  const userId = parseUserId({ body: reqBody, query: reqQuery, user: reqUser });
  const username = String(reqBody?.username || "").trim();
  const teljesNev = String(reqBody?.teljes_nev || "").trim();
  const email = String(reqBody?.email || "").trim();

  if (!userId) {
    throw httpError(401, "Bejelentkezes szukseges.");
  }

  if (!username || !teljesNev || !email) {
    throw httpError(400, "Minden mezo kitoltese kotelezo.");
  }

  const existing = await findConflictingUser(userId, username, email);
  if (existing) {
    throw httpError(409, "A felhasznalonev vagy email mar foglalt.");
  }

  const updatedUser = await updateUserProfileData(userId, username, teljesNev, email);

  return {
    message: "Profil adatok sikeresen frissitve.",
    user: updatedUser,
  };
};

const changePassword = async ({ reqBody, reqQuery, reqUser }) => {
  const userId = parseUserId({ body: reqBody, query: reqQuery, user: reqUser });
  const currentPassword = String(reqBody?.currentPassword || "");
  const newPassword = String(reqBody?.newPassword || "");

  if (!userId) {
    throw httpError(401, "Bejelentkezes szukseges.");
  }

  if (!currentPassword || !newPassword) {
    throw httpError(400, "Minden mezo kitoltese kotelezo.");
  }

  if (newPassword.length < 8) {
    throw httpError(400, "Az uj jelszo legalabb 8 karakter legyen.");
  }

  const user = await getUserPasswordHash(userId);
  if (!user) {
    throw httpError(404, "Felhasznalo nem talalhato.");
  }

  const validCurrent = await bcrypt.compare(currentPassword, user.jelszo_hash);
  if (!validCurrent) {
    throw httpError(400, "A jelenlegi jelszo hibas.");
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await updateUserPasswordHash(userId, newHash);

  return {
    message: "Jelszo sikeresen frissitve.",
  };
};

module.exports = {
  uploadProfilePicture,
  updateProfilePicture,
  deleteProfilePicture,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
