(() => {
  // Token kiolvasása localStorage/sessionStorage tárból.
  const tokenKiolvasasa = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  // Felhasználói adatok kiolvasása és JSON parse.
  const felhasznaloKiolvasasa = () => {
    const nyersFelhasznalo = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!nyersFelhasznalo) return null;
    try {
      return JSON.parse(nyersFelhasznalo);
    } catch (_) {
      return null;
    }
  };

  // Auth adatok törlése minden böngésző tárból.
  const authTaroloUritese = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  };

  // JWT token lejáratának ellenőrzése.
  const tokenLejartE = (jwtToken) => {
    if (!jwtToken || !jwtToken.includes(".")) {
      return true;
    }
    try {
      const hasznosResz = jwtToken.split(".")[1];
      const normalizaltResz = hasznosResz.replace(/-/g, "+").replace(/_/g, "/");
      const kitoltottResz = normalizaltResz + "=".repeat((4 - (normalizaltResz.length % 4)) % 4);
      const tokenTartalom = JSON.parse(atob(kitoltottResz));
      if (!tokenTartalom.exp) {
        return false;
      }
      return tokenTartalom.exp * 1000 <= Date.now();
    } catch (_) {
      return true;
    }
  };

  const token = tokenKiolvasasa();
  const bejelentkezett = Boolean(token) && !tokenLejartE(token);
  if (!bejelentkezett && token) {
    authTaroloUritese();
  }

  const oldalUtvonal = window.location.pathname.toLowerCase();
  const palyakOldalE = oldalUtvonal.endsWith("/palyak.html") || oldalUtvonal.endsWith("\\palyak.html");

  if (!bejelentkezett && palyakOldalE) {
    window.location.replace("./bejelentkezes.html");
    return;
  }

  const navigaciosMenuk = document.querySelectorAll(".navbar .navbar-nav");
  if (!navigaciosMenuk.length) {
    return;
  }

  // Ellenőrzi, hogy egy hivatkozás adott auth oldalra mutat-e.
  const authLinkE = (hivatkozas, oldalNev) => {
    if (!hivatkozas) {
      return false;
    }
    const kisbetusHivatkozas = hivatkozas.toLowerCase();
    return (
      kisbetusHivatkozas.endsWith(`/${oldalNev}`) ||
      kisbetusHivatkozas.endsWith(`\\${oldalNev}`) ||
      kisbetusHivatkozas === `./${oldalNev}` ||
      kisbetusHivatkozas === oldalNev
    );
  };

  // Ellenőrzi, hogy a jelenlegi oldal egyezik-e a megadott oldallal.
  const aktualisOldalE = (oldalNev) => oldalUtvonal.endsWith(`/${oldalNev}`) || oldalUtvonal.endsWith(`\\${oldalNev}`);

  // Kikeresi a menü adott nav-link elemét.
  const linkKeresese = (menuElem, oldalNev) =>
    Array.from(menuElem.querySelectorAll("a.nav-link")).find((linkElem) => authLinkE(linkElem.getAttribute("href"), oldalNev));

  // Létrehoz egy új nav-link elemet.
  const linkLetrehozasa = (oldalNev, cimke) => {
    const ujLink = document.createElement("a");
    ujLink.className = "nav-link";
    ujLink.href = `./${oldalNev}`;
    ujLink.textContent = cimke;
    return ujLink;
  };

  // Kijelentkeztetés és visszairányítás főoldalra.
  const kijelentkezesKezelese = () => {
    authTaroloUritese();
    window.location.replace("./index.html");
  };

  // Értesítési UI biztosítása a menüben.
  const ertesitesiUiBiztositasa = (menuElem) => {
    const meglevoKontener = document.getElementById("notificationContainer");
    if (meglevoKontener) {
      meglevoKontener.style.display = "block";
      return {
        container: meglevoKontener,
        icon: document.getElementById("notificationIcon"),
        badge: document.getElementById("notificationBadge"),
        dropdown: document.getElementById("notificationDropdown"),
      };
    }

    const ertesitesiKontener = document.createElement("div");
    ertesitesiKontener.id = "notificationContainer";
    ertesitesiKontener.className = "nav-item ms-lg-2";
    ertesitesiKontener.style.position = "relative";
    ertesitesiKontener.setAttribute("data-auth-nav", "notification");
    ertesitesiKontener.innerHTML = `
      <button id="notificationIcon" type="button" style="border:1px solid #dee2e6;background:#fff;border-radius:999px;width:36px;height:36px;line-height:1;position:relative;cursor:pointer;">&#128276;</button>
      <span id="notificationBadge" style="display:none;position:absolute;top:-4px;right:-4px;background:#d32f2f;color:white;border-radius:50%;min-width:18px;height:18px;padding:0 4px;font-size:11px;line-height:18px;text-align:center;">0</span>
      <div id="notificationDropdown" style="display:none;position:absolute;right:0;top:42px;width:320px;max-height:360px;overflow:auto;background:#fff;border:1px solid #dee2e6;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.15);z-index:1200;">
        <div style="padding:12px;color:#6c757d;">Nincsenek értesítések</div>
      </div>
    `;
    menuElem.appendChild(ertesitesiKontener);
    return {
      container: ertesitesiKontener,
      icon: ertesitesiKontener.querySelector("#notificationIcon"),
      badge: ertesitesiKontener.querySelector("#notificationBadge"),
      dropdown: ertesitesiKontener.querySelector("#notificationDropdown"),
    };
  };

  // Értesítések lekérése, kirajzolása és frissítése.
  const ertesitesekBeallitasa = (menuElem, felhasznalo) => {
    if (!felhasznalo) return;
    const felhasznaloAzonosito = felhasznalo.felhasznalo_id || felhasznalo.id || felhasznalo.userId;
    if (!felhasznaloAzonosito) return;

    const ertesitesiUi = ertesitesiUiBiztositasa(menuElem);
    if (!ertesitesiUi.icon || !ertesitesiUi.badge || !ertesitesiUi.dropdown) return;

    // Legfeljebb 20 értesítés kirajzolása és olvasatlan badge frissítése.
    const ertesitesekKirajzolasa = (ertesitesLista) => {
      const olvasatlanDarab = ertesitesLista.filter((ertesites) => !ertesites.olvasott).length;
      if (olvasatlanDarab > 0) {
        ertesitesiUi.badge.style.display = "block";
        ertesitesiUi.badge.textContent = String(olvasatlanDarab);
      } else {
        ertesitesiUi.badge.style.display = "none";
      }

      if (!ertesitesLista.length) {
        ertesitesiUi.dropdown.innerHTML = '<div style="padding:12px;color:#6c757d;">Nincsenek értesítések</div>';
        return;
      }

      ertesitesiUi.dropdown.innerHTML = ertesitesLista
        .slice(0, 20)
        .map(
          (ertesites) => `
          <div style="padding:10px 12px;border-bottom:1px solid #f1f3f5;">
            <div style="font-weight:600;color:${ertesites.olvasott ? "#495057" : "#d9480f"};">${ertesites.olvasott ? "Értesítés" : "Új értesítés"}</div>
            <div style="font-size:13px;color:#495057;margin-top:4px;">${ertesites.uzenet || ""}</div>
            <div style="font-size:11px;color:#868e96;margin-top:4px;">${new Date(ertesites.letrehozva).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}</div>
          </div>
        `
        )
        .join("");
    };

    // Értesítések frissítése backend API-ról.
    const frissites = async () => {
      try {
        const valasz = await fetch(`http://localhost:4000/api/notifications/${felhasznaloAzonosito}`);
        if (!valasz.ok) return;
        const ertesitesLista = await valasz.json();
        ertesitesekKirajzolasa(ertesitesLista);
      } catch (_) {}
    };

    if (!ertesitesiUi.icon.dataset.bound) {
      ertesitesiUi.icon.dataset.bound = "1";
      ertesitesiUi.icon.addEventListener("click", () => {
        ertesitesiUi.dropdown.style.display = ertesitesiUi.dropdown.style.display === "block" ? "none" : "block";
      });
      document.addEventListener("click", (esemeny) => {
        if (!ertesitesiUi.container.contains(esemeny.target)) {
          ertesitesiUi.dropdown.style.display = "none";
        }
      });
    }

    frissites();
    if (!window.__authNavNotifInterval) {
      window.__authNavNotifInterval = setInterval(frissites, 5000);
    }
  };

  navigaciosMenuk.forEach((menuElem) => {
    const temaElem = menuElem.querySelector('.nav-item:not([data-auth-nav="logout"])');

    if (!bejelentkezett) {
      const palyakLink = linkKeresese(menuElem, "palyak.html");
      if (palyakLink) {
        palyakLink.remove();
      }

      const meglevoKijelentkezes = menuElem.querySelector('[data-auth-nav="logout"]');
      if (meglevoKijelentkezes) {
        meglevoKijelentkezes.remove();
      }

      const vanBejelentkezesLink = Boolean(linkKeresese(menuElem, "bejelentkezes.html"));
      if (!vanBejelentkezesLink) {
        const bejelentkezesLink = linkLetrehozasa("bejelentkezes.html", "Bejelentkezés");
        if (temaElem) {
          menuElem.insertBefore(bejelentkezesLink, temaElem);
        } else {
          menuElem.appendChild(bejelentkezesLink);
        }
      }
      return;
    }

    const bejelentkezesLink = linkKeresese(menuElem, "bejelentkezes.html");
    if (bejelentkezesLink) {
      bejelentkezesLink.remove();
    }

    const regisztracioLink = linkKeresese(menuElem, "regisztracio.html");
    if (regisztracioLink) {
      regisztracioLink.remove();
    }

    const meglevoKijelentkezes = menuElem.querySelector('[data-auth-nav="logout"]');
    if (meglevoKijelentkezes) {
      meglevoKijelentkezes.remove();
    }
    const meglevoProfilLenyilo = menuElem.querySelector('[data-auth-nav="profile-dropdown"]');
    if (meglevoProfilLenyilo) {
      meglevoProfilLenyilo.remove();
    }

    const palyakLink = linkKeresese(menuElem, "palyak.html") || linkLetrehozasa("palyak.html", "Pályák");
    const kapcsolatLink = linkKeresese(menuElem, "kapcsolat.html");
    const meglevoFoglalasokLink = linkKeresese(menuElem, "bookings.html");
    if (meglevoFoglalasokLink) {
      meglevoFoglalasokLink.remove();
    }
    const meglevoProfilLink = linkKeresese(menuElem, "user_profile.html");
    if (meglevoProfilLink) {
      meglevoProfilLink.remove();
    }

    const felhasznalo = felhasznaloKiolvasasa();
    ertesitesekBeallitasa(menuElem, felhasznalo);

    const profilLenyilo = document.createElement("div");
    profilLenyilo.className = "nav-item dropdown";
    profilLenyilo.setAttribute("data-auth-nav", "profile-dropdown");

    const profilLenyiloGomb = document.createElement("a");
    profilLenyiloGomb.className = "nav-link dropdown-toggle";
    profilLenyiloGomb.href = "#";
    profilLenyiloGomb.setAttribute("role", "button");
    profilLenyiloGomb.setAttribute("data-bs-toggle", "dropdown");
    profilLenyiloGomb.setAttribute("aria-expanded", "false");
    profilLenyiloGomb.textContent = "Profil";

    const lenyiloMenu = document.createElement("ul");
    lenyiloMenu.className = "dropdown-menu dropdown-menu-end";

    const profilomElemLi = document.createElement("li");
    const profilomElem = document.createElement("a");
    profilomElem.className = "dropdown-item";
    profilomElem.href = "../profil/profil.html";
    profilomElem.textContent = "Profilom";
    profilomElemLi.appendChild(profilomElem);

    const kijelentkezesElemLi = document.createElement("li");
    const kijelentkezesElem = document.createElement("button");
    kijelentkezesElem.type = "button";
    kijelentkezesElem.className = "dropdown-item text-danger";
    kijelentkezesElem.textContent = "Kijelentkezés";
    kijelentkezesElem.addEventListener("click", kijelentkezesKezelese);
    kijelentkezesElemLi.appendChild(kijelentkezesElem);

    lenyiloMenu.appendChild(profilomElemLi);
    lenyiloMenu.appendChild(kijelentkezesElemLi);
    profilLenyilo.appendChild(profilLenyiloGomb);
    profilLenyilo.appendChild(lenyiloMenu);

    palyakLink.classList.toggle("active", aktualisOldalE("palyak.html"));
    profilLenyiloGomb.classList.toggle("active", aktualisOldalE("profil.html"));
    profilomElem.classList.toggle("active", aktualisOldalE("profil.html"));
    if (kapcsolatLink) {
      kapcsolatLink.classList.toggle("active", aktualisOldalE("kapcsolat.html"));
    }

    if (temaElem) {
      menuElem.insertBefore(palyakLink, temaElem);
      if (kapcsolatLink) {
        menuElem.insertBefore(kapcsolatLink, temaElem);
      }
      menuElem.insertBefore(profilLenyilo, temaElem);
    } else {
      menuElem.appendChild(palyakLink);
      if (kapcsolatLink) {
        menuElem.appendChild(kapcsolatLink);
      }
      menuElem.appendChild(profilLenyilo);
    }
  });
})();
