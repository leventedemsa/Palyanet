(() => {
  const readToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
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
    window.location.replace("./login.html");
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

      const hasLogin = Boolean(findLink(menu, "login.html"));
      if (!hasLogin) {
        const loginLink = createLink("login.html", "Bejelentkezes");
        if (themeItem) {
          menu.insertBefore(loginLink, themeItem);
        } else {
          menu.appendChild(loginLink);
        }
      }
      return;
    }

    const loginLink = findLink(menu, "login.html");
    if (loginLink) {
      loginLink.remove();
    }

    const registerLink = findLink(menu, "register.html");
    if (registerLink) {
      registerLink.remove();
    }

    const existingLogout = menu.querySelector('[data-auth-nav="logout"]');
    if (existingLogout) {
      existingLogout.remove();
    }

    const palyakLink = findLink(menu, "palyak.html") || createLink("palyak.html", "Palyak");
    const contactLink = findLink(menu, "contact.html");
    const bookingsLink = findLink(menu, "bookings.html") || createLink("bookings.html", "📋 Foglalások");
    const profileLink = findLink(menu, "user_profile.html") || createLink("user_profile.html", "👤 Profil");

    palyakLink.classList.toggle("active", isCurrentPage("palyak.html"));
    bookingsLink.classList.toggle("active", isCurrentPage("bookings.html"));
    profileLink.classList.toggle("active", isCurrentPage("user_profile.html"));
    if (contactLink) {
      contactLink.classList.toggle("active", isCurrentPage("contact.html"));
    }

    // Hide 'Foglalások' menu item for renters
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.szerep === "berlo") {
      // Do not add bookingsLink to menu
    } else {
      if (themeItem) {
        menu.insertBefore(bookingsLink, themeItem);
      } else {
        menu.appendChild(bookingsLink);
      }
    }

    // Add badge to Foglalások menu for owners
    if (user && user.szerep === "palyatulajdonos") {
      bookingsLink.innerHTML += ' <span id="bookingsBadge" style="display:none;background:#d32f2f;color:white;border-radius:50%;padding:0 7px;font-size:0.9em;vertical-align:middle;margin-left:4px;">0</span>';
      // Fetch unread count and update badge
      fetch(`http://localhost:4000/api/notifications/unread-count/${user.felhasznalo_id}`)
        .then(res => res.json())
        .then(data => {
          const badge = document.getElementById("bookingsBadge");
          if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = "inline-block";
          } else {
            badge.style.display = "none";
          }
        });
      // Optionally, setInterval for auto-refresh
      setInterval(() => {
        fetch(`http://localhost:4000/api/notifications/unread-count/${user.felhasznalo_id}`)
          .then(res => res.json())
          .then(data => {
            const badge = document.getElementById("bookingsBadge");
            if (data.count > 0) {
              badge.textContent = data.count;
              badge.style.display = "inline-block";
            } else {
              badge.style.display = "none";
            }
          });
      }, 5000);
    }

    if (themeItem) {
      menu.insertBefore(palyakLink, themeItem);
      if (contactLink) {
        menu.insertBefore(contactLink, themeItem);
      }
      menu.insertBefore(bookingsLink, themeItem);
      menu.insertBefore(profileLink, themeItem);
    } else {
      menu.appendChild(palyakLink);
      if (contactLink) {
        menu.appendChild(contactLink);
      }
      menu.appendChild(bookingsLink);
      menu.appendChild(profileLink);
    }


  });
})();
