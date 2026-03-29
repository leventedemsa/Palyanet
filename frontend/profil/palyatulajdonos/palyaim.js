/* global bootstrap: false */
(function () {
  "use strict";

  var API_BASE = "http://localhost:4000";

  function readUser() {
    var raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function ensureLoggedIn() {
    var user = readUser();
    if (!user) {
      window.location.href = "../../login.html";
      return null;
    }
    return user;
  }

  function getUserId(user) {
    return user && (user.felhasznalo_id || user.id || user.userId);
  }

  function showError(message) {
    return Swal.fire({
      icon: "error",
      title: "Hiba",
      text: message,
      confirmButtonText: "Rendben"
    });
  }

  function confirmAction(message) {
    return Swal.fire({
      icon: "warning",
      title: "Megerősítés",
      text: message,
      showCancelButton: true,
      confirmButtonText: "Igen",
      cancelButtonText: "Mégsem"
    });
  }

  function absoluteImageUrl(url) {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    return API_BASE + url;
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
    var palyaimItems = document.querySelectorAll('[data-sidebar-item="palyaim"]');
    var foglalasaimItems = document.querySelectorAll('[data-sidebar-item="foglalasaim"]');
    var statisztikaItems = document.querySelectorAll('[data-sidebar-item="statisztika"]');
    var berleseimItems = document.querySelectorAll('[data-sidebar-item="berleseim"]');
    var isOwner = user.szerep === "palyatulajdonos";

    palyaimItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
    foglalasaimItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
    statisztikaItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
    berleseimItems.forEach(function (item) { item.style.display = ""; });

    var names = document.querySelectorAll(".sidebar-user-name");
    var avatars = document.querySelectorAll(".sidebar-user-avatar");
    var displayName = user.teljes_nev || user.username || "Felhasználó";
    names.forEach(function (el) { el.textContent = displayName; });
    avatars.forEach(function (el) {
      if (user.profil_kep_url) el.src = absoluteImageUrl(user.profil_kep_url);
    });

    var logoutBtns = document.querySelectorAll(".sidebar-logout-btn");
    logoutBtns.forEach(function (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "../../login.html";
      });
    });
  }

  async function loadPalyaimPage(user) {
    var myFieldsList = document.getElementById("myFieldsList");
    var modalElement = document.getElementById("ujPalyaModal");
    var modalForm = document.getElementById("ujPalyaForm");
    var modalSaveButton = document.getElementById("ujPalyaKuldBtn");
    if (!myFieldsList || !modalElement || !modalForm || !modalSaveButton) return;

    if (user.szerep !== "palyatulajdonos") {
      window.location.href = "../berleseim.html";
      return;
    }

    var modalTitle = document.getElementById("ujPalyaModalTitle");
    var modalPalyaIdInput = document.getElementById("modalPalyaId");
    var modalNevInput = document.getElementById("modalNev");
    var modalSportagInput = document.getElementById("modalSportag");
    var modalHelyszinInput = document.getElementById("modalHelyszin");
    var modalArInput = document.getElementById("modalAr");
    var modalKepUrlInput = document.getElementById("modalKepUrl");
    var modalKepekInput = document.getElementById("modalKepek");
    var modalKepekPreview = document.getElementById("modalKepekPreview");
    var modalLeirasInput = document.getElementById("modalLeiras");
    var modalNyitasInput = document.getElementById("modalNyitas");
    var modalZarasInput = document.getElementById("modalZaras");
    var openAddFieldModalButton = document.getElementById("openAddFieldModalButton");
    var helyszinValasztoBtn = document.getElementById("modalHelyszinValasztoBtn");
    var helyszinModalElement = document.getElementById("helyszinValasztoModal");
    var helyszinModal = helyszinModalElement ? bootstrap.Modal.getOrCreateInstance(helyszinModalElement) : null;
    var palyaimHelyszinKivalasztBtn = document.getElementById("palyaimHelyszinKivalasztBtn");
    var palyaimHelyszinTorlesBtn = document.getElementById("palyaimHelyszinTorlesBtn");
    var kivalasztottHelyszinBox = document.getElementById("kivalasztottHelyszinekPalyaim");
    var palyaModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    var fields = [];
    var editingId = null;
    var selectedLocation = "";
    var switchingToLocationModal = false;
    var restorePalyaModalAfterLocationModal = false;
    var uploadedImageUrls = [];

    var budapestKeruletek = Array.from({ length: 23 }, function (_, i) {
      return toRoman(i + 1) + ". kerület";
    });
    var megyek = [
      "Bács-Kiskun",
      "Baranya",
      "Békés",
      "Borsod-Abaúj-Zemplén",
      "Csongrád-Csanád",
      "Fejér",
      "Győr-Moson-Sopron",
      "Hajdú-Bihar",
      "Heves",
      "Jász-Nagykun-Szolnok",
      "Komárom-Esztergom",
      "Nógrád",
      "Pest",
      "Somogy",
      "Szabolcs-Szatmár-Bereg",
      "Tolna",
      "Vas",
      "Veszprém",
      "Zala"
    ];
    var varosok = ["Budapest", "Debrecen", "Győr", "Kecskemét", "Miskolc", "Nyíregyháza", "Pécs", "Sopron", "Szeged", "Székesfehérvár", "Szentendre"];

    function toRoman(num) {
      var map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
      var out = "";
      var n = num;
      map.forEach(function (pair) {
        var value = pair[0];
        var numeral = pair[1];
        while (n >= value) {
          out += numeral;
          n -= value;
        }
      });
      return out;
    }

    function renderHelyszinOptions(containerId, items, prefix) {
      var root = document.getElementById(containerId);
      if (!root) return;
      root.innerHTML = items.map(function (item, index) {
        var id = prefix + "_" + index;
        return (
          '<div class="col-12 col-md-4">' +
            '<div class="form-check mb-2">' +
              '<input class="form-check-input palyaim-helyszin-choice" type="radio" name="palyaimHelyszinChoice" id="' + id + '" value="' + item + '">' +
              '<label class="form-check-label" for="' + id + '">' + item + "</label>" +
            "</div>" +
          "</div>"
        );
      }).join("");
    }

    function updateHelyszinSummary() {
      if (!kivalasztottHelyszinBox) return;
      if (!selectedLocation) {
        kivalasztottHelyszinBox.innerHTML = '<span class="text-body-secondary">Nincs kiválasztott helyszín</span>';
        modalHelyszinInput.value = "";
        return;
      }

      kivalasztottHelyszinBox.innerHTML =
        '<span class="badge rounded-pill text-bg-success fs-6 px-3 py-2">' + selectedLocation + "</span>";
      modalHelyszinInput.value = selectedLocation;
    }

    function syncHelyszinRadios() {
      document.querySelectorAll(".palyaim-helyszin-choice").forEach(function (radio) {
        radio.checked = radio.value === selectedLocation;
      });
    }

    function initHelyszinModal() {
      renderHelyszinOptions("palyaimBudapestKeruletekContainer", budapestKeruletek, "palyaim_kerulet");
      renderHelyszinOptions("palyaimMegyekContainer", megyek, "palyaim_megye");
      renderHelyszinOptions("palyaimVarosokContainer", varosok, "palyaim_varos");
      syncHelyszinRadios();
      updateHelyszinSummary();

      document.querySelectorAll(".palyaim-helyszin-choice").forEach(function (radio) {
        radio.addEventListener("change", function (event) {
          selectedLocation = event.target.value || "";
          updateHelyszinSummary();
        });
      });
    }

    function formatPrice(value) {
      return Number(value).toLocaleString("hu-HU") + " Ft/óra";
    }

    function getPrimaryImage(field) {
      var list = parseImageUrls(field && field.kep_url);
      if (list.length) return absoluteImageUrl(list[0]);
      return "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1000&q=80&auto=format&fit=crop";
    }

    function renderModalImagePreview() {
      if (!modalKepekPreview) return;
      var images = uploadedImageUrls.slice();
      if (!images.length) {
        modalKepekPreview.innerHTML = '<span class="text-muted small">Nincs kiválasztott kép.</span>';
        return;
      }
      modalKepekPreview.innerHTML = images.map(function (imgUrl) {
        var abs = absoluteImageUrl(imgUrl);
        return '<img src="' + abs + '" alt="Pályakép" style="width:92px;height:64px;object-fit:cover;border-radius:10px;border:1px solid #e9ecef;">';
      }).join("");
    }

    async function uploadSelectedImages() {
      if (!modalKepekInput || !modalKepekInput.files || !modalKepekInput.files.length) {
        return [];
      }

      var formData = new FormData();
      Array.from(modalKepekInput.files).forEach(function (file) {
        formData.append("images", file);
      });

      var response = await fetch(API_BASE + "/api/palyak/upload-images", {
        method: "POST",
        body: formData,
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        throw new Error(data.error || data.message || "Képfeltöltés sikertelen");
      }
      return Array.isArray(data.urls) ? data.urls : [];
    }

    function renderFields() {
      if (!fields.length) {
        myFieldsList.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Még nincs saját pálya.</div></div>';
        return;
      }

      myFieldsList.innerHTML = fields.map(function (field) {
        var kep = field.kep_url && field.kep_url.trim()
          ? getPrimaryImage(field)
          : "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1000&q=80&auto=format&fit=crop";
        return (
          '<div class="col-12 col-md-6 col-lg-4">' +
            '<div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">' +
              '<div class="ratio ratio-16x9">' +
                '<img src="' + kep + '" class="w-100 h-100 object-fit-cover" alt="' + field.nev + '">' +
              "</div>" +
              '<div class="card-body p-3 p-lg-4 d-flex flex-column">' +
                '<h3 class="h6 mb-2">' + field.nev + "</h3>" +
                '<p class="small mb-2 lh-sm"><strong>Sportág:</strong> ' + field.sportag + "</p>" +
                '<p class="small mb-2 lh-sm"><strong>Helyszín:</strong> ' + field.helyszin + "</p>" +
                '<p class="small mb-2 lh-sm"><strong>Ár:</strong> ' + formatPrice(field.ar_ora) + "</p>" +
                '<p class="small mb-0 lh-sm"><strong>Foglalások száma:</strong> ' + (field.foglalasok_szama || 0) + "</p>" +
                '<div class="d-flex gap-2 mt-3 mt-auto">' +
                  '<button class="btn btn-outline-primary btn-sm flex-fill mt-2" type="button" data-action="edit" data-id="' + field.palya_id + '">Módosítás</button>' +
                  '<button class="btn btn-outline-danger btn-sm flex-fill mt-2" type="button" data-action="delete" data-id="' + field.palya_id + '">Törlés</button>' +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>"
        );
      }).join("");
    }

    function resetModalForm() {
      editingId = null;
      if (modalPalyaIdInput) modalPalyaIdInput.value = "";
      modalForm.reset();
      modalNyitasInput.value = "08:00";
      modalZarasInput.value = "20:00";
      selectedLocation = "";
      uploadedImageUrls = [];
      if (modalKepekInput) modalKepekInput.value = "";
      renderModalImagePreview();
      syncHelyszinRadios();
      updateHelyszinSummary();
      if (modalTitle) modalTitle.textContent = "Új pálya hozzáadása";
      modalSaveButton.textContent = "Hozzáadás";
    }

    function toTimeInput(value, fallback) {
      if (!value) return fallback;
      return String(value).slice(0, 5);
    }

    function startEditing(fieldId) {
      var field = fields.find(function (f) { return Number(f.palya_id) === Number(fieldId); });
      if (!field) return;

      editingId = Number(field.palya_id);
      if (modalPalyaIdInput) modalPalyaIdInput.value = String(editingId);
      modalNevInput.value = field.nev || "";
      modalSportagInput.value = field.sportag || "";
      modalHelyszinInput.value = field.helyszin || "";
      selectedLocation = field.helyszin || "";
      syncHelyszinRadios();
      updateHelyszinSummary();
      modalArInput.value = String(field.ar_ora || "");
      modalKepUrlInput.value = field.kep_url || "";
      uploadedImageUrls = parseImageUrls(field.kep_url);
      if (uploadedImageUrls.length > 1 || (uploadedImageUrls[0] && uploadedImageUrls[0].startsWith("/uploads/"))) {
        modalKepUrlInput.value = "";
      }
      if (modalKepekInput) modalKepekInput.value = "";
      renderModalImagePreview();
      modalLeirasInput.value = field.leiras || "";
      modalNyitasInput.value = toTimeInput(field.nyitas, "08:00");
      modalZarasInput.value = toTimeInput(field.zaras, "20:00");
      if (modalTitle) modalTitle.textContent = "Pálya módosítása";
      modalSaveButton.textContent = "Mentés";
      palyaModal.show();
    }

    async function deleteField(fieldId) {
      var confirmResult = await confirmAction("Biztosan törölni szeretnéd ezt a pályát?");
      if (!confirmResult.isConfirmed) return;
      try {
        var response = await fetch(API_BASE + "/api/palyak/" + fieldId, { method: "DELETE" });
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(data.error || data.message || "Tőrlési hiba");
        await fetchFields();
      } catch (error) {
        console.error(error);
        showError("Hiba a pálya törlésekor: " + error.message);
      }
    }

    async function fetchFields() {
      try {
        var response = await fetch(API_BASE + "/api/palyak/owner/" + getUserId(user));
        if (!response.ok) throw new Error("Pálya lekérési hiba");
        fields = await response.json();
        renderFields();
      } catch (error) {
        console.error(error);
        myFieldsList.innerHTML = '<div class="col-12"><div class="alert alert-danger mb-0">Hiba a pályák betőltésekor.</div></div>';
      }
    }

    async function saveFromModal() {
      if (!modalForm.checkValidity()) {
        modalForm.reportValidity();
        return;
      }

      var payload = {
        tulaj_id: getUserId(user),
        nev: modalNevInput.value.trim(),
        sportag: modalSportagInput.value,
        helyszin: modalHelyszinInput.value.trim(),
        ar_ora: Number(modalArInput.value),
        kep_url: "",
        leiras: modalLeirasInput.value.trim(),
        nyitas: modalNyitasInput.value,
        zaras: modalZarasInput.value
      };

      try {
        var newUploaded = await uploadSelectedImages();
        if (newUploaded.length) {
          uploadedImageUrls = newUploaded;
        }

        var manualUrl = modalKepUrlInput.value.trim();
        var allImages = uploadedImageUrls.slice();
        if (manualUrl) {
          allImages.unshift(manualUrl);
        }
        allImages = allImages.filter(function (url, index, arr) {
          return url && arr.indexOf(url) === index;
        });

        if (allImages.length > 1) {
          payload.kep_url = JSON.stringify(allImages);
        } else if (allImages.length === 1) {
          payload.kep_url = allImages[0];
        }

        var endpoint = editingId ? (API_BASE + "/api/palyak/" + editingId) : (API_BASE + "/api/palyak");
        var method = editingId ? "PUT" : "POST";
        var response = await fetch(endpoint, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        var data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || "Mentési hiba");

        resetModalForm();
        palyaModal.hide();
        await fetchFields();
      } catch (error) {
        console.error(error);
        showError("Hiba a pálya mentésekor: " + error.message);
      }
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
    if (helyszinValasztoBtn && helyszinModal) {
      helyszinValasztoBtn.addEventListener("click", function (event) {
        event.preventDefault();
        syncHelyszinRadios();
        updateHelyszinSummary();
        switchingToLocationModal = true;
        restorePalyaModalAfterLocationModal = true;
        palyaModal.hide();
      });
    }
    if (modalKepekInput) {
      modalKepekInput.addEventListener("change", function () {
        var selectedFiles = Array.from(modalKepekInput.files || []);
        if (!selectedFiles.length) {
          return;
        }
        uploadedImageUrls = selectedFiles.map(function (file) {
          return URL.createObjectURL(file);
        });
        renderModalImagePreview();
      });
    }
    if (palyaimHelyszinTorlesBtn) {
      palyaimHelyszinTorlesBtn.addEventListener("click", function () {
        selectedLocation = "";
        syncHelyszinRadios();
        updateHelyszinSummary();
      });
    }
    if (palyaimHelyszinKivalasztBtn) {
      palyaimHelyszinKivalasztBtn.addEventListener("click", function () {
        updateHelyszinSummary();
        if (helyszinModal) helyszinModal.hide();
      });
    }

    myFieldsList.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-action]");
      if (!button) return;
      var action = button.getAttribute("data-action");
      var id = Number(button.getAttribute("data-id"));
      if (!id) return;
      if (action === "edit") startEditing(id);
      if (action === "delete") deleteField(id);
    });

    modalElement.addEventListener("hidden.bs.modal", function () {
      if (switchingToLocationModal && helyszinModal) {
        switchingToLocationModal = false;
        helyszinModal.show();
        return;
      }
      resetModalForm();
    });
    if (helyszinModalElement) {
      helyszinModalElement.addEventListener("hidden.bs.modal", function () {
        if (restorePalyaModalAfterLocationModal) {
          restorePalyaModalAfterLocationModal = false;
          palyaModal.show();
        }
      });
    }

    initHelyszinModal();
    resetModalForm();
    renderModalImagePreview();
    fetchFields();
  }

  var user = ensureLoggedIn();
  if (!user) return;

  wireSidebar(user);
  loadPalyaimPage(user);
})();
