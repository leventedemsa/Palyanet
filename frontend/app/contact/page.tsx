import styles from "./Contact.module.css";

export default function KapcsolatPage() {
  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <h1 className={styles.title}>Kapcsolat</h1>
        <p className={styles.subtitle}>
          Vedd fel velünk a kapcsolatot, és hamarosan válaszolunk.
        </p>

        <div className={styles.grid}>
          {/* INFO PANEL_ */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Elérhetőségek</h3>
            <p className={styles.text}>
              Email: <strong>info@palyanet.hu</strong>
            </p>
            <p className={styles.text}>
              Telefon: <strong>+36 30 123 4567</strong>
            </p>
            <p className={styles.text}>
              Ügyfélszolgálat: H–P 9:00–17:00
            </p>
          </div>

          {/* FORM PANEL */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Üzenet küldése</h3>

            <form className={styles.form}>
              <input
                type="text"
                placeholder="Név"
                className={styles.input}
              />
              <input
                type="email"
                placeholder="Email címed"
                className={styles.input}
              />
              <textarea
                placeholder="Üzenet"
                className={styles.textarea}
                rows={4}
              />
              <button type="button" className={styles.button}>
                Küldés
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
