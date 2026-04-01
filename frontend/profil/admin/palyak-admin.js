(function () {
  "use strict";

  var API_ALAP = "http://localhost:4000";
  var palyaIdMezo = document.getElementById("adminPalyaId");
  var felhasznalonevMezo = document.getElementById("adminUsername");
  var keresesGomb = document.getElementById("adminPalyaKeresesBtn");
  var alaphelyzetGomb = document.getElementById("adminPalyaResetBtn");
  var listaKontener = document.getElementById("adminPalyakLista");

  if (!palyaIdMezo || !felhasznalonevMezo || !keresesGomb || !alaphelyzetGomb || !listaKontener) return;

  function felhasznaloOlvasasa() {
    var raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function felhasznaloAzonosito(felhasznalo) {
    return felhasznalo && (felhasznalo.felhasznalo_id || felhasznalo.id || felhasznalo.userId);
  }

  function hibaMutatas(message) {
    return Swal.fire({ icon: "error", title: "Hiba", text: message, confirmButtonText: "Rendben" });
  }

  function sikerMutatas(message) {
    return Swal.fire({ icon: "success", title: "Sikeres művelet", text: message, confirmButtonText: "Rendben" });
  }

  function torlesMegerositese() {
    return Swal.fire({
      icon: "warning",
      title: "Biztosan törlöd?",
      text: "Ez a művelet nem vonható vissza.",
      showCancelButton: true,
      confirmButtonText: "Igen, törlöm",
      cancelButtonText: "Mégsem"
    });
  }

  function torlesIndokBekeres() {
    return Swal.fire({
      title: "Törlés indoka",
      input: "text",
      inputLabel: "Kötelező mező",
      inputPlaceholder: "Add meg a törlés indokát",
      showCancelButton: true,
      confirmButtonText: "Törlés",
      cancelButtonText: "Mégsem",
      inputValidator: function (value) {
        if (!value || !String(value).trim()) return "A törlés indoka kötelező.";
        return null;
      }
    });
  }

  function felfuggesztesIndokBekeres(felfuggesztesLegyen) {
    if (!felfuggesztesLegyen) return Promise.resolve({ isConfirmed: true, value: "" });
    return Swal.fire({
      title: "Felfüggesztés indoka",
      input: "text",
      inputLabel: "Kötelező mező",
      inputPlaceholder: "Add meg a felfüggesztés indokát",
      showCancelButton: true,
      confirmButtonText: "Mentés",
      cancelButtonText: "Mégsem",
      inputValidator: function (value) {
        if (!value || !String(value).trim()) return "A felfüggesztés indoka kötelező.";
        return null;
      }
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
      hour12: false
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

  async function adminPalyakBetoltese(adminId, palyaId, felhasznalonev) {
    var params = new URLSearchParams();
    params.set("admin_id", String(adminId));
    if (palyaId) params.set("palya_id", String(palyaId));
    if (felhasznalonev) params.set("username", felhasznalonev);

    return jsonKeres(
      API_ALAP + "/api/palyak/admin/list?" + params.toString(),
      null,
      [],
      "Pályák lekérdezése sikertelen."
    );
  }

  async function adminPalyaTorlesKeres(adminId, palyaId, torlesIndok) {
    await jsonKeres(
      API_ALAP + "/api/palyak/admin/" + palyaId + "?admin_id=" + adminId,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ torles_indok: torlesIndok })
      },
      {},
      "Pálya törlése sikertelen."
    );
  }

  async function adminPalyaFelfuggesztesKeres(adminId, palyaId, felfuggesztve, indok) {
    await jsonKeres(
      API_ALAP + "/api/palyak/admin/" + palyaId + "/suspension",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: adminId,
          felfuggesztve: felfuggesztve,
          indok: indok || ""
        })
      },
      {},
      "Pálya felfüggesztés frissítése sikertelen."
    );
  }

  async function torlesAkcio(adminId, palyaId) {
    var megerosites = await torlesMegerositese();
    if (!megerosites.isConfirmed) return false;

    var indokValasz = await torlesIndokBekeres();
    if (!indokValasz.isConfirmed) return false;

    await adminPalyaTorlesKeres(adminId, palyaId, String(indokValasz.value || "").trim());
    await sikerMutatas("A pálya törlése sikeres.");
    return true;
  }

  async function felfuggesztesAkcio(adminId, palyaId, felfuggesztesLegyen) {
    var indokValasz = await felfuggesztesIndokBekeres(felfuggesztesLegyen);
    if (!indokValasz.isConfirmed) return false;

    await adminPalyaFelfuggesztesKeres(adminId, palyaId, felfuggesztesLegyen, String(indokValasz.value || "").trim());
    await sikerMutatas(felfuggesztesLegyen ? "A pálya felfüggesztése sikeres." : "A pálya felfüggesztésének feloldása sikeres.");
    return true;
  }

  function felfuggesztesJelveny(felfuggesztve) {
    return felfuggesztve
      ? '<span class="badge text-bg-danger">Felfüggesztve</span>'
      : '<span class="badge text-bg-success">Aktív</span>';
  }

  function felfuggesztesGomb(felfuggesztve, palyaId) {
    if (felfuggesztve) {
      return '<button class="btn btn-outline-success btn-sm" data-action="unsuspend" data-id="' + palyaId + '">Felfüggesztés feloldása</button>';
    }
    return '<button class="btn btn-outline-warning btn-sm" data-action="suspend" data-id="' + palyaId + '">Felfüggesztés</button>';
  }

  function palyakRender(listaElemek) {
    if (!listaElemek.length) {
      listaKontener.innerHTML = '<div class="alert alert-light border mb-0">Nincs találat.</div>';
      return;
    }

    listaKontener.innerHTML = listaElemek.map(function (palya) {
      var felfuggesztve = Boolean(palya.felfuggesztve);
      var indok = palya.felfuggesztes_indok ? ('<p class="mb-1 text-muted"><strong>Indok:</strong> ' + htmlBiztonsagos(palya.felfuggesztes_indok) + '</p>') : '';
      return (
        '<div class="card shadow-sm border-0 mb-3">' +
          '<div class="card-body">' +
            '<div class="d-flex justify-content-between align-items-start gap-3 mb-2">' +
              '<div class="fw-semibold">' + htmlBiztonsagos(palya.nev || "-") + ' (ID: ' + Number(palya.palya_id) + ')</div>' +
              '<div class="d-flex gap-2">' +
                felfuggesztesGomb(felfuggesztve, Number(palya.palya_id)) +
                '<button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="' + Number(palya.palya_id) + '">Törlés</button>' +
              '</div>' +
            '</div>' +
            '<p class="mb-1"><strong>Tulaj:</strong> ' + htmlBiztonsagos(palya.username || "-") + ' (' + htmlBiztonsagos(palya.teljes_nev || "-") + ')</p>' +
            '<p class="mb-1"><strong>Helyszín:</strong> ' + htmlBiztonsagos(palya.helyszin || "-") + '</p>' +
            '<p class="mb-1"><strong>Sportág:</strong> ' + htmlBiztonsagos(palya.sportag || "-") + '</p>' +
            '<p class="mb-1"><strong>Státusz:</strong> ' + felfuggesztesJelveny(felfuggesztve) + '</p>' +
            indok +
            '<p class="mb-0"><strong>Létrehozva:</strong> ' + datumFormaz(palya.letrehozva) + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  var felhasznalo = felhasznaloOlvasasa();
  if (!felhasznalo) {
    window.location.href = "../../fooldal/login.html";
    return;
  }
  var bejelentkezettFelhasznaloId = felhasznaloAzonosito(felhasznalo);
  if (!bejelentkezettFelhasznaloId || String(felhasznalo.szerep || "").toLowerCase() !== "admin") {
    window.location.href = "../profil.html";
    return;
  }

  oldalsavBekotes(felhasznalo);

  async function frissit() {
    try {
      var palyaAzonosito = parseInt(palyaIdMezo.value, 10);
      var felhasznalonev = String(felhasznalonevMezo.value || "").trim();
      var palyak = await adminPalyakBetoltese(bejelentkezettFelhasznaloId, Number.isNaN(palyaAzonosito) ? null : palyaAzonosito, felhasznalonev);
      palyakRender(palyak);
    } catch (error) {
      console.error(error);
      listaKontener.innerHTML = '<div class="alert alert-danger mb-0">Hiba a pályák betöltése közben.</div>';
    }
  }

  keresesGomb.addEventListener("click", function () { frissit(); });

  alaphelyzetGomb.addEventListener("click", function () {
    palyaIdMezo.value = "";
    felhasznalonevMezo.value = "";
    frissit();
  });

  listaKontener.addEventListener("click", async function (event) {
    var gomb = event.target.closest("button[data-action]");
    if (!gomb) return;

    var muvelet = gomb.getAttribute("data-action");
    var palyaAzonosito = Number(gomb.getAttribute("data-id"));
    if (!palyaAzonosito) return;

    gomb.disabled = true;
    try {
      var kellFrissiteni = false;

      if (muvelet === "delete") {
        kellFrissiteni = await torlesAkcio(bejelentkezettFelhasznaloId, palyaAzonosito);
      }

      if (muvelet === "suspend" || muvelet === "unsuspend") {
        var felfuggesztesLegyen = muvelet === "suspend";
        kellFrissiteni = await felfuggesztesAkcio(bejelentkezettFelhasznaloId, palyaAzonosito, felfuggesztesLegyen);
      }

      if (kellFrissiteni) {
        await frissit();
      } else {
        gomb.disabled = false;
      }
    } catch (error) {
      console.error(error);
      hibaMutatas(error.message || "A művelet sikertelen.");
      gomb.disabled = false;
    }
  });

  frissit();
})();
