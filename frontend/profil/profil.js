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

  function showSuccess(message) {
    return Swal.fire({
      icon: "success",
      title: "Sikeres művelet",
      text: message,
      confirmButtonText: "Rendben"
    });
  }

  function showError(message) {
    return Swal.fire({
      icon: "error",
      title: "Hiba",
      text: message,
      confirmButtonText: "Rendben"
    });
  }

  function showWarning(message) {
    return Swal.fire({
      icon: "warning",
      title: "Figyelem",
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

  function roleLabel(szerep) {
    if (szerep === "admin") return "Admin";
    return szerep === "palyatulajdonos" ? "Pályatulajdonos" : "Bérlő";
  }

  function toggleDeletePictureButton(show) {
    var deletePictureBtn = document.getElementById("deletePictureBtn");
    if (!deletePictureBtn) return;
    deletePictureBtn.classList.toggle("d-none", !show);
  }

  function initSidebarNotifications(user) {
    var sidebars = document.querySelectorAll(".profile-sidebar");
    if (!sidebars.length) return;
    var userId = getUserId(user);
    if (!userId) return;
    var widgets = [];

    sidebars.forEach(function (sidebar) {
      if (sidebar.querySelector(".sidebar-notifications-box")) return;
      var box = document.createElement("div");
      box.className = "sidebar-notifications-box mt-3";
      box.innerHTML =
        '<button class="btn btn-outline-secondary btn-sm w-100 sidebar-notif-toggle" type="button">Értesítés <span class="badge bg-danger ms-1 sidebar-notif-badge" style="display:none;">0</span></button>' +
        '<div class="mt-2 p-2 bg-white text-dark rounded shadow-sm sidebar-notif-dropdown" style="display:none;max-height:260px;overflow:auto;">' +
        '<div class="small text-muted">Nincsenek értesítések</div>' +
        "</div>";
      sidebar.appendChild(box);

      var toggle = box.querySelector(".sidebar-notif-toggle");
      var badge = box.querySelector(".sidebar-notif-badge");
      var dropdown = box.querySelector(".sidebar-notif-dropdown");
      if (!toggle || !badge || !dropdown) return;

      toggle.addEventListener("click", function () {
        dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
      });
      widgets.push({ badge: badge, dropdown: dropdown });
    });
    if (!widgets.length) return;

    async function refreshNotifications() {
      try {
        var res = await fetch(API_BASE + "/api/notifications/" + userId);
        if (!res.ok) return;
        var items = await res.json();
        var unread = items.filter(function (n) { return !n.olvasott; }).length;
        var html = items.slice(0, 15).map(function (n) {
          return '<div class="small border-bottom pb-2 mb-2">' +
            '<div style="font-weight:600;">' + (n.olvasott ? "Értesítés" : "Új értesítés") + "</div>" +
            '<div>' + (n.uzenet || "") + "</div>" +
            '<div class="text-muted">' + new Date(n.letrehozva).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) + "</div>" +
            "</div>";
        }).join("");
        widgets.forEach(function (widget) {
          if (unread > 0) {
            widget.badge.style.display = "inline-block";
            widget.badge.textContent = String(unread);
          } else {
            widget.badge.style.display = "none";
          }
          if (!items.length) {
            widget.dropdown.innerHTML = '<div class="small text-muted">Nincsenek értesítések</div>';
            return;
          }
          widget.dropdown.innerHTML = html;
        });
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
    var palyaimItems = document.querySelectorAll('[data-sidebar-item="palyaim"]');
    var foglalasaimItems = document.querySelectorAll('[data-sidebar-item="foglalasaim"]');
    var statisztikaItems = document.querySelectorAll('[data-sidebar-item="statisztika"]');
    var berleseimItems = document.querySelectorAll('[data-sidebar-item="berleseim"]');
    var bejelentesekItems = document.querySelectorAll('[data-sidebar-item="bejelentesek"]');
    var adminPalyakItems = document.querySelectorAll('[data-sidebar-item="admin-palyak"]');
    var adminFelhasznalokItems = document.querySelectorAll('[data-sidebar-item="admin-felhasznalok"]');
    var isOwner = user.szerep === "palyatulajdonos";
    var isAdmin = user.szerep === "admin";

    palyaimItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
    foglalasaimItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
    statisztikaItems.forEach(function (item) { item.style.display = isOwner ? "" : "none"; });
    berleseimItems.forEach(function (item) { item.style.display = isAdmin ? "none" : ""; });
    bejelentesekItems.forEach(function (item) { item.style.display = isAdmin ? "" : "none"; });
    adminPalyakItems.forEach(function (item) { item.style.display = isAdmin ? "" : "none"; });
    adminFelhasznalokItems.forEach(function (item) { item.style.display = isAdmin ? "" : "none"; });

    var dropdownNames = document.querySelectorAll(".sidebar-user-name, #sidebarUserName");
    var dropdownAvatars = document.querySelectorAll(".sidebar-user-avatar, #sidebarUserAvatar");
    var displayName = user.teljes_nev || user.username || "Felhasználó";
    dropdownNames.forEach(function (el) { el.textContent = displayName; });
    dropdownAvatars.forEach(function (el) {
      if (user.profil_kep_url) el.src = absoluteImageUrl(user.profil_kep_url);
    });

    var logoutBtns = document.querySelectorAll(".sidebar-logout-btn, #sidebarLogoutBtn");
    logoutBtns.forEach(function (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "../login.html";
      });
    });
  }

  function setQuickStats(items) {
    var label1 = document.getElementById("quickStat1Label");
    var label2 = document.getElementById("quickStat2Label");
    var label3 = document.getElementById("quickStat3Label");
    var value1 = document.getElementById("quickStat1Value");
    var value2 = document.getElementById("quickStat2Value");
    var value3 = document.getElementById("quickStat3Value");
    if (!label1 || !label2 || !label3 || !value1 || !value2 || !value3) return;

    var safe = (items || []).slice(0, 3);
    while (safe.length < 3) safe.push({ label: "-", value: "-" });
    label1.textContent = safe[0].label;
    label2.textContent = safe[1].label;
    label3.textContent = safe[2].label;
    value1.textContent = safe[0].value;
    value2.textContent = safe[1].value;
    value3.textContent = safe[2].value;
  }

  function formatDateOnly(value) {
    if (!value) return "-";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    var year = String(date.getFullYear());
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "." + month + "." + day;
  }

  async function loadQuickStats(user) {
    var hasStatsArea = document.getElementById("quickStat1Value");
    if (!hasStatsArea) return;
    var userId = getUserId(user);
    if (!userId) {
      setQuickStats([]);
      return;
    }

    try {
      if (user.szerep === "palyatulajdonos") {
        var ownerFieldsRes = await fetch(API_BASE + "/api/palyak/owner/" + userId);
        var ownerBookingsRes = await fetch(API_BASE + "/api/bookings/owner/" + userId);
        var ownerFields = ownerFieldsRes.ok ? await ownerFieldsRes.json() : [];
        var ownerBookings = ownerBookingsRes.ok ? await ownerBookingsRes.json() : [];
        var pendingCount = ownerBookings.filter(function (b) { return b.statusz === "pending"; }).length;
        var acceptedCount = ownerBookings.filter(function (b) { return b.statusz === "accepted"; }).length;
        setQuickStats([
          { label: "Saját pályák", value: String(ownerFields.length) },
          { label: "Függő foglalások", value: String(pendingCount) },
          { label: "Elfogadott foglalások", value: String(acceptedCount) }
        ]);
        return;
      }

      if (user.szerep === "admin") {
        var bejelentesekValasz = await fetch(API_BASE + "/api/reports?admin_id=" + userId);
        var bejelentesek = bejelentesekValasz.ok ? await bejelentesekValasz.json() : [];
        var fuggoBejelentesekDarab = bejelentesek.filter(function (bejelentes) {
          return String(bejelentes.statusz || "").toLowerCase() === "pending";
        }).length;
        var lezartBejelentesekDarab = bejelentesek.filter(function (bejelentes) {
          return String(bejelentes.statusz || "").toLowerCase() !== "pending";
        }).length;

        setQuickStats([
          { label: "Függő bejelentések", value: String(fuggoBejelentesekDarab) },
          { label: "Lezárt bejelentések", value: String(lezartBejelentesekDarab) },
          { label: "Összes bejelentés", value: String(bejelentesek.length) }
        ]);
        return;
      }

      var renterBookingsRes = await fetch(API_BASE + "/api/bookings/renter/" + userId);
      var renterBookings = renterBookingsRes.ok ? await renterBookingsRes.json() : [];
      var now = new Date();
      var activeCount = renterBookings.filter(function (b) {
        if (b.statusz === "rejected") return false;
        return new Date(b.vege) >= now;
      }).length;
      var pastCount = renterBookings.filter(function (b) {
        if (b.statusz === "rejected") return true;
        return new Date(b.vege) < now;
      }).length;
      setQuickStats([
        { label: "Aktív foglalások", value: String(activeCount) },
        { label: "Lejárt foglalások", value: String(pastCount) },
        { label: "Összes foglalás", value: String(renterBookings.length) }
      ]);
    } catch (_) {
      if (user && user.szerep === "admin") {
        setQuickStats([
          { label: "Függő bejelentések", value: "-" },
          { label: "Lezárt bejelentések", value: "-" },
          { label: "Összes bejelentés", value: "-" }
        ]);
        return;
      }

      setQuickStats([
        { label: "Aktív foglalások", value: "-" },
        { label: "Lejárt foglalások", value: "-" },
        { label: "Összes foglalás", value: "-" }
      ]);
    }
  }

  async function loadProfilePage(user) {
    var usernameValue = document.getElementById("profileUsernameValue");
    if (!usernameValue) return;
    var currentProfile = Object.assign({}, user);

    function paint(profileData) {
      var displayName = profileData.teljes_nev || profileData.username || "Felhasználó";
      var avatarUrl = profileData.profil_kep_url ? absoluteImageUrl(profileData.profil_kep_url) : "https://github.com/mdo.png";
      var sidebarUserAvatars = document.querySelectorAll(".sidebar-user-avatar, #sidebarUserAvatar");
      var sidebarUserNames = document.querySelectorAll(".sidebar-user-name, #sidebarUserName");
      currentProfile = Object.assign({}, currentProfile, profileData);

      document.getElementById("profileCardName").textContent = displayName;
      document.getElementById("profileCardEmail").textContent = profileData.email || "-";
      document.getElementById("profileAvatar").src = avatarUrl;
      document.getElementById("profileUsernameValue").textContent = profileData.username || "-";
      document.getElementById("profileFullNameValue").textContent = displayName;
      document.getElementById("profileEmailValue").textContent = profileData.email || "-";
      document.getElementById("profileRoleValue").textContent = roleLabel(profileData.szerep);
      var roleValueSecondary = document.getElementById("profileRoleValueSecondary");
      if (roleValueSecondary) roleValueSecondary.textContent = roleLabel(profileData.szerep);
      document.getElementById("profilePhoneValue").textContent = profileData.telefonszam || "-";
      var createdAt = document.getElementById("profileCreatedAtValue");
      if (createdAt) createdAt.textContent = formatDateOnly(profileData.letrehozva);
      toggleDeletePictureButton(!!profileData.profil_kep_url);
      sidebarUserAvatars.forEach(function (avatar) { avatar.src = avatarUrl; });
      sidebarUserNames.forEach(function (name) { name.textContent = displayName; });
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
          showWarning("Csak képfájlt lehet feltölteni.");
          fileInput.value = "";
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          showWarning("A kép mérete legfeljebb 5 MB lehet.");
          fileInput.value = "";
          return;
        }

        try {
          var storedUser = readUser() || user || {};
          var userId = getUserId(storedUser) || getUserId(currentProfile);
          if (!userId) throw new Error("Hiányzik a felhasználó azonosítója.");

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
          if (!response.ok) throw new Error(data.message || "Profilkép mentési hiba.");

          var nextProfile = Object.assign({}, currentProfile, {
            profil_kep_url: data.profil_kep_url || null
          });
          paint(nextProfile);
          syncStoredUser(nextProfile);
          fileInput.value = "";
          showSuccess("Profilkép sikeresen frissítve.");
        } catch (err) {
          console.error(err);
          showError("Hiba a profilkép frissítésekor: " + err.message);
          fileInput.value = "";
        }
      });

      deleteBtn.addEventListener("click", async function () {
        var confirmResult = await confirmAction("Biztosan törölni szeretnéd a profilképet?");
        if (!confirmResult.isConfirmed) return;
        try {
          var storedUser = readUser() || user || {};
          var userId = getUserId(storedUser) || getUserId(currentProfile);
          if (!userId) throw new Error("Hiányzik a felhasználó azonosítója.");

          var response = await fetch(API_BASE + "/api/profile/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId })
          });
          var data = await response.json().catch(function () { return {}; });
          if (!response.ok) throw new Error(data.message || "Profilkép törlési hiba.");

          var nextProfile = Object.assign({}, currentProfile, { profil_kep_url: null });
          paint(nextProfile);
          syncStoredUser(nextProfile);
          showSuccess("Profilkép sikeresen törölve.");
        } catch (err) {
          console.error(err);
          showError("Hiba a profilkép törlésekor: " + err.message);
        }
      });
    }

    function bindProfileEditActions() {
      var modalElement = document.getElementById("editProfileModal");
      var form = document.getElementById("editProfileForm");
      var saveBtn = document.getElementById("saveProfileChangesBtn");
      var usernameInput = document.getElementById("editUsernameInput");
      var fullNameInput = document.getElementById("editFullNameInput");
      var emailInput = document.getElementById("editEmailInput");
      if (!modalElement || !form || !saveBtn || !usernameInput || !fullNameInput || !emailInput) return;
      if (saveBtn.dataset.bound === "1") return;
      saveBtn.dataset.bound = "1";

      modalElement.addEventListener("show.bs.modal", function () {
        usernameInput.value = currentProfile.username || "";
        fullNameInput.value = currentProfile.teljes_nev || "";
        emailInput.value = currentProfile.email || "";
      });

      saveBtn.addEventListener("click", async function () {
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        try {
          var payload = {
            userId: getUserId(currentProfile) || getUserId(user),
            username: usernameInput.value.trim(),
            teljes_nev: fullNameInput.value.trim(),
            email: emailInput.value.trim()
          };

          var response = await fetch(API_BASE + "/api/profile/update-data", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          var data = await response.json().catch(function () { return {}; });
          if (!response.ok) throw new Error(data.message || data.error || ("Profil adat mentési hiba. HTTP " + response.status));

          if (data.user) {
            paint(data.user);
            syncStoredUser(data.user);
          }

          var modal = bootstrap.Modal.getOrCreateInstance(modalElement);
          modal.hide();
          showSuccess("Profil adatok sikeresen frissítve.");
        } catch (err) {
          console.error(err);
          showError("Hiba a profil adatok mentésekor: " + err.message);
        }
      });
    }

    function bindPasswordActions() {
      var modalElement = document.getElementById("changePasswordModal");
      var form = document.getElementById("changePasswordForm");
      var currentInput = document.getElementById("currentPasswordInput");
      var newInput = document.getElementById("newPasswordInput");
      var confirmInput = document.getElementById("confirmPasswordInput");
      var saveBtn = document.getElementById("changePasswordBtn");
      if (!modalElement || !form || !currentInput || !newInput || !confirmInput || !saveBtn) return;
      if (saveBtn.dataset.bound === "1") return;
      saveBtn.dataset.bound = "1";

      function resetForm() {
        currentInput.value = "";
        newInput.value = "";
        confirmInput.value = "";
      }

      modalElement.addEventListener("show.bs.modal", function () {
        resetForm();
      });

      saveBtn.addEventListener("click", async function () {
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        var currentPassword = currentInput.value || "";
        var newPassword = newInput.value || "";
        var confirmPassword = confirmInput.value || "";

        if (!currentPassword || !newPassword || !confirmPassword) {
          showWarning("Kérlek tölts ki minden jelszó mezőt.");
          return;
        }
        if (newPassword.length < 8) {
          showWarning("Az új jelszó legalább 8 karakter legyen.");
          return;
        }
        if (newPassword !== confirmPassword) {
          showWarning("Az új jelszó és a megerősítés nem egyezik.");
          return;
        }

        try {
          var response = await fetch(API_BASE + "/api/profile/change-password", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: getUserId(currentProfile) || getUserId(user),
              currentPassword: currentPassword,
              newPassword: newPassword
            })
          });
          var data = await response.json().catch(function () { return {}; });
          if (!response.ok) throw new Error(data.message || data.error || ("Jelszó módosítási hiba. HTTP " + response.status));

          resetForm();
          var modal = bootstrap.Modal.getOrCreateInstance(modalElement);
          modal.hide();
          showSuccess("Jelszó sikeresen módosítva.");
        } catch (err) {
          console.error(err);
          showError("Hiba a jelszó módosításakor: " + err.message);
        }
      });
    }

    paint(user);
    bindProfilePictureActions();
    bindProfileEditActions();
    bindPasswordActions();
    syncStoredUser(user);

    try {
      var userId = getUserId(user);
      if (!userId) throw new Error("Hiányzik a felhasználó azonosítója");
      var res = await fetch(API_BASE + "/api/profile/profile?userId=" + encodeURIComponent(userId));
      if (!res.ok) throw new Error("Profil lekérési hiba");
      var profile = await res.json();
      paint(profile);
      syncStoredUser(profile);
    } catch (err) {
      console.error(err);
    }
  }

  var user = ensureLoggedIn();
  if (!user) return;

  wireSidebar(user);
  loadProfilePage(user);
  loadQuickStats(user);
})();

