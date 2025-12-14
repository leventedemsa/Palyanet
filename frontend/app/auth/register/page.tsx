"use client";
import Link from "next/link";
import styles from "../Auth.module.css";

export default function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Regisztráció</h1>

        <form className={styles.form}>
          <input
            className={styles.input}
            type="text"
            placeholder="Felhasználónév"
          />
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Jelszó"
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Jelszó megerősítése"
          />

          <button type="submit" className={styles.button}>
            Regisztráció
          </button>
        </form>

        <p className={styles.switch}>
          Van már fiókod? <Link href="/auth">Bejelentkezés</Link>
        </p>
      </div>
    </div>
  );
}
