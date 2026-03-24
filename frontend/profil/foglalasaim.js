(function () {
  "use strict";

  var API_BASE = "http://localhost:4000";
  var pendingContainer = document.getElementById("pendingBookingsContainer");
  var acceptedContainer = document.getElementById("acceptedBookingsContainer");
  var rejectedContainer = document.getElementById("rejectedBookingsContainer");
  var pendingBadge = document.getElementById("pendingBadge");
  var acceptedBadge = document.getElementById("acceptedBadge");
  var rejectedBadge = document.getElementById("rejectedBadge");
  var calendarGrid = document.getElementById("calendarGrid");
  var calendarMonthLabel = document.getElementById("calendarMonthLabel");
  var calendarPrevMonth = document.getElementById("calendarPrevMonth");
  var calendarNextMonth = document.getElementById("calendarNextMonth");
  var bookingImagesModalEl = document.getElementById("bookingImagesModal");
  var bookingImagesMain = document.getElementById("bookingImagesMain");
  var bookingImagesThumbs = document.getElementById("bookingImagesThumbs");
  var bookingImagesModal = bookingImagesModalEl ? bootstrap.Modal.getOrCreateInstance(bookingImagesModalEl) : null;
  var bookingImagesById = {};

  if (!pendingContainer || !acceptedContainer || !rejectedContainer || !calendarGrid) return;

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
      '<button id="sidebarNotifToggle" class="btn btn-outline-light btn-sm w-100" type="button">Ertesites <span id="sidebarNotifBadge" class="badge bg-danger ms-1" style="display:none;">0</span></button>' +
      '<div id="sidebarNotifDropdown" class="mt-2 p-2 bg-white text-dark rounded shadow-sm" style="display:none;max-height:260px;overflow:auto;">' +
      '<div class="small text-muted">Nincsenek ertesitesek</div>' +
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
          dropdown.innerHTML = '<div class="small text-muted">Nincsenek ertesitesek</div>';
          return;
        }
        dropdown.innerHTML = items.slice(0, 15).map(function (n) {
          return '<div class="small border-bottom pb-2 mb-2">' +
            '<div style="font-weight:600;">' + (n.olvasott ? "Ertesites" : "Uj ertesites") + "</div>" +
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
    var displayName = user.teljes_nev || user.username || "Felhasznalo";
    names.forEach(function (el) { el.textContent = displayName; });
    avatars.forEach(function (el) { el.src = absoluteImageUrl(user.profil_kep_url); });

    var logoutBtns = document.querySelectorAll(".sidebar-logout-btn");
    logoutBtns.forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.preventDefault(); logout(); });
    });

    var berleseimItems = document.querySelectorAll('[data-sidebar-item="berleseim"]');
    berleseimItems.forEach(function (item) { item.style.display = ""; });
  }

  function statusText(status) {
    if (status === "pending") return "Fuggoben";
    if (status === "accepted") return "Elfogadva";
    return "Elutasitva";
  }

  function statusBadgeClass(status) {
    if (status === "pending") return "text-bg-warning";
    if (status === "accepted") return "text-bg-success";
    return "text-bg-danger";
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("hu-HU");
  }

  function formatTime(iso) {
    var d = new Date(iso);
    return d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function formatPrice(value) {
    return Number(value || 0).toLocaleString("hu-HU") + " Ft";
  }

  function renderBookingCard(booking, withActions) {
    var imageUrls = parseImageUrls(booking.kep_url);
    var imagesButton = imageUrls.length
      ? '<button class="btn btn-outline-primary btn-sm" type="button" data-action="images" data-id="' + booking.foglalas_id + '">Képek megtekintése</button>'
      : "";
    return (
      '<div class="col-12 col-md-6">' +
      '<div class="card shadow-sm h-100"><div class="card-body d-flex flex-column">' +
      '<h3 class="h6 mb-1">' + booking.palya_nev + "</h3>" +
      '<p class="text-muted mb-2">' + booking.sportag + " - " + booking.helyszin + "</p>" +
      '<p class="mb-1"><strong>Foglalo:</strong> ' + (booking.teljes_nev || "-") + ' <span class="text-muted">(@' + (booking.username || "-") + ")</span></p>" +
      '<p class="mb-1"><strong>Idopont:</strong> ' + formatDate(booking.kezdes) + ", " + formatTime(booking.kezdes) + " - " + formatTime(booking.vege) + "</p>" +
      '<p class="mb-1"><strong>Ar:</strong> ' + formatPrice(booking.ar) + "</p>" +
      '<p class="mb-0"><span class="badge ' + statusBadgeClass(booking.statusz) + '">' + statusText(booking.statusz) + "</span></p>" +
      '<div class="d-flex gap-2 mt-3 flex-wrap">' + imagesButton + '</div>' +
      (withActions
        ? '<div class="d-flex gap-2 mt-2">' +
        '<button class="btn btn-success btn-sm" type="button" data-action="accept" data-id="' + booking.foglalas_id + '">Elfogadas</button>' +
        '<button class="btn btn-danger btn-sm" type="button" data-action="reject" data-id="' + booking.foglalas_id + '">Elutasitas</button>' +
        "</div>"
        : "") +
      "</div></div>" +
      "</div>"
    );
  }

  function openImagesModal(foglalasId) {
    if (!bookingImagesModal || !bookingImagesMain || !bookingImagesThumbs) return;
    var urls = bookingImagesById[foglalasId] || [];
    if (!urls.length) return;

    var absoluteUrls = urls.map(function (url) { return absoluteImageUrl(url); });
    bookingImagesMain.src = absoluteUrls[0];
    bookingImagesThumbs.innerHTML = absoluteUrls.map(function (url, index) {
      return '<img src="' + url + '" alt="Palyakep ' + (index + 1) + '" class="booking-image-thumb" data-action="thumb" data-src="' + url + '">';
    }).join("");
    bookingImagesModal.show();
  }

  function renderList(container, list, withActions) {
    if (!list.length) {
      container.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Nincs foglalas ebben a kategoriaban.</div></div>';
      return;
    }
    container.innerHTML = list.map(function (booking) { return renderBookingCard(booking, withActions); }).join("");
  }

  var monthNames = ["Januar", "Februar", "Marcius", "Aprilis", "Majus", "Junius", "Julius", "Augusztus", "Szeptember", "Oktober", "November", "December"];
  var weekDays = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
  var bookings = [];
  var currentDate = new Date();
  var currentYear = currentDate.getFullYear();
  var currentMonth = currentDate.getMonth();

  function isDayBooked(dateText) {
    return bookings.some(function (booking) {
      var day = booking.kezdes ? booking.kezdes.slice(0, 10) : "";
      return day === dateText && (booking.statusz === "pending" || booking.statusz === "accepted");
    });
  }

  function getDayBookingCount(dateText) {
    return bookings.filter(function (booking) {
      var day = booking.kezdes ? booking.kezdes.slice(0, 10) : "";
      return day === dateText && (booking.statusz === "pending" || booking.statusz === "accepted");
    }).length;
  }

  function renderCalendar() {
    calendarMonthLabel.textContent = monthNames[currentMonth] + " " + String(currentYear);
    var firstDay = new Date(currentYear, currentMonth, 1);
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    var startWeekday = (firstDay.getDay() + 6) % 7;
    var html = '<table class="table table-bordered align-middle text-center mb-0"><thead><tr>' +
      weekDays.map(function (name) { return '<th class="small text-muted fw-semibold">' + name + "</th>"; }).join("") +
      "</tr></thead><tbody>";
    var dayCellCount = 0;
    html += "<tr>";
    for (var i = 0; i < startWeekday; i++) {
      html += '<td class="bg-body-tertiary"></td>';
      dayCellCount += 1;
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var monthText = String(currentMonth + 1).padStart(2, "0");
      var dayText = String(day).padStart(2, "0");
      var dateText = String(currentYear) + "-" + monthText + "-" + dayText;
      var booked = isDayBooked(dateText);
      var bookingCount = getDayBookingCount(dateText);
      var cellClass = booked ? "table-warning" : "table-success";
      html += '<td class="' + cellClass + '" title="' + (booked ? "Foglalt" : "Szabad") + ' - ' + String(bookingCount) + ' foglalas">' +
        '<div class="fw-semibold">' + String(day) + "</div>" +
        '<div class="small text-muted">' + String(bookingCount) + " foglalas</div>" +
        "</td>";
      dayCellCount += 1;
      if (dayCellCount % 7 === 0 && day !== daysInMonth) html += "</tr><tr>";
    }
    while (dayCellCount % 7 !== 0) {
      html += '<td class="bg-body-tertiary"></td>';
      dayCellCount += 1;
    }
    html += "</tr></tbody></table>";
    calendarGrid.innerHTML = html;
  }

  function renderAll() {
    bookingImagesById = {};
    bookings.forEach(function (booking) {
      bookingImagesById[booking.foglalas_id] = parseImageUrls(booking.kep_url);
    });

    var pending = bookings.filter(function (b) { return b.statusz === "pending"; });
    var accepted = bookings.filter(function (b) { return b.statusz === "accepted"; });
    var rejected = bookings.filter(function (b) { return b.statusz === "rejected"; });
    pendingBadge.textContent = String(pending.length);
    acceptedBadge.textContent = String(accepted.length);
    rejectedBadge.textContent = String(rejected.length);
    renderList(pendingContainer, pending, true);
    renderList(acceptedContainer, accepted, false);
    renderList(rejectedContainer, rejected, false);
    renderCalendar();
  }

  async function loadBookings(userId) {
    var response = await fetch(API_BASE + "/api/bookings/owner/" + userId);
    if (!response.ok) throw new Error("Foglalasok lekerese sikertelen");
    bookings = await response.json();
    renderAll();
  }

  async function updateBookingStatus(action, foglalasId) {
    var endpoint = action === "accept" ? "/api/bookings/accept" : "/api/bookings/reject";
    var response = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foglalas_id: foglalasId })
    });
    if (!response.ok) throw new Error("Statusz frissites sikertelen");
  }

  pendingContainer.addEventListener("click", async function (event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;
    var action = button.getAttribute("data-action");
    var id = Number(button.getAttribute("data-id"));
    if (!id) return;

    if (action === "images") {
      openImagesModal(id);
      return;
    }

    try {
      await updateBookingStatus(action, id);
      bookings = bookings.map(function (booking) {
        if (booking.foglalas_id !== id) return booking;
        return Object.assign({}, booking, { statusz: action === "accept" ? "accepted" : "rejected" });
      });
      renderAll();
    } catch (error) {
      console.error(error);
      alert("Hiba a foglalas allapotanak frissitesekor.");
    }
  });

  [acceptedContainer, rejectedContainer].forEach(function (container) {
    container.addEventListener("click", function (event) {
      var button = event.target.closest('button[data-action="images"]');
      if (!button) return;
      var id = Number(button.getAttribute("data-id"));
      if (!id) return;
      openImagesModal(id);
    });
  });

  if (bookingImagesThumbs) {
    bookingImagesThumbs.addEventListener("click", function (event) {
      var thumb = event.target.closest('img[data-action="thumb"]');
      if (!thumb || !bookingImagesMain) return;
      var src = thumb.getAttribute("data-src") || "";
      if (!src) return;
      bookingImagesMain.src = src;
    });
  }

  calendarPrevMonth.addEventListener("click", function () {
    currentMonth -= 1;
    if (currentMonth < 0) { currentMonth = 11; currentYear -= 1; }
    renderCalendar();
  });
  calendarNextMonth.addEventListener("click", function () {
    currentMonth += 1;
    if (currentMonth > 11) { currentMonth = 0; currentYear += 1; }
    renderCalendar();
  });

  var user = readUser();
  if (!user) {
    window.location.href = "../login.html";
    return;
  }
  if (user.szerep !== "palyatulajdonos") {
    window.location.href = "./berleseim.html";
    return;
  }

  wireSidebar(user);

  function refreshOwnerBookings() {
    return loadBookings(getUserId(user)).catch(function (err) {
      console.error(err);
      pendingContainer.innerHTML = '<div class="col-12"><div class="alert alert-danger mb-0">Hiba a foglalasok betoltesekor.</div></div>';
      acceptedContainer.innerHTML = "";
      rejectedContainer.innerHTML = "";
    });
  }

  refreshOwnerBookings();
  setInterval(refreshOwnerBookings, 5000);
})();
