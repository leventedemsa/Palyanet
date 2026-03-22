const { sql, poolPromise } = require("../db");

const timeToMinutes = (timeValue) => {
  if (!timeValue) return null;
  const raw = String(timeValue);
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const dateToMinutes = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
};

// ===== CREATE BOOKING =====
const createBooking = async (req, res) => {
  try {
    let { palya_id, berlo_id, kezdes, vege, ar } = req.body;

    // Convert to proper types
    palya_id = parseInt(palya_id);
    berlo_id = parseInt(berlo_id);
    ar = parseInt(ar);

    if (!palya_id || !berlo_id || !kezdes || !vege || ar === undefined || ar === null || isNaN(palya_id) || isNaN(berlo_id) || isNaN(ar)) {
      return res.status(400).json({
        message: "Hiányzó vagy érvénytelen kötelező mezők",
        debug: { palya_id, berlo_id, kezdes, vege, ar }
      });
    }

    const pool = await poolPromise;

    // Check if track exists and get owner info
    const palyaResult = await pool
      .request()
      .input("palya_id", sql.Int, palya_id)
      .query(`
        SELECT p.*,
               CONVERT(VARCHAR(8), p.nyitas, 108) AS nyitas_str,
               CONVERT(VARCHAR(8), p.zaras, 108) AS zaras_str,
               f.email as tulaj_email, f.teljes_nev as tulaj_nev, f.felhasznalo_id as tulaj_id
        FROM Palya p
        JOIN Felhasznalok f ON p.tulaj_id = f.felhasznalo_id
        WHERE p.palya_id = @palya_id
      `);

    if (palyaResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Pálya nem található",
      });
    }

    const palya = palyaResult.recordset[0];

    // Validate booking interval against track opening hours
    const nyitasMinutes = timeToMinutes(palya.nyitas_str || palya.nyitas);
    const zarasMinutes = timeToMinutes(palya.zaras_str || palya.zaras);
    const kezdesMinutes = dateToMinutes(kezdes);
    const vegeMinutes = dateToMinutes(vege);
    const kezdesDate = new Date(kezdes);
    const vegeDate = new Date(vege);

    if (
      nyitasMinutes === null ||
      zarasMinutes === null ||
      kezdesMinutes === null ||
      vegeMinutes === null ||
      Number.isNaN(kezdesDate.getTime()) ||
      Number.isNaN(vegeDate.getTime())
    ) {
      return res.status(400).json({
        message: "Ervenytelen idoformátum",
      });
    }

    const sameDay =
      kezdesDate.getFullYear() === vegeDate.getFullYear() &&
      kezdesDate.getMonth() === vegeDate.getMonth() &&
      kezdesDate.getDate() === vegeDate.getDate();

    if (!sameDay) {
      return res.status(400).json({
        message: "A foglalas csak egy napon belul lehet.",
      });
    }

    if (kezdesMinutes < nyitasMinutes || vegeMinutes > zarasMinutes) {
      return res.status(400).json({
        message: `Csak a palya nyitvatartasan belul lehet foglalni (${palya.nyitas_str || palya.nyitas} - ${palya.zaras_str || palya.zaras}).`,
      });
    }

    // Get renter info
    const berloResult = await pool
      .request()
      .input("berlo_id", sql.Int, berlo_id)
      .query(`
        SELECT felhasznalo_id, username, teljes_nev, email, szerep, tiltva
        FROM Felhasznalok
        WHERE felhasznalo_id = @berlo_id
      `);

    if (berloResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Bérlő nem található",
      });
    }

    const berlo = berloResult.recordset[0];
    if (berlo.tiltva) {
      return res.status(403).json({
        message: "A felhasznalo tiltva van, nem tud foglalni.",
      });
    }
    if (String(berlo.szerep || "").toLowerCase() === "admin") {
      return res.status(403).json({
        message: "Admin felhasznalo nem foglalhat palyat.",
      });
    }

    // Create booking with 'pending' status
    const bookingResult = await pool
      .request()
      .input("palya_id", sql.Int, palya_id)
      .input("berlo_id", sql.Int, berlo_id)
      .input("kezdes", sql.DateTime2, new Date(kezdes))
      .input("vege", sql.DateTime2, new Date(vege))
      .input("statusz", sql.NVarChar(50), "pending")
      .input("ar", sql.Int, ar)
      .input("fizetes_statusz", sql.NVarChar(50), "pending")
      .query(`
        INSERT INTO Foglalas (palya_id, berlo_id, kezdes, vege, statusz, ar, fizetes_statusz)
        VALUES (@palya_id, @berlo_id, @kezdes, @vege, @statusz, @ar, @fizetes_statusz);

        SELECT *
        FROM Foglalas
        WHERE foglalas_id = CAST(SCOPE_IDENTITY() AS INT);
      `);

    const booking = bookingResult.recordset[0];

    // Create notification for track owner
    const notificationMessage = `Új foglalási kérelem: ${berlo.teljes_nev} (${berlo.username}) szeretné lefoglalni a "${palya.nev}" pályát ${new Date(kezdes).toLocaleDateString("hu-HU")} napra.`;

    const tulaj_id = parseInt(palya.tulaj_id);
    if (isNaN(tulaj_id)) {
      console.error("Hiba: tulaj_id érvénytelen:", palya.tulaj_id);
      return res.status(500).json({
        message: "Hiba a pályatulajdonos azonosítás során"
      });
    }

    await pool
      .request()
      .input("kuldo_id", sql.Int, berlo_id)
      .input("cimzett_id", sql.Int, tulaj_id)
      .input("uzenet", sql.NVarChar("MAX"), notificationMessage)
      .query(`
        INSERT INTO Ertesites (kuldo_id, cimzett_id, uzenet, olvasott)
        VALUES (@kuldo_id, @cimzett_id, @uzenet, 0)
      `);

    return res.status(201).json({
      message: "Foglalási kérelem sikeresen létrehozva",
      booking: {
        ...booking,
        palya_nev: palya.nev,
        berlo_nev: berlo.teljes_nev,
      },
    });
  } catch (error) {
    console.error("Foglalás létrehozási hiba:", error);
    return res.status(500).json({
      message: "Hiba a foglalás létrehozásakor: " + (error.message || error)
    });
  }
};

// ===== GET BOOKINGS FOR OWNER =====
const getBookingsForOwner = async (req, res) => {
  try {
    const { tulaj_id } = req.params;

    if (!tulaj_id) {
      return res.status(400).json({
        message: "Pályatulajdonos ID szükséges",
      });
    }

    const pool = await poolPromise;

    // Get all bookings for owner's tracks
    const result = await pool
      .request()
      .input("tulaj_id", sql.Int, tulaj_id)
      .query(`
        SELECT 
          f.foglalas_id,
          f.palya_id,
          f.berlo_id,
          f.kezdes,
          f.vege,
          f.statusz,
          f.ar,
          f.fizetes_statusz,
          f.letrehozva,
          p.nev as palya_nev,
          p.sportag,
          p.helyszin,
          b.username,
          b.teljes_nev,
          b.email,
          b.profil_kep_url
        FROM Foglalas f
        JOIN Palya p ON f.palya_id = p.palya_id
        JOIN Felhasznalok b ON f.berlo_id = b.felhasznalo_id
        WHERE p.tulaj_id = @tulaj_id
        ORDER BY f.letrehozva DESC
      `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Foglalások lekérési hiba:", error);
    return res.status(500).json({
      message: "Hiba a foglalások lekérésekor",
    });
  }
};

// ===== GET BOOKINGS FOR RENTER =====
const getBookingsForRenter = async (req, res) => {
  try {
    const { berlo_id } = req.params;

    if (!berlo_id) {
      return res.status(400).json({
        message: "Bérlő ID szükséges",
      });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("berlo_id", sql.Int, berlo_id)
      .query(`
        SELECT 
          f.foglalas_id,
          f.palya_id,
          f.berlo_id,
          f.kezdes,
          f.vege,
          f.statusz,
          f.ar,
          f.fizetes_statusz,
          f.letrehozva,
          p.nev as palya_nev,
          p.sportag,
          p.helyszin,
          p.kep_url,
          p.tulaj_id,
          o.username as tulaj_username,
          o.teljes_nev as tulaj_nev,
          o.profil_kep_url as tulaj_profilkep
        FROM Foglalas f
        JOIN Palya p ON f.palya_id = p.palya_id
        JOIN Felhasznalok o ON p.tulaj_id = o.felhasznalo_id
        WHERE f.berlo_id = @berlo_id
        ORDER BY f.letrehozva DESC
      `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Foglalások lekérési hiba:", error);
    return res.status(500).json({
      message: "Hiba a foglalások lekérésekor",
    });
  }
};

// ===== ACCEPT BOOKING =====
const acceptBooking = async (req, res) => {
  try {
    const { foglalas_id } = req.body;

    if (!foglalas_id) {
      return res.status(400).json({
        message: "Foglalás ID szükséges",
      });
    }

    const pool = await poolPromise;

    // Get booking details
    const bookingResult = await pool
      .request()
      .input("foglalas_id", sql.Int, foglalas_id)
      .query(`
        SELECT f.*, p.nev as palya_nev, b.teljes_nev as berlo_nev, b.email as berlo_email, p.tulaj_id
        FROM Foglalas f
        JOIN Palya p ON f.palya_id = p.palya_id
        JOIN Felhasznalok b ON f.berlo_id = b.felhasznalo_id
        WHERE f.foglalas_id = @foglalas_id
      `);

    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Foglalás nem található",
      });
    }

    const booking = bookingResult.recordset[0];

    // Update booking status to 'accepted'
    await pool
      .request()
      .input("foglalas_id", sql.Int, foglalas_id)
      .query(`
        UPDATE Foglalas
        SET statusz = 'accepted'
        WHERE foglalas_id = @foglalas_id
      `);

    // Create notification for renter
    const notificationMessage = `Jó hír! A "${booking.palya_nev}" pályabérlést elfogadták ${new Date(booking.kezdes).toLocaleDateString("hu-HU")} napra.`;

    await pool
      .request()
      .input("kuldo_id", sql.Int, booking.tulaj_id) // Owner sends notification
      .input("cimzett_id", sql.Int, booking.berlo_id) // To renter
      .input("uzenet", sql.NVarChar("MAX"), notificationMessage)
      .query(`
        INSERT INTO Ertesites (kuldo_id, cimzett_id, uzenet, olvasott)
        VALUES (@kuldo_id, @cimzett_id, @uzenet, 0)
      `);

    return res.status(200).json({
      message: "Foglalás elfogadva",
      booking: booking,
    });
  } catch (error) {
    console.error("Foglalás elfogadási hiba:", error);
    return res.status(500).json({
      message: "Hiba a foglalás elfogadásakor",
    });
  }
};

// ===== REJECT BOOKING =====
const rejectBooking = async (req, res) => {
  try {
    const { foglalas_id } = req.body;

    if (!foglalas_id) {
      return res.status(400).json({
        message: "Foglalás ID szükséges",
      });
    }

    const pool = await poolPromise;

    // Get booking details
    const bookingResult = await pool
      .request()
      .input("foglalas_id", sql.Int, foglalas_id)
      .query(`
        SELECT f.*, p.nev as palya_nev, b.teljes_nev as berlo_nev, b.email as berlo_email, p.tulaj_id
        FROM Foglalas f
        JOIN Palya p ON f.palya_id = p.palya_id
        JOIN Felhasznalok b ON f.berlo_id = b.felhasznalo_id
        WHERE f.foglalas_id = @foglalas_id
      `);

    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Foglalás nem található",
      });
    }

    const booking = bookingResult.recordset[0];

    // Update booking status to 'rejected'
    await pool
      .request()
      .input("foglalas_id", sql.Int, foglalas_id)
      .query(`
        UPDATE Foglalas
        SET statusz = 'rejected'
        WHERE foglalas_id = @foglalas_id
      `);

    // Create notification for renter
    const notificationMessage = `Sajnos a "${booking.palya_nev}" pályabérlési kérelmet elutasították ${new Date(booking.kezdes).toLocaleDateString("hu-HU")} napra.`;

    await pool
      .request()
      .input("kuldo_id", sql.Int, booking.tulaj_id) // Owner sends notification
      .input("cimzett_id", sql.Int, booking.berlo_id) // To renter
      .input("uzenet", sql.NVarChar("MAX"), notificationMessage)
      .query(`
        INSERT INTO Ertesites (kuldo_id, cimzett_id, uzenet, olvasott)
        VALUES (@kuldo_id, @cimzett_id, @uzenet, 0)
      `);

    return res.status(200).json({
      message: "Foglalás elutasítva",
      booking: booking,
    });
  } catch (error) {
    console.error("Foglalás elutasítási hiba:", error);
    return res.status(500).json({
      message: "Hiba a foglalás elutasításakor",
    });
  }
};

// ===== GET PENDING BOOKING COUNT FOR OWNER =====
const getPendingBookingCount = async (req, res) => {
  try {
    const { tulaj_id } = req.params;

    if (!tulaj_id) {
      return res.status(400).json({
        message: "Pályatulajdonos ID szükséges",
      });
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("tulaj_id", sql.Int, tulaj_id)
      .query(`
        SELECT COUNT(*) as pending_count
        FROM Foglalas f
        JOIN Palya p ON f.palya_id = p.palya_id
        WHERE p.tulaj_id = @tulaj_id AND f.statusz = 'pending'
      `);

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Függőben lévő foglalások száma lekérési hiba:", error);
    return res.status(500).json({
      message: "Hiba a foglalások lekérésekor",
    });
  }
};

module.exports = {
  createBooking,
  getBookingsForOwner,
  getBookingsForRenter,
  acceptBooking,
  rejectBooking,
  getPendingBookingCount,
};
