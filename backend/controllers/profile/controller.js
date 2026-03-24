const profileService = require("./service");

const uploadProfilePicture = async (req, res) => {
  try {
    const result = await profileService.uploadProfilePicture({
      reqFile: req.file,
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Profilkép feltöltési hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a profilkép feltöltésekor.",
    });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    const result = await profileService.updateProfilePicture({
      reqFile: req.file,
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Profilkép frissítési hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a profilkép frissítésekor.",
    });
  }
};

const deleteProfilePicture = async (req, res) => {
  try {
    const result = await profileService.deleteProfilePicture({
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Profilkép törlési hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a profilkép törlésekor.",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const result = await profileService.getUserProfile({
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Profil lekérési hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a profil lekérésekor.",
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const result = await profileService.updateUserProfile({
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Profil adatfrissitesi hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a profil adatok frissitesekor.",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const result = await profileService.changePassword({
      reqBody: req.body,
      reqQuery: req.query,
      reqUser: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Jelszocsere hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a jelszo modositasakor.",
    });
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
