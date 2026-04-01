(function () {
  "use strict";

  var API_ALAP = "http://localhost:4000";
  var seged = window.ProfilSeged;
  var ertesitesListaKontener = document.getElementById("notificationsList");
  var darabJelveny = document.getElementById("notificationsCount");
  var osszesTorlesGomb = document.getElementById("clearAllNotificationsBtn");

  if (!seged || !ertesitesListaKontener || !darabJelveny || !osszesTorlesGomb) return;

  var felhasznaloBeolvasasa = seged.felhasznaloBeolvasasa;
  var felhasznaloAzonosito = seged.felhasznaloAzonosito;
  var hibaMegjelenitese = seged.hibaMegjelenitese;
  var muveletMegerositese = seged.muveletMegerositese;
  var htmlSzovegEscape = seged.htmlSzovegEscape;

  // Relatív képútvonalból teljes URL-t készít.
  function abszolutKepUrl(url) {
    return seged.abszolutKepUrl(API_ALAP, url, "https://github.com/mdo.png");
  }

  // Kijelentkezteti a felhasználót és visszairányít a belépéshez.
  function kijelentkezes() {
    seged.kijelentkezes("../fooldal/login.html");
  }

  // Oldalsáv menüpontjait és profiladatait állítja be.
  function oldalsavBekotese(felhasznalo) {
    var palyaimElemek = document.querySelectorAll('[data-sidebar-item="palyaim"]');
    var foglalasaimElemek = document.querySelectorAll('[data-sidebar-item="foglalasaim"]');
    var statisztikaElemek = document.querySelectorAll('[data-sidebar-item="statisztika"]');
    var berleseimElemek = document.querySelectorAll('[data-sidebar-item="berleseim"]');
    var adminElemek = document.querySelectorAll('[data-sidebar-item="bejelentesek"], [data-sidebar-item="admin-palyak"], [data-sidebar-item="admin-felhasznalok"], [data-sidebar-item="admin-logok"]');
    var szerep = String(felhasznalo.szerep || "").toLowerCase();
    var palyatulajdonosE = szerep === "palyatulajdonos";
    var adminE = szerep === "admin";

    palyaimElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    foglalasaimElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    statisztikaElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    berleseimElemek.forEach(function (elem) { elem.style.display = adminE ? "none" : ""; });
    adminElemek.forEach(function (elem) { elem.style.display = adminE ? "" : "none"; });

    seged.oldalsavAlapBekotes({
      felhasznalo: felhasznalo,
      apiAlap: API_ALAP,
      loginUrl: "../fooldal/login.html"
    });
  }

  // Dátumot magyar időbélyeg szöveggé alakít.
  function idoFormazasa(ertek) {
    if (!ertek) return "-";
    var datum = new Date(ertek);
    if (Number.isNaN(datum.getTime())) return "-";
    return datum.toLocaleString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  // Az értesítések listáját kirendereli a felületre.
  function ertesitesekRenderelese(ertesitesek) {
    darabJelveny.textContent = String(ertesitesek.length);
    osszesTorlesGomb.disabled = ertesitesek.length === 0;

    if (!ertesitesek.length) {
      ertesitesListaKontener.innerHTML = '<div class="alert alert-light border mb-0">Nincs értesítés.</div>';
      return;
    }

    ertesitesListaKontener.innerHTML = ertesitesek.map(function (ertesites) {
      var olvasottJelveny = ertesites.olvasott
        ? '<span class="badge text-bg-secondary">Olvasott</span>'
        : '<span class="badge text-bg-primary">Új</span>';
      return (
        '<div class="card shadow-sm border-0 mb-3" data-id="' + Number(ertesites.ertesites_id) + '">' +
          '<div class="card-body">' +
            '<div class="d-flex justify-content-between align-items-start gap-3 mb-2">' +
              '<div class="fw-semibold">Értesítés</div>' +
              olvasottJelveny +
            '</div>' +
            '<p class="mb-2">' + htmlSzovegEscape(ertesites.uzenet || "") + '</p>' +
            '<div class="d-flex justify-content-between align-items-center gap-3">' +
              '<small class="text-muted">' + idoFormazasa(ertesites.letrehozva) + '</small>' +
              '<button type="button" class="btn btn-outline-danger btn-sm" data-action="delete" data-id="' + Number(ertesites.ertesites_id) + '">Törlés</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  // A felhasználó értesítéseit lekéri az API-ból.
  async function ertesitesekBetoltese(felhasznaloId) {
    var valasz = await fetch(API_ALAP + "/api/notifications/" + felhasznaloId);
    if (!valasz.ok) throw new Error("Értesítések lekérése sikertelen");
    return valasz.json();
  }

  // Egy értesítést töröl az API-n keresztül.
  async function ertesitesTorlese(felhasznaloId, ertesitesId) {
    var valasz = await fetch(API_ALAP + "/api/notifications/" + felhasznaloId + "/" + ertesitesId, {
      method: "DELETE"
    });
    if (!valasz.ok) throw new Error("Értesítés törlése sikertelen");
  }

  // Az összes értesítést törli az API-n keresztül.
  async function osszesErtesitesTorlese(felhasznaloId) {
    var valasz = await fetch(API_ALAP + "/api/notifications/" + felhasznaloId, {
      method: "DELETE"
    });
    if (!valasz.ok) throw new Error("Értesítések törlése sikertelen");
  }

  var felhasznalo = felhasznaloBeolvasasa();
  if (!felhasznalo) {
    window.location.href = "../fooldal/login.html";
    return;
  }

  var felhasznaloId = felhasznaloAzonosito(felhasznalo);
  if (!felhasznaloId) {
    window.location.href = "../fooldal/login.html";
    return;
  }

  oldalsavBekotese(felhasznalo);

  // Az értesítéslista teljes frissítését végzi.
  async function frissites() {
    try {
      var ertesitesek = await ertesitesekBetoltese(felhasznaloId);
      ertesitesekRenderelese(ertesitesek);
    } catch (hiba) {
      console.error(hiba);
      ertesitesListaKontener.innerHTML = '<div class="alert alert-danger mb-0">Hiba az értesítések betöltésekor.</div>';
      darabJelveny.textContent = "0";
      osszesTorlesGomb.disabled = true;
    }
  }

  ertesitesListaKontener.addEventListener("click", async function (esemeny) {
    var gomb = esemeny.target.closest("button[data-action='delete']");
    if (!gomb) return;
    var ertesitesId = Number(gomb.getAttribute("data-id"));
    if (!ertesitesId) return;

    gomb.disabled = true;
    try {
      await ertesitesTorlese(felhasznaloId, ertesitesId);
      await frissites();
    } catch (hiba) {
      console.error(hiba);
      hibaMegjelenitese("Nem sikerült törölni az értesítést.");
      gomb.disabled = false;
    }
  });

  osszesTorlesGomb.addEventListener("click", async function () {
    var megerosites = await muveletMegerositese("Biztosan törölni szeretnéd az összes értesítést?");
    if (!megerosites.isConfirmed) return;
    osszesTorlesGomb.disabled = true;
    try {
      await osszesErtesitesTorlese(felhasznaloId);
      await frissites();
    } catch (hiba) {
      console.error(hiba);
      hibaMegjelenitese("Nem sikerült törölni az értesítéseket.");
      osszesTorlesGomb.disabled = false;
    }
  });

  frissites();
})();
