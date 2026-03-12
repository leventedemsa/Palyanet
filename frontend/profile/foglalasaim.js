(function () {
  "use strict";

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

  if (!pendingContainer || !acceptedContainer || !rejectedContainer || !calendarGrid) {
    return;
  }

  var bookings = [
    {
      id: 1,
      palya_nev: "Sportpark 1",
      sportag: "Foci",
      helyszin: "Budapest XI.",
      foglalo_nev: "Kiss Adam",
      foglalo_username: "@kissadam",
      datum: "2026-03-18",
      kezdes: "18:00",
      vege: "19:30",
      ar: 18000,
      statusz: "pending"
    },
    {
      id: 2,
      palya_nev: "Arena Center",
      sportag: "Tenisz",
      helyszin: "Debrecen",
      foglalo_nev: "Nagy Nora",
      foglalo_username: "@nagynora",
      datum: "2026-03-20",
      kezdes: "16:00",
      vege: "17:00",
      ar: 9500,
      statusz: "accepted"
    },
    {
      id: 3,
      palya_nev: "Kispalya Plusz",
      sportag: "Kosarlabda",
      helyszin: "Szeged",
      foglalo_nev: "Toth Marcell",
      foglalo_username: "@tmarcell",
      datum: "2026-03-22",
      kezdes: "20:00",
      vege: "21:00",
      ar: 8000,
      statusz: "rejected"
    }
  ];
  var monthNames = [
    "Januar", "Februar", "Marcius", "Aprilis", "Majus", "Junius",
    "Julius", "Augusztus", "Szeptember", "Oktober", "November", "December"
  ];
  var weekDays = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
  var currentDate = new Date();
  var currentYear = currentDate.getFullYear();
  var currentMonth = currentDate.getMonth();

  function formatPrice(value) {
    return Number(value).toLocaleString("hu-HU") + " Ft";
  }

  function statusText(status) {
    if (status === "pending") return "Fuggoben";
    if (status === "accepted") return "Elfogadva";
    return "Elutasitva";
  }

  function renderBookingCard(booking, withActions) {
    return (
      '<div class="col-12 col-md-6">' +
        '<div class="booking-card">' +
          '<h3 class="h6 mb-1">' + booking.palya_nev + '</h3>' +
          '<p class="text-muted mb-2">' + booking.sportag + ' - ' + booking.helyszin + '</p>' +
          '<p class="mb-1"><strong>Foglalo:</strong> ' + booking.foglalo_nev + ' <span class="text-muted">(' + booking.foglalo_username + ')</span></p>' +
          '<p class="mb-1"><strong>Idopont:</strong> ' + booking.datum + ', ' + booking.kezdes + ' - ' + booking.vege + '</p>' +
          '<p class="mb-1"><strong>Ar:</strong> ' + formatPrice(booking.ar) + '</p>' +
          '<p class="mb-0"><span class="booking-status ' + booking.statusz + '">' + statusText(booking.statusz) + '</span></p>' +
          (withActions
            ? '<div class="booking-actions">' +
                '<button class="btn btn-success btn-sm" type="button" data-action="accept" data-id="' + booking.id + '">Elfogadas</button>' +
                '<button class="btn btn-danger btn-sm" type="button" data-action="reject" data-id="' + booking.id + '">Elutasitas</button>' +
              '</div>'
            : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderList(container, list, withActions) {
    if (!list.length) {
      container.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Nincs foglalas ebben a kategoriaban.</div></div>';
      return;
    }

    container.innerHTML = list.map(function (booking) {
      return renderBookingCard(booking, withActions);
    }).join("");
  }

  function isDayBooked(dateText) {
    return bookings.some(function (booking) {
      return booking.datum === dateText && (booking.statusz === "pending" || booking.statusz === "accepted");
    });
  }

  function renderCalendar() {
    calendarMonthLabel.textContent = monthNames[currentMonth] + " " + String(currentYear);

    var firstDay = new Date(currentYear, currentMonth, 1);
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    var startWeekday = (firstDay.getDay() + 6) % 7;

    var html = weekDays.map(function (name) {
      return '<div class="calendar-head">' + name + "</div>";
    }).join("");

    for (var i = 0; i < startWeekday; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var monthText = String(currentMonth + 1).padStart(2, "0");
      var dayText = String(day).padStart(2, "0");
      var dateText = String(currentYear) + "-" + monthText + "-" + dayText;
      var booked = isDayBooked(dateText);
      html += '<div class="calendar-day ' + (booked ? "booked" : "free") + '" title="' + (booked ? "Foglalt" : "Szabad") + '">' + String(day) + "</div>";
    }

    calendarGrid.innerHTML = html;
  }

  function render() {
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

  pendingContainer.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;

    var action = button.getAttribute("data-action");
    var id = Number(button.getAttribute("data-id"));
    if (!id) return;

    bookings = bookings.map(function (booking) {
      if (booking.id !== id) return booking;
      if (action === "accept") {
        return Object.assign({}, booking, { statusz: "accepted" });
      }
      if (action === "reject") {
        return Object.assign({}, booking, { statusz: "rejected" });
      }
      return booking;
    });

    render();
  });

  calendarPrevMonth.addEventListener("click", function () {
    currentMonth -= 1;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    }
    renderCalendar();
  });

  calendarNextMonth.addEventListener("click", function () {
    currentMonth += 1;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear += 1;
    }
    renderCalendar();
  });

  render();
})();
