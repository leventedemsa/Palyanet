(function () {
  "use strict";

  var API_ALAP = "http://localhost:4000";
  var seged = window.ProfilSeged;
  var fuggobenKontener = document.getElementById("pendingBookingsContainer");
  var elfogadottKontener = document.getElementById("acceptedBookingsContainer");
  var elutasitottKontener = document.getElementById("rejectedBookingsContainer");
  var fuggobenJelveny = document.getElementById("pendingBadge");
  var elfogadottJelveny = document.getElementById("acceptedBadge");
  var elutasitottJelveny = document.getElementById("rejectedBadge");
  var naptarRacs = document.getElementById("calendarGrid");
  var naptarHonapCimke = document.getElementById("calendarMonthLabel");
  var naptarElozoHonapGomb = document.getElementById("calendarPrevMonth");
  var naptarKovetkezoHonapGomb = document.getElementById("calendarNextMonth");

  if (!seged || !fuggobenKontener || !elfogadottKontener || !elutasitottKontener || !naptarRacs) return;

  var felhasznaloBeolvasasa = seged.felhasznaloBeolvasasa;
  var felhasznaloAzonosito = seged.felhasznaloAzonosito;
  var hibaMegjelenitese = seged.hibaMegjelenitese;

  // Relatív képútvonalból teljes URL-t készít.
  function abszolutKepUrl(url) {
    return seged.abszolutKepUrl(API_ALAP, url, "https://github.com/mdo.png");
  }

  // Oldalsáv profiladatait, avatart és kilépés gombot köti be.
  function oldalsavBekotese(felhasznalo) {
    seged.oldalsavAlapBekotes({
      felhasznalo: felhasznalo,
      apiAlap: API_ALAP,
      loginUrl: "../../fooldal/login.html"
    });

    var berleseimElemek = document.querySelectorAll('[data-sidebar-item="berleseim"]');
    var statisztikaElemek = document.querySelectorAll('[data-sidebar-item="statisztika"]');
    berleseimElemek.forEach(function (elem) { elem.style.display = ""; });
    statisztikaElemek.forEach(function (elem) { elem.style.display = ""; });
  }

  // Foglalás státuszához olvasható feliratot ad.
  function statuszSzoveg(statusz) {
    if (statusz === "pending") return "Függőben";
    if (statusz === "accepted") return "Elfogadva";
    return "Elutasítva";
  }

  // Foglalás státuszához badge osztályt ad.
  function statuszJelvenyOsztaly(statusz) {
    if (statusz === "pending") return "text-bg-warning";
    if (statusz === "accepted") return "text-bg-success";
    return "text-bg-danger";
  }

  // ISO dátumból magyar dátumformátumot készít.
  function datumFormazasa(iso) {
    var datum = new Date(iso);
    return datum.toLocaleDateString("hu-HU");
  }

  // ISO dátumból magyar időformátumot készít.
  function idoFormazasa(iso) {
    var datum = new Date(iso);
    return datum.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  // Egy foglalás kártyájának HTML-jét állítja elő.
  function foglalasKartyaRenderelese(foglalas, legyenMuveletGomb) {
    return (
      '<div class="col-12 col-md-6">' +
      '<div class="card shadow-sm h-100"><div class="card-body d-flex flex-column">' +
      '<h3 class="h6 mb-1">' + foglalas.palya_nev + "</h3>" +
      '<p class="text-muted mb-2">' + foglalas.sportag + " - " + foglalas.helyszin + "</p>" +
      '<p class="mb-1"><strong>Foglaló:</strong> ' + (foglalas.teljes_nev || "-") + ' <span class="text-muted">(@' + (foglalas.username || "-") + ")</span></p>" +
      '<p class="mb-1"><strong>Időpont:</strong> ' + datumFormazasa(foglalas.kezdes) + ", " + idoFormazasa(foglalas.kezdes) + " - " + idoFormazasa(foglalas.vege) + "</p>" +
      '<p class="mb-1"><strong>Ár:</strong> ' + seged.arSzoveg(foglalas.ar, " Ft") + "</p>" +
      '<p class="mb-0"><span class="badge ' + statuszJelvenyOsztaly(foglalas.statusz) + '">' + statuszSzoveg(foglalas.statusz) + "</span></p>" +
      (legyenMuveletGomb
        ? '<div class="d-flex gap-2 mt-2">' +
        '<button class="btn btn-success btn-sm" type="button" data-action="accept" data-id="' + foglalas.foglalas_id + '">Elfogadás</button>' +
        '<button class="btn btn-danger btn-sm" type="button" data-action="reject" data-id="' + foglalas.foglalas_id + '">Elutasítás</button>' +
        "</div>"
        : "") +
      "</div></div>" +
      "</div>"
    );
  }

  // Kategóriánként kirendereli a foglaláslista elemeit.
  function listaRenderelese(kontener, lista, legyenMuveletGomb) {
    if (!lista.length) {
      kontener.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Nincs foglalás ebben a kategóriában.</div></div>';
      return;
    }
    kontener.innerHTML = lista.map(function (foglalas) { return foglalasKartyaRenderelese(foglalas, legyenMuveletGomb); }).join("");
  }

  var honapNevek = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
  var hetNapok = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
  var foglalasok = [];
  var maiDatum = new Date();
  var aktualisEv = maiDatum.getFullYear();
  var aktualisHonap = maiDatum.getMonth();

  // Eldönti, hogy az adott nap foglalt-e.
  function napFoglaltE(datumSzoveg) {
    return foglalasok.some(function (foglalas) {
      var nap = foglalas.kezdes ? foglalas.kezdes.slice(0, 10) : "";
      return nap === datumSzoveg && (foglalas.statusz === "pending" || foglalas.statusz === "accepted");
    });
  }

  // Megadja egy nap foglalásainak számát.
  function napFoglalasDarab(datumSzoveg) {
    return foglalasok.filter(function (foglalas) {
      var nap = foglalas.kezdes ? foglalas.kezdes.slice(0, 10) : "";
      return nap === datumSzoveg && (foglalas.statusz === "pending" || foglalas.statusz === "accepted");
    }).length;
  }

  // A havi naptár táblát kirendereli a foglalások alapján.
  function naptarRenderelese() {
    naptarHonapCimke.textContent = honapNevek[aktualisHonap] + " " + String(aktualisEv);
    var honapElsoNapja = new Date(aktualisEv, aktualisHonap, 1);
    var napokSzamaAHonapban = new Date(aktualisEv, aktualisHonap + 1, 0).getDate();
    var kezdoHetnap = (honapElsoNapja.getDay() + 6) % 7;
    var html = '<table class="table table-bordered align-middle text-center mb-0"><thead><tr>' +
      hetNapok.map(function (nev) { return '<th class="small text-muted fw-semibold">' + nev + "</th>"; }).join("") +
      "</tr></thead><tbody>";
    var cellaDarab = 0;
    html += "<tr>";
    for (var i = 0; i < kezdoHetnap; i++) {
      html += '<td class="bg-body-tertiary"></td>';
      cellaDarab += 1;
    }
    for (var napSorszam = 1; napSorszam <= napokSzamaAHonapban; napSorszam++) {
      var honapSzoveg = String(aktualisHonap + 1).padStart(2, "0");
      var napSzoveg = String(napSorszam).padStart(2, "0");
      var datumSzoveg = String(aktualisEv) + "-" + honapSzoveg + "-" + napSzoveg;
      var foglalt = napFoglaltE(datumSzoveg);
      var foglalasDarab = napFoglalasDarab(datumSzoveg);
      var cellaOsztaly = foglalt ? "table-warning" : "table-success";
      html += '<td class="' + cellaOsztaly + '" title="' + (foglalt ? "Foglalt" : "Szabad") + ' - ' + String(foglalasDarab) + ' foglalás">' +
        '<div class="fw-semibold">' + String(napSorszam) + "</div>" +
        '<div class="small text-muted">' + String(foglalasDarab) + " foglalás</div>" +
        "</td>";
      cellaDarab += 1;
      if (cellaDarab % 7 === 0 && napSorszam !== napokSzamaAHonapban) html += "</tr><tr>";
    }
    while (cellaDarab % 7 !== 0) {
      html += '<td class="bg-body-tertiary"></td>';
      cellaDarab += 1;
    }
    html += "</tr></tbody></table>";
    naptarRacs.innerHTML = html;
  }

  // A teljes oldal listáit, badge-eit és naptárát frissíti.
  function mindenRenderelese() {
    var fuggoben = foglalasok.filter(function (foglalas) { return foglalas.statusz === "pending"; });
    var elfogadott = foglalasok.filter(function (foglalas) { return foglalas.statusz === "accepted"; });
    var elutasitott = foglalasok.filter(function (foglalas) { return foglalas.statusz === "rejected"; });
    fuggobenJelveny.textContent = String(fuggoben.length);
    elfogadottJelveny.textContent = String(elfogadott.length);
    elutasitottJelveny.textContent = String(elutasitott.length);
    listaRenderelese(fuggobenKontener, fuggoben, true);
    listaRenderelese(elfogadottKontener, elfogadott, false);
    listaRenderelese(elutasitottKontener, elutasitott, false);
    naptarRenderelese();
  }

  // A tulajdonos foglalásait lekéri az API-ból.
  async function foglalasokBetoltese(felhasznaloId) {
    var valasz = await fetch(API_ALAP + "/api/bookings/owner/" + felhasznaloId);
    if (!valasz.ok) throw new Error("Foglalások lekérése sikertelen");
    foglalasok = await valasz.json();
    mindenRenderelese();
  }

  // Egy foglalás státuszát elfogadásra vagy elutasításra frissíti.
  async function foglalasStatuszFrissitese(muvelet, foglalasId) {
    var vegpont = muvelet === "accept" ? "/api/bookings/accept" : "/api/bookings/reject";
    var valasz = await fetch(API_ALAP + vegpont, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foglalas_id: foglalasId })
    });
    if (!valasz.ok) throw new Error("Státusz frissítése sikertelen");
  }

  fuggobenKontener.addEventListener("click", async function (esemeny) {
    var gomb = esemeny.target.closest("button[data-action]");
    if (!gomb) return;
    var muvelet = gomb.getAttribute("data-action");
    var foglalasId = Number(gomb.getAttribute("data-id"));
    if (!foglalasId) return;

    try {
      await foglalasStatuszFrissitese(muvelet, foglalasId);
      foglalasok = foglalasok.map(function (foglalas) {
        if (foglalas.foglalas_id !== foglalasId) return foglalas;
        return Object.assign({}, foglalas, { statusz: muvelet === "accept" ? "accepted" : "rejected" });
      });
      mindenRenderelese();
    } catch (hiba) {
      console.error(hiba);
      hibaMegjelenitese("Hiba a foglalás állapotának frissítésekor.");
    }
  });

  naptarElozoHonapGomb.addEventListener("click", function () {
    aktualisHonap -= 1;
    if (aktualisHonap < 0) { aktualisHonap = 11; aktualisEv -= 1; }
    naptarRenderelese();
  });
  naptarKovetkezoHonapGomb.addEventListener("click", function () {
    aktualisHonap += 1;
    if (aktualisHonap > 11) { aktualisHonap = 0; aktualisEv += 1; }
    naptarRenderelese();
  });

  var felhasznalo = felhasznaloBeolvasasa();
  if (!felhasznalo) {
    window.location.href = "../../fooldal/login.html";
    return;
  }
  if (felhasznalo.szerep !== "palyatulajdonos") {
    window.location.href = "../berleseim.html";
    return;
  }

  oldalsavBekotese(felhasznalo);

  // Tulajdonosi foglaláslista periodikus frissítését végzi.
  function tulajdonosFoglalasokFrissitese() {
    return foglalasokBetoltese(felhasznaloAzonosito(felhasznalo)).catch(function (hiba) {
      console.error(hiba);
      fuggobenKontener.innerHTML = '<div class="col-12"><div class="alert alert-danger mb-0">Hiba a foglalások betöltésekor.</div></div>';
      elfogadottKontener.innerHTML = "";
      elutasitottKontener.innerHTML = "";
    });
  }

  tulajdonosFoglalasokFrissitese();
  setInterval(tulajdonosFoglalasokFrissitese, 5000);
})();
