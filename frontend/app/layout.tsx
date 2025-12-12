import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: "Palyanet",
  description: "Sportpálya foglaló rendszer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body>
        <Navbar />

        <main className="site-content">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
