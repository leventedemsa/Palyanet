const foglalasSzolgaltatas = require("./service");

// Új foglalás létrehozása.
const foglalasLetrehozasa = async (req, res) => {
  try {
    const valasz = await foglalasSzolgaltatas.createBooking(req.body || {});
    return res.status(201).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Foglalás létrehozási hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a foglalás létrehozásakor",
      ...(hiba.extra ? { debug: hiba.extra } : {}),
    });
  }
};

// Tulajdonos foglalásainak lekérése.
const tulajFoglalasainakLekerese = async (req, res) => {
  try {
    const valasz = await foglalasSzolgaltatas.listOwnerBookings(req.params.tulaj_id);
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Foglalások lekérési hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a foglalások lekérésekor",
    });
  }
};

// Bérlő foglalásainak lekérése.
const berloFoglalasainakLekerese = async (req, res) => {
  try {
    const valasz = await foglalasSzolgaltatas.listRenterBookings(req.params.berlo_id);
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Foglalások lekérési hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a foglalások lekérésekor",
    });
  }
};

// Foglalás elfogadása.
const foglalasElfogadasa = async (req, res) => {
  try {
    const valasz = await foglalasSzolgaltatas.acceptBooking(req.body && req.body.foglalas_id);
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Foglalás elfogadási hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a foglalás elfogadásakor",
    });
  }
};

// Foglalás elutasítása.
const foglalasElutasitasa = async (req, res) => {
  try {
    const valasz = await foglalasSzolgaltatas.rejectBooking(req.body && req.body.foglalas_id);
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Foglalás elutasítási hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a foglalás elutasításakor",
    });
  }
};

// Függőben lévő foglalások számának lekérése.
const fuggobenLevoFoglalasokSzama = async (req, res) => {
  try {
    const valasz = await foglalasSzolgaltatas.getPendingCount(req.params.tulaj_id);
    return res.status(200).json(valasz);
  } catch (hiba) {
    if (!hiba.status || hiba.status === 500) {
      console.error("Függőben lévő foglalások száma lekérési hiba:", hiba);
    }
    return res.status(hiba.status || 500).json({
      message: hiba.message || "Hiba a foglalások lekérésekor",
    });
  }
};

module.exports = {
  foglalasLetrehozasa,
  tulajFoglalasainakLekerese,
  berloFoglalasainakLekerese,
  foglalasElfogadasa,
  foglalasElutasitasa,
  fuggobenLevoFoglalasokSzama,
};
