import type { Metadata, Viewport } from "next";
import { barlow, hanken } from "../fonts";
import "../globals.css";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Panel · TepozTours", template: "%s · Panel TepozTours" },
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#14261E",
  width: "device-width",
  initialScale: 1,
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="es" className={`${barlow.variable} ${hanken.variable}`}>
      <body className="ad-body">{children}</body>
    </html>
  );
}
