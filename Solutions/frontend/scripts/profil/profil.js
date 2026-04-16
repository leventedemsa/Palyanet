/* global bootstrap: false */
(function () {
  "use strict";

  var API_ALAP = "http://localhost:4000";
  var seged = window.ProfilSeged;
  if (!seged) return;

  var felhasznaloBeolvasasa = seged.felhasznaloBeolvasasa;
  var felhasznaloMentese = seged.felhasznaloMentese;
  var felhasznaloAzonosito = seged.felhasznaloAzonosito;
  var sikerMegjelenitese = seged.sikerMegjelenitese;
  var hibaMegjelenitese = seged.hibaMegjelenitese;
  var figyelmeztetesMegjelenitese = seged.figyelmeztetesMegjelenitese;
  var muveletMegerositese = seged.muveletMegerositese;
  var adminMenupontokMegjeleniteseHaAdmin = seged.adminMenupontokMegjeleniteseHaAdmin;

  // Ellenőrzi a belépést, és hiány esetén a login oldalra irányít.
  function bejelentkezesEllenorzese() {
    var felhasznalo = felhasznaloBeolvasasa();
    if (!felhasznalo) {
      window.location.href = "../fooldal/bejelentkezes.html";
      return null;
    }
    return felhasznalo;
  }

  // A szerepkódhoz olvasható magyar címkét ad.
  function szerepCimke(szerep) {
    if (szerep === "admin") return "Admin";
    return szerep === "palyatulajdonos" ? "Pályatulajdonos" : "Bérlő";
  }

  // A profilkép törlés gomb láthatóságát állítja.
  function profilKepTorlesGombAllitasa(lathato) {
    var torlesGomb = document.getElementById("deletePictureBtn");
    if (!torlesGomb) return;
    torlesGomb.classList.toggle("d-none", !lathato);
  }

  // Oldalsáv értesítéseit felépíti és rendszeresen frissíti.
  function oldalsavErtesitesekInditasa(felhasznalo) {
    var oldalsavak = document.querySelectorAll(".profile-sidebar");
    if (!oldalsavak.length) return;
    var felhasznaloId = felhasznaloAzonosito(felhasznalo);
    if (!felhasznaloId) return;
    var widgetek = [];

    oldalsavak.forEach(function (oldalsav) {
      if (oldalsav.querySelector(".sidebar-notifications-box")) return;
      var doboz = document.createElement("div");
      doboz.className = "sidebar-notifications-box mt-3";
      doboz.innerHTML =
        '<button class="btn btn-outline-secondary btn-sm w-100 sidebar-notif-toggle" type="button">Értesítés <span class="badge bg-danger ms-1 sidebar-notif-badge" style="display:none;">0</span></button>' +
        '<div class="mt-2 p-2 bg-white text-dark rounded shadow-sm sidebar-notif-dropdown" style="display:none;max-height:260px;overflow:auto;">' +
        '<div class="small text-muted">Nincsenek értesítések</div>' +
        "</div>";
      oldalsav.appendChild(doboz);

      var kapcsolo = doboz.querySelector(".sidebar-notif-toggle");
      var jelveny = doboz.querySelector(".sidebar-notif-badge");
      var legordulo = doboz.querySelector(".sidebar-notif-dropdown");
      if (!kapcsolo || !jelveny || !legordulo) return;

      kapcsolo.addEventListener("click", function () {
        legordulo.style.display = legordulo.style.display === "none" ? "block" : "none";
      });
      widgetek.push({ jelveny: jelveny, legordulo: legordulo });
    });
    if (!widgetek.length) return;

    // Az értesítések adatait lekéri és frissíti minden oldalsáv widgetet.
    async function ertesitesekFrissitese() {
      try {
        var valasz = await fetch(API_ALAP + "/api/notifications/" + felhasznaloId);
        if (!valasz.ok) return;
        var tetelek = await valasz.json();
        var olvasatlanDarab = tetelek.filter(function (ertesites) { return !ertesites.olvasott; }).length;
        var html = tetelek.slice(0, 15).map(function (ertesites) {
          return '<div class="small border-bottom pb-2 mb-2">' +
            '<div style="font-weight:600;">' + (ertesites.olvasott ? "Értesítés" : "Új értesítés") + "</div>" +
            '<div>' + (ertesites.uzenet || "") + "</div>" +
            '<div class="text-muted">' + new Date(ertesites.letrehozva).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) + "</div>" +
            "</div>";
        }).join("");
        widgetek.forEach(function (widget) {
          if (olvasatlanDarab > 0) {
            widget.jelveny.style.display = "inline-block";
            widget.jelveny.textContent = String(olvasatlanDarab);
          } else {
            widget.jelveny.style.display = "none";
          }
          if (!tetelek.length) {
            widget.legordulo.innerHTML = '<div class="small text-muted">Nincsenek értesítések</div>';
            return;
          }
          widget.legordulo.innerHTML = html;
        });
      } catch (_) {}
    }

    ertesitesekFrissitese();
    setInterval(ertesitesekFrissitese, 5000);
  }

  // Relatív képútvonalból teljes URL-t készít.
  function abszolutKepUrl(url) {
    return seged.abszolutKepUrl(API_ALAP, url, "");
  }

  // Oldalsáv menüpontjait és profiladatait állítja be.
  function oldalsavBekotese(felhasznalo) {
    var palyaimElemek = document.querySelectorAll('[data-sidebar-item="palyaim"]');
    var foglalasaimElemek = document.querySelectorAll('[data-sidebar-item="foglalasaim"]');
    var statisztikaElemek = document.querySelectorAll('[data-sidebar-item="statisztika"]');
    var berleseimElemek = document.querySelectorAll('[data-sidebar-item="berleseim"]');
    var palyatulajdonosE = felhasznalo.szerep === "palyatulajdonos";
    var adminE = felhasznalo.szerep === "admin";

    palyaimElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    foglalasaimElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    statisztikaElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    berleseimElemek.forEach(function (elem) { elem.style.display = adminE ? "none" : ""; });
    if (typeof adminMenupontokMegjeleniteseHaAdmin === "function") {
      adminMenupontokMegjeleniteseHaAdmin(felhasznalo);
    }

    seged.oldalsavAlapBekotes({
      felhasznalo: felhasznalo,
      apiAlap: API_ALAP,
      nevSelector: ".sidebar-user-name, #sidebarUserName",
      avatarSelector: ".sidebar-user-avatar, #sidebarUserAvatar",
      kijelentkezesSelector: ".sidebar-logout-btn, #sidebarLogoutBtn",
      loginUrl: "../fooldal/bejelentkezes.html"
    });
  }

  // A gyors statisztika mezők értékeit beállítja.
  function gyorsStatisztikaBeallitasa(tetelek) {
    var cimke1 = document.getElementById("quickStat1Label");
    var cimke2 = document.getElementById("quickStat2Label");
    var cimke3 = document.getElementById("quickStat3Label");
    var ertek1 = document.getElementById("quickStat1Value");
    var ertek2 = document.getElementById("quickStat2Value");
    var ertek3 = document.getElementById("quickStat3Value");
    if (!cimke1 || !cimke2 || !cimke3 || !ertek1 || !ertek2 || !ertek3) return;

    var biztonsagosTetelek = (tetelek || []).slice(0, 3);
    while (biztonsagosTetelek.length < 3) biztonsagosTetelek.push({ label: "-", value: "-" });
    cimke1.textContent = biztonsagosTetelek[0].label;
    cimke2.textContent = biztonsagosTetelek[1].label;
    cimke3.textContent = biztonsagosTetelek[2].label;
    ertek1.textContent = biztonsagosTetelek[0].value;
    ertek2.textContent = biztonsagosTetelek[1].value;
    ertek3.textContent = biztonsagosTetelek[2].value;
  }

  // Dátumot magyar rövid formátumra alakít.
  function datumFormazasa(ertek) {
    if (!ertek) return "-";
    var datum = new Date(ertek);
    if (Number.isNaN(datum.getTime())) return "-";
    var ev = String(datum.getFullYear());
    var honap = String(datum.getMonth() + 1).padStart(2, "0");
    var nap = String(datum.getDate()).padStart(2, "0");
    return ev + "." + honap + "." + nap;
  }

  // A szerephez tartozó gyors statisztikákat lekéri és megjeleníti.
  async function gyorsStatisztikaBetoltese(felhasznalo) {
    var statTerulet = document.getElementById("quickStat1Value");
    if (!statTerulet) return;
    var felhasznaloId = felhasznaloAzonosito(felhasznalo);
    if (!felhasznaloId) {
      gyorsStatisztikaBeallitasa([]);
      return;
    }

    try {
      if (felhasznalo.szerep === "palyatulajdonos") {
        var tulajPalyakValasz = await fetch(API_ALAP + "/api/palyak/owner/" + felhasznaloId);
        var tulajFoglalasokValasz = await fetch(API_ALAP + "/api/bookings/owner/" + felhasznaloId);
        var tulajPalyak = tulajPalyakValasz.ok ? await tulajPalyakValasz.json() : [];
        var tulajFoglalasok = tulajFoglalasokValasz.ok ? await tulajFoglalasokValasz.json() : [];
        var fuggobenFoglalasok = tulajFoglalasok.filter(function (foglalas) { return foglalas.statusz === "pending"; }).length;
        var elfogadottFoglalasok = tulajFoglalasok.filter(function (foglalas) { return foglalas.statusz === "accepted"; }).length;
        gyorsStatisztikaBeallitasa([
          { label: "Saját pályák", value: String(tulajPalyak.length) },
          { label: "Függő foglalások", value: String(fuggobenFoglalasok) },
          { label: "Elfogadott foglalások", value: String(elfogadottFoglalasok) }
        ]);
        return;
      }

      if (felhasznalo.szerep === "admin") {
        var bejelentesekValasz = await fetch(API_ALAP + "/api/reports?admin_id=" + felhasznaloId);
        var bejelentesek = bejelentesekValasz.ok ? await bejelentesekValasz.json() : [];
        var fuggobenBejelentesek = bejelentesek.filter(function (bejelentes) {
          return String(bejelentes.statusz || "").toLowerCase() === "pending";
        }).length;
        var lezartBejelentesek = bejelentesek.filter(function (bejelentes) {
          return String(bejelentes.statusz || "").toLowerCase() !== "pending";
        }).length;

        gyorsStatisztikaBeallitasa([
          { label: "Függő bejelentések", value: String(fuggobenBejelentesek) },
          { label: "Lezárt bejelentések", value: String(lezartBejelentesek) },
          { label: "Összes bejelentés", value: String(bejelentesek.length) }
        ]);
        return;
      }

      var berloFoglalasokValasz = await fetch(API_ALAP + "/api/bookings/renter/" + felhasznaloId);
      var berloFoglalasok = berloFoglalasokValasz.ok ? await berloFoglalasokValasz.json() : [];
      var most = new Date();
      var aktivFoglalasok = berloFoglalasok.filter(function (foglalas) {
        if (foglalas.statusz === "rejected") return false;
        return new Date(foglalas.vege) >= most;
      }).length;
      var lejartFoglalasok = berloFoglalasok.filter(function (foglalas) {
        if (foglalas.statusz === "rejected") return true;
        return new Date(foglalas.vege) < most;
      }).length;
      gyorsStatisztikaBeallitasa([
        { label: "Aktív foglalások", value: String(aktivFoglalasok) },
        { label: "Lejárt foglalások", value: String(lejartFoglalasok) },
        { label: "Összes foglalás", value: String(berloFoglalasok.length) }
      ]);
    } catch (_) {
      if (felhasznalo && felhasznalo.szerep === "admin") {
        gyorsStatisztikaBeallitasa([
          { label: "Függő bejelentések", value: "-" },
          { label: "Lezárt bejelentések", value: "-" },
          { label: "Összes bejelentés", value: "-" }
        ]);
        return;
      }

      gyorsStatisztikaBeallitasa([
        { label: "Aktív foglalások", value: "-" },
        { label: "Lejárt foglalások", value: "-" },
        { label: "Összes foglalás", value: "-" }
      ]);
    }
  }

  // A profil oldal működését inicializálja és kezeli.
  async function profilOldalBetoltese(felhasznalo) {
    var profilFelhasznalonevErtek = document.getElementById("profileUsernameValue");
    if (!profilFelhasznalonevErtek) return;
    var aktualisProfil = Object.assign({}, felhasznalo);

    // A profil adatait kirajzolja a felületen.
    function profilKirajzolasa(profilAdat) {
      var megjelenitendoNev = profilAdat.teljes_nev || profilAdat.username || "Felhasználó";
      var avatarUrl = profilAdat.profil_kep_url ? abszolutKepUrl(profilAdat.profil_kep_url) : "https://github.com/mdo.png";
      var oldalsavAvatarok = document.querySelectorAll(".sidebar-user-avatar, #sidebarUserAvatar");
      var oldalsavNevek = document.querySelectorAll(".sidebar-user-name, #sidebarUserName");
      aktualisProfil = Object.assign({}, aktualisProfil, profilAdat);

      document.getElementById("profileCardName").textContent = megjelenitendoNev;
      document.getElementById("profileCardEmail").textContent = profilAdat.email || "-";
      document.getElementById("profileAvatar").src = avatarUrl;
      document.getElementById("profileUsernameValue").textContent = profilAdat.username || "-";
      document.getElementById("profileFullNameValue").textContent = megjelenitendoNev;
      document.getElementById("profileEmailValue").textContent = profilAdat.email || "-";
      document.getElementById("profileRoleValue").textContent = szerepCimke(profilAdat.szerep);
      var masodlagosSzerep = document.getElementById("profileRoleValueSecondary");
      if (masodlagosSzerep) masodlagosSzerep.textContent = szerepCimke(profilAdat.szerep);
      document.getElementById("profilePhoneValue").textContent = profilAdat.telefonszam || "-";
      var letrehozasDatum = document.getElementById("profileCreatedAtValue");
      if (letrehozasDatum) letrehozasDatum.textContent = datumFormazasa(profilAdat.letrehozva);
      profilKepTorlesGombAllitasa(!!profilAdat.profil_kep_url);
      oldalsavAvatarok.forEach(function (avatar) { avatar.src = avatarUrl; });
      oldalsavNevek.forEach(function (nev) { nev.textContent = megjelenitendoNev; });
    }

    // A tárolt felhasználó objektumot profil adatokkal frissíti.
    function taroltFelhasznaloSzinkronizalasa(profilAdat) {
      var taroltFelhasznalo = felhasznaloBeolvasasa();
      if (!taroltFelhasznalo) return;
      var osszefuzott = Object.assign({}, taroltFelhasznalo, {
        username: profilAdat.username || taroltFelhasznalo.username,
        teljes_nev: profilAdat.teljes_nev || taroltFelhasznalo.teljes_nev,
        email: profilAdat.email || taroltFelhasznalo.email,
        szerep: profilAdat.szerep || taroltFelhasznalo.szerep,
        telefonszam: profilAdat.telefonszam || taroltFelhasznalo.telefonszam,
        profil_kep_url: profilAdat.profil_kep_url || null
      });
      felhasznaloMentese(osszefuzott);
    }

    // Profilkép feltöltés és törlés eseményeit köti be.
    function profilKepMuveletekBekotese() {
      var fajlBemenet = document.getElementById("profilePictureInput");
      var feltoltesGomb = document.getElementById("uploadPictureBtn");
      var torlesGomb = document.getElementById("deletePictureBtn");
      if (!fajlBemenet || !feltoltesGomb || !torlesGomb) return;
      if (feltoltesGomb.dataset.bound === "1") return;
      feltoltesGomb.dataset.bound = "1";

      feltoltesGomb.addEventListener("click", function () {
        fajlBemenet.click();
      });

      fajlBemenet.addEventListener("change", async function () {
        var fajl = fajlBemenet.files && fajlBemenet.files[0];
        if (!fajl) return;

        if (!fajl.type || !fajl.type.startsWith("image/")) {
          figyelmeztetesMegjelenitese("Csak képfájlt lehet feltölteni.");
          fajlBemenet.value = "";
          return;
        }

        if (fajl.size > 5 * 1024 * 1024) {
          figyelmeztetesMegjelenitese("A kép mérete legfeljebb 5 MB lehet.");
          fajlBemenet.value = "";
          return;
        }

        try {
          var taroltFelhasznalo = felhasznaloBeolvasasa() || felhasznalo || {};
          var felhasznaloId = felhasznaloAzonosito(taroltFelhasznalo) || felhasznaloAzonosito(aktualisProfil);
          if (!felhasznaloId) throw new Error("Hiányzik a felhasználó azonosítója.");

          var formAdat = new FormData();
          formAdat.append("profilePicture", fajl);
          formAdat.append("userId", String(felhasznaloId));

          var vanAktualisKep = !!(aktualisProfil && aktualisProfil.profil_kep_url);
          var vegpont = vanAktualisKep ? "/api/profile/update" : "/api/profile/upload";
          var httpMetodus = vanAktualisKep ? "PUT" : "POST";

          var valasz = await fetch(API_ALAP + vegpont, {
            method: httpMetodus,
            body: formAdat
          });
          var adat = await valasz.json().catch(function () { return {}; });
          if (!valasz.ok) throw new Error(adat.message || "Profilkép mentési hiba.");

          var kovetkezoProfil = Object.assign({}, aktualisProfil, {
            profil_kep_url: adat.profil_kep_url || null
          });
          profilKirajzolasa(kovetkezoProfil);
          taroltFelhasznaloSzinkronizalasa(kovetkezoProfil);
          fajlBemenet.value = "";
          sikerMegjelenitese("Profilkép sikeresen frissítve.");
        } catch (hiba) {
          console.error(hiba);
          hibaMegjelenitese("Hiba a profilkép frissítésekor: " + hiba.message);
          fajlBemenet.value = "";
        }
      });

      torlesGomb.addEventListener("click", async function () {
        var megerosites = await muveletMegerositese("Biztosan törölni szeretnéd a profilképet?");
        if (!megerosites.isConfirmed) return;
        try {
          var taroltFelhasznalo = felhasznaloBeolvasasa() || felhasznalo || {};
          var felhasznaloId = felhasznaloAzonosito(taroltFelhasznalo) || felhasznaloAzonosito(aktualisProfil);
          if (!felhasznaloId) throw new Error("Hiányzik a felhasználó azonosítója.");

          var valasz = await fetch(API_ALAP + "/api/profile/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: felhasznaloId })
          });
          var adat = await valasz.json().catch(function () { return {}; });
          if (!valasz.ok) throw new Error(adat.message || "Profilkép törlési hiba.");

          var kovetkezoProfil = Object.assign({}, aktualisProfil, { profil_kep_url: null });
          profilKirajzolasa(kovetkezoProfil);
          taroltFelhasznaloSzinkronizalasa(kovetkezoProfil);
          sikerMegjelenitese("Profilkép sikeresen törölve.");
        } catch (hiba) {
          console.error(hiba);
          hibaMegjelenitese("Hiba a profilkép törlésekor: " + hiba.message);
        }
      });
    }

    // Profil adatszerkesztés modal eseményeit köti be.
    function profilSzerkesztesBekotese() {
      var modalElem = document.getElementById("editProfileModal");
      var urlap = document.getElementById("editProfileForm");
      var mentesGomb = document.getElementById("saveProfileChangesBtn");
      var felhasznalonevMezo = document.getElementById("editUsernameInput");
      var teljesNevMezo = document.getElementById("editFullNameInput");
      var emailMezo = document.getElementById("editEmailInput");
      if (!modalElem || !urlap || !mentesGomb || !felhasznalonevMezo || !teljesNevMezo || !emailMezo) return;
      if (mentesGomb.dataset.bound === "1") return;
      mentesGomb.dataset.bound = "1";

      modalElem.addEventListener("show.bs.modal", function () {
        felhasznalonevMezo.value = aktualisProfil.username || "";
        teljesNevMezo.value = aktualisProfil.teljes_nev || "";
        emailMezo.value = aktualisProfil.email || "";
      });

      mentesGomb.addEventListener("click", async function () {
        if (!urlap.checkValidity()) {
          urlap.reportValidity();
          return;
        }

        try {
          var kuldendoAdat = {
            userId: felhasznaloAzonosito(aktualisProfil) || felhasznaloAzonosito(felhasznalo),
            username: felhasznalonevMezo.value.trim(),
            teljes_nev: teljesNevMezo.value.trim(),
            email: emailMezo.value.trim()
          };

          var valasz = await fetch(API_ALAP + "/api/profile/update-data", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(kuldendoAdat)
          });
          var adat = await valasz.json().catch(function () { return {}; });
          if (!valasz.ok) throw new Error(adat.message || adat.error || ("Profil adat mentési hiba. HTTP " + valasz.status));

          if (adat.user) {
            profilKirajzolasa(adat.user);
            taroltFelhasznaloSzinkronizalasa(adat.user);
          }

          var modal = bootstrap.Modal.getOrCreateInstance(modalElem);
          modal.hide();
          sikerMegjelenitese("Profil adatok sikeresen frissítve.");
        } catch (hiba) {
          console.error(hiba);
          hibaMegjelenitese("Hiba a profil adatok mentésekor: " + hiba.message);
        }
      });
    }

    // Jelszócsere modal eseményeit köti be és validálja.
    function jelszoMuveletekBekotese() {
      var modalElem = document.getElementById("changePasswordModal");
      var urlap = document.getElementById("changePasswordForm");
      var aktualisJelszoMezo = document.getElementById("currentPasswordInput");
      var ujJelszoMezo = document.getElementById("newPasswordInput");
      var ujJelszoMegerositeseMezo = document.getElementById("confirmPasswordInput");
      var mentesGomb = document.getElementById("changePasswordBtn");
      if (!modalElem || !urlap || !aktualisJelszoMezo || !ujJelszoMezo || !ujJelszoMegerositeseMezo || !mentesGomb) return;
      if (mentesGomb.dataset.bound === "1") return;
      mentesGomb.dataset.bound = "1";

      // A jelszó űrlap mezőit alaphelyzetbe állítja.
      function urlapNullazasa() {
        aktualisJelszoMezo.value = "";
        ujJelszoMezo.value = "";
        ujJelszoMegerositeseMezo.value = "";
      }

      modalElem.addEventListener("show.bs.modal", function () {
        urlapNullazasa();
      });

      mentesGomb.addEventListener("click", async function () {
        if (!urlap.checkValidity()) {
          urlap.reportValidity();
          return;
        }

        var aktualisJelszo = aktualisJelszoMezo.value || "";
        var ujJelszo = ujJelszoMezo.value || "";
        var ujJelszoMegerositese = ujJelszoMegerositeseMezo.value || "";

        if (!aktualisJelszo || !ujJelszo || !ujJelszoMegerositese) {
          figyelmeztetesMegjelenitese("Kérlek tölts ki minden jelszó mezőt.");
          return;
        }
        if (ujJelszo.length < 8) {
          figyelmeztetesMegjelenitese("Az új jelszó legalább 8 karakter legyen.");
          return;
        }
        if (ujJelszo !== ujJelszoMegerositese) {
          figyelmeztetesMegjelenitese("Az új jelszó és a megerősítés nem egyezik.");
          return;
        }

        try {
          var valasz = await fetch(API_ALAP + "/api/profile/change-password", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: felhasznaloAzonosito(aktualisProfil) || felhasznaloAzonosito(felhasznalo),
              currentPassword: aktualisJelszo,
              newPassword: ujJelszo
            })
          });
          var adat = await valasz.json().catch(function () { return {}; });
          if (!valasz.ok) throw new Error(adat.message || adat.error || ("Jelszó módosítási hiba. HTTP " + valasz.status));

          urlapNullazasa();
          var modal = bootstrap.Modal.getOrCreateInstance(modalElem);
          modal.hide();
          sikerMegjelenitese("Jelszó sikeresen módosítva.");
        } catch (hiba) {
          console.error(hiba);
          hibaMegjelenitese("Hiba a jelszó módosításakor: " + hiba.message);
        }
      });
    }

    profilKirajzolasa(felhasznalo);
    profilKepMuveletekBekotese();
    profilSzerkesztesBekotese();
    jelszoMuveletekBekotese();
    taroltFelhasznaloSzinkronizalasa(felhasznalo);

    try {
      var felhasznaloId = felhasznaloAzonosito(felhasznalo);
      if (!felhasznaloId) throw new Error("Hiányzik a felhasználó azonosítója");
      var valasz = await fetch(API_ALAP + "/api/profile/profile?userId=" + encodeURIComponent(felhasznaloId));
      if (!valasz.ok) throw new Error("Profil lekérési hiba");
      var profil = await valasz.json();
      profilKirajzolasa(profil);
      taroltFelhasznaloSzinkronizalasa(profil);
    } catch (hiba) {
      console.error(hiba);
    }
  }

  var felhasznalo = bejelentkezesEllenorzese();
  if (!felhasznalo) return;

  oldalsavBekotese(felhasznalo);
  profilOldalBetoltese(felhasznalo);
  gyorsStatisztikaBetoltese(felhasznalo);
})();
