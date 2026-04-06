const profilSzolgaltatas = require("./service");

// Profilkép feltöltése.
const profilkepFeltoltese = async (req, res) => {
  try {
    const valasz = await profilSzolgaltatas.uploadProfilePicture({
      reqFile: req.file,
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Profilkép feltöltési hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a profilkép feltöltésekor.",
    });
  }
};

// Profilkép frissítése.
const profilkepFrissitese = async (req, res) => {
  try {
    const valasz = await profilSzolgaltatas.updateProfilePicture({
      reqFile: req.file,
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Profilkép frissítési hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a profilkép frissítésekor.",
    });
  }
};

// Profilkép törlése.
const profilkepTorlese = async (req, res) => {
  try {
    const valasz = await profilSzolgaltatas.deleteProfilePicture({
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Profilkép törlési hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a profilkép törlésekor.",
    });
  }
};

// Felhasználói profil lekérése.
const felhasznaloiProfilLekerese = async (req, res) => {
  try {
    const valasz = await profilSzolgaltatas.getUserProfile({
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Profil lekérési hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a profil lekérésekor.",
    });
  }
};

// Felhasználói profil frissítése.
const felhasznaloiProfilFrissitese = async (req, res) => {
  try {
    const valasz = await profilSzolgaltatas.updateUserProfile({
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Profil adatfrissitesi hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a profil adatok frissitesekor.",
    });
  }
};

// Jelszó módosítása.
const jelszoModositasa = async (req, res) => {
  try {
    const valasz = await profilSzolgaltatas.changePassword({
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Jelszocsere hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a jelszo modositasakor.",
    });
  }
};

module.exports = {
  profilkepFeltoltese,
  profilkepFrissitese,
  profilkepTorlese,
  felhasznaloiProfilLekerese,
  felhasznaloiProfilFrissitese,
  jelszoModositasa,
};
