const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookingsForOwner,
  getBookingsForRenter,
  acceptBooking,
  rejectBooking,
  getPendingBookingCount,
} = require("../controllers/booking");

// Create new booking
router.post("/create", createBooking);

// Get bookings for owner
router.get("/owner/:tulaj_id", getBookingsForOwner);

// Get bookings for renter
router.get("/renter/:berlo_id", getBookingsForRenter);

// Accept booking
router.post("/accept", acceptBooking);

// Reject booking
router.post("/reject", rejectBooking);

// Get pending booking count for owner
router.get("/pending-count/:tulaj_id", getPendingBookingCount);

module.exports = router;
