const { ujBejelentesLetrehozasa, adminBejelentesekListazasa, bejelentesStatuszFrissitese } = require("./service");

// Új bejelentés endpoint kezelése.
const ujBejelentes = async (req, res) => {
    try {
        const eredmeny = await ujBejelentesLetrehozasa(req.body || {});
        return res.status(201).json(eredmeny);
    } catch (error) {
        const status = error.status || 500;
        if (status === 500) {
            console.error("Bejelentés létrehozási hiba:", error);
        }
        return res.status(status).json({
            message: error.message || "Bejelentés létrehozása sikertelen.",
        });
    }
};

// Admin bejelentéslista endpoint kezelése.
const lista = async (req, res) => {
    try {
        const eredmeny = await adminBejelentesekListazasa(req.query || {});
        return res.status(200).json(eredmeny);
    } catch (error) {
        const status = error.status || 500;
        if (status === 500) {
            console.error("Bejelentéslista lekérési hiba:", error);
        }
        return res.status(status).json({
            message: error.message || "Bejelentések lekérése sikertelen.",
        });
    }
};

// Bejelentés státuszfrissítés endpoint kezelése.
const statuszFrissites = async (req, res) => {
    try {
        const eredmeny = await bejelentesStatuszFrissitese({
            bejelentes_id: req.params.id,
            admin_id: req.body && req.body.admin_id,
            statusz: req.body && req.body.statusz,
            admin_megjegyzes: req.body && req.body.admin_megjegyzes,
        });

        return res.status(200).json(eredmeny);
    } catch (error) {
        const status = error.status || 500;
        if (status === 500) {
            console.error("Bejelentés státuszfrissítési hiba:", error);
        }
        return res.status(status).json({
            message: error.message || "A bejelentés frissítése sikertelen.",
        });
    }
};

module.exports = {
    ujBejelentes,
    lista,
    statuszFrissites,
};
