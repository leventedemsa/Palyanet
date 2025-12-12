import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-white shadow fixed top-0 left-0 z-50 flex items-center px-6 justify-between">
      <Link href="/" className="text-xl font-semibold">
        SportPálya
      </Link>

      <Link
        href="/auth"
        className="px-4 py-2 rounded-xl border hover:bg-gray-100 transition"
      >
        Bejelentkezés
      </Link>
    </nav>
  );
}
