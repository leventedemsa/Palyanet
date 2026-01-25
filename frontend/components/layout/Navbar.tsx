"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // ESC bezárás
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ha desktopra váltasz, csukjuk be
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className={styles.navbar}>
      <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
        <Image
          src="/palyanetlogo.png"
          alt="Pályanet logó"
          width={32}
          height={32}
          className={styles.logo}
          priority
        />
        <span className={styles.brandText}>Pályanet</span>
      </Link>

      {/* Desktop menu */}
      <nav className={styles.menu} aria-label="Fő navigáció">
        <Link href="/contact" className={styles.link}>
          Kapcsolat
        </Link>
        <Link href="/login" className={styles.login}>
          Bejelentkezés
        </Link>
      </nav>

      {/* Mobile hamburger */}
      <button
        type="button"
        className={styles.burger}
        aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.burgerIcon} aria-hidden="true" />
      </button>

      {/* Mobile dropdown */}
      <div
        id="mobile-nav"
        className={`${styles.mobilePanel} ${open ? styles.mobilePanelOpen : ""}`}
        role="dialog"
        aria-label="Mobil menü"
      >
        <Link
          href="/contact"
          className={styles.mobileLink}
          onClick={() => setOpen(false)}
        >
          Kapcsolat
        </Link>

        <Link
          href="/login"
          className={`${styles.mobileLink} ${styles.mobileLogin}`}
          onClick={() => setOpen(false)}
        >
          Bejelentkezés
        </Link>
      </div>

      {/* click-outside overlay */}
      {open && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Menü bezárása"
          onClick={() => setOpen(false)}
        />
      )}
    </header>
  );
}
