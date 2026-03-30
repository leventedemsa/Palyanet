const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  keresFelhasznaloEmailVagyUsernameAlapjan,
  felhasznaloLetrehozasa,
  keresFelhasznaloBelepeshez,
} = require("./repository");

// Engedélyezett szerepkörök.
const engedelyezettSzerepek = ["berlo", "palyatulajdonos"];

// HTTP-hiba létrehozása státuszkóddal
const httpHiba = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// Felhasználó regisztrációja.
// 1. kötelező mezők ellenőrzése
// 2. szerepkör validálása
// 3. email / username egyediség ellenőrzése
// 4. jelszó biztonságos hash-elése
// 5. felhasználó mentése az adatbázisba
const regisztracio = async ({ email, username, teljes_nev, password, szerep }) => {
  if (!email || !username || !teljes_nev || !password || !szerep) {
    throw httpHiba(400, "Minden kotelezo mezot ki kell tolteni.");
  }

  if (String(username).trim().toLowerCase() === "admin") {
    throw httpHiba(403, "Ez a felhasznalonev nem valaszthato.");
  }

  if (!engedelyezettSzerepek.includes(szerep)) {
    throw httpHiba(400, "Ervenytelen szerepkor.");
  }

  const letezoFelhasznalo = await keresFelhasznaloEmailVagyUsernameAlapjan(
    email,
    username
  );
  if (letezoFelhasznalo) {
    throw httpHiba(409, "Az email vagy a felhasznalonev mar foglalt.");
  }

  const jelszo_hash = await bcrypt.hash(password, 10);
  const user = await felhasznaloLetrehozasa({
    username,
    teljes_nev,
    email,
    jelszo_hash,
    szerep,
  });

  return {
    message: "Sikeres regisztracio.",
    user,
  };
};

// Felhasználó bejelentkeztetése.
// 1. azonosító (email vagy username) ellenőrzése
// 2. felhasználó lekérése
// 3. aktivitás ellenőrzése
// 4. jelszó összehasonlítása hash alapján
// 5. JWT token kiállítása
const bejelentkezes = async ({ identifier, password }) => {
  if (!identifier || !password) {
    throw httpHiba(400, "Az email vagy felhasznalonev, es a jelszo kotelezo.");
  }

  const user = await keresFelhasznaloBelepeshez(identifier);
  if (!user) {
    throw httpHiba(401, "Hibas belepesi adatok.");
  }

  if (!user.aktiv) {
    throw httpHiba(403, "A fiok inaktiv.");
  }

  const helyesJelszo = await bcrypt.compare(password, user.jelszo_hash);
  if (!helyesJelszo) {
    throw httpHiba(401, "Hibas belepesi adatok.");
  }

  const token = jwt.sign(
    {
      id: user.felhasznalo_id,
      email: user.email,
      username: user.username,
      szerep: user.szerep,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    message: "Sikeres bejelentkezes.",
    token,
    user: {
      felhasznalo_id: user.felhasznalo_id,
      username: user.username,
      teljes_nev: user.teljes_nev,
      email: user.email,
      szerep: user.szerep,
      profil_kep_url: user.profil_kep_url,
    },
  };
};

module.exports = {
  regisztracio,
  bejelentkezes,
};
