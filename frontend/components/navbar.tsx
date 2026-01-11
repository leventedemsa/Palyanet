"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const isAuth = pathname === "/auth" || pathname === "/auth/register";

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        Pályanet
      </Link>
      <div className={styles.right}>
        <Link href="/contact" className={styles.link}>
          Kapcsolat
        </Link>

        <Link href={isAuth ? "/" : "/auth"} className={styles.action}>
          {isAuth ? "Főoldal" : "Bejelentkezés"}
        </Link>
      </div>
    </nav>
  );
}
