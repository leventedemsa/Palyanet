import Link from "next/link";
import styles from "./Login.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Bejelentkezés</h1>
        <p className={styles.subtitle}>Jelentkezz be a fiókodba.</p>

        <form className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              placeholder="pelda@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Jelszó
            </label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className={styles.loginButton}>
            Bejelentkezés
          </button>
        </form>

        <div className={styles.footerRow}>
          <span className={styles.muted}>Nincs még fiókod?</span>
          <Link href="/register" className={styles.link}>
            Regisztráció
          </Link>
        </div>
      </section>
    </main>
  );
}
