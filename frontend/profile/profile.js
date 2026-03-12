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

  function writeUser(user) {
    if (!user) return;
    var json = JSON.stringify(user);
    localStorage.setItem("user", json);
    sessionStorage.setItem("user", json);
  }

  function ensureLoggedIn() {
    var user = readUser();
    if (!user) {
      window.location.href = "../login.html";
      return null;
    }
    return user;
  }

  function getUserId(user) {
    return user && (user.felhasznalo_id || user.id || user.userId);
  }

  function roleLabel(szerep) {
    return szerep === "palyatulajdonos" ? "Palyatulajdonos" : "Berlo";
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

  function absoluteImageUrl(url) {
    if (!url) return "";
    return url.startsWith("http") ? url : API_BASE + url;
  }

  function wireSidebar(user) {
    var palyaimLink = document.querySelector('a[href="./palyaim.html"]');
    var foglalasaimLink = document.querySelector('a[href="./foglalasaim.html"]');
    var berleseimLink = document.querySelector('a[href="./berleseim.html"]');
    var isOwner = user.szerep === "palyatulajdonos";

    if (palyaimLink) palyaimLink.parentElement.style.display = isOwner ? "" : "none";
    if (foglalasaimLink) foglalasaimLink.parentElement.style.display = isOwner ? "" : "none";
    if (berleseimLink) berleseimLink.parentElement.style.display = "";

    var dropdownName = document.getElementById("sidebarUserName");
    var dropdownAvatar = document.getElementById("sidebarUserAvatar");
    if (dropdownName) dropdownName.textContent = user.teljes_nev || user.username || "Felhasznalo";
    if (dropdownAvatar && user.profil_kep_url) dropdownAvatar.src = absoluteImageUrl(user.profil_kep_url);

    var logoutBtn = document.getElementById("sidebarLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "../login.html";
      });
    }
    initSidebarNotifications(user);
  }

  async function loadProfilePage(user) {
    var usernameValue = document.getElementById("profileUsernameValue");
    if (!usernameValue) return;
    var currentProfile = Object.assign({}, user);

    function paint(profileData) {
      var displayName = profileData.teljes_nev || profileData.username || "Felhasznalo";
      var avatarUrl = profileData.profil_kep_url ? absoluteImageUrl(profileData.profil_kep_url) : "https://github.com/mdo.png";
      var deletePictureBtn = document.getElementById("deletePictureBtn");
      var sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
      currentProfile = Object.assign({}, currentProfile, profileData);

      document.getElementById("profileCardName").textContent = displayName;
      document.getElementById("profileCardEmail").textContent = profileData.email || "-";
      document.getElementById("profileAvatar").src = avatarUrl;
      document.getElementById("profileUsernameValue").textContent = profileData.username || "-";
      document.getElementById("profileFullNameValue").textContent = displayName;
      document.getElementById("profileEmailValue").textContent = profileData.email || "-";
      document.getElementById("profileRoleValue").textContent = roleLabel(profileData.szerep);
      document.getElementById("profilePhoneValue").textContent = profileData.telefonszam || "-";
      document.getElementById("profileAccountTypeValue").textContent = "Normal fiok";
      if (deletePictureBtn) {
        deletePictureBtn.style.display = profileData.profil_kep_url ? "inline-block" : "none";
      }
      if (sidebarUserAvatar) {
        sidebarUserAvatar.src = avatarUrl;
      }
    }

    function syncStoredUser(profileData) {
      var storedUser = readUser();
      if (!storedUser) return;
      var merged = Object.assign({}, storedUser, {
        username: profileData.username || storedUser.username,
        teljes_nev: profileData.teljes_nev || storedUser.teljes_nev,
        email: profileData.email || storedUser.email,
        szerep: profileData.szerep || storedUser.szerep,
        telefonszam: profileData.telefonszam || storedUser.telefonszam,
        profil_kep_url: profileData.profil_kep_url || null
      });
      writeUser(merged);
    }

    function bindProfilePictureActions() {
      var fileInput = document.getElementById("profilePictureInput");
      var uploadBtn = document.getElementById("uploadPictureBtn");
      var deleteBtn = document.getElementById("deletePictureBtn");
      if (!fileInput || !uploadBtn || !deleteBtn) return;
      if (uploadBtn.dataset.bound === "1") return;
      uploadBtn.dataset.bound = "1";

      uploadBtn.addEventListener("click", function () {
        fileInput.click();
      });

      fileInput.addEventListener("change", async function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;

        if (!file.type || !file.type.startsWith("image/")) {
          alert("Csak kepfajlt lehet feltolteni.");
          fileInput.value = "";
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert("A kep merete legfeljebb 5 MB lehet.");
          fileInput.value = "";
          return;
        }

        try {
          var storedUser = readUser() || user || {};
          var userId = getUserId(storedUser) || getUserId(currentProfile);
          if (!userId) throw new Error("Hianyzik a user azonosito.");

          var formData = new FormData();
          formData.append("profilePicture", file);
          formData.append("userId", String(userId));

          var hasCurrentPicture = !!(currentProfile && currentProfile.profil_kep_url);
          var endpoint = hasCurrentPicture ? "/api/profile/update" : "/api/profile/upload";
          var method = hasCurrentPicture ? "PUT" : "POST";

          var response = await fetch(API_BASE + endpoint, {
            method: method,
            body: formData
          });
          var data = await response.json().catch(function () { return {}; });
          if (!response.ok) throw new Error(data.message || "Profilkep mentesi hiba.");

          var nextProfile = Object.assign({}, currentProfile, {
            profil_kep_url: data.profil_kep_url || null
          });
          paint(nextProfile);
          syncStoredUser(nextProfile);
          fileInput.value = "";
          alert("Profilkep sikeresen frissitve.");
        } catch (err) {
          console.error(err);
          alert("Hiba a profilkep frissitesekor: " + err.message);
          fileInput.value = "";
        }
      });

      deleteBtn.addEventListener("click", async function () {
        if (!confirm("Biztosan torolni szeretned a profilkepet?")) return;
        try {
          var storedUser = readUser() || user || {};
          var userId = getUserId(storedUser) || getUserId(currentProfile);
          if (!userId) throw new Error("Hianyzik a user azonosito.");

          var response = await fetch(API_BASE + "/api/profile/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId })
          });
          var data = await response.json().catch(function () { return {}; });
          if (!response.ok) throw new Error(data.message || "Profilkep torlesi hiba.");

          var nextProfile = Object.assign({}, currentProfile, { profil_kep_url: null });
          paint(nextProfile);
          syncStoredUser(nextProfile);
          alert("Profilkep sikeresen torolve.");
        } catch (err) {
          console.error(err);
          alert("Hiba a profilkep torlesekor: " + err.message);
        }
      });
    }

    paint(user);
    bindProfilePictureActions();
    syncStoredUser(user);

    try {
      var userId = getUserId(user);
      if (!userId) throw new Error("Hianyzik a user ID");
      var res = await fetch(API_BASE + "/api/profile/profile?userId=" + encodeURIComponent(userId));
      if (!res.ok) throw new Error("Profil lekeresi hiba");
      var profile = await res.json();
      paint(profile);
      syncStoredUser(profile);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPalyaimPage(user) {
    var myFieldsList = document.getElementById("myFieldsList");
    var modalElement = document.getElementById("ujPalyaModal");
    var modalForm = document.getElementById("ujPalyaForm");
    var modalSaveButton = document.getElementById("ujPalyaKuldBtn");
    if (!myFieldsList || !modalElement || !modalForm || !modalSaveButton) return;

    if (user.szerep !== "palyatulajdonos") {
      window.location.href = "./berleseim.html";
      return;
    }

    var modalTitle = document.getElementById("ujPalyaModalTitle");
    var modalPalyaIdInput = document.getElementById("modalPalyaId");
    var modalNevInput = document.getElementById("modalNev");
    var modalSportagInput = document.getElementById("modalSportag");
    var modalHelyszinInput = document.getElementById("modalHelyszin");
    var modalArInput = document.getElementById("modalAr");
    var modalKepUrlInput = document.getElementById("modalKepUrl");
    var modalLeirasInput = document.getElementById("modalLeiras");
    var modalNyitasInput = document.getElementById("modalNyitas");
    var modalZarasInput = document.getElementById("modalZaras");
    var openAddFieldModalButton = document.getElementById("openAddFieldModalButton");
    var palyaModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    var fields = [];
    var editingId = null;

    function formatPrice(value) {
      return Number(value).toLocaleString("hu-HU") + " Ft/ora";
    }

    function renderFields() {
      if (!fields.length) {
        myFieldsList.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Meg nincs sajat palya.</div></div>';
        return;
      }

      myFieldsList.innerHTML = fields.map(function (field) {
        var kep = field.kep_url && field.kep_url.trim()
          ? field.kep_url
          : "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1000&q=80&auto=format&fit=crop";
        return (
          '<div class="col-12 col-md-6 col-lg-4">' +
            '<div class="card h-100 shadow-sm">' +
              '<img src="' + kep + '" class="card-img-top" alt="' + field.nev + '" style="height:180px;object-fit:cover;">' +
              '<div class="card-body d-flex flex-column">' +
                '<h3 class="h6 mb-2">' + field.nev + "</h3>" +
                '<div class="field-meta"><strong>Sportag:</strong> ' + field.sportag + "</div>" +
                '<div class="field-meta"><strong>Helyszin:</strong> ' + field.helyszin + "</div>" +
                '<div class="field-meta"><strong>Ar:</strong> ' + formatPrice(field.ar_ora) + "</div>" +
                '<div class="field-meta"><strong>Foglalasok szama:</strong> ' + (field.foglalasok_szama || 0) + "</div>" +
                '<div class="field-actions mt-auto">' +
                  '<button class="btn btn-outline-primary btn-sm" type="button" data-action="edit" data-id="' + field.palya_id + '">Modositas</button>' +
                  '<button class="btn btn-outline-danger btn-sm" type="button" data-action="delete" data-id="' + field.palya_id + '">Torles</button>' +
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
      if (modalTitle) modalTitle.textContent = "Uj palya hozzaadasa";
      modalSaveButton.textContent = "Hozzaadas";
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
      modalArInput.value = String(field.ar_ora || "");
      modalKepUrlInput.value = field.kep_url || "";
      modalLeirasInput.value = field.leiras || "";
      modalNyitasInput.value = toTimeInput(field.nyitas, "08:00");
      modalZarasInput.value = toTimeInput(field.zaras, "20:00");
      if (modalTitle) modalTitle.textContent = "Palya modositasa";
      modalSaveButton.textContent = "Mentes";
      palyaModal.show();
    }

    async function deleteField(fieldId) {
      if (!confirm("Biztosan torolni szeretned ezt a palyat?")) return;
      try {
        var response = await fetch(API_BASE + "/api/palyak/" + fieldId, { method: "DELETE" });
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(data.error || data.message || "Torlesi hiba");
        await fetchFields();
      } catch (error) {
        console.error(error);
        alert("Hiba a palya torlesekor: " + error.message);
      }
    }

    async function fetchFields() {
      try {
        var response = await fetch(API_BASE + "/api/palyak/owner/" + getUserId(user));
        if (!response.ok) throw new Error("Palya lekeresi hiba");
        fields = await response.json();
        renderFields();
      } catch (error) {
        console.error(error);
        myFieldsList.innerHTML = '<div class="col-12"><div class="alert alert-danger mb-0">Hiba a palyak betoltesekor.</div></div>';
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
        kep_url: modalKepUrlInput.value.trim(),
        leiras: modalLeirasInput.value.trim(),
        nyitas: modalNyitasInput.value,
        zaras: modalZarasInput.value
      };

      try {
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
        alert("Hiba a palya mentesekor: " + error.message);
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
      resetModalForm();
    });

    resetModalForm();
    fetchFields();
  }

  var user = ensureLoggedIn();
  if (!user) return;

  wireSidebar(user);
  loadProfilePage(user);
  loadPalyaimPage(user);
})();

