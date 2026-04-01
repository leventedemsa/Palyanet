(function () {
  "use strict";

  var API_ALAP = "http://localhost:4000";
  var felhasznaloIdMezo = document.getElementById("logFelhasznaloId");
  var esemenyTipusMezo = document.getElementById("logEsemenyTipus");
  var keresesGomb = document.getElementById("logKeresesBtn");
  var resetGomb = document.getElementById("logResetBtn");
  var listaKontener = document.getElementById("logLista");

  if (!felhasznaloIdMezo || !esemenyTipusMezo || !keresesGomb || !resetGomb || !listaKontener) return;

  function felhasznaloOlvasasa() {
    var raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function felhasznaloAzonosito(felhasznalo) {
    return felhasznalo && (felhasznalo.felhasznalo_id || felhasznalo.id || felhasznalo.userId);
  }

  function htmlBiztonsagos(szoveg) {
    return String(szoveg || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function datumFormaz(datum) {
    if (!datum) return "-";
    var d = new Date(datum);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
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
    window.location.href = "../../fooldal/login.html";
  }

  function oldalsavBekotes(felhasznalo) {
    var nev = felhasznalo.teljes_nev || felhasznalo.username || "Felhasználó";
    document.querySelectorAll(".sidebar-user-name").forEach(function (el) { el.textContent = nev; });
    document.querySelectorAll(".sidebar-user-avatar").forEach(function (el) { el.src = abszolutKepUrl(felhasznalo.profil_kep_url); });
    document.querySelectorAll(".sidebar-logout-btn").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        kijelentkezes();
      });
    });
  }

  function jsonVagyAlap(response, alapErtek) {
    return response.json().catch(function () { return alapErtek; });
  }

  async function jsonKeres(url, options, alapErtek, alapHiba) {
    var response = await fetch(url, options);
    var data = await jsonVagyAlap(response, alapErtek);
    if (!response.ok) throw new Error(data.error || alapHiba);
    return data;
  }

  async function logokBetoltese(adminId, felhasznaloId, esemenyTipus) {
    var params = new URLSearchParams();
    params.set("admin_id", String(adminId));
    params.set("limit", "300");
    if (felhasznaloId) params.set("felhasznalo_id", String(felhasznaloId));
    if (esemenyTipus) params.set("esemeny_tipus", esemenyTipus);

    return jsonKeres(
      API_ALAP + "/api/users/admin/logs?" + params.toString(),
      null,
      [],
      "Logok lekérdezése sikertelen."
    );
  }

  function logListaRender(logok) {
    if (!logok.length) {
      listaKontener.innerHTML = '<div class="alert alert-light border mb-0">Nincs találat.</div>';
      return;
    }

    listaKontener.innerHTML = logok.map(function (sor) {
      var logId = Number(sor.log_id);
      var felhasznaloId = Number(sor.felhasznalo_id);
      var felhasznaloNev = (sor.teljes_nev || sor.username)
        ? htmlBiztonsagos((sor.teljes_nev || "") + (sor.username ? " (" + sor.username + ")" : ""))
        : "-";

      return (
        '<div class="card shadow-sm border-0 mb-3">' +
          '<div class="card-body">' +
            '<div class="d-flex justify-content-between align-items-start gap-3 mb-2">' +
              '<div class="fw-semibold">Log ID: ' + logId + "</div>" +
              '<span class="badge text-bg-primary">' + htmlBiztonsagos(sor.esemeny_tipus || "-") + "</span>" +
            "</div>" +
            '<p class="mb-1"><strong>Felhasználó ID:</strong> ' + felhasznaloId + "</p>" +
            '<p class="mb-1"><strong>Felhasználó:</strong> ' + felhasznaloNev + "</p>" +
            '<p class="mb-0"><strong>Dátum:</strong> ' + datumFormaz(sor.datum) + "</p>" +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  var felhasznalo = felhasznaloOlvasasa();
  if (!felhasznalo) {
    window.location.href = "../../fooldal/login.html";
    return;
  }

  var adminId = felhasznaloAzonosito(felhasznalo);
  if (!adminId || String(felhasznalo.szerep || "").toLowerCase() !== "admin") {
    window.location.href = "../profil.html";
    return;
  }

  oldalsavBekotes(felhasznalo);

  async function frissit() {
    try {
      var felhasznaloId = parseInt(felhasznaloIdMezo.value, 10);
      var esemenyTipus = String(esemenyTipusMezo.value || "").trim();
      var logok = await logokBetoltese(adminId, Number.isNaN(felhasznaloId) ? null : felhasznaloId, esemenyTipus);
      logListaRender(logok);
    } catch (error) {
      console.error(error);
      listaKontener.innerHTML = '<div class="alert alert-danger mb-0">Hiba a logok betöltése közben.</div>';
    }
  }

  keresesGomb.addEventListener("click", frissit);
  resetGomb.addEventListener("click", function () {
    felhasznaloIdMezo.value = "";
    esemenyTipusMezo.value = "";
    frissit();
  });

  frissit();
})();
