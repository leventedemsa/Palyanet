(function () {
  "use strict";

  var apiAlapUrl = "http://localhost:4000";
  var honapElem = document.getElementById("summaryMonthValue");
  var elfogadottDbElem = document.getElementById("summaryAcceptedCount");
  var varhatoBevetelElem = document.getElementById("summaryRevenue");
  var palyaTablaTorzsElem = document.getElementById("fieldStatsTableBody");
  var tablaHonapElem = document.getElementById("tableMonthLabel");

  if (!honapElem || !elfogadottDbElem || !varhatoBevetelElem || !palyaTablaTorzsElem || !tablaHonapElem) {
    return;
  }

  // Felhasználó objektum beolvasása localStorage/sessionStorage alól.
  function olvasFelhasznalo() {
    var nyers = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!nyers) return null;
    try { return JSON.parse(nyers); } catch (_) { return null; }
  }

  // Egységes felhasználó azonosító kinyerése a lehetséges mezőkből.
  function felhasznaloAzonosito(felhasznalo) {
    return felhasznalo && (felhasznalo.felhasznalo_id || felhasznalo.id || felhasznalo.userId);
  }

  // Relatív profilkép URL-ek teljes API URL-re alakítása.
  function abszolutKepUrl(url) {
    if (!url) return "https://github.com/mdo.png";
    return url.startsWith("http") ? url : apiAlapUrl + url;
  }

  // Kijelentkeztetés és auth adatok törlése.
  function kijelentkezes() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "../../login.html";
  }

  // Oldalsáv felhasználói adatai + kijelentkezés gombok bekötése.
  function oldalsavBekotes(felhasznalo) {
    var nevElemek = document.querySelectorAll(".sidebar-user-name");
    var avatarElemek = document.querySelectorAll(".sidebar-user-avatar");
    var megjelenitettNev = felhasznalo.teljes_nev || felhasznalo.username || "Felhasználó";

    nevElemek.forEach(function (elem) { elem.textContent = megjelenitettNev; });
    avatarElemek.forEach(function (elem) { elem.src = abszolutKepUrl(felhasznalo.profil_kep_url); });

    var kijelentkezesGombok = document.querySelectorAll(".sidebar-logout-btn");
    kijelentkezesGombok.forEach(function (gomb) {
      gomb.addEventListener("click", function (esemeny) {
        esemeny.preventDefault();
        kijelentkezes();
      });
    });
  }

  // Aktuális hónap nevének formázása magyar nyelven.
  function honapSzoveg(datum) {
    return datum.toLocaleDateString("hu-HU", { month: "long" });
  }

  // Forint értékek megjelenítése emberbarát formában.
  function penznemSzoveg(ertek) {
    return Number(ertek || 0).toLocaleString("hu-HU") + " Ft";
  }

  // Ellenőrzés, hogy egy dátum az adott hónapba esik-e.
  function azonosHonap(datumErtek, honapDatuma) {
    var datum = new Date(datumErtek);
    if (Number.isNaN(datum.getTime())) return false;
    return datum.getFullYear() === honapDatuma.getFullYear() && datum.getMonth() === honapDatuma.getMonth();
  }

  // Elfogadott foglalások szűrése az aktuális hónapra.
  function elfogadottFoglalasokHonapra(foglalasok, honapDatuma) {
    return (foglalasok || []).filter(function (foglalas) {
      return foglalas.statusz === "accepted" && azonosHonap(foglalas.kezdes, honapDatuma);
    });
  }

  // Felső összegző kártyák kitöltése az aktuális hónap adataival.
  function osszegzesKirajzolas(foglalasok, honapDatuma) {
    var elfogadottak = elfogadottFoglalasokHonapra(foglalasok, honapDatuma);
    var bevetel = elfogadottak.reduce(function (osszeg, foglalas) {
      return osszeg + Number(foglalas.ar || 0);
    }, 0);

    var honapNev = honapSzoveg(honapDatuma);
    honapElem.textContent = honapNev;
    tablaHonapElem.textContent = honapNev;
    elfogadottDbElem.textContent = String(elfogadottak.length);
    varhatoBevetelElem.textContent = penznemSzoveg(bevetel);
  }

  // Pályánkénti tábla építése: minden saját pálya szerepeljen, nullás sorokkal is.
  function palyaTablaKirajzolas(palyak, foglalasok, honapDatuma) {
    var elfogadottak = elfogadottFoglalasokHonapra(foglalasok, honapDatuma);
    var palyaBontas = {};

    (palyak || []).forEach(function (palya) {
      var kulcs = String(palya.palya_id || palya.nev || "ismeretlen");
      if (!palyaBontas[kulcs]) {
        palyaBontas[kulcs] = {
          nev: palya.nev || "Ismeretlen pálya",
          elfogadottDb: 0,
          bevetel: 0
        };
      }
    });

    elfogadottak.forEach(function (foglalas) {
      var kulcs = String(foglalas.palya_id || foglalas.palya_nev || "ismeretlen");
      if (!palyaBontas[kulcs]) {
        palyaBontas[kulcs] = {
          nev: foglalas.palya_nev || "Ismeretlen pálya",
          elfogadottDb: 0,
          bevetel: 0
        };
      }
      palyaBontas[kulcs].elfogadottDb += 1;
      palyaBontas[kulcs].bevetel += Number(foglalas.ar || 0);
    });

    var sorok = Object.keys(palyaBontas)
      .map(function (kulcs) { return palyaBontas[kulcs]; })
      .sort(function (a, b) { return b.bevetel - a.bevetel; });

    if (!sorok.length) {
      palyaTablaTorzsElem.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nincs saját pálya.</td></tr>';
      return;
    }

    palyaTablaTorzsElem.innerHTML = sorok.map(function (sor) {
      return (
        "<tr>" +
          "<td>" + sor.nev + "</td>" +
          '<td class="text-center fw-semibold">' + String(sor.elfogadottDb) + "</td>" +
          '<td class="text-end fw-semibold">' + penznemSzoveg(sor.bevetel) + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  // Tulaj foglalások API lekérése.
  async function tulajFoglalasokBetoltese(felhasznaloId) {
    var valasz = await fetch(apiAlapUrl + "/api/bookings/owner/" + felhasznaloId);
    if (!valasz.ok) throw new Error("Foglalások lekérése sikertelen");
    return valasz.json();
  }

  // Tulaj pályák API lekérése.
  async function tulajPalyakBetoltese(felhasznaloId) {
    var valasz = await fetch(apiAlapUrl + "/api/palyak/owner/" + felhasznaloId);
    if (!valasz.ok) throw new Error("Pályák lekérése sikertelen");
    return valasz.json();
  }

  var felhasznalo = olvasFelhasznalo();
  if (!felhasznalo) {
    window.location.href = "../../login.html";
    return;
  }
  if (String(felhasznalo.szerep || "").toLowerCase() !== "palyatulajdonos") {
    window.location.href = "../berleseim.html";
    return;
  }

  var felhasznaloId = felhasznaloAzonosito(felhasznalo);
  if (!felhasznaloId) {
    window.location.href = "../../login.html";
    return;
  }

  oldalsavBekotes(felhasznalo);

  var most = new Date();
  var aktualisHonapDatuma = new Date(most.getFullYear(), most.getMonth(), 1);
  var tulajFoglalasok = [];
  var tulajPalyak = [];

  // Teljes oldal állapot kirajzolása.
  function allapotKirajzolas() {
    osszegzesKirajzolas(tulajFoglalasok, aktualisHonapDatuma);
    palyaTablaKirajzolas(tulajPalyak, tulajFoglalasok, aktualisHonapDatuma);
  }

  // Kezdő adatbetöltés (foglalások + pályák), majd kezdő kirajzolás.
  Promise.all([tulajFoglalasokBetoltese(felhasznaloId), tulajPalyakBetoltese(felhasznaloId)])
    .then(function (eredmenyek) {
      var foglalasok = eredmenyek[0];
      var palyak = eredmenyek[1];
      tulajFoglalasok = Array.isArray(foglalasok) ? foglalasok : [];
      tulajPalyak = Array.isArray(palyak) ? palyak : [];
      allapotKirajzolas();
    })
    .catch(function (hiba) {
      console.error(hiba);
      honapElem.textContent = honapSzoveg(aktualisHonapDatuma);
      tablaHonapElem.textContent = honapSzoveg(aktualisHonapDatuma);
      elfogadottDbElem.textContent = "0";
      varhatoBevetelElem.textContent = "0 Ft";
      palyaTablaTorzsElem.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Nem sikerült betölteni a táblázat adatait.</td></tr>';
      Swal.fire({
        icon: "error",
        title: "Hiba",
        text: "Nem sikerült betölteni a foglalási adatokat.",
        confirmButtonText: "Rendben"
      });
    });
})();
