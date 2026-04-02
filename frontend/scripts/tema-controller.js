(function () {
  "use strict";

  var TEMA_KULCS = "theme";
  var SOTET_TEMA = "dark";
  var VILAGOS_TEMA = "light";
  var VALTO_GOMB_SELECTOR = "#themeToggle";

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

    var outlineStilusosGomb =
      gombElem.classList.contains("btn-outline-secondary") ||
      gombElem.classList.contains("btn-outline-light");

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
