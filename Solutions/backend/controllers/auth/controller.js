const { regisztracio, bejelentkezes } = require("./service");

// Regisztráció kezelése.
const register = async (req, res) => {
  try {
    const result = await regisztracio(req.body);
    return res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    if (status === 500) {
      console.error("Register hiba:", error);
    }
    return res.status(status).json({
      message: error.message || "Szerverhiba tortent.",
    });
  }
};

// Bejelentkezés kezelése.
const login = async (req, res) => {
  try {
    const result = await bejelentkezes(req.body);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    if (status === 500) {
      console.error("Login hiba:", error);
    }
    return res.status(status).json({
      message: error.message || "Szerverhiba tortent.",
    });
  }
};

module.exports = {
  register,
  login,
};
