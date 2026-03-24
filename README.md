# TODO Határ: Due(03.29)

- Közös:
    - Weboldal public domain
    - Adatbázis felhőben

# Kornél:

## 03.24:
- BookingController átszervezése új struktúrába: ✅
    - Controller logika külön fájlba szervezése ✅
    - Service réteg kialakítása ✅
    - Repository réteg kialakítása (adatkezelés szétválasztása) ✅
    - Moduláris index fájl létrehozása ✅
- ProfileController átszervezése új struktúrába: ✅
    - Controller logika szétbontása ✅
    - Service réteg implementálása ✅
    - Repository réteg létrehozása ✅
    - Moduláris felépítés kialakítása ✅
- Alert-ek teljes eltávolítása a projektből ✅
- SweetAlert2 implementálása mindenhol: ✅
    - Sikeres műveletek visszajelzése ✅
    - Hibák felhasználóbarát megjelenítése ✅
    - Egységes felugró rendszer kialakítása ✅
- Kép feltöltés megvalósítása fájlkezelőből: ✅
    - Fájl kiválasztás kezelése frontend oldalon ✅
    - Kép feltöltés backend feldolgozása ✅
    - Feltöltött fájlok tárolása ✅
- Kép hozzáadás lehetősége a pályákhoz: ✅
    - Kép hozzárendelése pályához ✅
    - Feltöltött kép megjelenítése a pálya részleteinél ✅
    - Dinamikus képbetöltés megvalósítása ✅
- index.html újratervezése (design frissítés): ✅
    - UI elemek átdolgozása ✅
    - Elrendezés modernizálása ✅
    - Felhasználói élmény javítása ✅

## 03.17:
- Profile mappán belüli HTML fájlok teljes redesignja: ✅
    - Layout újratervezése ✅
    - UI elemek egységesítése ✅
    - Reszponzív megjelenés javítása ✅
- Apró hibák javítása: ✅
    - Megjelenítési hibák javítása ✅
    - Strukturális hibák korrigálása ✅

## 03.12:
- Profilkép feltöltés implementálása: ✅
    - Kép kiválasztás kezelése ✅
    - Feltöltési folyamat megvalósítása ✅
- Profilkép megjelenítése pályáknál: ✅
    - Tulajdonos adatainak megjelenítése ✅
    - Profilkép dinamikus betöltése ✅
- Bérlő rendszer fejlesztése (~80%): ✅
    - Alap logika kialakítása ✅
    - Foglalási folyamat implementálása ✅
    - Backend struktúra előkészítése ✅

  
# Levi:

## 03.21:
- Új Értesítések menü a Profil részlegnél. ✅
- Értesítések fülnél, lehessen törölni az adott értesítést ✅
- Moderációs rendszer: ✅
    - SQL: ✅
        - `Bejelentesek` tábla létrehozva (küldő ID, bejelentett ID, pálya ID, szöveg, státusz, admin mezők). ✅
        - `Felhasznalok` táblába `tiltva` mező bekerült (alapértelmezetten `false`). ✅
    - Admin szerepkör: ✅
        - Induláskor, ha nincs admin, a backend létrehozza az alap admin felhasználót. ✅
        - Admin menük: `Profilom`, `Bejelentések`, `Pályák`, `Értesítések`. ✅
    - Bejelentések kezelése: ✅
        - A felhasználó pályára bejelentést tud küldeni szöveggel. ✅
        - Admin oldalon a bejelentések listázása működik. ✅
        - Admin döntés: `Elutasítva` vagy `Végrehajtva`. ✅
    - Értesítések: ✅
        - Bejelentés beküldésekor a küldő kap visszaigazolást. ✅
        - Bejelentés beküldésekor az admin(ok) értesítést kap(nak) új bejelentésről. ✅
        - Admin döntés után a bejelentés küldője értesítést kap a döntésről. ✅
        - Admin pályatörlésnél kötelező indok, és a pálya tulajdonosa értesítést kap az indokkal. ✅
    - Tiltás logika: ✅
        - Tiltott felhasználó nem tud pályát létrehozni. ✅
        - Tiltott felhasználó nem tud pályát foglalni. ✅
        - Tiltott felhasználó nem tud bejelentést küldeni. ✅
- Pályáim Javascript részét át emelni a profile.js-ből. ✅
- A Profil részlegnél a Sidebar legyen collapsable. (Telefonon ez jobban működik.) ✅
- Auth controller átszervezése (controller/service/repository + auth/index import) ✅

## 03.19:

- profil részleg újrastrukturálása (CSS-el nem foglalkoztam.) ✅
- Szűrés megyék és települések alapján (az ingatlan.com mintájára). ✅
- Ugyanez a logika a Pályák létrehozására is.
- Hiba oldalak megcsinálása ✅
- Pályáim részleg újrastrukturálása: ✅
    - A HTML kód section-re bontása. ✅
    - Kisebb stílusbeli javítások elvégzése. ✅
- Foglalásaim újrastrukturálása: ✅
    - A naptárnál jelenjen meg, hogy az adott napra hány foglalás van. ✅
    - A naptár és a foglalások kerüljenek egy lenyitható / lezárható menübe. ✅
    - A foglalás napjánál már ne lehessen múltbeli napra foglalni. ✅
    - A HTML kód section-re bontása. ✅
