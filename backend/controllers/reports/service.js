const {
    adminEllenorzes,
    felhasznaloLekerese,
    palyaLekerese,
    bejelentesLetrehozasa,
    ertesitesLetrehozasa,
    adminokLekerese,
    bejelentesekListazasa,
    bejelentesLekerese,
    bejelentesReszletekLekerese,
    felhasznaloTiltasa,
    palyaFelfuggesztese,
    bejelentesStatuszFrissites,
} = require("./repository");

// HTTP-hiba létrehozása státuszkóddal.
const httpHiba = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

// Azonosítót alakít számmá; hibás értéknél 0-t ad vissza.
const parseAzonosito = (value) => parseInt(value, 10) || 0;

// Kliens oldali státusz-variációk normalizálásához.
const statuszAtnevezes = {
    vegrehajtas: "vegrehajtva",
};

// Bejövő státusz értéket egységesített formára alakít.
const normalizaltStatusz = (statusz) => {
    const kertStatusz = String(statusz || "")
        .trim()
        .toLowerCase();
    return statuszAtnevezes[kertStatusz] || kertStatusz;
};

// Ellenőrzi, hogy az adott felhasználó admin jogosultságú-e.
const adminJogEllenorzes = async (adminAzonosito) => {
    const admin = await adminEllenorzes(adminAzonosito);
    if (!admin) {
        throw httpHiba(403, "Nincs jogosultság.");
    }
};

// Különböző típusú bemeneteket logikai értékké alakít.
const boolErtek = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
        const normalizalt = value.trim().toLowerCase();
        return normalizalt === "1" || normalizalt === "true";
    }
    return false;
};

// Új bejelentés létrehozása:
// 1. bemenet validáció
// 2. küldő ellenőrzése (létezés + tiltva)
// 3. pálya és bejelentett ellenőrzése
// 4. bejelentés mentés + értesítések küldése
const ujBejelentesLetrehozasa = async ({ kuldo_felhasznalo_id, palya_id, szoveg }) => {
    const kuldoAzonosito = parseAzonosito(kuldo_felhasznalo_id);
    const palyaAzonosito = parseAzonosito(palya_id);
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

    const bejelentettFelhasznaloAzonosito = parseAzonosito(palya.tulaj_id);
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
        const adminAzonosito = parseAzonosito(admin.felhasznalo_id);
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
    const adminAzonosito = parseAzonosito(admin_id);
    if (!adminAzonosito) {
        throw httpHiba(400, "Az admin_id kötelező.");
    }

    await adminJogEllenorzes(adminAzonosito);
    return bejelentesekListazasa();
};

// Admin bejelentésrészletek lekérése:
// 1. admin és bejelentés azonosító validáció
// 2. jogosultság-ellenőrzés
// 3. részletes rekord visszaadása
const adminBejelentesReszletek = async ({ admin_id, bejelentes_id }) => {
    const adminAzonosito = parseAzonosito(admin_id);
    const bejelentesAzonosito = parseAzonosito(bejelentes_id);

    if (!adminAzonosito || !bejelentesAzonosito) {
        throw httpHiba(400, "Az admin_id és a bejelentes_id kötelező.");
    }

    await adminJogEllenorzes(adminAzonosito);

    const bejelentes = await bejelentesReszletekLekerese(bejelentesAzonosito);
    if (!bejelentes) {
        throw httpHiba(404, "A bejelentés nem található.");
    }

    return bejelentes;
};

// Bejelentés státuszfrissítése:
// 1. bemenet validáció
// 2. admin jogosultság ellenőrzése
// 3. bejelentés állapotának ellenőrzése (csak pending frissíthető)
// 4. státusz mentés + küldő értesítése
const bejelentesStatuszFrissitese = async ({
    bejelentes_id,
    admin_id,
    statusz,
    admin_megjegyzes,
    felhasznalo_letiltas,
    palya_felfuggesztes,
}) => {
    const bejelentesAzonosito = parseAzonosito(bejelentes_id);
    const adminAzonosito = parseAzonosito(admin_id);
    const ujStatusz = normalizaltStatusz(statusz);
    const adminMegjegyzes = String(admin_megjegyzes || "").trim();
    const felhasznaloLetiltas = boolErtek(felhasznalo_letiltas);
    const palyaFelfuggesztes = boolErtek(palya_felfuggesztes);

    if (!bejelentesAzonosito || !adminAzonosito || !ujStatusz) {
        throw httpHiba(400, "Hiányzó kötelező mezők.");
    }
    if (!["elutasitva", "vegrehajtva"].includes(ujStatusz)) {
        throw httpHiba(400, "Érvénytelen státusz.");
    }

    await adminJogEllenorzes(adminAzonosito);

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

    if (felhasznaloLetiltas) {
        await felhasznaloTiltasa(bejelentes.bejelentett_felhasznalo_id);
    }

    if (palyaFelfuggesztes) {
        await palyaFelfuggesztese({
            palyaAzonosito: bejelentes.palya_id,
            adminAzonosito,
            indok: adminMegjegyzes || "Admin bejelentés alapján felfüggesztve.",
        });
    }

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
    adminBejelentesReszletek,
    bejelentesStatuszFrissitese,
};
