(function () {
    "use strict";

    var TEMA_KULCS = "theme";
    var SOTET_TEMA = "dark";
    var VILAGOS_TEMA = "light";
    var VALTO_GOMB_SELECTOR = "#themeToggle";
    var GLOBALIS_TEMA_STYLE_ID = "global-theme-overrides";

    // Közös dark-mode felülírás a profil/admin oldalakhoz.
    function globalisTemaStilusBiztositasa() {
        if (document.getElementById(GLOBALIS_TEMA_STYLE_ID)) return;

        var stilus = document.createElement("style");
        stilus.id = GLOBALIS_TEMA_STYLE_ID;
        stilus.textContent = `
      [data-bs-theme="dark"] {
        --bg: #0e141d !important;
        --surface: #171f2b !important;
        --border: #2a3648 !important;
        --text: #e8eef8 !important;
        --muted: #9eacc2 !important;
        --shadow-soft: 0 12px 28px rgba(0, 0, 0, 0.35) !important;
        --shadow-medium: 0 18px 40px rgba(0, 0, 0, 0.48) !important;
      }

      [data-bs-theme="dark"] body {
        color: var(--text) !important;
        background:
          radial-gradient(circle at 7% -10%, rgba(255, 122, 24, 0.2), transparent 34%),
          radial-gradient(circle at 100% 110%, rgba(255, 155, 61, 0.16), transparent 40%),
          var(--bg) !important;
      }

      [data-bs-theme="dark"] .topbar {
        background: rgba(16, 23, 34, 0.86) !important;
        border-bottom-color: rgba(255, 122, 24, 0.35) !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
      }

      [data-bs-theme="dark"] .menu-toggle {
        color: #ffa45f !important;
      }

      [data-bs-theme="dark"] .sidebar-desktop,
      [data-bs-theme="dark"] .offcanvas {
        background:
          linear-gradient(180deg, rgba(255, 122, 24, 0.13), transparent 220px),
          var(--surface) !important;
        border-color: var(--border) !important;
        box-shadow: 10px 0 30px rgba(0, 0, 0, 0.38) !important;
      }

      [data-bs-theme="dark"] .sidebar-brand,
      [data-bs-theme="dark"] .offcanvas-header,
      [data-bs-theme="dark"] .sidebar-user-wrap {
        border-color: rgba(255, 122, 24, 0.3) !important;
      }

      [data-bs-theme="dark"] .sidebar-brand a,
      [data-bs-theme="dark"] .offcanvas-title {
        color: #f3f7ff !important;
      }

      [data-bs-theme="dark"] .sidebar-links li {
        border-bottom-color: rgba(42, 54, 72, 0.85) !important;
      }

      [data-bs-theme="dark"] .sidebar-link {
        color: #aebbd0 !important;
      }

      [data-bs-theme="dark"] .sidebar-link:hover,
      [data-bs-theme="dark"] .sidebar-link.is-active {
        color: #ffd2ae !important;
        background: linear-gradient(90deg, rgba(255, 122, 24, 0.24), rgba(255, 155, 61, 0.1)) !important;
      }

      [data-bs-theme="dark"] .main-content h1,
      [data-bs-theme="dark"] .main-content h2,
      [data-bs-theme="dark"] .main-content h3,
      [data-bs-theme="dark"] .main-content h4,
      [data-bs-theme="dark"] .main-content h5,
      [data-bs-theme="dark"] .main-content h6,
      [data-bs-theme="dark"] .text-dark {
        color: var(--text) !important;
      }

      [data-bs-theme="dark"] .text-muted,
      [data-bs-theme="dark"] .text-body-secondary {
        color: var(--muted) !important;
      }

      [data-bs-theme="dark"] .main-content > section,
      [data-bs-theme="dark"] .card,
      [data-bs-theme="dark"] .modal-content,
      [data-bs-theme="dark"] .alert,
      [data-bs-theme="dark"] .border.rounded {
        background: var(--surface) !important;
        border-color: var(--border) !important;
        box-shadow: var(--shadow-soft) !important;
      }

      [data-bs-theme="dark"] .table,
      [data-bs-theme="dark"] .table > :not(caption) > * > * {
        --bs-table-bg: transparent;
        --bs-table-color: var(--text);
        --bs-table-border-color: var(--border);
      }

      [data-bs-theme="dark"] .list-group-item {
        background: transparent !important;
        border-color: var(--border) !important;
        color: var(--text) !important;
      }

      [data-bs-theme="dark"] .form-control,
      [data-bs-theme="dark"] .form-select,
      [data-bs-theme="dark"] .input-group-text {
        background: #111927 !important;
        border-color: #33435a !important;
        color: var(--text) !important;
      }

      [data-bs-theme="dark"] .form-control::placeholder {
        color: #8190a8 !important;
      }

      [data-bs-theme="dark"] .form-control:focus,
      [data-bs-theme="dark"] .form-select:focus {
        border-color: rgba(255, 122, 24, 0.72) !important;
        box-shadow: 0 0 0 0.2rem rgba(255, 122, 24, 0.22) !important;
      }

      [data-bs-theme="dark"] .btn-outline-secondary,
      [data-bs-theme="dark"] .btn-outline-primary {
        color: #ffb884 !important;
        border-color: rgba(255, 122, 24, 0.55) !important;
      }

      [data-bs-theme="dark"] .btn-outline-secondary:hover,
      [data-bs-theme="dark"] .btn-outline-primary:hover {
        color: #ffe4cf !important;
        background: rgba(255, 122, 24, 0.2) !important;
        border-color: rgba(255, 155, 61, 0.65) !important;
      }

      [data-bs-theme="dark"] .btn-close {
        filter: invert(1) grayscale(100%);
      }
    `;

        document.head.appendChild(stilus);
    }

    // Biztonságosan normalizálja a téma értéket dark/light párosra.
    function temaNormalizalasa(ertek) {
        return ertek === SOTET_TEMA ? SOTET_TEMA : VILAGOS_TEMA;
    }

    // Kiolvassa a mentett témát a localStorage-ból.
    function mentettTemaOlvasasa() {
        return temaNormalizalasa(localStorage.getItem(TEMA_KULCS));
    }

    // Eldönti az induló témát: mentett érték vagy rendszerbeállítás.
    function kezdoTemaMeghatarozasa() {
        var mentettTema = localStorage.getItem(TEMA_KULCS);
        if (mentettTema === SOTET_TEMA || mentettTema === VILAGOS_TEMA) return mentettTema;

        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return SOTET_TEMA;
        }
        return VILAGOS_TEMA;
    }

    // Alkalmazza a témát a dokumentumon és elmenti a localStorage-ba.
    function temaAlkalmazasa(tema) {
        var normalizaltTema = temaNormalizalasa(tema);
        document.documentElement.setAttribute("data-bs-theme", normalizaltTema);
        localStorage.setItem(TEMA_KULCS, normalizaltTema);
        return normalizaltTema;
    }

    // Frissíti a téma váltó gomb szövegét és outline osztályait.
    function valtoGombFrissitese(gombElem, aktivTema) {
        if (!gombElem) return;

        if (aktivTema === SOTET_TEMA) {
            gombElem.textContent = "\u2600\uFE0F Light";
        } else {
            gombElem.textContent = "\uD83C\uDF19 Dark";
        }

        var outlineStilusosGomb = gombElem.classList.contains("btn-outline-secondary") || gombElem.classList.contains("btn-outline-light");

        if (!outlineStilusosGomb) return;

        if (aktivTema === SOTET_TEMA) {
            gombElem.classList.remove("btn-outline-secondary");
            gombElem.classList.add("btn-outline-light");
            return;
        }

        gombElem.classList.remove("btn-outline-light");
        gombElem.classList.add("btn-outline-secondary");
    }

    // Inicializálja a témát és beköti a váltó gomb kattintáskezelőjét.
    function inicializalas(opciok) {
        var beallitasok = opciok || {};
        var gombSelector = beallitasok.valtoGombSelector || VALTO_GOMB_SELECTOR;
        var valtoGomb = document.querySelector(gombSelector);
        globalisTemaStilusBiztositasa();
        var kezdoTema = temaAlkalmazasa(beallitasok.tema || kezdoTemaMeghatarozasa());
        valtoGombFrissitese(valtoGomb, kezdoTema);

        if (!valtoGomb || valtoGomb.dataset.temaControllerKotve === "1") {
            return kezdoTema;
        }

        valtoGomb.dataset.temaControllerKotve = "1";
        valtoGomb.addEventListener("click", function () {
            var jelenlegiTema = document.documentElement.getAttribute("data-bs-theme");
            var kovetkezoTema = temaNormalizalasa(jelenlegiTema) === SOTET_TEMA ? VILAGOS_TEMA : SOTET_TEMA;
            var aktivTema = temaAlkalmazasa(kovetkezoTema);
            valtoGombFrissitese(valtoGomb, aktivTema);
        });

        return kezdoTema;
    }

    // Beállítja a megadott témát és frissíti a gombállapotot.
    function temaBeallitasa(tema) {
        var aktivTema = temaAlkalmazasa(tema);
        valtoGombFrissitese(document.querySelector(VALTO_GOMB_SELECTOR), aktivTema);
        return aktivTema;
    }

    // Átváltja az aktuális témát világos és sötét mód között.
    function temaAtvaltasa() {
        var jelenlegiTema = document.documentElement.getAttribute("data-bs-theme");
        return temaBeallitasa(temaNormalizalasa(jelenlegiTema) === SOTET_TEMA ? VILAGOS_TEMA : SOTET_TEMA);
    }

    // Publikus API-t ad a globális window objektumon keresztül.
    window.TemaController = {
        inicializalas: inicializalas,
        aktualisTema: mentettTemaOlvasasa,
        temaBeallitasa: temaBeallitasa,
        temaAtvaltasa: temaAtvaltasa,
    };

    // Automatikusan elindítja az inicializálást dokumentum betöltés után.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            inicializalas();
        });
        return;
    }

    inicializalas();
})();
