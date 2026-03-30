require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { sql, poolPromise } = require("./db");
const authRoutes = require("./routes/authRoutes");
const palyaRoutes = require("./routes/palyaRoutes");
const profileRoutes = require("./routes/profileRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
// Hibakezelő directory path-ek.
const frontendKonyvtar = path.join(__dirname, "..", "frontend");
const nemTalalhatoOldal = path.join(frontendKonyvtar, "hibakezelo", "404notfound.html");
const belsoHibaOldal = path.join(frontendKonyvtar, "hibakezelo", "500internalservererror.html");
const szolgaltatasNemElerhetoOldal = path.join(frontendKonyvtar, "hibakezelo", "503serviceunavailable.html");
const karbantartasiMod = process.env.MAINTENANCE_MODE;

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
// API kéréseknél pedig JSON hibaválaszt ad vissza.
app.use((req, res, next) => {
    if (karbantartasiMod !== "true") {
        return next();
    }

    const apiKeres = req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/auth");

    if (apiKeres) {
        return res.status(503).json({ error: "Service unavailable" });
    }

    return res.status(503).sendFile(szolgaltatasNemElerhetoOldal);
});

app.use("/auth", authRoutes);
app.use("/api/palyak", palyaRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
// Bejelentések.
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

// Statikus frontend fájlok kiszolgálása.
app.use(express.static(frontendKonyvtar));

// 404 kezelő: API-hoz JSON, oldalhoz HTML válasz.
app.use((req, res) => {
    const apiKeres = req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/auth");

    if (apiKeres) {
        return res.status(404).json({ error: "Not found" });
    }

    res.status(404).sendFile(nemTalalhatoOldal);
});

// 500 kezelő: szerverhiba esetén API kéréseknél JSON hibaválaszt,
// egyébként 500-as hibaoldalt küld.
app.use((err, req, res, next) => {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    const apiKeres = req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/auth");

    if (apiKeres) {
        return res.status(500).json({ error: "Internal server error" });
    }

    return res.status(500).sendFile(belsoHibaOldal);
});
// Alapértelmezett admin felhasználó létrehozása, ha még nincs admin a rendszerben.
async function letrehozAdmin() {
    try {
         const pool = await poolPromise;
        const admindbEredmeny = await pool.request().query(`
        SELECT COUNT(*) AS admin_darab
        FROM Felhasznalok
        WHERE szerep = N'admin'
        `);
        const adminDB = Number(admindbEredmeny.recordset[0]?.admin_darab || 0);
        if (adminDB > 0) {
            return;
        }
        const hash = await bcrypt.hash("admin123", 10);
        await pool
            .request()
            .input("username", sql.NVarChar(50), "admin")
            .input("teljes_nev", sql.NVarChar(150), "Rendszer Admin")
            .input("email", sql.NVarChar(200), "admin@palyanet.local")
            .input("jelszo_hash", sql.NVarChar(300), hash)
            .input("szerep", sql.NVarChar(50), "admin").query(`
            INSERT INTO Felhasznalok (username, teljes_nev, email, jelszo_hash, szerep)
            VALUES (@username, @teljes_nev, @email, @jelszo_hash, @szerep)
            `);
        console.log("Alap admin felhasználó létrehozva! (admin, admin123)");
    } catch (error) {
        console.error("Hiba az alap admin létrehozásakor:", error);
        throw error;
    }
   
}
// Alapértelmezett pályatulajdonos felhasználó létrehozása, ha még nincs admin a rendszerben.
async function letrehozPalyatulajdonos(){
    try {
        const pool = await poolPromise;
        const palyatulajdonosdbEredmeny = await pool.request().query(`
            SELECT COUNT(*) AS palyatulajdonos_darab
            FROM Felhasznalok
            WHERE szerep = N'palyatulajdonos'
            `);
        const palyatulajdonosDB = Number(palyatulajdonosdbEredmeny.recordset[0]?.palyatulajdonos_darab || 0);
        if(palyatulajdonosDB > 0) return;
        const jelszoHash = await bcrypt.hash("tulaj123", 10); 
        await pool
        .request()
        .input("username", sql.NVarChar(50), "tulaj")
        .input("teljes_nev", sql.NVarChar(150), "Alap Pályatulajdonos")
        .input("email", sql.NVarChar(200), "palyatulaj@palyanet.local")
        .input("jelszo_hash", sql.NVarChar(300), jelszoHash)
        .input("szerep", sql.NVarChar(50), "palyatulajdonos").query(`
            INSERT INTO Felhasznalok (username, teljes_nev, email, jelszo_hash, szerep)
                VALUES (@username, @teljes_nev, @email, @jelszo_hash, @szerep)
        `);
        console.log("Alap pályatulajdonos létrehozva! (tulaj, tulaj123)")
    } catch (error) {
        console.error("Hiba az alap pályatulajdonos létrehozásakor:", error);
        throw error;
    }
    
}
// Alapértelmezett bérlő felhasználó létrehozása, ha még nincs admin a rendszerben.
async function letrehozBerlo(){
    try {
        const pool = await poolPromise;
        const berlodbEredmeny = await pool.request().query(`
            SELECT COUNT(*) AS berlo_darab
            FROM Felhasznalok
            WHERE szerep = N'berlo'
            `);
        const berloDB = Number(berlodbEredmeny.recordset[0]?.berlo_darab || 0);
        if(berloDB > 0) return;
        const jelszoHash = await bcrypt.hash("berlo123", 10); 
        await pool
        .request()
        .input("username", sql.NVarChar(50), "berlo")
        .input("teljes_nev", sql.NVarChar(150), "Alap Bérlő")
        .input("email", sql.NVarChar(200), "berlo@palyanet.local")
        .input("jelszo_hash", sql.NVarChar(300), jelszoHash)
        .input("szerep", sql.NVarChar(50), "berlo").query(`
            INSERT INTO Felhasznalok (username, teljes_nev, email, jelszo_hash, szerep)
                VALUES (@username, @teljes_nev, @email, @jelszo_hash, @szerep)
        `);
        console.log("Alap bérlő létrehozva! (berlo, berlo123)")
    } catch (error) {
        console.error("Hiba az alap bérlő létrehozásakor:", error);
        throw error;
    }
    
}
async function startServer() {
    try {
        await poolPromise;
        await letrehozAdmin();
        await letrehozPalyatulajdonos();
        await letrehozBerlo();

        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`Szerver fut a ${PORT} porton`);
            console.log(`Fő oldal: http://localhost:4000/index.html`);
        });
    } catch (error) {
        console.error("Szerver indítási hiba:", error);
        process.exit(1);
    }
}

startServer();
