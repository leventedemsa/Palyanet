require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sql, poolPromise } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API működik");
});

app.post("/register", async (req, res) => {
  try {
    const {
      email,
      username,
      fullname,
      password,
      confirmPassword,
      gender,
      terms,
    } = req.body;

    if (!email || !username || !fullname || !password || !confirmPassword) {
      return res.status(400).json({ message: "Minden kötelező mezőt ki kell tölteni." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "A két jelszó nem egyezik." });
    }

    if (!terms) {
      return res.status(400).json({ message: "El kell fogadnod a feltételeket." });
    }

    const pool = await poolPromise;

    const existingUser = await pool
      .request()
      .input("email", sql.NVarChar(200), email)
      .input("username", sql.NVarChar(50), username)
      .query(`
        SELECT felhasznalo_id
        FROM Felhasznalok
        WHERE email = @email OR username = @username
      `);

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ message: "Az email vagy a felhasználónév már foglalt." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input("username", sql.NVarChar(50), username)
      .input("teljes_nev", sql.NVarChar(150), fullname)
      .input("email", sql.NVarChar(200), email)
      .input("jelszo_hash", sql.NVarChar(300), passwordHash)
      .input("nem", sql.NVarChar(30), gender || null)
      .query(`
        INSERT INTO Felhasznalok (username, teljes_nev, email, jelszo_hash, nem)
        OUTPUT
          INSERTED.felhasznalo_id,
          INSERTED.username,
          INSERTED.teljes_nev,
          INSERTED.email,
          INSERTED.nem,
          INSERTED.szerep,
          INSERTED.letrehozva
        VALUES (@username, @teljes_nev, @email, @jelszo_hash, @nem)
      `);

    const user = result.recordset[0];

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

    res.status(201).json({
      message: "Sikeres regisztráció.",
      token,
      user,
    });
  } catch (error) {
    console.error("Register hiba:", error);
    res.status(500).json({ message: "Szerverhiba történt." });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`A szerver fut a ${PORT} porton.`);
});