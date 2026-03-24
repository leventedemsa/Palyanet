const bookingService = require("./service");

const createBooking = async (req, res) => {
  try {
    const result = await bookingService.createBooking(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Foglalás létrehozási hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a foglalás létrehozásakor",
      ...(error.extra ? { debug: error.extra } : {}),
    });
  }
};

const getBookingsForOwner = async (req, res) => {
  try {
    const result = await bookingService.listOwnerBookings(req.params.tulaj_id);
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Foglalások lekérési hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a foglalások lekérésekor",
    });
  }
};

const getBookingsForRenter = async (req, res) => {
  try {
    const result = await bookingService.listRenterBookings(req.params.berlo_id);
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Foglalások lekérési hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a foglalások lekérésekor",
    });
  }
};

const acceptBooking = async (req, res) => {
  try {
    const result = await bookingService.acceptBooking(req.body && req.body.foglalas_id);
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Foglalás elfogadási hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a foglalás elfogadásakor",
    });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const result = await bookingService.rejectBooking(req.body && req.body.foglalas_id);
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Foglalás elutasítási hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a foglalás elutasításakor",
    });
  }
};

const getPendingBookingCount = async (req, res) => {
  try {
    const result = await bookingService.getPendingCount(req.params.tulaj_id);
    return res.status(200).json(result);
  } catch (error) {
    if (!error.status || error.status === 500) {
      console.error("Függőben lévő foglalások száma lekérési hiba:", error);
    }
    return res.status(error.status || 500).json({
      message: error.message || "Hiba a foglalások lekérésekor",
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
