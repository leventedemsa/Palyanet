import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} Palyanet. Minden jog fenntartva.</span>
    </footer>
  );
}
