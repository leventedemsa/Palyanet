const {
    adminEllenorzes,
    felhasznaloLekerese,
    palyaLekerese,
    bejelentesLetrehozasa,
    ertesitesLetrehozasa,
    adminokLekerese,
    bejelentesekListazasa,
    bejelentesLekerese,
    bejelentesStatuszFrissites,
} = require("./repository");

// HTTP-hiba létrehozása státuszkóddal.
const httpHiba = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// Új bejelentés létrehozása:
// 1. bemenet validáció
// 2. küldő ellenőrzése (létezés + tiltva)
// 3. pálya és bejelentett ellenőrzése
// 4. bejelentés mentés + értesítések küldése
const ujBejelentesLetrehozasa = async ({ kuldo_felhasznalo_id, palya_id, szoveg }) => {
    const kuldoAzonosito = parseInt(kuldo_felhasznalo_id, 10);
    const palyaAzonosito = parseInt(palya_id, 10);
    const bejelentesSzoveg = String(szoveg || "").trim();

    if (!kuldoAzonosito || !palyaAzonosito || !bejelentesSzoveg) {
        throw httpHiba(400, "Hiányzó kötelező mezők.");
    }
    if (bejelentesSzoveg.length > 1500) {
        throw httpHiba(400, "A bejelentés szövege legfeljebb 1500 karakter lehet.");
    }

    const kuldo = await felhasznaloLekerese(kuldoAzonosito);
    if (!kuldo) {
        throw httpHiba(404, "A küldő felhasználó nem található.");
    }
    if (kuldo.tiltva) {
        throw httpHiba(403, "Tiltott felhasználó nem küldhet bejelentést.");
    }

    const palya = await palyaLekerese(palyaAzonosito);
    if (!palya) {
        throw httpHiba(404, "A pálya nem található.");
    }

    const bejelentettFelhasznaloAzonosito = parseInt(palya.tulaj_id, 10);
    if (!bejelentettFelhasznaloAzonosito) {
        throw httpHiba(500, "A bejelentett felhasználó nem azonosítható.");
    }

    const bejelentesAzonosito = await bejelentesLetrehozasa({
        kuldoFelhasznaloAzonosito: kuldoAzonosito,
        bejelentettFelhasznaloAzonosito,
        palyaAzonosito,
        szoveg: bejelentesSzoveg,
    });

    await ertesitesLetrehozasa({
        kuldoAzonosito: kuldoAzonosito,
        cimzettAzonosito: kuldoAzonosito,
        uzenet: "A bejelentésedet rögzítettük.",
    });

    const adminok = await adminokLekerese();
    for (const admin of adminok) {
        const adminAzonosito = parseInt(admin.felhasznalo_id, 10);
        if (!adminAzonosito) continue;

        await ertesitesLetrehozasa({
            kuldoAzonosito: kuldoAzonosito,
            cimzettAzonosito: adminAzonosito,
            uzenet: `Új bejelentés érkezett (#${bejelentesAzonosito || "-"})`,
        });
    }

    return {
        message: "Bejelentés sikeresen rögzítve.",
        bejelentes_id: bejelentesAzonosito,
    };
};

// Admin bejelentéslista lekérése:
// 1. admin azonosító validáció
// 2. jogosultság-ellenőrzés
// 3. lista visszaadása
const adminBejelentesekListazasa = async ({ admin_id }) => {
    const adminAzonosito = parseInt(admin_id, 10);
    if (!adminAzonosito) {
        throw httpHiba(400, "Az admin_id kötelező.");
    }

    const admin = await adminEllenorzes(adminAzonosito);
    if (!admin) {
        throw httpHiba(403, "Nincs jogosultság.");
    }

    return bejelentesekListazasa();
};

// Bejelentés státuszfrissítése:
// 1. bemenet validáció
// 2. admin jogosultság ellenőrzése
// 3. bejelentés állapotának ellenőrzése (csak pending frissíthető)
// 4. státusz mentés + küldő értesítése
const bejelentesStatuszFrissitese = async ({ bejelentes_id, admin_id, statusz, admin_megjegyzes }) => {
    const bejelentesAzonosito = parseInt(bejelentes_id, 10);
    const adminAzonosito = parseInt(admin_id, 10);
    const ujStatusz = String(statusz || "")
        .trim()
        .toLowerCase();
    const adminMegjegyzes = String(admin_megjegyzes || "").trim();

    if (!bejelentesAzonosito || !adminAzonosito || !ujStatusz) {
        throw httpHiba(400, "Hiányzó kötelező mezők.");
    }
    if (!["elutasitva", "vegrehajtva"].includes(ujStatusz)) {
        throw httpHiba(400, "Érvénytelen státusz.");
    }

    const admin = await adminEllenorzes(adminAzonosito);
    if (!admin) {
        throw httpHiba(403, "Nincs jogosultság.");
    }

    const bejelentes = await bejelentesLekerese(bejelentesAzonosito);
    if (!bejelentes) {
        throw httpHiba(404, "A bejelentés nem található.");
    }
    if (String(bejelentes.statusz || "").toLowerCase() !== "pending") {
        throw httpHiba(400, "Ez a bejelentés már el van bírálva.");
    }

    await bejelentesStatuszFrissites({
        bejelentesAzonosito,
        statusz: ujStatusz,
        adminAzonosito,
        adminMegjegyzes,
    });

    const ertesitesSzoveg = ujStatusz === "vegrehajtva" ? "A bejelentésedet végrehajtották." : "A bejelentésedet elutasították.";

    await ertesitesLetrehozasa({
        kuldoAzonosito: adminAzonosito,
        cimzettAzonosito: bejelentes.kuldo_felhasznalo_id,
        uzenet: ertesitesSzoveg,
    });

    return { message: "A bejelentés státusza frissítve." };
};

module.exports = {
    ujBejelentesLetrehozasa,
    adminBejelentesekListazasa,
    bejelentesStatuszFrissitese,
};
