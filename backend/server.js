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
//hibakezelő directory path-ek
const frontendDir = path.join(__dirname, "..", "frontend");
const notFoundPage = path.join(frontendDir, "hibakezelo", "404notfound.html");
const internalErrorPage = path.join(frontendDir,"hibakezelo","500internalservererror.html");
const serviceUnavailablePage = path.join(frontendDir,"hibakezelo","503serviceunavailable.html");
const isMaintenanceMode = process.env.MAINTENANCE_MODE;

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

// 503 kezelő: karbantartási mód esetén a weboldalhoz 503-as oldalt, 
// API kéréseknél pedig JSON hibaválaszt ad vissza
app.use((req, res, next) => {
  if (isMaintenanceMode !== "true") {
    return next();
  }

  const isApiRequest =
    req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/auth");

  if (isApiRequest) {
    return res.status(503).json({ error: "Service unavailable" });
  }

  return res.status(503).sendFile(serviceUnavailablePage);
});

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

// 500 kezelő: szerverhiba esetén API kéréseknél JSON hibaválaszt,
// egyébként 500-as hibaoldalt küld
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const isApiRequest =
    req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/auth");

  if (isApiRequest) {
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(500).sendFile(internalErrorPage);
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Szerver fut a ${PORT} porton`);
  console.log(`Fő oldal: http://localhost:4000/index.html`)
});
