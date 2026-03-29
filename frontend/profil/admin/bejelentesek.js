(function () {
  "use strict";

  var API_ALAP = "http://localhost:4000";
  var fuggoBejelentesekKontener = document.getElementById("pendingReports");
  var korabbiBejelentesekKontener = document.getElementById("historyReports");
  var frissitesGomb = document.getElementById("refreshReportsBtn");
  var reszletekModalElem = document.getElementById("reportDetailsModal");
  var reszletekTorzs = document.getElementById("reportDetailsBody");
  var elutasitasGomb = document.getElementById("rejectReportBtn");
  var vegrehajtasGomb = document.getElementById("executeReportBtn");
  var felhasznaloTiltasJelolo = document.getElementById("actionBanUser");
  var palyaFelfuggesztesJelolo = document.getElementById("actionSuspendField");
  var adminMegjegyzesMezo = document.getElementById("adminNote");
  var kuldesErintettnekJelolo = document.getElementById("sendToTarget");
  var erintettUzenetMezo = document.getElementById("targetMessage");

  if (
    !fuggoBejelentesekKontener || !korabbiBejelentesekKontener || !frissitesGomb || !reszletekModalElem || !reszletekTorzs ||
    !elutasitasGomb || !vegrehajtasGomb || !felhasznaloTiltasJelolo || !palyaFelfuggesztesJelolo || !adminMegjegyzesMezo || !kuldesErintettnekJelolo || !erintettUzenetMezo
  ) return;

  var reszletekModal = bootstrap.Modal.getOrCreateInstance(reszletekModalElem);
  var aktualisBejelentes = null;
  var felhasznaloAzonosito = null;

  function felhasznaloOlvasasa() {
    var raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function felhasznaloId(felhasznalo) {
    return felhasznalo && (felhasznalo.felhasznalo_id || felhasznalo.id || felhasznalo.userId);
  }

  function hibaMutatas(message) {
    return Swal.fire({ icon: "error", title: "Hiba", text: message, confirmButtonText: "Rendben" });
  }

  function sikerMutatas(message) {
    return Swal.fire({ icon: "success", title: "Sikeres művelet", text: message, confirmButtonText: "Rendben" });
  }

  function abszolutKepUrl(url) {
    if (!url) return "https://github.com/mdo.png";
    return url.startsWith("http") ? url : API_ALAP + url;
  }

  function kijelentkezes() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "../../login.html";
  }

  function htmlBiztonsagos(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function oldalsavBekotes(felhasznalo) {
    var nevek = document.querySelectorAll(".sidebar-user-name");
    var avatarok = document.querySelectorAll(".sidebar-user-avatar");
    var megjelenitettNev = felhasznalo.teljes_nev || felhasznalo.username || "Felhasználó";
    nevek.forEach(function (elem) { elem.textContent = megjelenitettNev; });
    avatarok.forEach(function (elem) { elem.src = abszolutKepUrl(felhasznalo.profil_kep_url); });

    document.querySelectorAll(".sidebar-logout-btn").forEach(function (gomb) {
      gomb.addEventListener("click", function (event) {
        event.preventDefault();
        kijelentkezes();
      });
    });
  }

  function datumFormaz(value) {
    if (!value) return "-";
    var datum = new Date(value);
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

  function jsonVagyAlap(response, alapErtek) {
    return response.json().catch(function () { return alapErtek; });
  }

  async function jsonKeres(url, options, alapErtek, alapHiba) {
    var response = await fetch(url, options);
    var adat = await jsonVagyAlap(response, alapErtek);
    if (!response.ok) throw new Error(adat.message || alapHiba);
    return adat;
  }

  function statuszJelveny(statusz) {
    var normalizalt = String(statusz || "").toLowerCase();
    if (normalizalt === "vegrehajtva") return '<span class="badge text-bg-success">Végrehajtva</span>';
    if (normalizalt === "elutasitva") return '<span class="badge text-bg-secondary">Elutasítva</span>';
    return '<span class="badge text-bg-warning">Függőben</span>';
  }

  function kartyaRender(bejelentes, fuggo) {
    return (
      '<div class="card shadow-sm border-0 mb-3">' +
        '<div class="card-body">' +
          '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">' +
            '<div class="fw-semibold">Bejelentés #' + Number(bejelentes.bejelentes_id) + '</div>' +
            statuszJelveny(bejelentes.statusz) +
          '</div>' +
          '<p class="mb-1"><strong>Pálya:</strong> ' + htmlBiztonsagos(bejelentes.palya_nev || ("ID " + bejelentes.palya_id)) + '</p>' +
          '<p class="mb-1"><strong>Küldő:</strong> ' + htmlBiztonsagos(bejelentes.kuldo_username || bejelentes.kuldo_felhasznalo_id) + '</p>' +
          '<p class="mb-1"><strong>Bejelentett:</strong> ' + htmlBiztonsagos(bejelentes.bejelentett_username || bejelentes.bejelentett_felhasznalo_id) + '</p>' +
          '<p class="mb-2"><strong>Szöveg:</strong> ' + htmlBiztonsagos(bejelentes.szoveg || "") + '</p>' +
          '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2">' +
            '<small class="text-muted">Létrehozva: ' + datumFormaz(bejelentes.letrehozva) + '</small>' +
            (fuggo
              ? '<button class="btn btn-primary btn-sm" data-action="details" data-id="' + Number(bejelentes.bejelentes_id) + '">Részletek</button>'
              : '<button class="btn btn-outline-secondary btn-sm" data-action="details" data-id="' + Number(bejelentes.bejelentes_id) + '">Részletek</button>') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function bejelentesekRender(bejelentesek) {
    var fuggoBejelentesek = bejelentesek.filter(function (elem) { return String(elem.statusz || "").toLowerCase() === "pending"; });
    var korabbiBejelentesek = bejelentesek.filter(function (elem) { return String(elem.statusz || "").toLowerCase() !== "pending"; });

    fuggoBejelentesekKontener.innerHTML = fuggoBejelentesek.length ? fuggoBejelentesek.map(function (bejelentes) { return kartyaRender(bejelentes, true); }).join("") : '<div class="alert alert-light border mb-0">Nincs függőben lévő bejelentés.</div>';
    korabbiBejelentesekKontener.innerHTML = korabbiBejelentesek.length ? korabbiBejelentesek.map(function (bejelentes) { return kartyaRender(bejelentes, false); }).join("") : '<div class="alert alert-light border mb-0">Nincs korábbi bejelentés.</div>';
  }

  async function bejelentesekBetoltese() {
    return jsonKeres(
      API_ALAP + "/api/reports?admin_id=" + felhasznaloAzonosito,
      null,
      [],
      "Bejelentések lekérése sikertelen"
    );
  }

  async function bejelentesReszletekBetoltese(bejelentesAzonosito) {
    return jsonKeres(
      API_ALAP + "/api/reports/" + bejelentesAzonosito + "?admin_id=" + felhasznaloAzonosito,
      null,
      {},
      "Bejelentés részletek lekérése sikertelen"
    );
  }

  function akcioPayloadOlvasas(statusz) {
    return {
      admin_id: felhasznaloAzonosito,
      statusz: statusz,
      felhasznalo_letiltas: felhasznaloTiltasJelolo.checked,
      palya_felfuggesztes: palyaFelfuggesztesJelolo.checked,
      admin_megjegyzes: String(adminMegjegyzesMezo.value || "").trim(),
      kuld_uzenet_erintettnek: kuldesErintettnekJelolo.checked,
      admin_uzenet_erintettnek: String(erintettUzenetMezo.value || "").trim()
    };
  }

  async function bejelentesStatuszFrissitesKeres(bejelentesAzonosito, payload) {
    await jsonKeres(
      API_ALAP + "/api/reports/" + bejelentesAzonosito + "/status",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      },
      {},
      "Bejelentés frissítése sikertelen"
    );
  }

  function akcioUrlapAlaphelyzet(bejelentes) {
    felhasznaloTiltasJelolo.checked = false;
    palyaFelfuggesztesJelolo.checked = Boolean(bejelentes.palya_felfuggesztve);
    adminMegjegyzesMezo.value = "";
    erintettUzenetMezo.value = "";
    kuldesErintettnekJelolo.checked = true;
  }

  function reszletekKitoltese(bejelentes) {
    reszletekTorzs.innerHTML =
      '<div class="row g-3 mb-2">' +
        '<div class="col-md-6"><strong>Küldő:</strong><br>' + htmlBiztonsagos(bejelentes.kuldo_username || "-") + ' (' + htmlBiztonsagos(bejelentes.kuldo_email || "-") + ')</div>' +
        '<div class="col-md-6"><strong>Bejelentett:</strong><br>' + htmlBiztonsagos(bejelentes.bejelentett_username || "-") + ' (' + htmlBiztonsagos(bejelentes.bejelentett_email || "-") + ')</div>' +
      '</div>' +
      '<p class="mb-1"><strong>Pálya:</strong> ' + htmlBiztonsagos(bejelentes.palya_nev || "-") + ' (ID: ' + Number(bejelentes.palya_id) + ')</p>' +
      '<p class="mb-1"><strong>Sportág/Helyszín:</strong> ' + htmlBiztonsagos(bejelentes.palya_sportag || "-") + ' / ' + htmlBiztonsagos(bejelentes.palya_helyszin || "-") + '</p>' +
      '<p class="mb-2"><strong>Bejelentés szövege:</strong> ' + htmlBiztonsagos(bejelentes.szoveg || "") + '</p>' +
      '<div class="d-flex flex-wrap justify-content-between gap-2">' +
        '<small class="text-muted">Létrehozva: ' + datumFormaz(bejelentes.letrehozva) + '</small>' +
        '<a class="btn btn-outline-primary btn-sm" href="../../palyak.html?id=' + Number(bejelentes.palya_id) + '" target="_blank" rel="noopener">Pálya megtekintése</a>' +
      '</div>';

    akcioUrlapAlaphelyzet(bejelentes);

    var fuggo = String(bejelentes.statusz || "").toLowerCase() === "pending";
    elutasitasGomb.disabled = !fuggo;
    vegrehajtasGomb.disabled = !fuggo;
  }

  async function frissites() {
    try {
      var bejelentesek = await bejelentesekBetoltese();
      bejelentesekRender(bejelentesek);
    } catch (error) {
      console.error(error);
      fuggoBejelentesekKontener.innerHTML = '<div class="alert alert-danger mb-0">Hiba a bejelentések betöltése közben.</div>';
      korabbiBejelentesekKontener.innerHTML = "";
    }
  }

  async function reszletekMegnyitas(bejelentesAzonosito) {
    try {
      aktualisBejelentes = await bejelentesReszletekBetoltese(bejelentesAzonosito);
      reszletekKitoltese(aktualisBejelentes);
      reszletekModal.show();
    } catch (error) {
      console.error(error);
      hibaMutatas(error.message || "A bejelentés részletei nem tölthetők be.");
    }
  }

  var felhasznalo = felhasznaloOlvasasa();
  if (!felhasznalo) {
    window.location.href = "../../login.html";
    return;
  }
  felhasznaloAzonosito = felhasznaloId(felhasznalo);
  if (!felhasznaloAzonosito) {
    window.location.href = "../../login.html";
    return;
  }
  if (String(felhasznalo.szerep || "").toLowerCase() !== "admin") {
    window.location.href = "../profil.html";
    return;
  }

  oldalsavBekotes(felhasznalo);

  function kontenerKattintasKotes(kontener) {
    kontener.addEventListener("click", function (event) {
      var gomb = event.target.closest("button[data-action='details']");
      if (!gomb) return;
      var bejelentesAzonosito = Number(gomb.getAttribute("data-id"));
      if (!bejelentesAzonosito) return;
      reszletekMegnyitas(bejelentesAzonosito);
    });
  }

  kontenerKattintasKotes(fuggoBejelentesekKontener);
  kontenerKattintasKotes(korabbiBejelentesekKontener);

  async function statuszAkcioKezeles(statusz, sikerUzenet, alapHibaUzenet) {
    if (!aktualisBejelentes) return;
    var payload = akcioPayloadOlvasas(statusz);
    try {
      await bejelentesStatuszFrissitesKeres(aktualisBejelentes.bejelentes_id, payload);
      reszletekModal.hide();
      await frissites();
      await sikerMutatas(sikerUzenet);
    } catch (error) {
      console.error(error);
      hibaMutatas(error.message || alapHibaUzenet);
    }
  }

  elutasitasGomb.addEventListener("click", function () {
    statuszAkcioKezeles("elutasitva", "A bejelentés elutasítva.", "Nem sikerült elutasítani a bejelentést.");
  });

  vegrehajtasGomb.addEventListener("click", function () {
    statuszAkcioKezeles("vegrehajtva", "A bejelentés végrehajtása megtörtént.", "Nem sikerült végrehajtani a bejelentést.");
  });

  frissitesGomb.addEventListener("click", frissites);
  frissites();
})();
