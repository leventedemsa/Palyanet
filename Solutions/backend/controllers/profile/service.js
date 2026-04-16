const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const {
  profilkepLekereseFelhasznaloAlapjan,
  profilkepBeallitasaFelhasznalohoz,
  profilkepTorleseFelhasznalotol,
  felhasznaloiProfilLekereseIdAlapjan,
  utkozoFelhasznaloKeresese,
  felhasznaloiProfilAdatainakFrissitese,
  felhasznaloJelszoHashLekerese,
  felhasznaloJelszoHashFrissitese,
} = require("./repository");

// HTTP hibaobjektum létrehozása.
const httpHiba = (status, message) => {
  const hiba = new Error(message);
  hiba.status = status;
  return hiba;
};

// Felhasználó azonosítójának kinyerése request payloadból.
const felhasznaloAzonositoFeldolgozasa = (payload) => {
  const raw = payload?.body?.userId || payload?.query?.userId || payload?.user?.id;
  const userId = parseInt(raw, 10);
  return Number.isNaN(userId) ? null : userId;
};

// Feltöltési könyvtár létrehozása és visszaadása.
const feltoltesiKonyvtarBiztositasa = () => {
  const uploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Fájl törlése, ha létezik.
const fajlTorleseHaLetezik = (targetPath) => {
  try {
    if (targetPath && fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  } catch (err) {
    console.log("Could not delete file:", err);
  }
};

// Feltöltött fájl áthelyezése végleges helyre.
const feltoltottFajlAthelyezese = (file, userId) => {
  const uploadDir = feltoltesiKonyvtarBiztositasa();
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

// Publikus URL-ből fájlrendszer útvonal képzése.
const taroltUtvonalKepzese = (picUrl) => {
  if (!picUrl || !picUrl.startsWith("/uploads/")) return null;
  const relative = picUrl.replace(/^\/+/, "");
  return path.join(__dirname, "../../", relative);
};

// Profilkép feltöltése.
const profilkepFeltolteseSzolgaltatas = async ({ reqFile, reqBody, reqQuery, reqUser }) => {
  if (!reqFile) {
    throw httpHiba(400, "Nincs kép kiválasztva.");
  }

  const userId = felhasznaloAzonositoFeldolgozasa({ body: reqBody, query: reqQuery, user: reqUser });
  if (!userId) {
    throw httpHiba(401, "Bejelentkezés szükséges.");
  }

  const picUrl = feltoltottFajlAthelyezese(reqFile, userId);
  await profilkepBeallitasaFelhasznalohoz(userId, picUrl);

  const fullPicUrl = `http://localhost:${process.env.PORT || 4000}${picUrl}`;
  return {
    message: "Profilkép sikeresen feltöltve.",
    profil_kep_url: fullPicUrl,
  };
};

// Profilkép frissítése.
const profilkepFrissiteseSzolgaltatas = async ({ reqFile, reqBody, reqQuery, reqUser }) => {
  if (!reqFile) {
    throw httpHiba(400, "Nincs kép kiválasztva.");
  }

  const userId = felhasznaloAzonositoFeldolgozasa({ body: reqBody, query: reqQuery, user: reqUser });
  if (!userId) {
    throw httpHiba(401, "Bejelentkezés szükséges.");
  }

  const oldPicUrl = await profilkepLekereseFelhasznaloAlapjan(userId);
  fajlTorleseHaLetezik(taroltUtvonalKepzese(oldPicUrl));

  const picUrl = feltoltottFajlAthelyezese(reqFile, userId);
  await profilkepBeallitasaFelhasznalohoz(userId, picUrl);

  return {
    message: "Profilkép sikeresen frissítve.",
    profil_kep_url: picUrl,
  };
};

// Profilkép törlése.
const profilkepTorleseSzolgaltatas = async ({ reqBody, reqQuery, reqUser }) => {
  const userId = felhasznaloAzonositoFeldolgozasa({ body: reqBody, query: reqQuery, user: reqUser });
  if (!userId) {
    throw httpHiba(401, "Bejelentkezés szükséges.");
  }

  const picUrl = await profilkepLekereseFelhasznaloAlapjan(userId);
  fajlTorleseHaLetezik(taroltUtvonalKepzese(picUrl));
  await profilkepTorleseFelhasznalotol(userId);

  return {
    message: "Profilkép sikeresen törölve.",
  };
};

// Felhasználói profil lekérése.
const felhasznaloiProfilLekerese = async ({ reqBody, reqQuery, reqUser }) => {
  const userId = felhasznaloAzonositoFeldolgozasa({ body: reqBody, query: reqQuery, user: reqUser });
  if (!userId) {
    throw httpHiba(401, "Bejelentkezés szükséges.");
  }

  const profile = await felhasznaloiProfilLekereseIdAlapjan(userId);
  if (!profile) {
    throw httpHiba(404, "Felhasználó nem található.");
  }

  return profile;
};

// Felhasználói profil adatok frissítése.
const felhasznaloiProfilFrissitese = async ({ reqBody, reqQuery, reqUser }) => {
  const userId = felhasznaloAzonositoFeldolgozasa({ body: reqBody, query: reqQuery, user: reqUser });
  const username = String(reqBody?.username || "").trim();
  const teljesNev = String(reqBody?.teljes_nev || "").trim();
  const email = String(reqBody?.email || "").trim();

  if (!userId) {
    throw httpHiba(401, "Bejelentkezes szukseges.");
  }

  if (!username || !teljesNev || !email) {
    throw httpHiba(400, "Minden mezo kitoltese kotelezo.");
  }

  const existing = await utkozoFelhasznaloKeresese(userId, username, email);
  if (existing) {
    throw httpHiba(409, "A felhasznalonev vagy email mar foglalt.");
  }

  const updatedUser = await felhasznaloiProfilAdatainakFrissitese(userId, username, teljesNev, email);

  return {
    message: "Profil adatok sikeresen frissitve.",
    user: updatedUser,
  };
};

// Jelszó módosítása.
const jelszoModositasa = async ({ reqBody, reqQuery, reqUser }) => {
  const userId = felhasznaloAzonositoFeldolgozasa({ body: reqBody, query: reqQuery, user: reqUser });
  const currentPassword = String(reqBody?.currentPassword || "");
  const newPassword = String(reqBody?.newPassword || "");

  if (!userId) {
    throw httpHiba(401, "Bejelentkezes szukseges.");
  }

  if (!currentPassword || !newPassword) {
    throw httpHiba(400, "Minden mezo kitoltese kotelezo.");
  }

  if (newPassword.length < 8) {
    throw httpHiba(400, "Az uj jelszo legalabb 8 karakter legyen.");
  }

  const user = await felhasznaloJelszoHashLekerese(userId);
  if (!user) {
    throw httpHiba(404, "Felhasznalo nem talalhato.");
  }

  const validCurrent = await bcrypt.compare(currentPassword, user.jelszo_hash);
  if (!validCurrent) {
    throw httpHiba(400, "A jelenlegi jelszo hibas.");
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await felhasznaloJelszoHashFrissitese(userId, newHash);

  return {
    message: "Jelszo sikeresen frissitve.",
  };
};

module.exports = {
  profilkepFeltolteseSzolgaltatas,
  profilkepFrissiteseSzolgaltatas,
  profilkepTorleseSzolgaltatas,
  felhasznaloiProfilLekerese,
  felhasznaloiProfilFrissitese,
  jelszoModositasa,
};
