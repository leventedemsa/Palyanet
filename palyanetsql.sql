-- ============================
--   ADATBAZIS LETREHOZASA
-- ============================
CREATE DATABASE PalyanetADB;
GO
USE PalyanetADB;
GO

-- ============================
--   BEJELENTESEK TABLA (ELORE)
-- ============================
CREATE TABLE Bejelentesek (
    bejelentes_id INT IDENTITY(1,1) PRIMARY KEY,
    kuldo_felhasznalo_id INT NOT NULL,
    bejelentett_felhasznalo_id INT NOT NULL,
    palya_id INT NOT NULL,
    szoveg NVARCHAR(1500) NOT NULL,
    statusz NVARCHAR(50) NOT NULL DEFAULT N'pending',
    admin_id INT NULL,
    admin_megjegyzes NVARCHAR(1500) NULL,
    letrehozva DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    eldontve DATETIME2(7) NULL,

    CONSTRAINT CK_Bejelentesek_Statusz
        CHECK (statusz IN (N'pending', N'elutasitva', N'vegrehajtva'))
);

-- ============================
--   FELHASZNALOK TABLA
-- ============================
CREATE TABLE Felhasznalok (
    felhasznalo_id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    teljes_nev NVARCHAR(150) NOT NULL,
    email NVARCHAR(200) NOT NULL UNIQUE,
    jelszo_hash NVARCHAR(300) NOT NULL,
    nem NVARCHAR(30) NULL,
    szerep NVARCHAR(50) NOT NULL DEFAULT N'berlo',
    profil_kep_url NVARCHAR(500) NULL,
    letrehozva DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    utoljara_belepett DATETIME2(7) NULL,
    aktiv BIT NOT NULL DEFAULT 1,
    tiltva BIT NOT NULL DEFAULT 0,

    CONSTRAINT CK_Felhasznalok_Szerep
        CHECK (szerep IN (N'berlo', N'palyatulajdonos', N'admin'))
);

-- ============================
--   PALYA TABLA
-- ============================
CREATE TABLE Palya (
    palya_id INT IDENTITY(1,1) PRIMARY KEY,
    tulaj_id INT NOT NULL,
    nev NVARCHAR(200) NOT NULL,
    sportag NVARCHAR(100) NULL,
    helyszin NVARCHAR(300) NULL,
    ar_ora INT NULL,
    leiras NVARCHAR(MAX) NULL,
    kep_url NVARCHAR(500) NULL,
    nyitas TIME NULL,
    zaras TIME NULL,
    extra NVARCHAR(MAX) NULL,
    felfuggesztve BIT NOT NULL DEFAULT 0,
    felfuggesztes_indok NVARCHAR(1500) NULL,
    felfuggesztve_datum DATETIME2(7) NULL,
    felfuggesztve_admin_id INT NULL,
    letrehozva DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Palya_Tulaj FOREIGN KEY (tulaj_id)
        REFERENCES Felhasznalok(felhasznalo_id)
        ON DELETE CASCADE,

    CONSTRAINT CK_Palya_Ar
        CHECK (ar_ora IS NULL OR ar_ora >= 0),

    CONSTRAINT CK_Palya_NyitasZaras
        CHECK (
            (nyitas IS NULL AND zaras IS NULL)
            OR (nyitas IS NOT NULL AND zaras IS NOT NULL AND nyitas < zaras)
        ),

    CONSTRAINT FK_Palya_FelfuggesztveAdmin FOREIGN KEY (felfuggesztve_admin_id)
        REFERENCES Felhasznalok(felhasznalo_id)
);

-- Bejelentesek FK-k utolagos felkotese (a tabla szandekosan van legelol)
ALTER TABLE Bejelentesek
    ADD CONSTRAINT FK_Bejelentesek_Kuldo FOREIGN KEY (kuldo_felhasznalo_id)
        REFERENCES Felhasznalok(felhasznalo_id);

ALTER TABLE Bejelentesek
    ADD CONSTRAINT FK_Bejelentesek_Bejelentett FOREIGN KEY (bejelentett_felhasznalo_id)
        REFERENCES Felhasznalok(felhasznalo_id);

ALTER TABLE Bejelentesek
    ADD CONSTRAINT FK_Bejelentesek_Palya FOREIGN KEY (palya_id)
        REFERENCES Palya(palya_id);

ALTER TABLE Bejelentesek
    ADD CONSTRAINT FK_Bejelentesek_Admin FOREIGN KEY (admin_id)
        REFERENCES Felhasznalok(felhasznalo_id);

-- ============================
--   FOGLALAS TABLA
-- ============================
CREATE TABLE Foglalas (
    foglalas_id INT IDENTITY(1,1) PRIMARY KEY,
    palya_id INT NOT NULL,
    berlo_id INT NOT NULL,
    kezdes DATETIME2(7) NOT NULL,
    vege DATETIME2(7) NOT NULL,
    statusz NVARCHAR(50) NOT NULL DEFAULT N'pending',
    ar INT NOT NULL DEFAULT 0,
    fizetes_statusz NVARCHAR(50) NOT NULL DEFAULT N'pending',
    letrehozva DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Foglalas_Palya FOREIGN KEY (palya_id)
        REFERENCES Palya(palya_id),

    CONSTRAINT FK_Foglalas_Berlo FOREIGN KEY (berlo_id)
        REFERENCES Felhasznalok(felhasznalo_id),

    CONSTRAINT CK_Foglalas_Ido
        CHECK (vege > kezdes),

    CONSTRAINT CK_Foglalas_Statusz
        CHECK (statusz IN (N'pending', N'accepted', N'rejected', N'cancelled')),

    CONSTRAINT CK_Foglalas_FizetesStatusz
        CHECK (fizetes_statusz IN (N'pending', N'paid', N'failed', N'refunded')),

    CONSTRAINT CK_Foglalas_Ar
        CHECK (ar >= 0)
);
GO

-- Utkzo idosavos foglalas tiltasa ugyanarra a palyara
CREATE TRIGGER TR_Foglalas_NoOverlap
ON Foglalas
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN Foglalas f
            ON f.palya_id = i.palya_id
           AND f.foglalas_id <> i.foglalas_id
           AND f.statusz IN (N'pending', N'accepted')
           AND i.statusz IN (N'pending', N'accepted')
           AND i.kezdes < f.vege
           AND i.vege > f.kezdes
    )
    BEGIN
        THROW 50001, N'Utkozo foglalas: ezen az idosavon mar van aktiv foglalas.', 1;
    END
END;
GO

-- ============================
--   ERTESITES TABLA
-- ============================
CREATE TABLE Ertesites (
    ertesites_id INT IDENTITY(1,1) PRIMARY KEY,
    kuldo_id INT NOT NULL,
    cimzett_id INT NOT NULL,
    uzenet NVARCHAR(MAX) NOT NULL,
    olvasott BIT NOT NULL DEFAULT 0,
    letrehozva DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Ertesites_Kuldo FOREIGN KEY (kuldo_id)
        REFERENCES Felhasznalok(felhasznalo_id),

    CONSTRAINT FK_Ertesites_Cimzett FOREIGN KEY (cimzett_id)
        REFERENCES Felhasznalok(felhasznalo_id)
);

-- ============================
--   LOG TABLA
-- ============================
CREATE TABLE Log (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    felhasznalo_id INT NOT NULL,
    esemeny_tipus NVARCHAR(100) NOT NULL,
    datum DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Log_Felhasznalo FOREIGN KEY (felhasznalo_id)
        REFERENCES Felhasznalok(felhasznalo_id)
);
GO

-- ============================
--   INDEXEK (PERFORMANCE)
-- ============================
CREATE INDEX IX_Palya_Tulaj ON Palya (tulaj_id);
CREATE INDEX IX_Palya_Szurok ON Palya (sportag, helyszin, ar_ora);
CREATE INDEX IX_Palya_Felfuggesztve ON Palya (felfuggesztve);

CREATE INDEX IX_Foglalas_Palya_Interval_Statusz
    ON Foglalas (palya_id, kezdes, vege, statusz);
CREATE INDEX IX_Foglalas_Berlo_Kezdes
    ON Foglalas (berlo_id, kezdes);

CREATE INDEX IX_Ertesites_Cimzett_Olvasott_Letrehozva
    ON Ertesites (cimzett_id, olvasott, letrehozva);

CREATE INDEX IX_Bejelentesek_Statusz_Letrehozva
    ON Bejelentesek (statusz, letrehozva);
CREATE INDEX IX_Bejelentesek_Palya
    ON Bejelentesek (palya_id);
