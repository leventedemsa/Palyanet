(() => {
  const readToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
  const readUser = () => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  };
  const clearAuthStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  };

  const isTokenExpired = (jwtToken) => {
    if (!jwtToken || !jwtToken.includes(".")) {
      return true;
    }
    try {
      const payloadPart = jwtToken.split(".")[1];
      const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      if (!payload.exp) {
        return false;
      }
      return payload.exp * 1000 <= Date.now();
    } catch (_) {
      return true;
    }
  };

  const token = readToken();
  const isLoggedIn = Boolean(token) && !isTokenExpired(token);
  if (!isLoggedIn && token) {
    clearAuthStorage();
  }

  const path = window.location.pathname.toLowerCase();
  const isPalyakPage = path.endsWith("/palyak.html") || path.endsWith("\\palyak.html");

  if (!isLoggedIn && isPalyakPage) {
    window.location.replace("./bejelentkezes.html");
    return;
  }

  const navMenus = document.querySelectorAll(".navbar .navbar-nav");
  if (!navMenus.length) {
    return;
  }

  const isAuthLink = (href, page) => {
    if (!href) {
      return false;
    }
    const normalized = href.toLowerCase();
    return normalized.endsWith(`/${page}`) || normalized.endsWith(`\\${page}`) || normalized === `./${page}` || normalized === page;
  };

  const isCurrentPage = (page) => path.endsWith(`/${page}`) || path.endsWith(`\\${page}`);

  const findLink = (menu, page) =>
    Array.from(menu.querySelectorAll("a.nav-link")).find((link) => isAuthLink(link.getAttribute("href"), page));

  const createLink = (page, text) => {
    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = `./${page}`;
    link.textContent = text;
    return link;
  };

  const handleLogout = () => {
    clearAuthStorage();
    window.location.replace("./index.html");
  };

  const ensureNotificationUi = (menu) => {
    const existingContainer = document.getElementById("notificationContainer");
    if (existingContainer) {
      existingContainer.style.display = "block";
      return {
        container: existingContainer,
        icon: document.getElementById("notificationIcon"),
        badge: document.getElementById("notificationBadge"),
        dropdown: document.getElementById("notificationDropdown"),
      };
    }

    const container = document.createElement("div");
    container.id = "notificationContainer";
    container.className = "nav-item ms-lg-2";
    container.style.position = "relative";
    container.setAttribute("data-auth-nav", "notification");
    container.innerHTML = `
      <button id="notificationIcon" type="button" style="border:1px solid #dee2e6;background:#fff;border-radius:999px;width:36px;height:36px;line-height:1;position:relative;cursor:pointer;">&#128276;</button>
      <span id="notificationBadge" style="display:none;position:absolute;top:-4px;right:-4px;background:#d32f2f;color:white;border-radius:50%;min-width:18px;height:18px;padding:0 4px;font-size:11px;line-height:18px;text-align:center;">0</span>
      <div id="notificationDropdown" style="display:none;position:absolute;right:0;top:42px;width:320px;max-height:360px;overflow:auto;background:#fff;border:1px solid #dee2e6;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.15);z-index:1200;">
        <div style="padding:12px;color:#6c757d;">Nincsenek értesítések</div>
      </div>
    `;
    menu.appendChild(container);
    return {
      container,
      icon: container.querySelector("#notificationIcon"),
      badge: container.querySelector("#notificationBadge"),
      dropdown: container.querySelector("#notificationDropdown"),
    };
  };

  const setupNotifications = (menu, user) => {
    if (!user) return;
    const userId = user.felhasznalo_id || user.id || user.userId;
    if (!userId) return;

    const ui = ensureNotificationUi(menu);
    if (!ui.icon || !ui.badge || !ui.dropdown) return;

    const renderNotifications = (items) => {
      const unread = items.filter((n) => !n.olvasott).length;
      if (unread > 0) {
        ui.badge.style.display = "block";
        ui.badge.textContent = String(unread);
      } else {
        ui.badge.style.display = "none";
      }

      if (!items.length) {
        ui.dropdown.innerHTML = '<div style="padding:12px;color:#6c757d;">Nincsenek értesítések</div>';
        return;
      }

      ui.dropdown.innerHTML = items
        .slice(0, 20)
        .map((n) => `
          <div style="padding:10px 12px;border-bottom:1px solid #f1f3f5;">
            <div style="font-weight:600;color:${n.olvasott ? "#495057" : "#d9480f"};">${n.olvasott ? "Értesítés" : "Új értesítés"}</div>
            <div style="font-size:13px;color:#495057;margin-top:4px;">${n.uzenet || ""}</div>
            <div style="font-size:11px;color:#868e96;margin-top:4px;">${new Date(n.letrehozva).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}</div>
          </div>
        `)
        .join("");
    };

    const refresh = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/notifications/${userId}`);
        if (!response.ok) return;
        const items = await response.json();
        renderNotifications(items);
      } catch (_) {}
    };

    if (!ui.icon.dataset.bound) {
      ui.icon.dataset.bound = "1";
      ui.icon.addEventListener("click", () => {
        ui.dropdown.style.display = ui.dropdown.style.display === "block" ? "none" : "block";
      });
      document.addEventListener("click", (e) => {
        if (!ui.container.contains(e.target)) {
          ui.dropdown.style.display = "none";
        }
      });
    }

    refresh();
    if (!window.__authNavNotifInterval) {
      window.__authNavNotifInterval = setInterval(refresh, 5000);
    }
  };

  navMenus.forEach((menu) => {
    const themeItem = menu.querySelector('.nav-item:not([data-auth-nav="logout"])');

    if (!isLoggedIn) {
      const palyakLink = findLink(menu, "palyak.html");
      if (palyakLink) {
        palyakLink.remove();
      }

      const existingLogout = menu.querySelector('[data-auth-nav="logout"]');
      if (existingLogout) {
        existingLogout.remove();
      }

      const hasLogin = Boolean(findLink(menu, "bejelentkezes.html"));
      if (!hasLogin) {
        const loginLink = createLink("bejelentkezes.html", "Bejelentkezés");
        if (themeItem) {
          menu.insertBefore(loginLink, themeItem);
        } else {
          menu.appendChild(loginLink);
        }
      }
      return;
    }

    const loginLink = findLink(menu, "bejelentkezes.html");
    if (loginLink) {
      loginLink.remove();
    }

    const registerLink = findLink(menu, "regisztracio.html");
    if (registerLink) {
      registerLink.remove();
    }

    const existingLogout = menu.querySelector('[data-auth-nav="logout"]');
    if (existingLogout) {
      existingLogout.remove();
    }
    const existingProfileDropdown = menu.querySelector('[data-auth-nav="profile-dropdown"]');
    if (existingProfileDropdown) {
      existingProfileDropdown.remove();
    }

    const palyakLink = findLink(menu, "palyak.html") || createLink("palyak.html", "Pályák");
    const contactLink = findLink(menu, "kapcsolat.html");
    const existingBookingsLink = findLink(menu, "bookings.html");
    if (existingBookingsLink) {
      existingBookingsLink.remove();
    }
    const profileLink = findLink(menu, "user_profile.html");
    if (profileLink) {
      profileLink.remove();
    }
    const user = readUser();
    setupNotifications(menu, user);

    const profileDropdown = document.createElement("div");
    profileDropdown.className = "nav-item dropdown";
    profileDropdown.setAttribute("data-auth-nav", "profile-dropdown");

    const profileToggle = document.createElement("a");
    profileToggle.className = "nav-link dropdown-toggle";
    profileToggle.href = "#";
    profileToggle.setAttribute("role", "button");
    profileToggle.setAttribute("data-bs-toggle", "dropdown");
    profileToggle.setAttribute("aria-expanded", "false");
    profileToggle.textContent = "Profil";

    const dropdownMenu = document.createElement("ul");
    dropdownMenu.className = "dropdown-menu dropdown-menu-end";

    const myProfileItemLi = document.createElement("li");
    const myProfileItem = document.createElement("a");
    myProfileItem.className = "dropdown-item";
    myProfileItem.href = "../profil/profil.html";
    myProfileItem.textContent = "Profilom";
    myProfileItemLi.appendChild(myProfileItem);

    const logoutItemLi = document.createElement("li");
    const logoutItem = document.createElement("button");
    logoutItem.type = "button";
    logoutItem.className = "dropdown-item text-danger";
    logoutItem.textContent = "Kijelentkezés";
    logoutItem.addEventListener("click", handleLogout);
    logoutItemLi.appendChild(logoutItem);

    dropdownMenu.appendChild(myProfileItemLi);
    dropdownMenu.appendChild(logoutItemLi);
    profileDropdown.appendChild(profileToggle);
    profileDropdown.appendChild(dropdownMenu);

    palyakLink.classList.toggle("active", isCurrentPage("palyak.html"));
    profileToggle.classList.toggle("active", isCurrentPage("profil.html"));
    myProfileItem.classList.toggle("active", isCurrentPage("profil.html"));
    if (contactLink) {
      contactLink.classList.toggle("active", isCurrentPage("kapcsolat.html"));
    }

    if (themeItem) {
      menu.insertBefore(palyakLink, themeItem);
      if (contactLink) {
        menu.insertBefore(contactLink, themeItem);
      }
      menu.insertBefore(profileDropdown, themeItem);
    } else {
      menu.appendChild(palyakLink);
      if (contactLink) {
        menu.appendChild(contactLink);
      }
      menu.appendChild(profileDropdown);
    }


  });
})();
