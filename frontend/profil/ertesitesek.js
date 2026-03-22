(function () {
  "use strict";

  var API_BASE = "http://localhost:4000";
  var listContainer = document.getElementById("notificationsList");
  var countBadge = document.getElementById("notificationsCount");
  var clearAllButton = document.getElementById("clearAllNotificationsBtn");

  if (!listContainer || !countBadge || !clearAllButton) return;

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
    var palyaimItems = document.querySelectorAll('[data-sidebar-item="palyaim"]');
    var foglalasaimItems = document.querySelectorAll('[data-sidebar-item="foglalasaim"]');
    var berleseimItems = document.querySelectorAll('[data-sidebar-item="berleseim"]');
    var isOwner = user.szerep === "palyatulajdonos";

    palyaimItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
    foglalasaimItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
    berleseimItems.forEach(function (item) { item.style.display = ""; });

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

  function formatTime(value) {
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

  function renderNotifications(items) {
    countBadge.textContent = String(items.length);
    clearAllButton.disabled = items.length === 0;

    if (!items.length) {
      listContainer.innerHTML = '<div class="alert alert-light border mb-0">Nincs értesítés.</div>';
      return;
    }

    listContainer.innerHTML = items.map(function (item) {
      var unreadBadge = item.olvasott
        ? '<span class="badge text-bg-secondary">Olvasott</span>'
        : '<span class="badge text-bg-primary">Új</span>';
      return (
        '<div class="card shadow-sm border-0 mb-3" data-id="' + Number(item.ertesites_id) + '">' +
          '<div class="card-body">' +
            '<div class="d-flex justify-content-between align-items-start gap-3 mb-2">' +
              '<div class="fw-semibold">Értesítés</div>' +
              unreadBadge +
            '</div>' +
            '<p class="mb-2">' + escapeHtml(item.uzenet || "") + '</p>' +
            '<div class="d-flex justify-content-between align-items-center gap-3">' +
              '<small class="text-muted">' + formatTime(item.letrehozva) + '</small>' +
              '<button type="button" class="btn btn-outline-danger btn-sm" data-action="delete" data-id="' + Number(item.ertesites_id) + '">Törlés</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  async function loadNotifications(userId) {
    var response = await fetch(API_BASE + "/api/notifications/" + userId);
    if (!response.ok) throw new Error("Értesítések lekérése sikertelen");
    return response.json();
  }

  async function deleteNotification(userId, notificationId) {
    var response = await fetch(API_BASE + "/api/notifications/" + userId + "/" + notificationId, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Értesítés törlése sikertelen");
  }

  async function clearAllNotifications(userId) {
    var response = await fetch(API_BASE + "/api/notifications/" + userId, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Értesítések törlése sikertelen");
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

  wireSidebar(user);

  async function refresh() {
    try {
      var items = await loadNotifications(userId);
      renderNotifications(items);
    } catch (error) {
      console.error(error);
      listContainer.innerHTML = '<div class="alert alert-danger mb-0">Hiba az értesítések betöltésekor.</div>';
      countBadge.textContent = "0";
      clearAllButton.disabled = true;
    }
  }

  listContainer.addEventListener("click", async function (event) {
    var button = event.target.closest("button[data-action='delete']");
    if (!button) return;
    var id = Number(button.getAttribute("data-id"));
    if (!id) return;

    button.disabled = true;
    try {
      await deleteNotification(userId, id);
      await refresh();
    } catch (error) {
      console.error(error);
      alert("Nem sikerült törölni az értesítést.");
      button.disabled = false;
    }
  });

  clearAllButton.addEventListener("click", async function () {
    if (!confirm("Biztosan törölni szeretnéd az összes értesítést?")) return;
    clearAllButton.disabled = true;
    try {
      await clearAllNotifications(userId);
      await refresh();
    } catch (error) {
      console.error(error);
      alert("Nem sikerült törölni az értesítéseket.");
      clearAllButton.disabled = false;
    }
  });

  refresh();
})();

