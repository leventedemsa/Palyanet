const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  profilkepFeltoltese,
  profilkepFrissitese,
  profilkepTorlese,
  felhasznaloiProfilLekerese,
  felhasznaloiProfilFrissitese,
  jelszoModositasa,
} = require("../controllers/profile");

// Átmeneti könyvtár létrehozása, ha még nem létezik.
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Multer konfiguráció a fájlfeltöltéshez.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Csak képfájl feltöltésének engedélyezése.
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Csak képfájlokat lehet feltölteni."), false);
    }
  },
});

// Profilkép feltöltése.
router.post("/upload", upload.single("profilePicture"), profilkepFeltoltese);

// Profilkép frissítése.
router.put("/update", upload.single("profilePicture"), profilkepFrissitese);

// Profilkép törlése.
router.delete("/delete", profilkepTorlese);

// Felhasználói profil lekérése.
router.get("/profile", felhasznaloiProfilLekerese);

// Felhasználói profiladatok frissítése.
router.put("/update-data", felhasznaloiProfilFrissitese);

// Jelszó módosítása.
router.put("/change-password", jelszoModositasa);

module.exports = router;
