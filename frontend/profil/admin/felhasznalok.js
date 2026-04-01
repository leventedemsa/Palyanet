(function () {
  "use strict";

  var API_ALAP = "http://localhost:4000";
  var userIdMezo = document.getElementById("adminUserId");
  var usernameMezo = document.getElementById("adminUserUsername");
  var keresesGomb = document.getElementById("adminUserSearchBtn");
  var resetGomb = document.getElementById("adminUserResetBtn");
  var listaKontener = document.getElementById("adminUsersList");

  if (!userIdMezo || !usernameMezo || !keresesGomb || !resetGomb || !listaKontener) return;

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

  function megerosites(cim, szoveg) {
    return Swal.fire({
      icon: "warning",
      title: cim,
      text: szoveg,
      showCancelButton: true,
      confirmButtonText: "Igen",
      cancelButtonText: "Mégsem"
    });
  }

  function sikerUzenet(szoveg) {
    return Swal.fire({ icon: "success", title: "Sikeres művelet", text: szoveg, confirmButtonText: "Rendben" });
  }

  function hibaUzenet(szoveg) {
    return Swal.fire({ icon: "error", title: "Hiba", text: szoveg, confirmButtonText: "Rendben" });
  }

  async function adminFelhasznalokBetoltese(adminId, userId, username) {
    var params = new URLSearchParams();
    params.set("admin_id", String(adminId));
    if (userId) params.set("user_id", String(userId));
    if (username) params.set("username", username);

    return jsonKeres(
      API_ALAP + "/api/users/admin/list?" + params.toString(),
      null,
      [],
      "Felhasználók lekérdezése sikertelen."
    );
  }

  async function adminFelhasznaloTiltasFrissites(adminId, userId, tiltva) {
    await jsonKeres(
      API_ALAP + "/api/users/admin/" + userId + "/ban",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: adminId,
          tiltva: tiltva
        })
      },
      {},
      "Felhasználó tiltás frissítése sikertelen."
    );
  }

  function tiltottJelveny(tiltva) {
    return tiltva
      ? '<span class="badge text-bg-danger">Tiltva</span>'
      : '<span class="badge text-bg-success">Aktív</span>';
  }

  function tiltasiGomb(tiltva, userId) {
    if (tiltva) {
      return '<button class="btn btn-outline-success btn-sm" data-action="unban" data-id="' + userId + '">Tiltás feloldása</button>';
    }
    return '<button class="btn btn-outline-warning btn-sm" data-action="ban" data-id="' + userId + '">Tiltás</button>';
  }

  function usersRender(lista) {
    if (!lista.length) {
      listaKontener.innerHTML = '<div class="alert alert-light border mb-0">Nincs találat.</div>';
      return;
    }

    listaKontener.innerHTML = lista.map(function (user) {
      var tiltva = Boolean(user.tiltva);
      var userId = Number(user.felhasznalo_id);

      return (
        '<div class="card shadow-sm border-0 mb-3">' +
          '<div class="card-body">' +
            '<div class="d-flex justify-content-between align-items-start gap-3 mb-2">' +
              '<div class="fw-semibold">' + htmlBiztonsagos(user.username || "-") + ' (ID: ' + userId + ')</div>' +
              '<div>' + tiltasiGomb(tiltva, userId) + "</div>" +
            "</div>" +
            '<p class="mb-1"><strong>Név:</strong> ' + htmlBiztonsagos(user.teljes_nev || "-") + "</p>" +
            '<p class="mb-1"><strong>Email:</strong> ' + htmlBiztonsagos(user.email || "-") + "</p>" +
            '<p class="mb-1"><strong>Szerep:</strong> ' + htmlBiztonsagos(user.szerep || "-") + "</p>" +
            '<p class="mb-1"><strong>Státusz:</strong> ' + tiltottJelveny(tiltva) + "</p>" +
            '<p class="mb-1"><strong>Létrehozva:</strong> ' + datumFormaz(user.letrehozva) + "</p>" +
            '<p class="mb-0"><strong>Utolsó belépés:</strong> ' + datumFormaz(user.utoljara_belepett) + "</p>" +
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
      var userId = parseInt(userIdMezo.value, 10);
      var username = String(usernameMezo.value || "").trim();
      var users = await adminFelhasznalokBetoltese(adminId, Number.isNaN(userId) ? null : userId, username);
      usersRender(users);
    } catch (error) {
      console.error(error);
      listaKontener.innerHTML = '<div class="alert alert-danger mb-0">Hiba a felhasználók betöltése közben.</div>';
    }
  }

  keresesGomb.addEventListener("click", function () { frissit(); });

  resetGomb.addEventListener("click", function () {
    userIdMezo.value = "";
    usernameMezo.value = "";
    frissit();
  });

  listaKontener.addEventListener("click", async function (event) {
    var gomb = event.target.closest("button[data-action]");
    if (!gomb) return;

    var muvelet = gomb.getAttribute("data-action");
    var userId = Number(gomb.getAttribute("data-id"));
    if (!userId) return;

    var tiltvaLegyen = muvelet === "ban";
    var megerositesValasz = await megerosites(
      tiltvaLegyen ? "Felhasználó tiltása" : "Tiltás feloldása",
      tiltvaLegyen ? "Biztosan letiltod ezt a felhasználót?" : "Biztosan feloldod a tiltást ennél a felhasználónál?"
    );
    if (!megerositesValasz.isConfirmed) return;

    gomb.disabled = true;
    try {
      await adminFelhasznaloTiltasFrissites(adminId, userId, tiltvaLegyen);
      await frissit();
      await sikerUzenet(tiltvaLegyen ? "A felhasználó tiltása sikeres." : "A tiltás feloldása sikeres.");
    } catch (error) {
      console.error(error);
      await hibaUzenet(error.message || "A művelet sikertelen.");
      gomb.disabled = false;
    }
  });

  frissit();
})();
