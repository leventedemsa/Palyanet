const {
  palyaLekereseIdAlapjan,
  berloLekereseIdAlapjan,
  foglalasiRekordLetrehozasa,
  ertesitesLetrehozasa,
  logBejegyzesLetrehozasa,
  tulajFoglalasainakLekerese,
  berloFoglalasainakLekerese,
  foglalasLekereseIdAlapjan,
  foglalasStatuszFrissitese,
  fuggobenLevoFoglalasokSzama,
} = require("./repository");

// HTTP hibaobjektum létrehozása opcionális extra mezővel.
const httpHiba = (status, message, extra) => {
  const hiba = new Error(message);
  hiba.status = status;
  if (extra) {
    hiba.extra = extra;
  }
  return hiba;
};

// Időérték átalakítása percekre.
const idoPercreValtasa = (timeValue) => {
  if (!timeValue) return null;
  const raw = String(timeValue);
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

// Dátumérték aktuális napi percekre alakítása.
const datumPercreValtasa = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
};

// Foglalás létrehozása üzleti validációkkal.
const foglalasLetrehozasa = async ({ palya_id, berlo_id, kezdes, vege, ar }) => {
  const palyaId = parseInt(palya_id, 10);
  const berloId = parseInt(berlo_id, 10);
  const price = parseInt(ar, 10);

  if (!palyaId || !berloId || !kezdes || !vege || price === undefined || price === null || Number.isNaN(palyaId) || Number.isNaN(berloId) || Number.isNaN(price)) {
    throw httpHiba(400, "Hiányzó vagy érvénytelen kötelező mezők", {
      palya_id: palyaId,
      berlo_id: berloId,
      kezdes,
      vege,
      ar: price,
    });
  }

  const palya = await palyaLekereseIdAlapjan(palyaId);
  if (!palya) {
    throw httpHiba(404, "Pálya nem található");
  }

  const nyitasMinutes = idoPercreValtasa(palya.nyitas_str || palya.nyitas);
  const zarasMinutes = idoPercreValtasa(palya.zaras_str || palya.zaras);
  const kezdesMinutes = datumPercreValtasa(kezdes);
  const vegeMinutes = datumPercreValtasa(vege);
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
    throw httpHiba(400, "Ervenytelen idoformátum");
  }

  const sameDay =
    kezdesDate.getFullYear() === vegeDate.getFullYear() &&
    kezdesDate.getMonth() === vegeDate.getMonth() &&
    kezdesDate.getDate() === vegeDate.getDate();

  if (!sameDay) {
    throw httpHiba(400, "A foglalás csak egy napon belül lehet.");
  }

  if (kezdesMinutes < nyitasMinutes || vegeMinutes > zarasMinutes) {
    throw httpHiba(
      400,
      `Csak a pálya nyitvatartásán belül lehet foglalni (${palya.nyitas_str || palya.nyitas} - ${palya.zaras_str || palya.zaras}).`
    );
  }

  const berlo = await berloLekereseIdAlapjan(berloId);
  if (!berlo) {
    throw httpHiba(404, "Bérlő nem található");
  }

  if (berlo.tiltva) {
    throw httpHiba(403, "A felhasználó tiltva van, nem tud foglalni.");
  }

  if (String(berlo.szerep || "").toLowerCase() === "admin") {
    throw httpHiba(403, "Admin felhasználó nem foglalhat pályát.");
  }

  const foglalas = await foglalasiRekordLetrehozasa({
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
    throw httpHiba(500, "Hiba a pályatulajdonos azonosítás során");
  }

  await ertesitesLetrehozasa({
    kuldoId: berloId,
    cimzettId: tulajId,
    uzenet: notificationMessage,
  });

  return {
    message: "Foglalási kérelem sikeresen létrehozva",
    booking: {
      ...foglalas,
      palya_nev: palya.nev,
      berlo_nev: berlo.teljes_nev,
    },
  };
};

// Tulajdonos foglalásainak listázása.
const tulajFoglalasainakListazasa = async (tulajId) => {
  if (!tulajId) {
    throw httpHiba(400, "Pályatulajdonos ID szükséges");
  }

  return tulajFoglalasainakLekerese(parseInt(tulajId, 10));
};

// Bérlő foglalásainak listázása.
const berloFoglalasainakListazasa = async (berloId) => {
  if (!berloId) {
    throw httpHiba(400, "Bérlő ID szükséges");
  }

  return berloFoglalasainakLekerese(parseInt(berloId, 10));
};

// Foglalás elfogadása és értesítés küldése.
const foglalasElfogadasa = async (foglalasId) => {
  const bookingId = parseInt(foglalasId, 10);
  if (!bookingId) {
    throw httpHiba(400, "Foglalás ID szükséges");
  }

  const foglalas = await foglalasLekereseIdAlapjan(bookingId);
  if (!foglalas) {
    throw httpHiba(404, "Foglalás nem található");
  }

  await foglalasStatuszFrissitese(bookingId, "accepted");

  const notificationMessage = `Jó hír! A "${foglalas.palya_nev}" pályabérlést elfogadták ${new Date(foglalas.kezdes).toLocaleDateString("hu-HU")} napra.`;

  await ertesitesLetrehozasa({
    kuldoId: foglalas.tulaj_id,
    cimzettId: foglalas.berlo_id,
    uzenet: notificationMessage,
  });

  return {
    message: "Foglalás elfogadva",
    booking: foglalas,
  };
};

// Foglalás elutasítása és értesítés küldése.
const foglalasElutasitasa = async (foglalasId) => {
  const bookingId = parseInt(foglalasId, 10);
  if (!bookingId) {
    throw httpHiba(400, "Foglalás ID szükséges");
  }

  const foglalas = await foglalasLekereseIdAlapjan(bookingId);
  if (!foglalas) {
    throw httpHiba(404, "Foglalás nem található");
  }

  await foglalasStatuszFrissitese(bookingId, "rejected");

  const notificationMessage = `Sajnos a "${foglalas.palya_nev}" pályabérlési kérelmet elutasították ${new Date(foglalas.kezdes).toLocaleDateString("hu-HU")} napra.`;

  await ertesitesLetrehozasa({
    kuldoId: foglalas.tulaj_id,
    cimzettId: foglalas.berlo_id,
    uzenet: notificationMessage,
  });

  return {
    message: "Foglalás elutasítva",
    booking: foglalas,
  };
};

// Függőben lévő foglalások számának lekérése.
const fuggobenLevoFoglalasokSzamanakLekerese = async (tulajId) => {
  if (!tulajId) {
    throw httpHiba(400, "Pályatulajdonos ID szükséges");
  }

  return fuggobenLevoFoglalasokSzama(parseInt(tulajId, 10));
};

module.exports = {
  foglalasLetrehozasa,
  tulajFoglalasainakListazasa,
  berloFoglalasainakListazasa,
  foglalasElfogadasa,
  foglalasElutasitasa,
  fuggobenLevoFoglalasokSzamanakLekerese,
};
