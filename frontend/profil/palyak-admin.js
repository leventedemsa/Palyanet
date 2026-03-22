(function () {
  "use strict";

  var API_BASE = "http://localhost:4000";
  var palyaIdInput = document.getElementById("adminPalyaId");
  var usernameInput = document.getElementById("adminUsername");
  var keresesBtn = document.getElementById("adminPalyaKeresesBtn");
  var resetBtn = document.getElementById("adminPalyaResetBtn");
  var lista = document.getElementById("adminPalyakLista");

  if (!palyaIdInput || !usernameInput || !keresesBtn || !resetBtn || !lista) return;

  function felhasznalo() {
    var raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function felhasznaloId(user) {
    return user && (user.felhasznalo_id || user.id || user.userId);
  }

  function absoluteImageUrl(url) {
    if (!url) return "https://github.com/mdo.png";
    return url.startsWith("http") ? url : API_BASE + url;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "../login.html";
  }

  function htmlEscape(szoveg) {
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

  function oldalsav(user) {
    var adminItems = document.querySelectorAll('[data-sidebar-item="bejelentesek"], [data-sidebar-item="admin-palyak"], [data-sidebar-item="ertesitesek"]');
    adminItems.forEach(function (item) { item.style.display = ""; });

    var nev = user.teljes_nev || user.username || "Felhasználó";
    document.querySelectorAll(".sidebar-user-name").forEach(function (el) { el.textContent = nev; });
    document.querySelectorAll(".sidebar-user-avatar").forEach(function (el) { el.src = absoluteImageUrl(user.profil_kep_url); });
    document.querySelectorAll(".sidebar-logout-btn").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        logout();
      });
    });
  }

  async function adminPalyakLekerese(adminId, palyaId, username) {
    var params = new URLSearchParams();
    params.set("admin_id", String(adminId));
    if (palyaId) params.set("palya_id", String(palyaId));
    if (username) params.set("username", username);

    var response = await fetch(API_BASE + "/api/palyak/admin/list?" + params.toString());
    var data = await response.json().catch(function () { return []; });
    if (!response.ok) {
      throw new Error(data.error || "Pályák lekérdezése sikertelen.");
    }
    return data;
  }

  async function adminPalyaTorles(adminId, palyaId, torlesIndok) {
    var response = await fetch(API_BASE + "/api/palyak/admin/" + palyaId + "?admin_id=" + adminId, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ torles_indok: torlesIndok })
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      throw new Error(data.error || "Pálya törlése sikertelen.");
    }
  }

  function renderPalyak(listaElemek) {
    if (!listaElemek.length) {
      lista.innerHTML = '<div class="alert alert-light border mb-0">Nincs találat.</div>';
      return;
    }

    lista.innerHTML = listaElemek.map(function (p) {
      return (
        '<div class="card shadow-sm border-0 mb-3" data-palya-id="' + Number(p.palya_id) + '">' +
          '<div class="card-body">' +
            '<div class="d-flex justify-content-between align-items-start gap-3 mb-2">' +
              '<div class="fw-semibold">' + htmlEscape(p.nev || "-") + ' (ID: ' + Number(p.palya_id) + ')</div>' +
              '<button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="' + Number(p.palya_id) + '">Törlés</button>' +
            '</div>' +
            '<p class="mb-1"><strong>Tulaj:</strong> ' + htmlEscape(p.username || "-") + ' (' + htmlEscape(p.teljes_nev || "-") + ')</p>' +
            '<p class="mb-1"><strong>Helyszín:</strong> ' + htmlEscape(p.helyszin || "-") + '</p>' +
            '<p class="mb-1"><strong>Sportág:</strong> ' + htmlEscape(p.sportag || "-") + '</p>' +
            '<p class="mb-0"><strong>Létrehozva:</strong> ' + datumFormaz(p.letrehozva) + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  var user = felhasznalo();
  if (!user) {
    window.location.href = "../login.html";
    return;
  }
  var userId = felhasznaloId(user);
  if (!userId || String(user.szerep || "").toLowerCase() !== "admin") {
    window.location.href = "./profil.html";
    return;
  }

  oldalsav(user);

  async function frissit() {
    try {
      var palyaId = parseInt(palyaIdInput.value, 10);
      var username = String(usernameInput.value || "").trim();
      var elemek = await adminPalyakLekerese(userId, Number.isNaN(palyaId) ? null : palyaId, username);
      renderPalyak(elemek);
    } catch (error) {
      console.error(error);
      lista.innerHTML = '<div class="alert alert-danger mb-0">Hiba a pályák betöltésekor.</div>';
    }
  }

  keresesBtn.addEventListener("click", function () {
    frissit();
  });

  resetBtn.addEventListener("click", function () {
    palyaIdInput.value = "";
    usernameInput.value = "";
    frissit();
  });

  lista.addEventListener("click", async function (event) {
    var gomb = event.target.closest("button[data-action='delete']");
    if (!gomb) return;
    var palyaId = Number(gomb.getAttribute("data-id"));
    if (!palyaId) return;

    if (!confirm("Biztosan törölni szeretnéd ezt a pályát?")) return;

    var torlesIndok = prompt("Add meg a törlés indokát:");
    if (!torlesIndok || !String(torlesIndok).trim()) {
      alert("A törlés indoka kötelező.");
      return;
    }

    gomb.disabled = true;
    try {
      await adminPalyaTorles(userId, palyaId, String(torlesIndok).trim());
      await frissit();
    } catch (error) {
      console.error(error);
      alert(error.message || "Nem sikerült törölni a pályát.");
      gomb.disabled = false;
    }
  });

  frissit();
})();
