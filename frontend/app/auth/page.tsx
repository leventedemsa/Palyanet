"use client";
import Link from "next/link";
import styles from "./Auth.module.css";

export default function AuthPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Bejelentkezés</h1>

        <form className={styles.form}>
          <input
            className={styles.input}
            placeholder="Felhasználónév"
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Jelszó"
          />
          <button type="submit" className={styles.button}>
            Bejelentkezés
          </button>
        </form>

        <p className={styles.switch}>
          Még nincs fiókod? <Link href="/auth/register">Regisztráció</Link>
        </p>
      </div>
    </div>
  );
}
