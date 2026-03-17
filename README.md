# TODO Határ: 03.15

---

# 1) Profil oldal / `profil.html`(Kornél + Levi)

# Oldalmenü / navigáció

## 1. menü – **Profilom**

- Jelenítse meg a felhasználó alapadatait:
  - név
  - email cím
  - telefonszám (ha van)
  - szerepkör / fióktípus
- Lehessen módosítani az alapadatokat
- Lehessen módosítani a jelszót
- Profilkép megjelenítése
- Profilkép módosítása
- Legyen egyértelműen látható a felhasználó típusa:
  - pályatulajdonos
  - bérlő
- Legyen lehetőség kijelentkezésre

---

# Ha a felhasználó **pályatulajdonos**

## 2. menü – **Pályáim**

- Saját pályák listázása
- Minden pályánál jelenjen meg:
  - pálya neve
  - helyszín
  - ár
  - elérhetőség
- Lehessen módosítani a pálya adatait
- Lehessen törölni a pályát

### Új pálya hozzáadása
- Új pálya létrehozása űrlappal

### Foglalások
- Beérkezett foglalások megtekintése
- Foglalások kezelése:
  - elfogadás
  - elutasítás

### Statisztikák
- Foglalások száma adott pályánál

---

## 3. menü – **Foglalások**

- Foglalások megtekintése a pályáknál
- Lehessen elfogadni vagy elutasítani a foglalási kérelmet
- Legyen egy **naptár**, amely mutatja:
  - foglalt napok
  - szabad napok

---

# Ha a felhasználó **bérlő**

## Bérléseim

- Aktuális és korábbi foglalások listázása

Minden foglalásnál jelenjen meg:
- pálya adatai
- foglalás dátuma
- foglalás időpontja
- státusz:
  - Elutasítva
  - Függőben
  - Elfogadva

### Funkciók
- Lehessen az adott foglalást **lemondani**
- Legyen külön rész:
  - aktuális foglalások
  - korábbi foglalások

---

# 2) Profilkép integrálása (Kornél + Levi)
**Felelős:** Kornél

## Feladatok

- A felhasználó profilján jelenjen meg a saját profilképe
- Lehessen profilképet:
  - feltölteni
  - módosítani
  - törölni
- Ha nincs profilkép, jelenjen meg **alapértelmezett avatar**

### Pályák oldalon

A `Pályák.html` oldalon a **Részletek** gomb után jelenjen meg a pályatulajdonos:

- neve
- profilképe

---

# 3) Értesítések ikon a Navbarban (Kornél)

Legyen egy **értesítések ikon** a navbarban.

### Értesítések példák

**Bérlőknek**
- Foglalás elfogadva
- Foglalás elutasítva

**Pályatulajdonosoknak**
- Új foglalási kérelem érkezett

---

# 4) Hibakezelő oldalak (Levente)

- 404-es oldal készítése
- Jogosultsághiány esetén külön hibaoldal
- Nem létező pálya megnyitásakor hibaüzenet
- Hibás URL esetén visszairányítás

- # 5) Értesítések ikon a Navbarban (Kornél)
-Profil
-Pálya
-Bérlés
-Foglalás

Fent említettek .html oldalát meg design-olni
---

