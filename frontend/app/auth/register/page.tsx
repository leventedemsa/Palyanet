"use client";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Regisztráció</h1>

        <form>
          <input type="text" placeholder="Felhasználónév" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Jelszó" />
          <input type="password" placeholder="Jelszó megerősítése" />
          <button type="submit">Regisztráció</button>
        </form>

        <p className="auth-switch">
          Van már fiókod? <Link href="/auth">Bejelentkezés</Link>
        </p>
      </div>
    </div>
  );
}
