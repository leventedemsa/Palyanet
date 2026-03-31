# TODO 

## Közös:
- Weboldal public domain
- Adatbázis felhőben


# Kornél:

## 03.31:
- Téma kezelés egységesítése közös scriptben `theme-controller.js`
- Backendben változó- és függvénynevek magyarosítása.
- Backend metódusok fölé kommentek.
- HTML oldalak frontend scriptjeinek külön fájlba szervezése: 
    - `palyak.html` scriptjeinek kiszervezése 
    - `login.html` scriptjeinek kiszervezése
    - `register.html` scriptjeinek kiszervezése 
    - `forgotpassword.html` scriptjeinek kiszervezése 
- HTML oldalakban lévő JavaScript kód átdolgozása: 
    - Változónevek magyarosítása 
    - Kommentek elhelyezése a metódusok fölé 
- `auth-nav.js` átdolgozása: 
    - Változónevek magyarosítása 
    - Metódusok kommentelése 

## 03.24:
- BookingController átszervezése új struktúrába: 
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

## 03.31:
- JavaScript fájlok átdolgozása: (Kommentelés, és magyar váltózó nevek)
    - `profil.js` 
    - `ertesitesek.js` 
    - `berleseim.js` 
    - `foglalasaim.js` 
    - `palyaim.js` 
- CSS egységesítés: global.css + oldalspecifikus (profil.css, berleseim.css, stb.). 
- Foglalás UI frissítés: új mezők megjelenítése (email, leírás), amit a backend ad.
- Log rendszer bevezetése + külön `Log` részleg az admin menüben. ✅ (`1696830`)
    - Backend oldalon logolás és log lekérdezés bővítése (`booking`, `pálya`, `user` útvonalak érintve). ✅
    - Frontenden új admin log oldal (`log.html`, `log.js`) és menüintegráció. ✅
    - SQL frissítés a log funkcióhoz (`palyanetsql.sql`). ✅

## 03.30:
- SQL kód javítása, hogy máshol is működjön.
- Alap felhasználók létrehozása a backend futtatásnál. (pályatulajdonos, bérlő, admin)
- Kisebb kód tisztítás.

## 03.29:
- Admin jogosultságkezelés és admin panel újradolgozása: ✅
    - Admin jogosultságkezelés finomítása. ✅
    - Admin panel felépítésének átdolgozása. ✅
- Pályatulajdonos rész különszedése a root profil részlegről. ✅
- Moderációs felhasználókezelés: ✅
    - Pályatulajdonos rész külön kezelése. ✅
    - Felhasználókeresés megvalósítása. ✅
    - Tiltás / feloldás funkció implementálása. ✅
- Egységes admin menüsorrend kialakítása: ✅
    - `Profilom` ✅
    - `Bejelentések` ✅
    - `Pályák` ✅
    - `Felhasználók` ✅
    - `Értesítések` ✅
- Pénzügyi statisztikák fejlesztése a pályatulajdonos nézethez: ✅
    - Alap pénzügyi statisztika megjelenítése. ✅
    - Havi bevétel vonaldiagramon történő megjelenítése. ✅
    - Egyéni pályák bevételének kördiagramon történő megjelenítése. ✅

## 03.21:
- Új Értesítések menü a Profil részlegnél. ✅
- Értesítések fülnél, lehessen törölni az adott értesítést. ✅
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
