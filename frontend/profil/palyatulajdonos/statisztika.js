(function () {
  "use strict";

  var apiAlapUrl = "http://localhost:4000";
  var honapElem = document.getElementById("summaryMonthValue");
  var elfogadottDbElem = document.getElementById("summaryAcceptedCount");
  var varhatoBevetelElem = document.getElementById("summaryRevenue");
  var palyaTablaTorzsElem = document.getElementById("fieldStatsTableBody");
  var tablaHonapElem = document.getElementById("tableMonthLabel");
  var tablaHonapPieElem = document.getElementById("tableMonthLabelPie");
  var evesBevetelEvLabelElem = document.getElementById("evesBevetelEvLabel");
  var haviBevetelLineChartElem = document.getElementById("haviBevetelLineChart");
  var palyaBevetelPieChartElem = document.getElementById("palyaBevetelPieChart");

  if (
    !honapElem ||
    !elfogadottDbElem ||
    !varhatoBevetelElem ||
    !palyaTablaTorzsElem ||
    !tablaHonapElem ||
    !tablaHonapPieElem ||
    !evesBevetelEvLabelElem ||
    !haviBevetelLineChartElem ||
    !palyaBevetelPieChartElem
  ) {
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
    window.location.href = "../../fooldal/login.html";
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

  // Elfogadott foglalások szűrése a megadott évre.
  function elfogadottFoglalasokEvre(foglalasok, ev) {
    return (foglalasok || []).filter(function (foglalas) {
      if (foglalas.statusz !== "accepted") return false;
      var datum = new Date(foglalas.kezdes);
      if (Number.isNaN(datum.getTime())) return false;
      return datum.getFullYear() === ev;
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

  // Januártól decemberig havi bevételek kirajzolása az adott évre.
  function haviBevetelekKirajzolas(foglalasok, ev) {
    var honapNevek = [
      "Január",
      "Február",
      "Március",
      "Április",
      "Május",
      "Június",
      "Július",
      "Augusztus",
      "Szeptember",
      "Október",
      "November",
      "December"
    ];
    var honapBevetelek = new Array(12).fill(0);
    var eviElfogadottak = elfogadottFoglalasokEvre(foglalasok, ev);

    eviElfogadottak.forEach(function (foglalas) {
      var datum = new Date(foglalas.kezdes);
      if (Number.isNaN(datum.getTime())) return;
      var honapIndex = datum.getMonth();
      honapBevetelek[honapIndex] += Number(foglalas.ar || 0);
    });

    evesBevetelEvLabelElem.textContent = String(ev);

    return {
      honapNevek: honapNevek,
      honapBevetelek: honapBevetelek
    };
  }

  var haviBevetelLineChartPeldany = null;
  var palyaBevetelPieChartPeldany = null;

  // Havi bevételek line chart kirajzolása Chart.js segítségével.
  function haviBevetelLineChartKirajzolas(honapNevek, honapBevetelek) {
    if (typeof Chart === "undefined") return;

    if (haviBevetelLineChartPeldany) {
      haviBevetelLineChartPeldany.destroy();
      haviBevetelLineChartPeldany = null;
    }

    haviBevetelLineChartPeldany = new Chart(haviBevetelLineChartElem, {
      type: "line",
      data: {
        labels: honapNevek,
        datasets: [
          {
            label: "Havi bevétel",
            data: honapBevetelek,
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: function (contextus) {
                return " " + penznemSzoveg(contextus.parsed.y || 0);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (ertek) {
                return Number(ertek).toLocaleString("hu-HU") + " Ft";
              }
            }
          }
        }
      }
    });
  }

  // Pályánkénti bevételi arányok pie chart kirajzolása.
  function palyaBevetelPieChartKirajzolas(foglalasok, honapDatuma) {
    if (typeof Chart === "undefined") return;

    var elfogadottak = elfogadottFoglalasokHonapra(foglalasok, honapDatuma);
    var palyaBevetelek = {};

    elfogadottak.forEach(function (foglalas) {
      var palyaNev = foglalas.palya_nev || "Ismeretlen pálya";
      if (!palyaBevetelek[palyaNev]) palyaBevetelek[palyaNev] = 0;
      palyaBevetelek[palyaNev] += Number(foglalas.ar || 0);
    });

    var cimkek = Object.keys(palyaBevetelek);
    var ertekek = cimkek.map(function (cimke) { return palyaBevetelek[cimke]; });

    if (!cimkek.length) {
      cimkek = ["Nincs bevétel"];
      ertekek = [1];
    }

    tablaHonapPieElem.textContent = honapSzoveg(honapDatuma);

    var szinek = [
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 205, 86)",
      "rgb(75, 192, 192)",
      "rgb(153, 102, 255)",
      "rgb(255, 159, 64)",
      "rgb(46, 204, 113)",
      "rgb(231, 76, 60)",
      "rgb(52, 73, 94)",
      "rgb(241, 196, 15)"
    ];
    var hatterSzin = cimkek.map(function (_, index) {
      return szinek[index % szinek.length];
    });

    if (palyaBevetelPieChartPeldany) {
      palyaBevetelPieChartPeldany.destroy();
      palyaBevetelPieChartPeldany = null;
    }

    palyaBevetelPieChartPeldany = new Chart(palyaBevetelPieChartElem, {
      type: "pie",
      data: {
        labels: cimkek,
        datasets: [{
          label: "Pálya bevételi arány",
          data: ertekek,
          backgroundColor: hatterSzin,
          hoverOffset: 4
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function (contextus) {
                var osszes = contextus.dataset.data.reduce(function (a, b) { return a + Number(b || 0); }, 0);
                var aktualis = Number(contextus.raw || 0);
                var szazalek = osszes > 0 ? ((aktualis / osszes) * 100).toFixed(1) : "0.0";
                return " " + penznemSzoveg(aktualis) + " (" + szazalek + "%)";
              }
            }
          }
        }
      }
    });
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
    window.location.href = "../../fooldal/login.html";
    return;
  }
  if (String(felhasznalo.szerep || "").toLowerCase() !== "palyatulajdonos") {
    window.location.href = "../berleseim.html";
    return;
  }

  var felhasznaloId = felhasznaloAzonosito(felhasznalo);
  if (!felhasznaloId) {
    window.location.href = "../../fooldal/login.html";
    return;
  }

  oldalsavBekotes(felhasznalo);

  var most = new Date();
  var aktualisEv = most.getFullYear();
  var aktualisHonapDatuma = new Date(most.getFullYear(), most.getMonth(), 1);
  var tulajFoglalasok = [];
  var tulajPalyak = [];

  // Teljes oldal állapot kirajzolása.
  function allapotKirajzolas() {
    var haviAdatok = haviBevetelekKirajzolas(tulajFoglalasok, aktualisEv);
    haviBevetelLineChartKirajzolas(haviAdatok.honapNevek, haviAdatok.honapBevetelek);
    osszegzesKirajzolas(tulajFoglalasok, aktualisHonapDatuma);
    palyaTablaKirajzolas(tulajPalyak, tulajFoglalasok, aktualisHonapDatuma);
    palyaBevetelPieChartKirajzolas(tulajFoglalasok, aktualisHonapDatuma);
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
      tablaHonapPieElem.textContent = honapSzoveg(aktualisHonapDatuma);
      evesBevetelEvLabelElem.textContent = String(aktualisEv);
      elfogadottDbElem.textContent = "0";
      varhatoBevetelElem.textContent = "0 Ft";
      haviBevetelLineChartKirajzolas(
        ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      );
      palyaBevetelPieChartKirajzolas([], aktualisHonapDatuma);
      palyaTablaTorzsElem.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Nem sikerült betölteni a táblázat adatait.</td></tr>';
      Swal.fire({
        icon: "error",
        title: "Hiba",
        text: "Nem sikerült betölteni a foglalási adatokat.",
        confirmButtonText: "Rendben"
      });
    });
})();

