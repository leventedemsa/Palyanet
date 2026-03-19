require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const authRoutes = require("./routes/authRoutes");
const palyaRoutes = require("./routes/palyaRoutes");
const profileRoutes = require("./routes/profileRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const frontendDir = path.join(__dirname, "..", "frontend");
const notFoundPage = path.join(frontendDir, "hibakezelo", "404notfound.html");

app.use(cors());
app.use(express.json());

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth", authRoutes);
app.use("/api/palyak", palyaRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);

// Statikus frontend fájlok kiszolgálása
app.use(express.static(frontendDir));

// 404 kezelő: API-hoz JSON, oldalhoz HTML válasz
app.use((req, res) => {
  const isApiRequest =
    req.originalUrl.startsWith("/api") ||
    req.originalUrl.startsWith("/auth");

  if (isApiRequest) {
    return res.status(404).json({ error: "Not found" });
  }

  res.status(404).sendFile(notFoundPage);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Szerver fut a ${PORT} porton`);
});
