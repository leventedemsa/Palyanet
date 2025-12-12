"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  let rightHref = "/auth";
  let rightText = "Bejelentkezés";

  if (pathname === "/auth") {
    rightHref = "/";
    rightText = "Főoldal";
  } else if (pathname === "/auth/register") {
    rightHref = "/";
    rightText = "Főoldal";
  }

  return (
    <nav>
      <Link href="/" className="text-xl font-semibold">
        SportPálya
      </Link>

      <Link href={rightHref} className="btn btn-outline">
        {rightText}
      </Link>
    </nav>
  );
}
