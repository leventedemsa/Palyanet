import Link from "next/link";
import styles from "./Register.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Regisztráció</h1>
        <p className={styles.subtitle}>
          Hozz létre fiókot bérlőként vagy pályatulajdonosként.
        </p>

        <form className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Név
            </label>
            <input
              className={styles.input}
              id="name"
              name="name"
              type="text"
              placeholder="Teljes név"
              autoComplete="name"
              required
            />
          </div>

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
            <label className={styles.label} htmlFor="role">
              Szerepkör
            </label>
            <select className={styles.select} id="role" name="role" defaultValue="BERLO">
              <option value="BERLO">Bérlő</option>
              <option value="TULAJ">Pályatulajdonos</option>
            </select>
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
              placeholder="Legalább 6 karakter"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password2">
              Jelszó újra
            </label>
            <input
              className={styles.input}
              id="password2"
              name="password2"
              type="password"
              placeholder="Írd be újra"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className={styles.registerButton}>
            Regisztráció
          </button>
        </form>

        <div className={styles.footerRow}>
          <span className={styles.muted}>Van már fiókod?</span>
          <Link href="/login" className={styles.link}>
            Bejelentkezés
          </Link>
        </div>
      </section>
    </main>
  );
}
