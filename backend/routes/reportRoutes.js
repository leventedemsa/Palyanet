const express = require("express");
const router = express.Router();
const { reportsController } = require("../controllers/reports");

// Új bejelentés rögzítése.
router.post("/", reportsController.ujBejelentes);
// Bejelentések listázása admin számára.
router.get("/", reportsController.lista);
// Egy bejelentés részleteinek lekérése.
router.get("/:id", reportsController.reszletek);
// Bejelentés státuszának frissítése.
router.patch("/:id/status", reportsController.statuszFrissites);

module.exports = router;
