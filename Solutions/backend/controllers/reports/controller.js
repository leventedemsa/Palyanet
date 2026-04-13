const {
    ujBejelentesLetrehozasa,
    adminBejelentesekListazasa,
    adminBejelentesReszletek,
    bejelentesStatuszFrissitese,
} = require("./service");

// Egységes hiba-választ küld az endpointok számára.
const kezelesiHiba = (res, error, logUzenet, alapUzenet) => {
    const status = error.status || 500;
    if (status === 500) {
        console.error(logUzenet, error);
    }
    return res.status(status).json({
        message: error.message || alapUzenet,
    });
};

// Általános endpoint wrapper: kezeli a sikeres és hibás válaszokat.
const endpoint = (handler, successStatus, logUzenet, alapUzenet) => async (req, res) => {
    try {
        const eredmeny = await handler(req);
        return res.status(successStatus).json(eredmeny);
    } catch (error) {
        return kezelesiHiba(res, error, logUzenet, alapUzenet);
    }
};

// Új bejelentés endpoint kezelése.
const ujBejelentes = endpoint(
    (req) => ujBejelentesLetrehozasa(req.body || {}),
    201,
    "Bejelentés létrehozási hiba:",
    "Bejelentés létrehozása sikertelen."
);

// Admin bejelentéslista endpoint kezelése.
const lista = endpoint(
    (req) => adminBejelentesekListazasa(req.query || {}),
    200,
    "Bejelentéslista lekérési hiba:",
    "Bejelentések lekérése sikertelen."
);

// Admin bejelentésrészletek endpoint kezelése.
const reszletek = endpoint(
    (req) =>
        adminBejelentesReszletek({
            admin_id: req.query?.admin_id,
            bejelentes_id: req.params.id,
        }),
    200,
    "Bejelentésrészletek lekérési hiba:",
    "A bejelentés részleteinek lekérése sikertelen."
);

// Bejelentés státuszfrissítés endpoint kezelése.
const statuszFrissites = endpoint(
    (req) =>
        bejelentesStatuszFrissitese({
            bejelentes_id: req.params.id,
            admin_id: req.body?.admin_id,
            statusz: req.body?.statusz,
            admin_megjegyzes: req.body?.admin_megjegyzes,
            felhasznalo_letiltas: req.body?.felhasznalo_letiltas,
            palya_felfuggesztes: req.body?.palya_felfuggesztes,
        }),
    200,
    "Bejelentés státuszfrissítési hiba:",
    "A bejelentés frissítése sikertelen."
);

module.exports = {
    ujBejelentes,
    lista,
    reszletek,
    statuszFrissites,
};
