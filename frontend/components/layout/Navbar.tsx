import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";

export default function Navbar() {
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
        <Link href="/contact">Kapcsolat</Link>
        <Link href="/login" className={styles.login}>
          Bejelentkezés
        </Link>
      </nav>
    </header>
  );
}
