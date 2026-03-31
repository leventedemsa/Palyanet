const {
  getPalyaById,
  getRenterById,
  createBookingRecord,
  createNotification,
  logBejegyzesLetrehozasa,
  getBookingsForOwner,
  getBookingsForRenter,
  getBookingById,
  updateBookingStatus,
  getPendingBookingCount,
} = require("./repository");

const httpError = (status, message, extra) => {
  const error = new Error(message);
  error.status = status;
  if (extra) {
    error.extra = extra;
  }
  return error;
};

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

const createBooking = async ({ palya_id, berlo_id, kezdes, vege, ar }) => {
  const palyaId = parseInt(palya_id, 10);
  const berloId = parseInt(berlo_id, 10);
  const price = parseInt(ar, 10);

  if (!palyaId || !berloId || !kezdes || !vege || price === undefined || price === null || Number.isNaN(palyaId) || Number.isNaN(berloId) || Number.isNaN(price)) {
    throw httpError(400, "Hiányzó vagy érvénytelen kötelező mezők", {
      palya_id: palyaId,
      berlo_id: berloId,
      kezdes,
      vege,
      ar: price,
    });
  }

  const palya = await getPalyaById(palyaId);
  if (!palya) {
    throw httpError(404, "Pálya nem található");
  }

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
    throw httpError(400, "Ervenytelen idoformátum");
  }

  const sameDay =
    kezdesDate.getFullYear() === vegeDate.getFullYear() &&
    kezdesDate.getMonth() === vegeDate.getMonth() &&
    kezdesDate.getDate() === vegeDate.getDate();

  if (!sameDay) {
    throw httpError(400, "A foglalás csak egy napon belül lehet.");
  }

  if (kezdesMinutes < nyitasMinutes || vegeMinutes > zarasMinutes) {
    throw httpError(
      400,
      `Csak a pálya nyitvatartásán belül lehet foglalni (${palya.nyitas_str || palya.nyitas} - ${palya.zaras_str || palya.zaras}).`
    );
  }

  const berlo = await getRenterById(berloId);
  if (!berlo) {
    throw httpError(404, "Bérlő nem található");
  }

  if (berlo.tiltva) {
    throw httpError(403, "A felhasználó tiltva van, nem tud foglalni.");
  }

  if (String(berlo.szerep || "").toLowerCase() === "admin") {
    throw httpError(403, "Admin felhasználó nem foglalhat pályát.");
  }

  const booking = await createBookingRecord({
    palyaId,
    berloId,
    kezdes,
    vege,
    ar: price,
  });
  const log_esemeny_tipus = "foglalas_letrehozva";
  await logBejegyzesLetrehozasa({
    felhasznalo_id: berloId,
    esemeny_tipus: log_esemeny_tipus,
  });

  const notificationMessage = `Új foglalási kérelem: ${berlo.teljes_nev} (${berlo.username}) szeretné lefoglalni a "${palya.nev}" pályát ${new Date(kezdes).toLocaleDateString("hu-HU")} napra.`;

  const tulajId = parseInt(palya.tulaj_id, 10);
  if (Number.isNaN(tulajId)) {
    throw httpError(500, "Hiba a pályatulajdonos azonosítás során");
  }

  await createNotification({
    kuldoId: berloId,
    cimzettId: tulajId,
    uzenet: notificationMessage,
  });

  return {
    message: "Foglalási kérelem sikeresen létrehozva",
    booking: {
      ...booking,
      palya_nev: palya.nev,
      berlo_nev: berlo.teljes_nev,
    },
  };
};

const listOwnerBookings = async (tulajId) => {
  if (!tulajId) {
    throw httpError(400, "Pályatulajdonos ID szükséges");
  }

  return getBookingsForOwner(parseInt(tulajId, 10));
};

const listRenterBookings = async (berloId) => {
  if (!berloId) {
    throw httpError(400, "Bérlő ID szükséges");
  }

  return getBookingsForRenter(parseInt(berloId, 10));
};

const acceptBooking = async (foglalasId) => {
  const bookingId = parseInt(foglalasId, 10);
  if (!bookingId) {
    throw httpError(400, "Foglalás ID szükséges");
  }

  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw httpError(404, "Foglalás nem található");
  }

  await updateBookingStatus(bookingId, "accepted");

  const notificationMessage = `Jó hír! A "${booking.palya_nev}" pályabérlést elfogadták ${new Date(booking.kezdes).toLocaleDateString("hu-HU")} napra.`;

  await createNotification({
    kuldoId: booking.tulaj_id,
    cimzettId: booking.berlo_id,
    uzenet: notificationMessage,
  });

  return {
    message: "Foglalás elfogadva",
    booking,
  };
};

const rejectBooking = async (foglalasId) => {
  const bookingId = parseInt(foglalasId, 10);
  if (!bookingId) {
    throw httpError(400, "Foglalás ID szükséges");
  }

  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw httpError(404, "Foglalás nem található");
  }

  await updateBookingStatus(bookingId, "rejected");

  const notificationMessage = `Sajnos a "${booking.palya_nev}" pályabérlési kérelmet elutasították ${new Date(booking.kezdes).toLocaleDateString("hu-HU")} napra.`;

  await createNotification({
    kuldoId: booking.tulaj_id,
    cimzettId: booking.berlo_id,
    uzenet: notificationMessage,
  });

  return {
    message: "Foglalás elutasítva",
    booking,
  };
};

const getPendingCount = async (tulajId) => {
  if (!tulajId) {
    throw httpError(400, "Pályatulajdonos ID szükséges");
  }

  return getPendingBookingCount(parseInt(tulajId, 10));
};

module.exports = {
  createBooking,
  listOwnerBookings,
  listRenterBookings,
  acceptBooking,
  rejectBooking,
  getPendingCount,
};
