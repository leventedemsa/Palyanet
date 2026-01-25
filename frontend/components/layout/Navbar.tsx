"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const setTheme = (theme: "light" | "dark" | "contrast") => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  };

  return (
    <header className={styles.navbar}>
      <Link href="/" className={styles.brand}>
        <Image
          src="/palyanetlogo.png"
          alt="Pályanet logó"
          width={32}
          height={32}
        />
        <span className={styles.brandText}>Pályanet</span>
      </Link>

      <nav className={styles.menu}>
        <button onClick={() => setTheme("light")}>🌞</button>
        <button onClick={() => setTheme("dark")}>🌙</button>
        <button onClick={() => setTheme("contrast")}>⚠️</button>

        <Link href="/contact">Kapcsolat</Link>
        <Link href="/login" className={styles.login}>
          Bejelentkezés
        </Link>
      </nav>
    </header>
  );
}
