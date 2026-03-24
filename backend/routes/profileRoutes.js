const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  uploadProfilePicture,
  updateProfilePicture,
  deleteProfilePicture,
  getUserProfile,
  updateUserProfile,
  changePassword,
} = require("../controllers/profile");

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for file uploads
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Csak képfájlokat lehet feltölteni."), false);
    }
  },
});

// Routes
router.post("/upload", upload.single("profilePicture"), uploadProfilePicture);
router.put("/update", upload.single("profilePicture"), updateProfilePicture);
router.delete("/delete", deleteProfilePicture);
router.get("/profile", getUserProfile);
router.put("/update-data", updateUserProfile);
router.put("/change-password", changePassword);

module.exports = router;
