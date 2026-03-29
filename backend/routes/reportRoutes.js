const express = require("express");
const router = express.Router();
const { reportsController } = require("../controllers/reports");

router.post("/", reportsController.ujBejelentes);
router.get("/", reportsController.lista);
router.get("/:id", reportsController.reszletek);
router.patch("/:id/status", reportsController.statuszFrissites);

module.exports = router;
