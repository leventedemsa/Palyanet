(function () {
  "use strict";

  var currentContainer = document.getElementById("currentRentalsContainer");
  var pastContainer = document.getElementById("pastRentalsContainer");
  var currentCount = document.getElementById("currentRentalsCount");
  var pastCount = document.getElementById("pastRentalsCount");

  if (!currentContainer || !pastContainer || !currentCount || !pastCount) {
    return;
  }

  var now = new Date();

  function dateOffset(days) {
    var d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  var rentals = [
    {
      id: 1,
      palya: { nev: "Sportpark 1", sportag: "Foci", helyszin: "Budapest XI.", ar_ora: 12000 },
      datum: dateOffset(2),
      kezdes: "18:00",
      vege: "19:00",
      statusz: "pending"
    },
    {
      id: 2,
      palya: { nev: "Arena Center", sportag: "Tenisz", helyszin: "Debrecen", ar_ora: 9500 },
      datum: dateOffset(5),
      kezdes: "16:00",
      vege: "17:30",
      statusz: "accepted"
    },
    {
      id: 3,
      palya: { nev: "Kispalya Plusz", sportag: "Kosarlabda", helyszin: "Szeged", ar_ora: 8000 },
      datum: dateOffset(-4),
      kezdes: "19:00",
      vege: "20:00",
      statusz: "accepted"
    },
    {
      id: 4,
      palya: { nev: "Varosi Center", sportag: "Badminton", helyszin: "Gyor", ar_ora: 7000 },
      datum: dateOffset(-10),
      kezdes: "14:00",
      vege: "15:00",
      statusz: "rejected"
    },
    {
      id: 5,
      palya: { nev: "Ujhegyi Palya", sportag: "Foci", helyszin: "Budapest X.", ar_ora: 11000 },
      datum: dateOffset(7),
      kezdes: "20:00",
      vege: "21:00",
      statusz: "pending"
    }
  ];

  function statusText(status) {
    if (status === "pending") return "Fuggoben";
    if (status === "accepted") return "Elfogadva";
    return "Elutasitva";
  }

  function formatPrice(value) {
    return Number(value).toLocaleString("hu-HU") + " Ft/ora";
  }

  function endDateTime(booking) {
    return new Date(booking.datum + "T" + booking.vege + ":00");
  }

  function isCurrentBooking(booking) {
    if (booking.statusz === "rejected") return false;
    return endDateTime(booking) >= new Date();
  }

  function isCancelable(booking) {
    return isCurrentBooking(booking) && (booking.statusz === "pending" || booking.statusz === "accepted");
  }

  function renderCard(booking, showCancel) {
    return (
      '<div class="col-12 col-md-6">' +
        '<div class="booking-card">' +
          '<h3 class="h6 mb-1">' + booking.palya.nev + '</h3>' +
          '<p class="text-muted mb-2">' + booking.palya.sportag + ' - ' + booking.palya.helyszin + '</p>' +
          '<p class="mb-1"><strong>Ar:</strong> ' + formatPrice(booking.palya.ar_ora) + '</p>' +
          '<p class="mb-1"><strong>Datum:</strong> ' + booking.datum + '</p>' +
          '<p class="mb-2"><strong>Idopont:</strong> ' + booking.kezdes + ' - ' + booking.vege + '</p>' +
          '<p class="mb-0"><span class="booking-status ' + booking.statusz + '">' + statusText(booking.statusz) + '</span></p>' +
          (showCancel
            ? '<div class="booking-actions"><button class="btn btn-outline-danger btn-sm" type="button" data-action="cancel" data-id="' + booking.id + '">Foglalas lemondasa</button></div>'
            : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderList(container, list, allowCancel) {
    if (!list.length) {
      container.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Nincs megjelenitheto foglalas.</div></div>';
      return;
    }

    container.innerHTML = list.map(function (booking) {
      return renderCard(booking, allowCancel && isCancelable(booking));
    }).join("");
  }

  function render() {
    var current = rentals
      .filter(function (b) { return isCurrentBooking(b); })
      .sort(function (a, b) { return new Date(a.datum + "T" + a.kezdes + ":00") - new Date(b.datum + "T" + b.kezdes + ":00"); });

    var past = rentals
      .filter(function (b) { return !isCurrentBooking(b); })
      .sort(function (a, b) { return new Date(b.datum + "T" + b.kezdes + ":00") - new Date(a.datum + "T" + a.kezdes + ":00"); });

    currentCount.textContent = String(current.length);
    pastCount.textContent = String(past.length);

    renderList(currentContainer, current, true);
    renderList(pastContainer, past, false);
  }

  currentContainer.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-action='cancel']");
    if (!button) return;

    var id = Number(button.getAttribute("data-id"));
    if (!id) return;

    rentals = rentals.map(function (booking) {
      if (booking.id !== id) return booking;
      return Object.assign({}, booking, { statusz: "rejected" });
    });

    render();
  });

  render();
})();
