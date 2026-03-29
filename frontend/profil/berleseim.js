(function () {
  "use strict";

  var API_BASE = "http://localhost:4000";
  var currentContainer = document.getElementById("currentRentalsContainer");
  var pastContainer = document.getElementById("pastRentalsContainer");
  var currentCount = document.getElementById("currentRentalsCount");
  var pastCount = document.getElementById("pastRentalsCount");
  var rentalImagesModalEl = document.getElementById("rentalImagesModal");
  var rentalImagesMain = document.getElementById("rentalImagesMain");
  var rentalImagesThumbs = document.getElementById("rentalImagesThumbs");
  var rentalImagesModal = rentalImagesModalEl ? bootstrap.Modal.getOrCreateInstance(rentalImagesModalEl) : null;
  var rentalImagesById = {};

  if (!currentContainer || !pastContainer || !currentCount || !pastCount) return;

  function readUser() {
    var raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function getUserId(user) {
    return user && (user.felhasznalo_id || user.id || user.userId);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "../login.html";
  }

  function absoluteImageUrl(url) {
    if (!url) return "https://github.com/mdo.png";
    return url.startsWith("http") ? url : API_BASE + url;
  }

  function parseImageUrls(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    var raw = String(value).trim();
    if (!raw) return [];
    if (raw[0] === "[") {
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean);
        }
      } catch (_) {}
    }
    return [raw];
  }

  function initSidebarNotifications(user) {
    var sidebar = document.querySelector(".profile-sidebar");
    if (!sidebar) return;
    if (document.getElementById("sidebarNotificationsBox")) return;
    var userId = getUserId(user);
    if (!userId) return;

    var box = document.createElement("div");
    box.id = "sidebarNotificationsBox";
    box.className = "mt-3";
    box.innerHTML =
      '<button id="sidebarNotifToggle" class="btn btn-outline-light btn-sm w-100" type="button">Értesítés <span id="sidebarNotifBadge" class="badge bg-danger ms-1" style="display:none;">0</span></button>' +
      '<div id="sidebarNotifDropdown" class="mt-2 p-2 bg-white text-dark rounded shadow-sm" style="display:none;max-height:260px;overflow:auto;">' +
      '<div class="small text-muted">Nincsenek értesítések</div>' +
      "</div>";
    sidebar.appendChild(box);

    var toggle = document.getElementById("sidebarNotifToggle");
    var badge = document.getElementById("sidebarNotifBadge");
    var dropdown = document.getElementById("sidebarNotifDropdown");

    toggle.addEventListener("click", function () {
      dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    });

    async function refreshNotifications() {
      try {
        var res = await fetch(API_BASE + "/api/notifications/" + userId);
        if (!res.ok) return;
        var items = await res.json();
        var unread = items.filter(function (n) { return !n.olvasott; }).length;
        if (unread > 0) {
          badge.style.display = "inline-block";
          badge.textContent = String(unread);
        } else {
          badge.style.display = "none";
        }
        if (!items.length) {
          dropdown.innerHTML = '<div class="small text-muted">Nincsenek értesítések</div>';
          return;
        }
        dropdown.innerHTML = items.slice(0, 15).map(function (n) {
          return '<div class="small border-bottom pb-2 mb-2">' +
            '<div style="font-weight:600;">' + (n.olvasott ? "Értesítés" : "Új értesítés") + "</div>" +
            '<div>' + (n.uzenet || "") + "</div>" +
            '<div class="text-muted">' + new Date(n.letrehozva).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) + "</div>" +
            "</div>";
        }).join("");
      } catch (_) {}
    }

    refreshNotifications();
    setInterval(refreshNotifications, 5000);
  }

  function wireSidebar(user) {
    var names = document.querySelectorAll(".sidebar-user-name");
    var avatars = document.querySelectorAll(".sidebar-user-avatar");
    var displayName = user.teljes_nev || user.username || "Felhasználó";
    names.forEach(function (el) { el.textContent = displayName; });
    avatars.forEach(function (el) { el.src = absoluteImageUrl(user.profil_kep_url); });

    var logoutBtns = document.querySelectorAll(".sidebar-logout-btn");
    logoutBtns.forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.preventDefault(); logout(); });
    });

    var palyaimItems = document.querySelectorAll('[data-sidebar-item="palyaim"]');
    var foglalasaimItems = document.querySelectorAll('[data-sidebar-item="foglalasaim"]');
    var isOwner = user.szerep === "palyatulajdonos";
    palyaimItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
    foglalasaimItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
  }

  function statusText(status) {
    if (status === "pending") return "Függőben";
    if (status === "accepted") return "Elfogadva";
    return "Elutasítva";
  }

  function statusBadgeClass(status) {
    if (status === "pending") return "text-bg-warning";
    if (status === "accepted") return "text-bg-success";
    return "text-bg-danger";
  }

  function formatPrice(value) {
    return Number(value || 0).toLocaleString("hu-HU") + " Ft";
  }

  function formatDateTime(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("hu-HU") + " " + d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function endDateTime(booking) {
    return new Date(booking.vege);
  }

  function isCurrentBooking(booking) {
    if (booking.statusz === "rejected") return false;
    return endDateTime(booking) >= new Date();
  }

  function renderCard(booking) {
    var imageUrls = parseImageUrls(booking.kep_url);
    var imagesButton = imageUrls.length
      ? '<button class="btn btn-outline-primary btn-sm" type="button" data-action="images" data-id="' + booking.foglalas_id + '">Képek megtekintése</button>'
      : "";
    return (
      '<div class="col-12 col-md-6">' +
      '<div class="card shadow-sm h-100"><div class="card-body">' +
      '<h3 class="h6 mb-1">' + booking.palya_nev + "</h3>" +
      '<p class="text-muted mb-2">' + booking.sportag + " - " + booking.helyszin + "</p>" +
      '<p class="mb-1"><strong>Ár:</strong> ' + formatPrice(booking.ar) + "</p>" +
      '<p class="mb-1"><strong>Kezdés:</strong> ' + formatDateTime(booking.kezdes) + "</p>" +
      '<p class="mb-2"><strong>Vége:</strong> ' + formatDateTime(booking.vege) + "</p>" +
      '<p class="mb-0"><span class="badge ' + statusBadgeClass(booking.statusz) + '">' + statusText(booking.statusz) + "</span></p>" +
      '<div class="mt-3">' + imagesButton + '</div>' +
      "</div></div>" +
      "</div>"
    );
  }

  function openImagesModal(foglalasId) {
    if (!rentalImagesModal || !rentalImagesMain || !rentalImagesThumbs) return;
    var urls = rentalImagesById[foglalasId] || [];
    if (!urls.length) return;

    var absoluteUrls = urls.map(function (url) { return absoluteImageUrl(url); });
    rentalImagesMain.src = absoluteUrls[0];
    rentalImagesThumbs.innerHTML = absoluteUrls.map(function (url, index) {
      return '<img src="' + url + '" alt="Pályakép ' + (index + 1) + '" class="booking-image-thumb" data-action="thumb" data-src="' + url + '">';
    }).join("");
    rentalImagesModal.show();
  }

  function renderList(container, list) {
    if (!list.length) {
      container.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Nincs megjeleníthető foglalás.</div></div>';
      return;
    }
    container.innerHTML = list.map(function (booking) { return renderCard(booking); }).join("");
  }

  function render(rentals) {
    rentalImagesById = {};
    rentals.forEach(function (booking) {
      rentalImagesById[booking.foglalas_id] = parseImageUrls(booking.kep_url);
    });

    var current = rentals
      .filter(function (b) { return isCurrentBooking(b); })
      .sort(function (a, b) { return new Date(a.kezdes) - new Date(b.kezdes); });

    var past = rentals
      .filter(function (b) { return !isCurrentBooking(b); })
      .sort(function (a, b) { return new Date(b.kezdes) - new Date(a.kezdes); });

    currentCount.textContent = String(current.length);
    pastCount.textContent = String(past.length);
    renderList(currentContainer, current);
    renderList(pastContainer, past);
  }

  [currentContainer, pastContainer].forEach(function (container) {
    container.addEventListener("click", function (event) {
      var button = event.target.closest('button[data-action="images"]');
      if (!button) return;
      var id = Number(button.getAttribute("data-id"));
      if (!id) return;
      openImagesModal(id);
    });
  });

  if (rentalImagesThumbs) {
    rentalImagesThumbs.addEventListener("click", function (event) {
      var thumb = event.target.closest('img[data-action="thumb"]');
      if (!thumb || !rentalImagesMain) return;
      var src = thumb.getAttribute("data-src") || "";
      if (!src) return;
      rentalImagesMain.src = src;
    });
  }

  async function loadRentals(userId) {
    var response = await fetch(API_BASE + "/api/bookings/renter/" + userId);
    if (!response.ok) throw new Error("Bérlések lekérése sikertelen");
    var rentals = await response.json();
    render(rentals);
  }

  var user = readUser();
  if (!user) {
    window.location.href = "../login.html";
    return;
  }
  if (user.szerep !== "berlo" && user.szerep !== "palyatulajdonos") {
    window.location.href = "../login.html";
    return;
  }

  wireSidebar(user);
  loadRentals(getUserId(user)).catch(function (err) {
    console.error(err);
    currentContainer.innerHTML = '<div class="col-12"><div class="alert alert-danger mb-0">Hiba a bérlések betőltésekor.</div></div>';
    pastContainer.innerHTML = "";
  });
})();
