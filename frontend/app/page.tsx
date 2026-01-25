
import Link from "next/link";
import styles from "./Home.module.css";


export default function Home() {
  return (
    <main className={styles.page}>
      {/* BEVEZETŐ_ */}
      <section className={styles.mainSection}>
        <h1 className={styles.title}>Pályanet</h1>
        <p className={styles.subtitle}>
          Webes sportpálya-foglaló rendszer, amely összeköti a pályatulajdonosokat és a
          bérlőket. Átlátható keresés, egyszerű foglalás és gyors visszajelzés – egy helyen.
        </p>
        <div className={styles.ctaRow}>
          <span className={styles.subtitle}>Jelentkezz most:</span>
          <Link href="/register" className={styles.register}>
            Regisztráció
          </Link>
        </div>

      </section>
      {/* RÓLUNK */}
      <section className={styles.aboutSection}>
        <h2 className={styles.aboutTitle}>Miről szól a Pályanet?</h2>
        <div className={styles.twoCol}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>A probléma</h3>
            <p className={styles.text}>
              A sportpályák bérlése gyakran széttagolt: különböző felületeken, nehezen
              összehasonlítható információkkal és bonyolult időpont-egyeztetéssel működik.
              A Pályanet célja, hogy ezt egy egységes, magyar nyelvű, könnyen kezelhető
              rendszerben oldja meg.
            </p>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>A megoldás</h3>
            <p className={styles.text}>
              A bérlők egy felületen kereshetnek sportág, helyszín, ár és időpont alapján,
              majd lefoglalhatják a számukra megfelelő pályát. A pályatulajdonosok
              kezelhetik pályáikat, foglalásaikat és a naptárat, így a teljes folyamat
              átláthatóvá válik.
            </p>
          </div>
        </div>
      </section>
      {/* FUNKCIÓK */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Fő funkciók</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>🔎 Keresés és szűrés</h3>
            <p>
              Pályák böngészése sportág, helyszín, ár és időpont alapján – gyorsan,
              átláthatóan.
            </p>
          </div>

          <div className={styles.card}>
            <h3>📅 Foglalás kezelése</h3>
            <p>
              Szabad idősáv kiválasztása, foglalás leadása, státusz követése.
            </p>
          </div>

          <div className={styles.card}>
            <h3>🏟️ Pályaadatlapok</h3>
            <p>
              Részletes információk: helyszín, sportág, ár és elérhetőség.
            </p>
          </div>

          <div className={styles.card}>
            <h3>🔔 Értesítések</h3>
            <p>
              Visszajelzés foglalásról és változásokról – később akár emailben is.
            </p>
          </div>
        </div>
      </section>
    </main>

  );
}
