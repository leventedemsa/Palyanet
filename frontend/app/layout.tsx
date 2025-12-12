import "./globals.css";
import Navbar from "../components/navbar";

export const metadata = {
  title: "Sportpálya Foglaló",
  description: "Pályafoglalási rendszer frontend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="pt-20 max-w-5xl mx-auto px-4">{children}</main>
      </body>
    </html>
  );
}
