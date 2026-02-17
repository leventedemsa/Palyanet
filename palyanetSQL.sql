-- ============================
--   ADATBÁZIS LÉTREHOZÁSA
-- ============================
CREATE DATABASE PalyanetADB;
GO
USE PalyanetADB;
GO

-- ============================
--   FELHASZNALOK TÁBLA
-- ============================
CREATE TABLE Felhasznalok (
    felhasznalo_id INT IDENTITY(1,1) PRIMARY KEY,
    nev NVARCHAR(100) NOT NULL,
    email NVARCHAR(200) NOT NULL UNIQUE,
    jelszo_hash NVARCHAR(300) NOT NULL,
    telefon NVARCHAR(50),
    szerep NVARCHAR(50),
    profil_kep_url NVARCHAR(500),
    letrehozva DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    utoljara_belepett DATETIME2,
    aktiv BIT NOT NULL DEFAULT 1
);

-- ============================
--   PALYA TÁBLA
-- ============================
CREATE TABLE Palya (
    palya_id INT IDENTITY(1,1) PRIMARY KEY,
    tulaj_id INT NOT NULL,
    nev NVARCHAR(200) NOT NULL,
    sportag NVARCHAR(100),
    helyszin NVARCHAR(300),
    ar_ora INT,
    leiras NVARCHAR(MAX),
    kep_url NVARCHAR(500),
    nyitas TIME,
    zaras TIME,
    extra NVARCHAR(MAX),
    letrehozva DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Palya_Tulaj FOREIGN KEY (tulaj_id)
        REFERENCES Felhasznalok(felhasznalo_id)
        ON DELETE CASCADE
);

-- ============================
--   FOGLALAS TÁBLA
-- ============================
CREATE TABLE Foglalas (
    foglalas_id INT IDENTITY(1,1) PRIMARY KEY,
    palya_id INT NOT NULL,
    berlo_id INT NOT NULL,
    kezdes DATETIME2 NOT NULL,
    vege DATETIME2 NOT NULL,
    statusz NVARCHAR(50),
    ar INT,
    fizetes_statusz NVARCHAR(50),
    letrehozva DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Foglalas_Palya FOREIGN KEY (palya_id)
        REFERENCES Palya(palya_id),

    CONSTRAINT FK_Foglalas_Berlo FOREIGN KEY (berlo_id)
        REFERENCES Felhasznalok(felhasznalo_id)
);

-- ============================
--   ERTESITES TÁBLA
-- ============================
CREATE TABLE Ertesites (
    ertesites_id INT IDENTITY(1,1) PRIMARY KEY,
    kuldo_id INT NOT NULL,
    cimzett_id INT NOT NULL,
    uzenet NVARCHAR(MAX) NOT NULL,
    olvasott BIT NOT NULL DEFAULT 0,
    letrehozva DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Ertesites_Kuldo FOREIGN KEY (kuldo_id)
        REFERENCES Felhasznalok(felhasznalo_id),

    CONSTRAINT FK_Ertesites_Cimzett FOREIGN KEY (cimzett_id)
        REFERENCES Felhasznalok(felhasznalo_id)
);

-- ============================
--   LOG TÁBLA
-- ============================
CREATE TABLE Log (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    felhasznalo_id INT NOT NULL,
    esemeny_tipus NVARCHAR(100),
    akcio NVARCHAR(200),
    leiras NVARCHAR(MAX),
    datum DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Log_Felhasznalo FOREIGN KEY (felhasznalo_id)
        REFERENCES Felhasznalok(felhasznalo_id)
);

INSERT INTO Felhasznalok (nev, email, jelszo_hash, telefon, szerep, profil_kep_url, utoljara_belepett, aktiv)
VALUES
(
    N'Kovács Péter',
    N'peter.kovacs@email.com',
    N'$2b$10$examplehash1',
    N'+36301234567',
    N'tulajdonos',
    N'https://example.com/profilok/peter.jpg',
    SYSDATETIME(),
    1
),
(
    N'Nagy Anna',
    N'anna.nagy@email.com',
    N'$2b$10$examplehash2',
    N'+36309876543',
    N'berlo',
    N'https://example.com/profilok/anna.jpg',
    SYSDATETIME(),
    1
),
(
    N'Szabó Márk',
    N'mark.szabo@email.com',
    N'$2b$10$examplehash3',
    N'+36305551234',
    N'admin',
    N'https://example.com/profilok/mark.jpg',
    NULL,
    1
);
