(function () {
  "use strict";

  var API_ALAP = "http://localhost:4000";
  var seged = window.ProfilSeged;
  var aktualisBerlesekKontener = document.getElementById("currentRentalsContainer");
  var lejartBerlesekKontener = document.getElementById("pastRentalsContainer");
  var aktualisBerlesekDarab = document.getElementById("currentRentalsCount");
  var lejartBerlesekDarab = document.getElementById("pastRentalsCount");
  var berlesKepekModalElem = document.getElementById("rentalImagesModal");
  var berlesKepekFoKep = document.getElementById("rentalImagesMain");
  var berlesKepekMiniaturak = document.getElementById("rentalImagesThumbs");
  var berlesKepekModal = berlesKepekModalElem ? bootstrap.Modal.getOrCreateInstance(berlesKepekModalElem) : null;
  var berlesKepekAzonositoSzerint = {};

  if (!seged || !aktualisBerlesekKontener || !lejartBerlesekKontener || !aktualisBerlesekDarab || !lejartBerlesekDarab) return;

  var felhasznaloBeolvasasa = seged.felhasznaloBeolvasasa;
  var felhasznaloAzonosito = seged.felhasznaloAzonosito;
  var kepUrlokFeldolgozasa = seged.kepUrlokFeldolgozasa;

  // Relatív képútvonalból teljes URL-t készít.
  function abszolutKepUrl(url) {
    return seged.abszolutKepUrl(API_ALAP, url, "https://github.com/mdo.png");
  }

  // Oldalsáv menüpontjait és profiladatait állítja be.
  function oldalsavBekotese(felhasznalo) {
    seged.oldalsavAlapBekotes({
      felhasznalo: felhasznalo,
      apiAlap: API_ALAP,
      loginUrl: "../fooldal/bejelentkezes.html"
    });

    var palyaimElemek = document.querySelectorAll('[data-sidebar-item="palyaim"]');
    var foglalasaimElemek = document.querySelectorAll('[data-sidebar-item="foglalasaim"]');
    var statisztikaElemek = document.querySelectorAll('[data-sidebar-item="statisztika"]');
    var palyatulajdonosE = felhasznalo.szerep === "palyatulajdonos";
    palyaimElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    foglalasaimElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    statisztikaElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
  }

  // Foglalás státuszához olvasható feliratot ad.
  function statuszSzoveg(statusz) {
    if (statusz === "pending") return "Függőben";
    if (statusz === "accepted") return "Elfogadva";
    return "Elutasítva";
  }

  // Foglalás státuszához badge osztályt ad.
  function statuszJelvenyOsztaly(statusz) {
    if (statusz === "pending") return "text-bg-warning";
    if (statusz === "accepted") return "text-bg-success";
    return "text-bg-danger";
  }

  // ISO dátumot magyar dátum-idő formátumban ad vissza.
  function datumIdoFormazasa(iso) {
    var datum = new Date(iso);
    return datum.toLocaleDateString("hu-HU") + " " + datum.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  // A foglalás befejezési idejét adja vissza Date-ként.
  function foglalasVegeIdopont(foglalas) {
    return new Date(foglalas.vege);
  }

  // Eldönti, hogy a foglalás az aktuális listába tartozik-e.
  function aktualisFoglalasE(foglalas) {
    if (foglalas.statusz === "rejected") return false;
    return foglalasVegeIdopont(foglalas) >= new Date();
  }

  // Egy foglalás kártyájának HTML-jét állítja elő.
  function kartyaRenderelese(foglalas) {
    var kepUrlok = kepUrlokFeldolgozasa(foglalas.kep_url);
    var kepekGomb = kepUrlok.length
      ? '<button class="btn btn-outline-primary btn-sm" type="button" data-action="images" data-id="' + foglalas.foglalas_id + '">Képek megtekintése</button>'
      : "";
    return (
      '<div class="col-12 col-md-6">' +
      '<div class="card shadow-sm h-100"><div class="card-body">' +
      '<h3 class="h6 mb-1">' + foglalas.palya_nev + "</h3>" +
      '<p class="text-muted mb-2">' + foglalas.sportag + " - " + foglalas.helyszin + "</p>" +
      '<p class="mb-1"><strong>Ár:</strong> ' + seged.arSzoveg(foglalas.ar, " Ft") + "</p>" +
      '<p class="mb-1"><strong>Kezdés:</strong> ' + datumIdoFormazasa(foglalas.kezdes) + "</p>" +
      '<p class="mb-2"><strong>Vége:</strong> ' + datumIdoFormazasa(foglalas.vege) + "</p>" +
      '<p class="mb-0"><span class="badge ' + statuszJelvenyOsztaly(foglalas.statusz) + '">' + statuszSzoveg(foglalas.statusz) + "</span></p>" +
      '<div class="mt-3">' + kepekGomb + '</div>' +
      "</div></div>" +
      "</div>"
    );
  }

  // A foglalás képeit modal ablakban megnyitja.
  function kepekModalMegnyitasa(foglalasId) {
    if (!berlesKepekModal || !berlesKepekFoKep || !berlesKepekMiniaturak) return;
    var urlok = berlesKepekAzonositoSzerint[foglalasId] || [];
    if (!urlok.length) return;

    var abszolutUrlok = urlok.map(function (url) { return abszolutKepUrl(url); });
    berlesKepekFoKep.src = abszolutUrlok[0];
    berlesKepekMiniaturak.innerHTML = abszolutUrlok.map(function (url, index) {
      return '<img src="' + url + '" alt="Pályakép ' + (index + 1) + '" class="booking-image-thumb" data-action="thumb" data-src="' + url + '">';
    }).join("");
    berlesKepekModal.show();
  }

  // A megadott listát kirendereli a cél konténerbe.
  function listaRenderelese(kontener, lista) {
    if (!lista.length) {
      kontener.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Nincs megjeleníthető foglalás.</div></div>';
      return;
    }
    kontener.innerHTML = lista.map(function (foglalas) { return kartyaRenderelese(foglalas); }).join("");
  }

  // Az aktuális és lejárt bérlések nézetét frissíti.
  function berlesekRenderelese(berlesek) {
    berlesKepekAzonositoSzerint = {};
    berlesek.forEach(function (foglalas) {
      berlesKepekAzonositoSzerint[foglalas.foglalas_id] = kepUrlokFeldolgozasa(foglalas.kep_url);
    });

    var aktualisak = berlesek
      .filter(function (foglalas) { return aktualisFoglalasE(foglalas); })
      .sort(function (a, b) { return new Date(a.kezdes) - new Date(b.kezdes); });

    var lejartak = berlesek
      .filter(function (foglalas) { return !aktualisFoglalasE(foglalas); })
      .sort(function (a, b) { return new Date(b.kezdes) - new Date(a.kezdes); });

    aktualisBerlesekDarab.textContent = String(aktualisak.length);
    lejartBerlesekDarab.textContent = String(lejartak.length);
    listaRenderelese(aktualisBerlesekKontener, aktualisak);
    listaRenderelese(lejartBerlesekKontener, lejartak);
  }

  [aktualisBerlesekKontener, lejartBerlesekKontener].forEach(function (kontener) {
    kontener.addEventListener("click", function (esemeny) {
      var gomb = esemeny.target.closest('button[data-action="images"]');
      if (!gomb) return;
      var foglalasId = Number(gomb.getAttribute("data-id"));
      if (!foglalasId) return;
      kepekModalMegnyitasa(foglalasId);
    });
  });

  if (berlesKepekMiniaturak) {
    berlesKepekMiniaturak.addEventListener("click", function (esemeny) {
      var miniatKep = esemeny.target.closest('img[data-action="thumb"]');
      if (!miniatKep || !berlesKepekFoKep) return;
      var forras = miniatKep.getAttribute("data-src") || "";
      if (!forras) return;
      berlesKepekFoKep.src = forras;
    });
  }

  // A bérléseket lekéri az API-ból és kirendereli.
  async function berlesekBetoltese(felhasznaloId) {
    var valasz = await fetch(API_ALAP + "/api/bookings/renter/" + felhasznaloId);
    if (!valasz.ok) throw new Error("Bérlések lekérése sikertelen");
    var berlesek = await valasz.json();
    berlesekRenderelese(berlesek);
  }

  var felhasznalo = felhasznaloBeolvasasa();
  if (!felhasznalo) {
    window.location.href = "../fooldal/bejelentkezes.html";
    return;
  }
  if (felhasznalo.szerep !== "berlo" && felhasznalo.szerep !== "palyatulajdonos") {
    window.location.href = "../fooldal/bejelentkezes.html";
    return;
  }

  oldalsavBekotese(felhasznalo);
  berlesekBetoltese(felhasznaloAzonosito(felhasznalo)).catch(function (hiba) {
    console.error(hiba);
    aktualisBerlesekKontener.innerHTML = '<div class="col-12"><div class="alert alert-danger mb-0">Hiba a bérlések betöltésekor.</div></div>';
    lejartBerlesekKontener.innerHTML = "";
  });
})();
