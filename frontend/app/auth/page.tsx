"use client";
import Link from "next/link";

export default function AuthPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Bejelentkezés</h1>

        <form>
          <input type="text" placeholder="Felhasználónév" />
          <input type="password" placeholder="Jelszó" />
          <button type="submit">Bejelentkezés</button>
        </form>

        <p className="auth-switch">
          Még nincs fiókod? <Link href="/auth/register">Regisztráció</Link>
        </p>
      </div>
    </div>
  );
}
