const express = require("express");
const router = express.Router();
const {
  foglalasLetrehozasa,
  tulajFoglalasainakLekerese,
  berloFoglalasainakLekerese,
  foglalasElfogadasa,
  foglalasElutasitasa,
  fuggobenLevoFoglalasokSzama,
} = require("../controllers/booking");

// Új foglalás létrehozása.
router.post("/create", foglalasLetrehozasa);

// Tulajdonos foglalásainak lekérése.
router.get("/owner/:tulaj_id", tulajFoglalasainakLekerese);

// Bérlő foglalásainak lekérése.
router.get("/renter/:berlo_id", berloFoglalasainakLekerese);

// Foglalás elfogadása.
router.post("/accept", foglalasElfogadasa);

// Foglalás elutasítása.
router.post("/reject", foglalasElutasitasa);

// Függőben lévő foglalások számának lekérése tulajdonoshoz.
router.get("/pending-count/:tulaj_id", fuggobenLevoFoglalasokSzama);

module.exports = router;
