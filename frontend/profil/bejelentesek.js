(function () {
  "use strict";

  var API_BASE = "http://localhost:4000";
  var reportsList = document.getElementById("reportsList");
  var refreshReportsBtn = document.getElementById("refreshReportsBtn");

  if (!reportsList || !refreshReportsBtn) return;

  function readUser() {
    var raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function getUserId(user) {
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function wireSidebar(user) {
    var adminItems = document.querySelectorAll('[data-sidebar-item="bejelentesek"], [data-sidebar-item="admin-palyak"], [data-sidebar-item="ertesitesek"]');
    adminItems.forEach(function (item) { item.style.display = ""; });

    var names = document.querySelectorAll(".sidebar-user-name");
    var avatars = document.querySelectorAll(".sidebar-user-avatar");
    var displayName = user.teljes_nev || user.username || "Felhasználó";
    names.forEach(function (el) { el.textContent = displayName; });
    avatars.forEach(function (el) { el.src = absoluteImageUrl(user.profil_kep_url); });

    var logoutBtns = document.querySelectorAll(".sidebar-logout-btn");
    logoutBtns.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        logout();
      });
    });
  }

  function formatDate(value) {
    if (!value) return "-";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function statusBadge(statusz) {
    var s = String(statusz || "").toLowerCase();
    if (s === "vegrehajtva") return '<span class="badge text-bg-success">Végrehajtva</span>';
    if (s === "elutasitva") return '<span class="badge text-bg-secondary">Elutasítva</span>';
    return '<span class="badge text-bg-warning">Függőben</span>';
  }

  function renderReports(items) {
    if (!items.length) {
      reportsList.innerHTML = '<div class="alert alert-light border mb-0">Nincs bejelentés.</div>';
      return;
    }

    reportsList.innerHTML = items.map(function (item) {
      var isPending = String(item.statusz || "").toLowerCase() === "pending";
      return (
        '<div class="card shadow-sm border-0 mb-3" data-id="' + Number(item.bejelentes_id) + '">' +
          '<div class="card-body">' +
            '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">' +
              '<div class="fw-semibold">Bejelentés #' + Number(item.bejelentes_id) + '</div>' +
              statusBadge(item.statusz) +
            '</div>' +
            '<p class="mb-1"><strong>Pálya:</strong> ' + escapeHtml(item.palya_nev || ("ID " + item.palya_id)) + ' (ID: ' + Number(item.palya_id) + ')</p>' +
            '<p class="mb-1"><strong>Küldő:</strong> ' + escapeHtml(item.kuldo_username || item.kuldo_felhasznalo_id) + '</p>' +
            '<p class="mb-1"><strong>Bejelentett:</strong> ' + escapeHtml(item.bejelentett_username || item.bejelentett_felhasznalo_id) + '</p>' +
            '<p class="mb-2"><strong>Szöveg:</strong> ' + escapeHtml(item.szoveg || "") + '</p>' +
            '<div class="small text-muted mb-3">Létrehozva: ' + formatDate(item.letrehozva) + '</div>' +
            (isPending
              ? (
                  '<div class="d-flex flex-wrap gap-2">' +
                    '<button class="btn btn-outline-secondary btn-sm" data-action="reject" data-id="' + Number(item.bejelentes_id) + '">Elutasít</button>' +
                    '<button class="btn btn-success btn-sm" data-action="execute" data-id="' + Number(item.bejelentes_id) + '">Végrehajtva</button>' +
                  '</div>'
                )
              : (
                  '<div class="small text-muted">Elbírálva: ' + formatDate(item.eldontve) + '</div>'
                )) +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  async function loadReports(adminId) {
    var response = await fetch(API_BASE + "/api/reports?admin_id=" + adminId);
    var data = await response.json().catch(function () { return []; });
    if (!response.ok) {
      throw new Error(data.message || "Bejelentések lekérése sikertelen");
    }
    return data;
  }

  async function updateReportStatus(reportId, adminId, statusz) {
    var response = await fetch(API_BASE + "/api/reports/" + reportId + "/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_id: adminId,
        statusz: statusz
      })
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      throw new Error(data.message || "Bejelentés frissítése sikertelen");
    }
  }

  var user = readUser();
  if (!user) {
    window.location.href = "../login.html";
    return;
  }
  var userId = getUserId(user);
  if (!userId) {
    window.location.href = "../login.html";
    return;
  }
  if (String(user.szerep || "").toLowerCase() !== "admin") {
    window.location.href = "./profil.html";
    return;
  }

  wireSidebar(user);

  async function refresh() {
    try {
      var items = await loadReports(userId);
      renderReports(items);
    } catch (error) {
      console.error(error);
      reportsList.innerHTML = '<div class="alert alert-danger mb-0">Hiba a bejelentések betöltésekor.</div>';
    }
  }

  reportsList.addEventListener("click", async function (event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;
    var action = button.getAttribute("data-action");
    var reportId = Number(button.getAttribute("data-id"));
    if (!reportId) return;

    button.disabled = true;
    try {
      if (action === "reject") {
        await updateReportStatus(reportId, userId, "elutasitva");
      } else if (action === "execute") {
        await updateReportStatus(reportId, userId, "vegrehajtva");
      }
      await refresh();
    } catch (error) {
      console.error(error);
      alert(error.message || "Nem sikerült frissíteni a bejelentést.");
      button.disabled = false;
    }
  });

  refreshReportsBtn.addEventListener("click", function () {
    refresh();
  });

  refresh();
})();
