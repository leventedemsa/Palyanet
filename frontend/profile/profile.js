/* global bootstrap: false */
(function () {
  "use strict";

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });

  var myFieldsList = document.getElementById("myFieldsList");
  var openAddFieldModalButton = document.getElementById("openAddFieldModalButton");
  var modalElement = document.getElementById("ujPalyaModal");
  var modalTitle = document.getElementById("ujPalyaModalTitle");
  var modalForm = document.getElementById("ujPalyaForm");
  var modalPalyaIdInput = document.getElementById("modalPalyaId");
  var modalNevInput = document.getElementById("modalNev");
  var modalSportagInput = document.getElementById("modalSportag");
  var modalHelyszinInput = document.getElementById("modalHelyszin");
  var modalArInput = document.getElementById("modalAr");
  var modalKepUrlInput = document.getElementById("modalKepUrl");
  var modalLeirasInput = document.getElementById("modalLeiras");
  var modalNyitasInput = document.getElementById("modalNyitas");
  var modalZarasInput = document.getElementById("modalZaras");
  var modalSaveButton = document.getElementById("ujPalyaKuldBtn");

  if (!myFieldsList || !modalElement || !modalForm || !modalSaveButton) {
    return;
  }

  var fields = [
    {
      id: 1,
      nev: "Sportpark 1",
      sportag: "Foci",
      helyszin: "Budapest XI.",
      ar_ora: 12000,
      kep_url: "",
      leiras: "Fedett kispalya.",
      nyitas: "08:00",
      zaras: "22:00",
      foglalasok_szama: 1
    },
    {
      id: 2,
      nev: "Arena Center",
      sportag: "Tenisz",
      helyszin: "Debrecen",
      ar_ora: 9500,
      kep_url: "",
      leiras: "Salakos palya.",
      nyitas: "09:00",
      zaras: "20:00",
      foglalasok_szama: 2
    },
    {
      id: 3,
      nev: "Kispalya Plusz",
      sportag: "Kosarlabda",
      helyszin: "Szeged",
      ar_ora: 8000,
      kep_url: "",
      leiras: "Kulteri vilagitassal.",
      nyitas: "10:00",
      zaras: "21:00",
      foglalasok_szama: 3
    }
  ];

  var nextId = 4;
  var editingId = null;
  var palyaModal = bootstrap.Modal.getOrCreateInstance(modalElement);

  function formatPrice(value) {
    return Number(value).toLocaleString("hu-HU") + " Ft/ora";
  }

  function renderFields() {
    if (!fields.length) {
      myFieldsList.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Nincs meg palya a listaban.</div></div>';
      return;
    }

    myFieldsList.innerHTML = fields
      .map(function (field) {
        return (
          '<div class="col-12 col-md-6">' +
            '<div class="field-card">' +
              '<h3 class="h6 mb-2">' + field.nev + "</h3>" +
              '<div class="field-meta"><strong>Sportag:</strong> ' + field.sportag + "</div>" +
              '<div class="field-meta"><strong>Helyszin:</strong> ' + field.helyszin + "</div>" +
              '<div class="field-meta"><strong>Ar:</strong> ' + formatPrice(field.ar_ora) + "</div>" +
              '<div class="field-meta"><strong>Foglalasok szama:</strong> ' + field.foglalasok_szama + "</div>" +
              '<div class="field-actions">' +
                '<button class="btn btn-outline-primary btn-sm" type="button" data-action="edit" data-id="' + field.id + '">Modositas</button>' +
                '<button class="btn btn-outline-danger btn-sm" type="button" data-action="delete" data-id="' + field.id + '">Torles</button>' +
              "</div>" +
            "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function resetModalForm() {
    editingId = null;
    modalPalyaIdInput.value = "";
    modalNevInput.value = "";
    modalSportagInput.value = "";
    modalHelyszinInput.value = "";
    modalArInput.value = "";
    modalKepUrlInput.value = "";
    modalLeirasInput.value = "";
    modalNyitasInput.value = "08:00";
    modalZarasInput.value = "20:00";
    modalTitle.textContent = "Uj palya hozzaadasa";
    modalSaveButton.textContent = "Hozzaadas";
  }

  function startEditing(fieldId) {
    var field = fields.find(function (f) { return f.id === fieldId; });
    if (!field) return;

    editingId = field.id;
    modalPalyaIdInput.value = String(field.id);
    modalNevInput.value = field.nev;
    modalSportagInput.value = field.sportag;
    modalHelyszinInput.value = field.helyszin;
    modalArInput.value = String(field.ar_ora);
    modalKepUrlInput.value = field.kep_url || "";
    modalLeirasInput.value = field.leiras || "";
    modalNyitasInput.value = field.nyitas || "08:00";
    modalZarasInput.value = field.zaras || "20:00";
    modalTitle.textContent = "Palya modositasa";
    modalSaveButton.textContent = "Mentes";
    palyaModal.show();
  }

  myFieldsList.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;

    var action = button.getAttribute("data-action");
    var id = Number(button.getAttribute("data-id"));
    if (!id) return;

    if (action === "delete") {
      fields = fields.filter(function (f) { return f.id !== id; });
      if (editingId === id) resetModalForm();
      renderFields();
      return;
    }

    if (action === "edit") {
      startEditing(id);
    }
  });

  function saveFromModal() {
    if (!modalForm.checkValidity()) {
      modalForm.reportValidity();
      return;
    }

    var payload = {
      nev: modalNevInput.value.trim(),
      sportag: modalSportagInput.value,
      helyszin: modalHelyszinInput.value.trim(),
      ar_ora: Number(modalArInput.value),
      kep_url: modalKepUrlInput.value.trim(),
      leiras: modalLeirasInput.value.trim(),
      nyitas: modalNyitasInput.value,
      zaras: modalZarasInput.value
    };

    if (editingId) {
      fields = fields.map(function (field) {
        if (field.id !== editingId) return field;
        return {
          id: field.id,
          nev: payload.nev,
          sportag: payload.sportag,
          helyszin: payload.helyszin,
          ar_ora: payload.ar_ora,
          kep_url: payload.kep_url,
          leiras: payload.leiras,
          nyitas: payload.nyitas,
          zaras: payload.zaras,
          foglalasok_szama: field.foglalasok_szama
        };
      });
    } else {
      fields.unshift({
        id: nextId++,
        nev: payload.nev,
        sportag: payload.sportag,
        helyszin: payload.helyszin,
        ar_ora: payload.ar_ora,
        kep_url: payload.kep_url,
        leiras: payload.leiras,
        nyitas: payload.nyitas,
        zaras: payload.zaras,
        foglalasok_szama: "Placeholder"
      });
    }

    resetModalForm();
    renderFields();
    palyaModal.hide();
  }

  modalSaveButton.addEventListener("click", saveFromModal);

  modalForm.addEventListener("submit", function (event) {
    event.preventDefault();
    saveFromModal();
  });

  if (openAddFieldModalButton) {
    openAddFieldModalButton.addEventListener("click", function () {
      resetModalForm();
    });
  }

  modalElement.addEventListener("hidden.bs.modal", function () {
    resetModalForm();
  });

  resetModalForm();
  renderFields();
})();
