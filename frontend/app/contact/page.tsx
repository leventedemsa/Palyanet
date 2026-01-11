import styles from "./Contact.module.css";

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Kapcsolat</h1>

        <p className={styles.description}>
          Kérdésed van a Pályanet használatával kapcsolatban?
          Vedd fel velünk a kapcsolatot az alábbi űrlapon.
        </p>

        <form className={styles.form}>
          <input
            type="text"
            placeholder="Név"
            className={styles.input}
          />

          <input
            type="email"
            placeholder="Email cím"
            className={styles.input}
          />

          <textarea
            placeholder="Üzenet"
            rows={4}
            className={styles.textarea}
          />

          <button type="submit" className={styles.button}>
            Üzenet küldése
          </button>
        </form>
      </section>
    </main>
  );
}
