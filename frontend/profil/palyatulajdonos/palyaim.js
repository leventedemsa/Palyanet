/* global bootstrap: false */
(function () {
  "use strict";

  var API_ALAP = "http://localhost:4000";
  var seged = window.ProfilSeged;
  if (!seged) return;

  var felhasznaloBeolvasasa = seged.felhasznaloBeolvasasa;
  var felhasznaloAzonosito = seged.felhasznaloAzonosito;
  var hibaMegjelenitese = seged.hibaMegjelenitese;
  var muveletMegerositese = seged.muveletMegerositese;
  var kepUrlokFeldolgozasa = seged.kepUrlokFeldolgozasa;

  // Ellenőrzi a belépést, és hiány esetén a login oldalra irányít.
  function bejelentkezesEllenorzese() {
    var felhasznalo = felhasznaloBeolvasasa();
    if (!felhasznalo) {
      window.location.href = "../../login.html";
      return null;
    }
    return felhasznalo;
  }

  // Relatív képútvonalból teljes URL-t készít.
  function abszolutKepUrl(url) {
    return seged.abszolutKepUrl(API_ALAP, url, "");
  }

  // Oldalsáv menüpontjait és profiladatait állítja be.
  function oldalsavBekotese(felhasznalo) {
    var palyaimElemek = document.querySelectorAll('[data-sidebar-item="palyaim"]');
    var foglalasaimElemek = document.querySelectorAll('[data-sidebar-item="foglalasaim"]');
    var statisztikaElemek = document.querySelectorAll('[data-sidebar-item="statisztika"]');
    var berleseimElemek = document.querySelectorAll('[data-sidebar-item="berleseim"]');
    var palyatulajdonosE = felhasznalo.szerep === "palyatulajdonos";

    palyaimElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    foglalasaimElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    statisztikaElemek.forEach(function (elem) { elem.style.display = palyatulajdonosE ? "" : "none"; });
    berleseimElemek.forEach(function (elem) { elem.style.display = ""; });

    seged.oldalsavAlapBekotes({
      felhasznalo: felhasznalo,
      apiAlap: API_ALAP,
      loginUrl: "../../login.html"
    });
  }

  // A pályáim oldal működését inicializálja és kezeli.
  async function palyaimOldalBetoltese(felhasznalo) {
    var sajatPalyakLista = document.getElementById("myFieldsList");
    var palyaModalElem = document.getElementById("ujPalyaModal");
    var palyaModalUrlap = document.getElementById("ujPalyaForm");
    var palyaModalMentesGomb = document.getElementById("ujPalyaKuldBtn");
    if (!sajatPalyakLista || !palyaModalElem || !palyaModalUrlap || !palyaModalMentesGomb) return;

    if (felhasznalo.szerep !== "palyatulajdonos") {
      window.location.href = "../berleseim.html";
      return;
    }

    var modalCim = document.getElementById("ujPalyaModalTitle");
    var modalPalyaIdMezo = document.getElementById("modalPalyaId");
    var modalNevMezo = document.getElementById("modalNev");
    var modalSportagMezo = document.getElementById("modalSportag");
    var modalHelyszinMezo = document.getElementById("modalHelyszin");
    var modalArMezo = document.getElementById("modalAr");
    var modalKepUrlMezo = document.getElementById("modalKepUrl");
    var modalKepekMezo = document.getElementById("modalKepek");
    var modalKepekEloNezet = document.getElementById("modalKepekPreview");
    var modalLeirasMezo = document.getElementById("modalLeiras");
    var modalNyitasMezo = document.getElementById("modalNyitas");
    var modalZarasMezo = document.getElementById("modalZaras");
    var ujPalyaModalNyitasGomb = document.getElementById("openAddFieldModalButton");
    var helyszinValasztoMegnyitasGomb = document.getElementById("modalHelyszinValasztoBtn");
    var helyszinValasztoModalElem = document.getElementById("helyszinValasztoModal");
    var helyszinValasztoModal = helyszinValasztoModalElem ? bootstrap.Modal.getOrCreateInstance(helyszinValasztoModalElem) : null;
    var helyszinKivalasztGomb = document.getElementById("palyaimHelyszinKivalasztBtn");
    var helyszinTorlesGomb = document.getElementById("palyaimHelyszinTorlesBtn");
    var kivalasztottHelyszinDoboz = document.getElementById("kivalasztottHelyszinekPalyaim");
    var palyaModal = bootstrap.Modal.getOrCreateInstance(palyaModalElem);
    var palyak = [];
    var szerkesztettPalyaId = null;
    var kivalasztottHelyszin = "";
    var helyszinModalraValtasFolyamatban = false;
    var palyaModalVisszanyitasHelyszinModalUtan = false;
    var feltoltottKepUrlok = [];

    var budapestKeruletek = Array.from({ length: 23 }, function (_, i) {
      return arabSzamRolRomaira(i + 1) + ". kerület";
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

    // Arab számot római számmá alakít.
    function arabSzamRolRomaira(szam) {
      var terkep = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
      var eredmeny = "";
      var maradek = szam;
      terkep.forEach(function (par) {
        var ertek = par[0];
        var jel = par[1];
        while (maradek >= ertek) {
          eredmeny += jel;
          maradek -= ertek;
        }
      });
      return eredmeny;
    }

    // Helyszín rádió opciókat renderel a megadott konténerbe.
    function helyszinOpcioRenderelese(kontenerAzonosito, elemek, azonositoEloTag) {
      var gyoker = document.getElementById(kontenerAzonosito);
      if (!gyoker) return;
      gyoker.innerHTML = elemek.map(function (elem, index) {
        var azonosito = azonositoEloTag + "_" + index;
        return (
          '<div class="col-12 col-md-4">' +
            '<div class="form-check mb-2">' +
              '<input class="form-check-input palyaim-helyszin-choice" type="radio" name="palyaimHelyszinChoice" id="' + azonosito + '" value="' + elem + '">' +
              '<label class="form-check-label" for="' + azonosito + '">' + elem + "</label>" +
            "</div>" +
          "</div>"
        );
      }).join("");
    }

    // A kiválasztott helyszín összefoglalóját frissíti a modalban.
    function helyszinOsszegzesFrissitese() {
      if (!kivalasztottHelyszinDoboz) return;
      if (!kivalasztottHelyszin) {
        kivalasztottHelyszinDoboz.innerHTML = '<span class="text-body-secondary">Nincs kiválasztott helyszín</span>';
        modalHelyszinMezo.value = "";
        return;
      }

      kivalasztottHelyszinDoboz.innerHTML =
        '<span class="badge rounded-pill text-bg-success fs-6 px-3 py-2">' + kivalasztottHelyszin + "</span>";
      modalHelyszinMezo.value = kivalasztottHelyszin;
    }

    // A helyszín rádiógombokat szinkronizálja az aktuális kiválasztással.
    function helyszinRadioSzinkronizalasa() {
      document.querySelectorAll(".palyaim-helyszin-choice").forEach(function (radio) {
        radio.checked = radio.value === kivalasztottHelyszin;
      });
    }

    // A helyszínválasztó modal tartalmát inicializálja.
    function helyszinValasztoModalInditasa() {
      helyszinOpcioRenderelese("palyaimBudapestKeruletekContainer", budapestKeruletek, "palyaim_kerulet");
      helyszinOpcioRenderelese("palyaimMegyekContainer", megyek, "palyaim_megye");
      helyszinOpcioRenderelese("palyaimVarosokContainer", varosok, "palyaim_varos");
      helyszinRadioSzinkronizalasa();
      helyszinOsszegzesFrissitese();

      document.querySelectorAll(".palyaim-helyszin-choice").forEach(function (radio) {
        radio.addEventListener("change", function (esemeny) {
          kivalasztottHelyszin = esemeny.target.value || "";
          helyszinOsszegzesFrissitese();
        });
      });
    }

    // A pálya elsődleges képét adja vissza megjelenítéshez.
    function elsoKepLekerdezese(palya) {
      var kepLista = kepUrlokFeldolgozasa(palya && palya.kep_url);
      if (kepLista.length) return abszolutKepUrl(kepLista[0]);
      return "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1000&q=80&auto=format&fit=crop";
    }

    // A modal kiválasztott képeinek előnézetét frissíti.
    function modalKepEloNezetRenderelese() {
      if (!modalKepekEloNezet) return;
      var kepek = feltoltottKepUrlok.slice();
      if (!kepek.length) {
        modalKepekEloNezet.innerHTML = '<span class="text-muted small">Nincs kiválasztott kép.</span>';
        return;
      }
      modalKepekEloNezet.innerHTML = kepek.map(function (kepUrl) {
        var abszolut = abszolutKepUrl(kepUrl);
        return '<img src="' + abszolut + '" alt="Pályakép" style="width:92px;height:64px;object-fit:cover;border-radius:10px;border:1px solid #e9ecef;">';
      }).join("");
    }

    // A modalban kiválasztott képfájlokat feltölti a szerverre.
    async function kivalasztottKepekFeltoltese() {
      if (!modalKepekMezo || !modalKepekMezo.files || !modalKepekMezo.files.length) {
        return [];
      }

      var formAdat = new FormData();
      Array.from(modalKepekMezo.files).forEach(function (fajl) {
        formAdat.append("images", fajl);
      });

      var valasz = await fetch(API_ALAP + "/api/palyak/upload-images", {
        method: "POST",
        body: formAdat,
      });
      var adat = await valasz.json().catch(function () { return {}; });
      if (!valasz.ok) {
        throw new Error(adat.error || adat.message || "Képfeltöltés sikertelen");
      }
      return Array.isArray(adat.urls) ? adat.urls : [];
    }

    // A saját pályák kártyáit kirendereli.
    function palyakRenderelese() {
      if (!palyak.length) {
        sajatPalyakLista.innerHTML = '<div class="col-12"><div class="alert alert-light border mb-0">Még nincs saját pálya.</div></div>';
        return;
      }

      sajatPalyakLista.innerHTML = palyak.map(function (palya) {
        var kep = palya.kep_url && palya.kep_url.trim()
          ? elsoKepLekerdezese(palya)
          : "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1000&q=80&auto=format&fit=crop";
        return (
          '<div class="col-12 col-md-6 col-lg-4">' +
            '<div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">' +
              '<div class="ratio ratio-16x9">' +
                '<img src="' + kep + '" class="w-100 h-100 object-fit-cover" alt="' + palya.nev + '">' +
              "</div>" +
              '<div class="card-body p-3 p-lg-4 d-flex flex-column">' +
                '<h3 class="h6 mb-2">' + palya.nev + "</h3>" +
                '<p class="small mb-2 lh-sm"><strong>Sportág:</strong> ' + palya.sportag + "</p>" +
                '<p class="small mb-2 lh-sm"><strong>Helyszín:</strong> ' + palya.helyszin + "</p>" +
                '<p class="small mb-2 lh-sm"><strong>Ár:</strong> ' + seged.arSzoveg(palya.ar_ora, " Ft/óra") + "</p>" +
                '<p class="small mb-0 lh-sm"><strong>Foglalások száma:</strong> ' + (palya.foglalasok_szama || 0) + "</p>" +
                '<div class="d-flex gap-2 mt-3 mt-auto">' +
                  '<button class="btn btn-outline-primary btn-sm flex-fill mt-2" type="button" data-action="edit" data-id="' + palya.palya_id + '">Módosítás</button>' +
                  '<button class="btn btn-outline-danger btn-sm flex-fill mt-2" type="button" data-action="delete" data-id="' + palya.palya_id + '">Törlés</button>' +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>"
        );
      }).join("");
    }

    // A pálya modal űrlapot alaphelyzetbe állítja.
    function modalUrlapAlaphelyzetbe() {
      szerkesztettPalyaId = null;
      if (modalPalyaIdMezo) modalPalyaIdMezo.value = "";
      palyaModalUrlap.reset();
      modalNyitasMezo.value = "08:00";
      modalZarasMezo.value = "20:00";
      kivalasztottHelyszin = "";
      feltoltottKepUrlok = [];
      if (modalKepekMezo) modalKepekMezo.value = "";
      modalKepEloNezetRenderelese();
      helyszinRadioSzinkronizalasa();
      helyszinOsszegzesFrissitese();
      if (modalCim) modalCim.textContent = "Új pálya hozzáadása";
      palyaModalMentesGomb.textContent = "Hozzáadás";
    }

    // Időértéket a time input mező formátumára vág.
    function idoMezoErteke(ertek, alapertelmezett) {
      if (!ertek) return alapertelmezett;
      return String(ertek).slice(0, 5);
    }

    // Kiválasztott pálya adatait betölti szerkesztéshez.
    function szerkesztesInditasa(palyaId) {
      var palya = palyak.find(function (elem) { return Number(elem.palya_id) === Number(palyaId); });
      if (!palya) return;

      szerkesztettPalyaId = Number(palya.palya_id);
      if (modalPalyaIdMezo) modalPalyaIdMezo.value = String(szerkesztettPalyaId);
      modalNevMezo.value = palya.nev || "";
      modalSportagMezo.value = palya.sportag || "";
      modalHelyszinMezo.value = palya.helyszin || "";
      kivalasztottHelyszin = palya.helyszin || "";
      helyszinRadioSzinkronizalasa();
      helyszinOsszegzesFrissitese();
      modalArMezo.value = String(palya.ar_ora || "");
      modalKepUrlMezo.value = palya.kep_url || "";
      feltoltottKepUrlok = kepUrlokFeldolgozasa(palya.kep_url);
      if (feltoltottKepUrlok.length > 1 || (feltoltottKepUrlok[0] && feltoltottKepUrlok[0].startsWith("/uploads/"))) {
        modalKepUrlMezo.value = "";
      }
      if (modalKepekMezo) modalKepekMezo.value = "";
      modalKepEloNezetRenderelese();
      modalLeirasMezo.value = palya.leiras || "";
      modalNyitasMezo.value = idoMezoErteke(palya.nyitas, "08:00");
      modalZarasMezo.value = idoMezoErteke(palya.zaras, "20:00");
      if (modalCim) modalCim.textContent = "Pálya módosítása";
      palyaModalMentesGomb.textContent = "Mentés";
      palyaModal.show();
    }

    // Egy pályát megerősítés után töröl.
    async function palyaTorlese(palyaId) {
      var megerosites = await muveletMegerositese("Biztosan törölni szeretnéd ezt a pályát?");
      if (!megerosites.isConfirmed) return;
      try {
        var valasz = await fetch(API_ALAP + "/api/palyak/" + palyaId, { method: "DELETE" });
        var adat = await valasz.json().catch(function () { return {}; });
        if (!valasz.ok) throw new Error(adat.error || adat.message || "Törlési hiba");
        await palyakLekerdezese();
      } catch (hiba) {
        console.error(hiba);
        hibaMegjelenitese("Hiba a pálya törlésekor: " + hiba.message);
      }
    }

    // A tulajdonos pályáit lekéri és frissíti a listát.
    async function palyakLekerdezese() {
      try {
        var valasz = await fetch(API_ALAP + "/api/palyak/owner/" + felhasznaloAzonosito(felhasznalo));
        if (!valasz.ok) throw new Error("Pálya lekérési hiba");
        palyak = await valasz.json();
        palyakRenderelese();
      } catch (hiba) {
        console.error(hiba);
        sajatPalyakLista.innerHTML = '<div class="col-12"><div class="alert alert-danger mb-0">Hiba a pályák betöltésekor.</div></div>';
      }
    }

    // A modal űrlap adatait validálja és menti.
    async function modalMentes() {
      if (!palyaModalUrlap.checkValidity()) {
        palyaModalUrlap.reportValidity();
        return;
      }

      var kuldendoAdat = {
        tulaj_id: felhasznaloAzonosito(felhasznalo),
        nev: modalNevMezo.value.trim(),
        sportag: modalSportagMezo.value,
        helyszin: modalHelyszinMezo.value.trim(),
        ar_ora: Number(modalArMezo.value),
        kep_url: "",
        leiras: modalLeirasMezo.value.trim(),
        nyitas: modalNyitasMezo.value,
        zaras: modalZarasMezo.value
      };

      try {
        var ujFeltoltottKepek = await kivalasztottKepekFeltoltese();
        if (ujFeltoltottKepek.length) {
          feltoltottKepUrlok = ujFeltoltottKepek;
        }

        var manualisKepUrl = modalKepUrlMezo.value.trim();
        var osszesKep = feltoltottKepUrlok.slice();
        if (manualisKepUrl) {
          osszesKep.unshift(manualisKepUrl);
        }
        osszesKep = osszesKep.filter(function (url, index, tomb) {
          return url && tomb.indexOf(url) === index;
        });

        if (osszesKep.length > 1) {
          kuldendoAdat.kep_url = JSON.stringify(osszesKep);
        } else if (osszesKep.length === 1) {
          kuldendoAdat.kep_url = osszesKep[0];
        }

        var vegpont = szerkesztettPalyaId ? (API_ALAP + "/api/palyak/" + szerkesztettPalyaId) : (API_ALAP + "/api/palyak");
        var httpMetodus = szerkesztettPalyaId ? "PUT" : "POST";
        var valasz = await fetch(vegpont, {
          method: httpMetodus,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(kuldendoAdat)
        });
        var adat = await valasz.json();
        if (!valasz.ok) throw new Error(adat.error || adat.message || "Mentési hiba");

        modalUrlapAlaphelyzetbe();
        palyaModal.hide();
        await palyakLekerdezese();
      } catch (hiba) {
        console.error(hiba);
        hibaMegjelenitese("Hiba a pálya mentésekor: " + hiba.message);
      }
    }

    palyaModalMentesGomb.addEventListener("click", modalMentes);
    palyaModalUrlap.addEventListener("submit", function (esemeny) {
      esemeny.preventDefault();
      modalMentes();
    });
    if (ujPalyaModalNyitasGomb) {
      ujPalyaModalNyitasGomb.addEventListener("click", function () {
        modalUrlapAlaphelyzetbe();
      });
    }
    if (helyszinValasztoMegnyitasGomb && helyszinValasztoModal) {
      helyszinValasztoMegnyitasGomb.addEventListener("click", function (esemeny) {
        esemeny.preventDefault();
        helyszinRadioSzinkronizalasa();
        helyszinOsszegzesFrissitese();
        helyszinModalraValtasFolyamatban = true;
        palyaModalVisszanyitasHelyszinModalUtan = true;
        palyaModal.hide();
      });
    }
    if (modalKepekMezo) {
      modalKepekMezo.addEventListener("change", function () {
        var kivalasztottFajlok = Array.from(modalKepekMezo.files || []);
        if (!kivalasztottFajlok.length) {
          return;
        }
        feltoltottKepUrlok = kivalasztottFajlok.map(function (fajl) {
          return URL.createObjectURL(fajl);
        });
        modalKepEloNezetRenderelese();
      });
    }
    if (helyszinTorlesGomb) {
      helyszinTorlesGomb.addEventListener("click", function () {
        kivalasztottHelyszin = "";
        helyszinRadioSzinkronizalasa();
        helyszinOsszegzesFrissitese();
      });
    }
    if (helyszinKivalasztGomb) {
      helyszinKivalasztGomb.addEventListener("click", function () {
        helyszinOsszegzesFrissitese();
        if (helyszinValasztoModal) helyszinValasztoModal.hide();
      });
    }

    sajatPalyakLista.addEventListener("click", function (esemeny) {
      var gomb = esemeny.target.closest("button[data-action]");
      if (!gomb) return;
      var muvelet = gomb.getAttribute("data-action");
      var palyaId = Number(gomb.getAttribute("data-id"));
      if (!palyaId) return;
      if (muvelet === "edit") szerkesztesInditasa(palyaId);
      if (muvelet === "delete") palyaTorlese(palyaId);
    });

    palyaModalElem.addEventListener("hidden.bs.modal", function () {
      if (helyszinModalraValtasFolyamatban && helyszinValasztoModal) {
        helyszinModalraValtasFolyamatban = false;
        helyszinValasztoModal.show();
        return;
      }
      modalUrlapAlaphelyzetbe();
    });
    if (helyszinValasztoModalElem) {
      helyszinValasztoModalElem.addEventListener("hidden.bs.modal", function () {
        if (palyaModalVisszanyitasHelyszinModalUtan) {
          palyaModalVisszanyitasHelyszinModalUtan = false;
          palyaModal.show();
        }
      });
    }

    helyszinValasztoModalInditasa();
    modalUrlapAlaphelyzetbe();
    modalKepEloNezetRenderelese();
    palyakLekerdezese();
  }

  var felhasznalo = bejelentkezesEllenorzese();
  if (!felhasznalo) return;

  oldalsavBekotese(felhasznalo);
  palyaimOldalBetoltese(felhasznalo);
})();
