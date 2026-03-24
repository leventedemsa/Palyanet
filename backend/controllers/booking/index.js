const {
  createBooking,
  getBookingsForOwner,
  getBookingsForRenter,
  acceptBooking,
  rejectBooking,
  getPendingBookingCount,
} = require("./controller");

module.exports = {
  createBooking,
  getBookingsForOwner,
  getBookingsForRenter,
  acceptBooking,
  rejectBooking,
  getPendingBookingCount,
};
