(function () {
  "use strict";

  // A bejelentkezett felhasználó adatait olvassa ki a tárolóból.
  function felhasznaloBeolvasasa() {
    var nyers = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!nyers) return null;
    try {
      return JSON.parse(nyers);
    } catch (_) {
      return null;
    }
  }

  // A felhasználó adatait menti a tárolókba.
  function felhasznaloMentese(felhasznalo) {
    if (!felhasznalo) return;
    var json = JSON.stringify(felhasznalo);
    localStorage.setItem("user", json);
    sessionStorage.setItem("user", json);
  }

  // A felhasználó egyedi azonosítóját adja vissza.
  function felhasznaloAzonosito(felhasznalo) {
    return felhasznalo && (felhasznalo.felhasznalo_id || felhasznalo.id || felhasznalo.userId);
  }

  // Kijelentkezteti a felhasználót és átirányítja.
  function kijelentkezes(atiranyitas) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = atiranyitas || "../fooldal/bejelentkezes.html";
  }

  // Relatív képútvonalból teljes URL-t készít.
  function abszolutKepUrl(apiAlap, url, alapertelmezett) {
    if (!url) return alapertelmezett || "";
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    return apiAlap + url;
  }

  // A képek mezőt tömbbé alakítja egységes feldolgozáshoz.
  function kepUrlokFeldolgozasa(ertek) {
    if (!ertek) return [];
    if (Array.isArray(ertek)) return ertek.filter(Boolean);
    var nyers = String(ertek).trim();
    if (!nyers) return [];
    if (nyers[0] === "[") {
      try {
        var feldolgozott = JSON.parse(nyers);
        if (Array.isArray(feldolgozott)) return feldolgozott.filter(Boolean);
      } catch (_) {}
    }
    return [nyers];
  }

  // A szöveget HTML-biztos formára alakítja.
  function htmlSzovegEscape(ertek) {
    return String(ertek || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Ár értéket magyar formátumban, opcionális utótaggal ad vissza.
  function arSzoveg(ertek, utotag) {
    var szoveg = Number(ertek || 0).toLocaleString("hu-HU");
    return szoveg + (utotag || " Ft");
  }

  // Oldalsáv alap profiladatokat és kijelentkezést köt be.
  function oldalsavAlapBekotes(opciok) {
    var be = opciok || {};
    var felhasznalo = be.felhasznalo || {};
    var apiAlap = be.apiAlap || "";
    var nevSelector = be.nevSelector || ".sidebar-user-name";
    var avatarSelector = be.avatarSelector || ".sidebar-user-avatar";
    var kijelentkezesSelector = be.kijelentkezesSelector || ".sidebar-logout-btn";
    var loginUrl = be.loginUrl || "../fooldal/bejelentkezes.html";
    var megjelenitendoNev = felhasznalo.teljes_nev || felhasznalo.username || "Felhasználó";

    var nevMezok = document.querySelectorAll(nevSelector);
    var avatarMezok = document.querySelectorAll(avatarSelector);
    nevMezok.forEach(function (elem) { elem.textContent = megjelenitendoNev; });
    avatarMezok.forEach(function (elem) {
      elem.src = abszolutKepUrl(apiAlap, felhasznalo.profil_kep_url, "https://github.com/mdo.png");
    });

    var kijelentkezesGombok = document.querySelectorAll(kijelentkezesSelector);
    kijelentkezesGombok.forEach(function (gomb) {
      gomb.addEventListener("click", function (esemeny) {
        esemeny.preventDefault();
        kijelentkezes(loginUrl);
      });
    });
  }

  // Admin menupontokat csak admin szerepnel jeleniti meg.
  function adminMenupontokMegjeleniteseHaAdmin(felhasznalo, selector) {
    var szerep = String((felhasznalo && felhasznalo.szerep) || "").toLowerCase();
    if (szerep !== "admin") return;
    var celSelector = selector || '[data-sidebar-item="bejelentesek"], [data-sidebar-item="admin-palyak"], [data-sidebar-item="admin-felhasznalok"], [data-sidebar-item="admin-logok"]';
    document.querySelectorAll(celSelector).forEach(function (elem) {
      elem.style.display = "";
    });
  }

  // Egyszerű oldalsáv értesítés widgetet épít fel és frissít.
  function oldalsavErtesitesekInditasaEgyszeru(opciok) {
    var be = opciok || {};
    var felhasznalo = be.felhasznalo || {};
    var apiAlap = be.apiAlap || "";
    var oldalsavSelector = be.oldalsavSelector || ".profile-sidebar";
    var oldalsav = document.querySelector(oldalsavSelector);
    if (!oldalsav) return;
    if (document.getElementById("sidebarNotificationsBox")) return;
    var felhasznaloId = felhasznaloAzonosito(felhasznalo);
    if (!felhasznaloId) return;

    var doboz = document.createElement("div");
    doboz.id = "sidebarNotificationsBox";
    doboz.className = "mt-3";
    doboz.innerHTML =
      '<button id="sidebarNotifToggle" class="btn btn-outline-light btn-sm w-100" type="button">Értesítés <span id="sidebarNotifBadge" class="badge bg-danger ms-1" style="display:none;">0</span></button>' +
      '<div id="sidebarNotifDropdown" class="mt-2 p-2 bg-white text-dark rounded shadow-sm" style="display:none;max-height:260px;overflow:auto;">' +
      '<div class="small text-muted">Nincsenek értesítések</div>' +
      "</div>";
    oldalsav.appendChild(doboz);

    var kapcsolo = document.getElementById("sidebarNotifToggle");
    var jelveny = document.getElementById("sidebarNotifBadge");
    var legordulo = document.getElementById("sidebarNotifDropdown");

    kapcsolo.addEventListener("click", function () {
      legordulo.style.display = legordulo.style.display === "none" ? "block" : "none";
    });

    async function frissites() {
      try {
        var valasz = await fetch(apiAlap + "/api/notifications/" + felhasznaloId);
        if (!valasz.ok) return;
        var tetelek = await valasz.json();
        var olvasatlanDarab = tetelek.filter(function (ertesites) { return !ertesites.olvasott; }).length;
        if (olvasatlanDarab > 0) {
          jelveny.style.display = "inline-block";
          jelveny.textContent = String(olvasatlanDarab);
        } else {
          jelveny.style.display = "none";
        }
        if (!tetelek.length) {
          legordulo.innerHTML = '<div class="small text-muted">Nincsenek értesítések</div>';
          return;
        }
        legordulo.innerHTML = tetelek.slice(0, 15).map(function (ertesites) {
          return '<div class="small border-bottom pb-2 mb-2">' +
            '<div style="font-weight:600;">' + (ertesites.olvasott ? "Értesítés" : "Új értesítés") + "</div>" +
            '<div>' + (ertesites.uzenet || "") + "</div>" +
            '<div class="text-muted">' + new Date(ertesites.letrehozva).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) + "</div>" +
            "</div>";
        }).join("");
      } catch (_) {}
    }

    frissites();
    setInterval(frissites, 5000);
  }

  // Sikeres művelet üzenetet jelenít meg.
  function sikerMegjelenitese(uzenet) {
    return Swal.fire({
      icon: "success",
      title: "Sikeres művelet",
      text: uzenet,
      confirmButtonText: "Rendben"
    });
  }

  // Hibaüzenetet jelenít meg felugró ablakban.
  function hibaMegjelenitese(uzenet) {
    return Swal.fire({
      icon: "error",
      title: "Hiba",
      text: uzenet,
      confirmButtonText: "Rendben"
    });
  }

  // Figyelmeztető üzenetet jelenít meg felugró ablakban.
  function figyelmeztetesMegjelenitese(uzenet) {
    return Swal.fire({
      icon: "warning",
      title: "Figyelem",
      text: uzenet,
      confirmButtonText: "Rendben"
    });
  }

  // Megerősítést kér egy művelet végrehajtása előtt.
  function muveletMegerositese(uzenet) {
    return Swal.fire({
      icon: "warning",
      title: "Megerősítés",
      text: uzenet,
      showCancelButton: true,
      confirmButtonText: "Igen",
      cancelButtonText: "Mégsem"
    });
  }

  window.ProfilSeged = {
    felhasznaloBeolvasasa: felhasznaloBeolvasasa,
    felhasznaloMentese: felhasznaloMentese,
    felhasznaloAzonosito: felhasznaloAzonosito,
    kijelentkezes: kijelentkezes,
    abszolutKepUrl: abszolutKepUrl,
    kepUrlokFeldolgozasa: kepUrlokFeldolgozasa,
    htmlSzovegEscape: htmlSzovegEscape,
    arSzoveg: arSzoveg,
    oldalsavAlapBekotes: oldalsavAlapBekotes,
    adminMenupontokMegjeleniteseHaAdmin: adminMenupontokMegjeleniteseHaAdmin,
    oldalsavErtesitesekInditasaEgyszeru: oldalsavErtesitesekInditasaEgyszeru,
    sikerMegjelenitese: sikerMegjelenitese,
    hibaMegjelenitese: hibaMegjelenitese,
    figyelmeztetesMegjelenitese: figyelmeztetesMegjelenitese,
    muveletMegerositese: muveletMegerositese
  };
})();
